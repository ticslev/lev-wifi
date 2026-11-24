// API de la consola de administración (/admin/api/…), protegida con
// Cloudflare Access. Incluye la herramienta de prueba de claves y la
// importación del listado de estudiantes.

import { generarClave } from './clave.js';
import {
  faltantes, listarClaves, crearClave, borrarClave, listarClientes, listarTodosClientes, esDePrueba,
} from './mist.js';
import { asegurarEsquema, todos, uno, registrarEvento } from './db.js';
import { normalizarNivel, reglaDe, rolMist, etiquetaCurso } from './reglas.js';
import { dominio } from './auth.js';
import { json, error } from './util.js';

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

// ---------- Listado de estudiantes ----------

async function resumenEstudiantes(env) {
  await asegurarEsquema(env.DB);
  const grupos = await todos(
    env.DB,
    `SELECT e.nivel, e.paralelo, COUNT(*) AS total,
            SUM(CASE WHEN EXISTS (SELECT 1 FROM claves c WHERE c.correo = e.correo AND c.revocada IS NULL) THEN 1 ELSE 0 END) AS con_clave
       FROM estudiantes e GROUP BY e.nivel, e.paralelo`
  );
  const ultima = await uno(env.DB, 'SELECT MAX(importado) AS cuando FROM estudiantes');
  const cursos = grupos.map((g) => {
    const regla = reglaDe(g.nivel);
    return {
      nivel: g.nivel,
      paralelo: g.paralelo,
      curso: etiquetaCurso(g.nivel, g.paralelo),
      rol: regla ? rolMist(g.nivel, g.paralelo) : null,
      vlan: regla ? regla.vlan : null,
      total: g.total,
      conClave: g.con_clave || 0,
    };
  });
  const orden = (n) => {
    const m = normalizarNivel(n).match(/^(\d+)/);
    const base = m ? Number(m[1]) : -1;
    return normalizarNivel(n).endsWith('BGU') ? 100 + base : base;
  };
  cursos.sort((a, b) => orden(a.nivel) - orden(b.nivel) || a.paralelo.localeCompare(b.paralelo, 'es'));
  return {
    total: cursos.reduce((s, c) => s + c.total, 0),
    habilitados: cursos.filter((c) => c.vlan !== null).reduce((s, c) => s + c.total, 0),
    conClave: cursos.reduce((s, c) => s + c.conClave, 0),
    ultimaImportacion: ultima ? ultima.cuando : null,
    cursos,
  };
}

async function importarEstudiantes(env, cuerpo, actor) {
  await asegurarEsquema(env.DB);
  const filas = Array.isArray(cuerpo && cuerpo.filas) ? cuerpo.filas : null;
  if (!filas || filas.length === 0) return error('El archivo no tiene filas de estudiantes');
  if (filas.length > 5000) return error('Demasiadas filas (máximo 5000)');

  const dom = '@' + dominio(env);
  const aceptadas = new Map();
  const rechazadas = [];
  filas.forEach((f, i) => {
    const fila = Number.isInteger(f && f.fila) ? f.fila : i + 2;
    const correo = String((f && f.correo) || '').trim().toLowerCase();
    const nivel = String((f && f.nivel) || '').replace(/\s+/g, ' ').trim();
    const paralelo = String((f && f.paralelo) || '').replace(/\s+/g, ' ').trim();
    const nombre = String((f && f.nombre) || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    let motivo = null;
    if (!correo) motivo = 'Sin correo';
    else if (!/^[^\s@]+@[^\s@]+$/.test(correo)) motivo = 'Correo no válido';
    else if (!correo.endsWith(dom)) motivo = `El correo no es ${dom}`;
    else if (!nivel || !paralelo) motivo = 'Falta el nivel o el paralelo';
    else if (aceptadas.has(correo)) motivo = 'Correo repetido';
    if (motivo) rechazadas.push({ fila, correo, motivo });
    else aceptadas.set(correo, { c: correo, n: nombre, v: nivel, p: paralelo });
  });
  if (aceptadas.size === 0) return json({ importados: 0, rechazadas }, 400);

  // Reemplaza el listado completo en dos sentencias (json_each), para no
  // pasar del límite de consultas por pedido de D1.
  const ahora = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM estudiantes'),
    env.DB.prepare(
      `INSERT INTO estudiantes (correo, nombre, nivel, paralelo, importado)
       SELECT json_extract(value, '$.c'), json_extract(value, '$.n'), json_extract(value, '$.v'),
              json_extract(value, '$.p'), ?2
         FROM json_each(?1)`
    ).bind(JSON.stringify([...aceptadas.values()]), ahora),
  ]);

  // Claves activas de estudiantes que ya no están en el listado.
  const huerfanas = await uno(
    env.DB,
    `SELECT COUNT(DISTINCT correo) AS n FROM claves
      WHERE revocada IS NULL AND correo NOT IN (SELECT correo FROM estudiantes)`
  );
  await registrarEvento(env.DB, {
    actor, accion: 'importar-listado',
    detalle: { importados: aceptadas.size, rechazadas: rechazadas.length },
  });
  return json({
    importados: aceptadas.size,
    rechazadas,
    fueraDelListadoConClave: huerfanas ? huerfanas.n : 0,
    resumen: await resumenEstudiantes(env),
  });
}

