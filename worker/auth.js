// Inicio de sesión de estudiantes con Google (OpenID Connect), solo cuentas
// del dominio del colegio. Basado en Lev Link, pero sin tabla de usuarios:
// la sesión es una cookie firmada con el correo y el nombre de Google.
//
// Secretos: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET (32+ caracteres).
// URI de redirección autorizada en Google: https://wifi.lev.edu.ec/auth/callback

import { firmar, verificar, aleatorio, leerCookie, cookie, redirigir, deBase64url } from './util.js';

const COOKIE_SESION = 'lev_wifi';
const COOKIE_OAUTH = 'lev_wifi_oauth';
const DURACION_SESION = 12 * 60 * 60; // 12 horas

export function dominio(env) {
  return (env.DOMINIO || 'lev.edu.ec').toLowerCase();
}

function secreto(env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error('Falta SESSION_SECRET (mínimo 32 caracteres) en las variables del Worker.');
  }
  return env.SESSION_SECRET;
}

// { correo, nombre } de la sesión actual, o null.
export async function sesionActual(request, env) {
  if (!env.SESSION_SECRET) return null;
  const datos = await verificar(leerCookie(request, COOKIE_SESION), secreto(env));
  if (!datos || typeof datos.c !== 'string') return null;
  return { correo: datos.c, nombre: datos.n || datos.c.split('@')[0] };
}

async function crearSesion(env, correo, nombre) {
  const token = await firmar({ c: correo, n: nombre, x: Date.now() + DURACION_SESION * 1000 }, secreto(env));
  const r = redirigir('/');
  r.headers.append('Set-Cookie', cookie(COOKIE_SESION, token, DURACION_SESION));
  r.headers.append('Set-Cookie', cookie(COOKIE_OAUTH, '', 0));
  return r;
}

export async function iniciar(request, env) {
  const url = new URL(request.url);

  // Solo para pruebas en el computador: entra sin Google si DEV_EMAIL está definido.
  if (env.DEV_EMAIL && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
    return crearSesion(env, env.DEV_EMAIL.toLowerCase(), env.DEV_NOMBRE || 'Estudiante de prueba');
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET) {
    return redirigir('/?estado=configuracion');
  }

  const estado = aleatorio(24);
  const nonce = aleatorio(24);
  const token = await firmar({ s: estado, n: nonce, x: Date.now() + 10 * 60 * 1000 }, secreto(env));
  const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  google.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  google.searchParams.set('redirect_uri', `${url.origin}/auth/callback`);
  google.searchParams.set('response_type', 'code');
  google.searchParams.set('scope', 'openid email profile');
  google.searchParams.set('state', estado);
  google.searchParams.set('nonce', nonce);
  google.searchParams.set('hd', dominio(env));
  google.searchParams.set('prompt', 'select_account');
  return redirigir(google.toString(), 302, { 'Set-Cookie': cookie(COOKIE_OAUTH, token, 600) });
}

export async function volverDeGoogle(request, env) {
  const url = new URL(request.url);
  if (!env.SESSION_SECRET) return redirigir('/?estado=configuracion');
  const guardado = await verificar(leerCookie(request, COOKIE_OAUTH), secreto(env));
  const estado = url.searchParams.get('state');
  const code = url.searchParams.get('code');

  if (url.searchParams.get('error')) return redirigir('/');
  if (!guardado || !estado || guardado.s !== estado || !code) return redirigir('/?estado=error');

  const respuesta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/auth/callback`,
      grant_type: 'authorization_code',
    }),
  });
  if (!respuesta.ok) {
    console.error('Google token', respuesta.status, await respuesta.text());
    return redirigir('/?estado=error');
  }
  const { id_token: idToken } = await respuesta.json();

  // El id_token llega directo de Google por HTTPS (flujo con código),
  // así que basta con revisar su contenido.
  let datos;
  try {
    datos = JSON.parse(new TextDecoder().decode(deBase64url(idToken.split('.')[1])));
  } catch {
    return redirigir('/?estado=error');
  }
  const correo = String(datos.email || '').toLowerCase();
  const correcto =
    ['accounts.google.com', 'https://accounts.google.com'].includes(datos.iss) &&
    datos.aud === env.GOOGLE_CLIENT_ID &&
    datos.exp * 1000 > Date.now() &&
    datos.nonce === guardado.n &&
    datos.email_verified === true;
  if (!correcto) return redirigir('/?estado=error');
  if (datos.hd !== dominio(env) || !correo.endsWith('@' + dominio(env))) return redirigir('/?estado=dominio');

  const nombre = String(datos.name || correo.split('@')[0]).replace(/\s+/g, ' ').trim().slice(0, 80);
  return crearSesion(env, correo, nombre);
}

export function salir() {
  return redirigir('/', 302, { 'Set-Cookie': cookie(COOKIE_SESION, '', 0) });
}
