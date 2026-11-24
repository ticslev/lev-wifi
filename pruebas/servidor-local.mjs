// Servidor local para probar la página sin Cloudflare ni Mist reales.
//
//   node pruebas/servidor-local.mjs      →  http://localhost:4325
//
// Imita a Cloudflare Access (firma un token con una llave de prueba) y a
// la API de Mist (claves y clientes en memoria). Solo escucha en localhost.

import http from 'node:http';
import worker from '../worker/index.js';

const PUERTO = Number(process.env.PUERTO || 4325);
const TEAM = 'prueba.cloudflareaccess.com';
const AUD = 'aud-de-prueba';
const CORREO = process.env.DEV_EMAIL || 'admin@lev.edu.ec';

// --- Llave de prueba para firmar el token de Access ---
const par = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify']
);
const jwkPublica = { ...(await crypto.subtle.exportKey('jwk', par.publicKey)), kid: 'k1' };
const b64url = (buf) => Buffer.from(buf).toString('base64url');
async function tokenAccess() {
  const h = b64url(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' }));
  const p = b64url(JSON.stringify({
    aud: [AUD], iss: `https://${TEAM}`, email: CORREO, exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', par.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(firma)}`;
}

// --- Mist simulado ---
const SSID = 'LEV';
const claves = [
  { id: '0b1c2d3e-0000-4000-8000-000000000001', name: 'prueba-a', passphrase: 'ceibo-lago-72-norte-pan', ssid: SSID, vlan_id: 140, max_usage: 1, expire_time: Math.floor(Date.now() / 1000) + 86400 },
  { id: '0b1c2d3e-0000-4000-8000-000000000098', name: 'estudiante@lev.edu.ec', passphrase: 'clave-real', ssid: SSID, vlan_id: 150, max_usage: 1 },
  { id: '0b1c2d3e-0000-4000-8000-000000000099', name: 'docentes-real', passphrase: 'no-tocar', ssid: 'LEV-DOCENTES', vlan_id: 200, max_usage: 3 },
];
const clientes = [
  { mac: 'aa11bb22cc33', ssid: SSID, psk_id: claves[0].id, vlan_id: 140, ip: '10.14.0.23', hostname: 'Galaxy-A54 <b>x</b>', manufacture: 'Samsung', family: 'Android', model: 'Galaxy A54', os: 'Android 15', ap_mac: '5c5b35000001' },
  { mac: '112233445566', ssid: SSID, psk_id: '0b1c2d3e-0000-4000-8000-000000000098', vlan_id: 150, ip: '10.15.0.9', hostname: 'celular-estudiante' },
  { mac: 'dd44ee55ff66', ssid: 'LEV-DOCENTES', vlan_id: 200, ip: '10.20.0.5', hostname: 'laptop-docente' },
];

const fetchReal = globalThis.fetch;
globalThis.fetch = async (entrada, op = {}) => {
  const url = new URL(typeof entrada === 'string' ? entrada : entrada.url);
  const r = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
  if (url.host === TEAM && url.pathname === '/cdn-cgi/access/certs') return r({ keys: [jwkPublica] });
  if (url.host === 'api.mist.test') {
    if (op.headers?.Authorization !== 'Token token-de-prueba') return r({ detail: 'auth' }, 401);
    const m = url.pathname.match(/^\/api\/v1\/sites\/site1\/psks(?:\/([^/]+))?$/);
    if (m && !m[1] && op.method === 'GET') return r(claves);
    if (m && !m[1] && op.method === 'POST') {
      const k = { id: crypto.randomUUID(), ...JSON.parse(op.body) };
      claves.push(k);
      return r(k);
    }
    if (m && m[1]) {
      const i = claves.findIndex((k) => k.id === m[1]);
      if (i < 0) return r({ detail: 'not found' }, 404);
      if (op.method === 'GET') return r(claves[i]);
      if (op.method === 'DELETE') { claves.splice(i, 1); return new Response('', { status: 200 }); }
    }
    if (url.pathname === '/api/v1/sites/site1/stats/clients') return r(clientes);
    return r({ detail: 'not found' }, 404);
  }
  return fetchReal(entrada, op);
};

const env = {
  ACCESS_TEAM: TEAM, ACCESS_AUD: AUD, ADMINS: CORREO,
  MIST_API: 'https://api.mist.test', MIST_TOKEN: 'token-de-prueba',
  MIST_ORG_ID: 'org1', MIST_SITE_ID: 'site1', MIST_SSID: SSID,
};

http.createServer(async (req, res) => {
  const trozos = [];
  for await (const t of req) trozos.push(t);
  const headers = new Headers(req.headers);
  if (process.env.SIN_ACCESS !== '1') headers.set('Cf-Access-Jwt-Assertion', await tokenAccess());
  const pedido = new Request(`http://localhost:${PUERTO}${req.url}`, {
    method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(trozos),
  });
  const respuesta = await worker.fetch(pedido, env);
  res.writeHead(respuesta.status, Object.fromEntries(respuesta.headers));
  res.end(Buffer.from(await respuesta.arrayBuffer()));
}).listen(PUERTO, '127.0.0.1', () => console.log(`lev-wifi local en http://localhost:${PUERTO}`));
