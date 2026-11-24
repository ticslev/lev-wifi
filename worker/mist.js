// Cliente mínimo de la API de Juniper Mist.
//
// Variables y secretos:
//   MIST_API      servidor de la API (p. ej. https://api.mist.com)
//   MIST_TOKEN    (secreto) token de API de Mist
//   MIST_ORG_ID   ID de la organización
//   MIST_SITE_ID  ID del sitio (para ver los clientes conectados)
//   MIST_SSID     SSID donde se crean las claves de prueba.
//
// La herramienta solo ve y borra claves de ese SSID cuyo nombre empieza
// con "prueba-". Así se puede usar sobre una red Multi-PSK en producción
// sin listar ni tocar las claves reales de estudiantes y personal.

export const PREFIJO = 'prueba-';
const esDePrueba = (k, env) => k && k.ssid === env.MIST_SSID && String(k.name || '').startsWith(PREFIJO);

export class ErrorMist extends Error {
  constructor(mensaje, estado, detalle) {
    super(mensaje);
    this.estado = estado;
    this.detalle = detalle;
  }
}

export function faltantes(env) {
  return ['MIST_API', 'MIST_TOKEN', 'MIST_ORG_ID', 'MIST_SITE_ID', 'MIST_SSID'].filter(
    (v) => !String(env[v] || '').trim()
  );
}

async function llamar(env, metodo, ruta, cuerpo) {
  const base = String(env.MIST_API).replace(/\/$/, '');
  const r = await fetch(`${base}/api/v1${ruta}`, {
    method: metodo,
    headers: {
      Authorization: `Token ${env.MIST_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await r.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch { datos = texto; }
  if (!r.ok) {
    const motivo = r.status === 401 || r.status === 403
      ? `Mist rechazó el token (código ${r.status}, ${metodo} ${ruta.split('?')[0].replace(/[0-9a-f-]{36}/g, '…')}): revisa MIST_TOKEN, sus permisos y que MIST_API sea la región correcta`
      : r.status === 404
        ? 'Mist no encontró el recurso (revisa MIST_API, MIST_ORG_ID o MIST_SITE_ID)'
        : `Mist respondió ${r.status}`;
    throw new ErrorMist(motivo, r.status, datos);
  }
  return datos;
}

const org = (env) => `/orgs/${env.MIST_ORG_ID}`;

export async function listarClaves(env) {
  const todas = await llamar(env, 'GET', `${org(env)}/psks?limit=1000`);
  return (Array.isArray(todas) ? todas : []).filter((k) => esDePrueba(k, env));
}

export async function crearClave(env, datos) {
  return llamar(env, 'POST', `${org(env)}/psks`, { ...datos, ssid: env.MIST_SSID });
}

export async function borrarClave(env, id) {
  // Comprueba primero que sea una clave de prueba.
  const clave = await llamar(env, 'GET', `${org(env)}/psks/${encodeURIComponent(id)}`);
  if (!esDePrueba(clave, env)) {
    throw new ErrorMist('Solo se pueden borrar claves de prueba creadas con esta herramienta', 403);
  }
  await llamar(env, 'DELETE', `${org(env)}/psks/${encodeURIComponent(id)}`);
  return clave;
}

// Solo devuelve los clientes conectados con alguna de las claves de prueba.
export async function listarClientes(env, idsPrueba) {
  const todos = await llamar(env, 'GET', `/sites/${env.MIST_SITE_ID}/stats/clients?limit=1000`);
  return (Array.isArray(todos) ? todos : []).filter(
    (c) => c.ssid === env.MIST_SSID && c.psk_id && idsPrueba.has(c.psk_id)
  );
}
