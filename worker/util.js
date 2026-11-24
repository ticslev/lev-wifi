// Utilidades compartidas (firmas, cookies y respuestas). Basadas en Lev Link.

export const CABECERAS_BASE = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
};

export function json(datos, estado = 200, cabeceras = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { ...CABECERAS_BASE, 'Content-Type': 'application/json; charset=utf-8', ...cabeceras },
  });
}

export function error(mensaje, estado = 400, detalle) {
  return json({ error: mensaje, detalle: detalle ?? null }, estado);
}

export function redirigir(destino, estado = 302, cabeceras = {}) {
  return new Response(null, { status: estado, headers: { ...CABECERAS_BASE, Location: destino, ...cabeceras } });
}

export function nonceNuevo() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

// Página HTML con CSP estricta: solo el script y el estilo con el nonce.
export function html(cuerpo, nonce, extraConnect = '') {
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}'`,
    `style-src 'nonce-${nonce}'`,
    `connect-src 'self'${extraConnect ? ' ' + extraConnect : ''}`,
    "img-src 'self' data:",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  return new Response(cuerpo, {
    headers: { ...CABECERAS_BASE, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': csp },
  });
}

export function ahoraISO() {
  return new Date().toISOString();
}

// ---------- base64url y firma HMAC ----------

const codificador = new TextEncoder();

export function aBase64url(bytes) {
  let texto = '';
  for (const b of new Uint8Array(bytes)) texto += String.fromCharCode(b);
  return btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function deBase64url(texto) {
  const normal = texto.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = normal + '='.repeat((4 - (normal.length % 4)) % 4);
  const binario = atob(relleno);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

async function claveHmac(secreto) {
  return crypto.subtle.importKey('raw', codificador.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function firmar(datos, secreto) {
  const cuerpo = aBase64url(codificador.encode(JSON.stringify(datos)));
  const firma = await crypto.subtle.sign('HMAC', await claveHmac(secreto), codificador.encode(cuerpo));
  return `${cuerpo}.${aBase64url(firma)}`;
}

export async function verificar(token, secreto) {
  if (!token || typeof token !== 'string') return null;
  const [cuerpo, firma] = token.split('.');
  if (!cuerpo || !firma) return null;
  let valido = false;
  try {
    valido = await crypto.subtle.verify('HMAC', await claveHmac(secreto), deBase64url(firma), codificador.encode(cuerpo));
  } catch {
    return null;
  }
  if (!valido) return null;
  try {
    const datos = JSON.parse(new TextDecoder().decode(deBase64url(cuerpo)));
    if (typeof datos.x === 'number' && datos.x < Date.now()) return null;
    return datos;
  } catch {
    return null;
  }
}

export function aleatorio(n = 16) {
  return aBase64url(crypto.getRandomValues(new Uint8Array(n)));
}

// ---------- Cookies ----------

export function leerCookie(request, nombre) {
  const texto = request.headers.get('Cookie') || '';
  for (const parte of texto.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function cookie(nombre, valor, segundos) {
  return [
    `${nombre}=${encodeURIComponent(valor)}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(segundos))}`,
  ].join('; ');
}
