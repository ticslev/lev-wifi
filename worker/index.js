// lev-wifi · Fase 1: herramienta de prueba de claves WiFi personales.
//
// Sirve una página interna (protegida con Cloudflare Access) para:
//   - crear claves Multi-PSK en Mist con su VLAN, límite de dispositivos
//     y vigencia;
//   - ver las claves del SSID de prueba y borrarlas;
//   - ver qué dispositivos están conectados al SSID de prueba, con qué
//     clave, en qué VLAN y qué equipo detecta Mist.
// Todo se limita a las claves "prueba-…" del SSID indicado en MIST_SSID.

import { verificarAcceso } from './acceso.js';
import { generarClave } from './clave.js';
import {
  ErrorMist, faltantes, listarClaves, crearClave, borrarClave, listarClientes,
} from './mist.js';
import { pagina } from './pagina.js';

const CABECERAS_BASE = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
};

function json(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { ...CABECERAS_BASE, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function error(mensaje, estado = 400, detalle) {
  return json({ error: mensaje, detalle: detalle ?? null }, estado);
}

function html(cuerpo, nonce) {
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    `style-src 'nonce-${nonce}'`,
    "connect-src 'self'",
    "img-src 'self' data:",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  return new Response(cuerpo, {
    headers: {
      ...CABECERAS_BASE,
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': csp,
    },
  });
}

function entero(valor, min, max) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

// Resume un cliente de Mist con los campos útiles para la prueba.
function resumirCliente(c, nombresClave) {
  const pskId = c.psk_id || null;
  return {
    mac: c.mac || '',
    nombre: c.hostname || '',
    ip: c.ip || '',
    vlan: c.vlan_id ?? null,
    clave: pskId ? (nombresClave[pskId] || pskId) : (c.psk_name || ''),
    fabricante: c.manufacture || '',
    familia: c.family || '',
    modelo: c.model || '',
    so: c.os || '',
    ap: c.ap_mac || '',
    rssi: c.rssi ?? null,
    visto: c.last_seen ?? null,
  };
}

async function api(request, env, url, correo) {
  const falta = faltantes(env);
  const ruta = url.pathname;

  if (ruta === '/api/estado' && request.method === 'GET') {
    return json({ correo, ssid: env.MIST_SSID || null, faltan: falta });
  }
  if (falta.length) return error(`Falta configurar: ${falta.join(', ')}`, 500);

  // Las operaciones que cambian algo exigen una cabecera propia: un
  // formulario de otro sitio no puede enviarla sin pasar por CORS.
  if (request.method !== 'GET' && request.headers.get('X-Lev-Wifi') !== '1') {
    return error('Pedido no permitido', 403);
  }

  if (ruta === '/api/claves' && request.method === 'GET') {
    const claves = await listarClaves(env);
    return json(claves.map((k) => ({
      id: k.id,
      nombre: k.name,
      clave: k.passphrase,
      vlan: k.vlan_id ?? null,
      rol: k.role || '',
      max: k.max_usage ?? 0,
      vence: k.expire_time ?? null,
      nota: k.note || '',
    })));
  }

  if (ruta === '/api/claves' && request.method === 'POST') {
    let cuerpo;
    try { cuerpo = await request.json(); } catch { return error('Datos inválidos'); }
    const etiqueta = String(cuerpo.nombre || '').trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    const vlan = entero(cuerpo.vlan, 1, 4094);
    const max = entero(cuerpo.max, 0, 20);
    const horas = entero(cuerpo.horas, 1, 24 * 30);
    if (!etiqueta) return error('Escribe un nombre para la clave');
    if (vlan === null) return error('La VLAN debe ser un número entre 1 y 4094');
    if (max === null) return error('Máximo de dispositivos: de 0 (sin límite) a 20');
    if (horas === null) return error('Vigencia: de 1 hora a 30 días');
    const rol = String(cuerpo.rol || '').trim();
    if (rol && !/^[A-Za-z0-9_.-]{1,32}$/.test(rol)) return error('El rol solo admite letras, números, punto, guion y guion bajo (máx. 32)');

    const clave = generarClave();
    const creada = await crearClave(env, {
      name: `prueba-${etiqueta}`,
      passphrase: clave,
      usage: 'multi',
      vlan_id: vlan,
      max_usage: max,
      expire_time: Math.floor(Date.now() / 1000) + horas * 3600,
      note: `Prueba lev-wifi creada por ${correo}`,
      ...(rol ? { role: rol } : {}),
    });
    return json({ id: creada && creada.id, nombre: `prueba-${etiqueta}`, clave, vlan, max, rol }, 201);
  }

  const borrar = ruta.match(/^\/api\/claves\/([A-Za-z0-9-]{8,64})$/);
  if (borrar && request.method === 'DELETE') {
    const clave = await borrarClave(env, borrar[1]);
    return json({ borrada: clave.name });
  }

  if (ruta === '/api/clientes' && request.method === 'GET') {
    const claves = await listarClaves(env);
    const clientes = await listarClientes(env, new Set(claves.map((k) => k.id)));
    const nombres = Object.fromEntries(claves.map((k) => [k.id, k.name]));
    return json(clientes.map((c) => resumirCliente(c, nombres)));
  }

  return error('No encontrado', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    let correo;
    try {
      correo = await verificarAcceso(request, env);
    } catch (e) {
      return new Response(`Acceso denegado: ${e.message}`, {
        status: 403,
        headers: { ...CABECERAS_BASE, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        return await api(request, env, url, correo);
      } catch (e) {
        if (e instanceof ErrorMist) return error(e.message, e.estado === 403 ? 403 : 502, e.detalle);
        console.error(e);
        return error('Error inesperado', 500);
      }
    }

    if (url.pathname === '/' && request.method === 'GET') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const nonce = btoa(String.fromCharCode(...bytes));
      return html(pagina(nonce), nonce);
    }

    return new Response('No encontrado', { status: 404, headers: CABECERAS_BASE });
  },
};
