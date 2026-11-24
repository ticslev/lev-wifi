// lev-wifi · Portal de registro a la red WiFi de la Unidad Educativa Lev Vygotsky.
//
//   /                 portal del estudiante (entra con Google @lev.edu.ec)
//   /auth/…           inicio y cierre de sesión con Google
//   /api/yo           datos del estudiante y su clave
//   /api/mi-clave     genera su clave en Mist (rol y VLAN según su curso)
//   /admin            consola de administración (Cloudflare Access)
//   /admin/api/…      API de la consola

import { verificarAcceso } from './acceso.js';
import { ErrorMist } from './mist.js';
import { paginaAdmin } from './pagina.js';
import { paginaPortal } from './portal.js';
import { apiAdmin } from './admin.js';
import { apiYo, apiMiClave } from './estudiante.js';
import { iniciar, volverDeGoogle, salir, sesionActual } from './auth.js';
import { asegurarEsquema } from './db.js';
import { CABECERAS_BASE, json, error, html, nonceNuevo, redirigir } from './util.js';

function textoPlano(texto, estado) {
  return new Response(texto, { status: estado, headers: { ...CABECERAS_BASE, 'Content-Type': 'text/plain; charset=utf-8' } });
}

function manejarError(e) {
  if (e instanceof ErrorMist) {
    console.error('Mist', e.estado, e.message, JSON.stringify(e.detalle));
    return error(e.message, e.estado === 403 ? 403 : 502, e.detalle);
  }
  console.error(e);
  return error('Error inesperado. Inténtalo otra vez o avisa al área de TI.', 500);
}

async function consola(request, env, url) {
  let correo;
  try {
    correo = await verificarAcceso(request, env);
  } catch (e) {
    return textoPlano(`Acceso denegado: ${e.message}`, 403);
  }
  if (url.pathname === '/admin') return redirigir('/admin/');
  if (url.pathname === '/admin/' && request.method === 'GET') {
    const nonce = nonceNuevo();
    return html(paginaAdmin(nonce), nonce);
  }
  if (url.pathname.startsWith('/admin/api/')) {
    try {
      return await apiAdmin(request, env, url, correo);
    } catch (e) {
      return manejarError(e);
    }
  }
  return textoPlano('No encontrado', 404);
}

async function portal(request, env, url) {
  const ruta = url.pathname;

  if (ruta === '/' && request.method === 'GET') {
    const nonce = nonceNuevo();
    return html(paginaPortal(nonce), nonce);
  }
  if (ruta === '/auth/login') return iniciar(request, env);
  if (ruta === '/auth/callback') return volverDeGoogle(request, env);
  if (ruta === '/auth/salir') return salir();

  if (ruta.startsWith('/api/')) {
    try {
      const sesion = await sesionActual(request, env);
      if (!sesion) {
        if (ruta === '/api/yo') return json({ sesion: false });
        return error('Inicia sesión con tu cuenta del colegio', 401);
      }
      if (!env.DB) return error('El portal aún no está configurado. Avisa al área de TI.', 503);
      await asegurarEsquema(env.DB);
      if (ruta === '/api/yo' && request.method === 'GET') return await apiYo(env, sesion);
      if (ruta === '/api/mi-clave' && request.method === 'POST') {
        if (request.headers.get('X-Lev-Wifi') !== '1') return error('Pedido no permitido', 403);
        return await apiMiClave(request, env, sesion);
      }
      return error('No encontrado', 404);
    } catch (e) {
      return manejarError(e);
    }
  }

  if (ruta === '/robots.txt') return textoPlano('User-agent: *\nDisallow: /\n', 200);
  return textoPlano('No encontrado', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) return consola(request, env, url);
    return portal(request, env, url);
  },
};