// ---------- Rutas ----------

export async function apiAdmin(request, env, url, correo) {
  const ruta = url.pathname.replace(/^\/admin/, '');
  const falta = faltantes(env);

  if (ruta === '/api/estado' && request.method === 'GET') {
    return json({ correo, ssid: env.MIST_SSID || null, faltan: falta, baseDatos: !!env.DB });
  }

  // Las operaciones que cambian algo exigen una cabecera propia: un
  // formulario de otro sitio no puede enviarla sin pasar por CORS.
  if (request.method !== 'GET' && request.headers.get('X-Lev-Wifi') !== '1') {
    return error('Pedido no permitido', 403);
  }

  if (ruta === '/api/estudiantes' && request.method === 'GET') {
    if (!env.DB) return error('Falta la base de datos D1 (binding DB)', 500);
    return json(await resumenEstudiantes(env));
  }
  if (ruta === '/api/estudiantes' && request.method === 'POST') {
    if (!env.DB) return error('Falta la base de datos D1 (binding DB)', 500);
    let cuerpo;
    try { cuerpo = await request.json(); } catch { return error('Datos inválidos'); }
    return importarEstudiantes(env, cuerpo, correo);
  }

  if (falta.length) return error(`Falta configurar: ${falta.join(', ')}`, 500);

  if (ruta === '/api/claves' && request.method === 'GET') {
    const todas = url.searchParams.get('todas') === '1';
    const [claves, clientes] = await Promise.all([listarClaves(env, { todas }), listarTodosClientes(env)]);
    // N.º de usuarios: dispositivos conectados ahora con cada clave.
    const conectados = {};
    for (const c of clientes) if (c.psk_id) conectados[c.psk_id] = (conectados[c.psk_id] || 0) + 1;
    const lista = claves.map((k) => ({
      id: k.id,
      nombre: k.name || '',
      email: k.email || '',
      clave: k.passphrase || '',
      uso: k.usage || 'multi',
      mac: k.mac || '',
      macs: Array.isArray(k.macs) ? k.macs.length : 0,
      ssid: k.ssid || '',
      vlan: k.vlan_id ?? null,
      rol: k.role || '',
      max: k.max_usage ?? 0,
      vence: k.expire_time ?? null,
      usuarios: conectados[k.id] || 0,
      prueba: esDePrueba(k, env),
    }));
    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    return json(lista);
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
    const email = String(cuerpo.email || '').trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('El correo no es válido');
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
      ...(email ? { email } : {}),
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
