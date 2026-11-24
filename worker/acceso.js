// Verificación de Cloudflare Access.
//
// Cloudflare Access pone delante del Worker una pantalla de inicio de
// sesión con Google y, si la persona está autorizada, agrega al pedido
// la cabecera Cf-Access-Jwt-Assertion: un token firmado por Cloudflare.
// Aquí se comprueba esa firma; no basta con leer la cabecera del correo,
// porque alguien podría inventarla si llegara al Worker por otra ruta.
//
// Variables necesarias:
//   ACCESS_TEAM  dominio del equipo, p. ej. "lev.cloudflareaccess.com"
//   ACCESS_AUD   "Application Audience (AUD) Tag" de la aplicación de Access
//   ADMINS       correos autorizados, separados por comas

let cacheLlaves = { team: '', hasta: 0, llaves: [] };

function b64urlABytes(txt) {
  const b64 = txt.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = b64 + '==='.slice((b64.length + 3) % 4);
  const bin = atob(relleno);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlAJson(txt) {
  return JSON.parse(new TextDecoder().decode(b64urlABytes(txt)));
}

async function llavesDe(team) {
  const ahora = Date.now();
  if (cacheLlaves.team === team && cacheLlaves.hasta > ahora) return cacheLlaves.llaves;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error('No se pudieron leer las llaves de Cloudflare Access');
  const { keys } = await r.json();
  const llaves = [];
  for (const jwk of keys || []) {
    if (jwk.kty !== 'RSA') continue;
    const llave = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    );
    llaves.push({ kid: jwk.kid, llave });
  }
  cacheLlaves = { team, hasta: ahora + 60 * 60 * 1000, llaves };
  return llaves;
}

// Devuelve el correo autenticado o lanza un error con el motivo.
export async function verificarAcceso(request, env) {
  const team = (env.ACCESS_TEAM || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const aud = (env.ACCESS_AUD || '').trim();
  const admins = (env.ADMINS || '').split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
  if (!team || !aud || admins.length === 0) {
    throw new Error('Falta configurar ACCESS_TEAM, ACCESS_AUD o ADMINS');
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new Error('El pedido no pasó por Cloudflare Access');

  const partes = token.split('.');
  if (partes.length !== 3) throw new Error('Token de Access inválido');
  const [h, p, firma] = partes;
  const cabecera = b64urlAJson(h);
  const datos = b64urlAJson(p);
  if (cabecera.alg !== 'RS256') throw new Error('Algoritmo de token no admitido');

  const llaves = await llavesDe(team);
  const candidata = llaves.find((k) => k.kid === cabecera.kid);
  if (!candidata) throw new Error('Token firmado con una llave desconocida');
  const valida = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    candidata.llave,
    b64urlABytes(firma),
    new TextEncoder().encode(`${h}.${p}`)
  );
  if (!valida) throw new Error('Firma del token inválida');

  const ahora = Math.floor(Date.now() / 1000);
  const auds = Array.isArray(datos.aud) ? datos.aud : [datos.aud];
  if (!auds.includes(aud)) throw new Error('El token es de otra aplicación de Access');
  if (datos.iss !== `https://${team}`) throw new Error('Emisor del token inesperado');
  if (typeof datos.exp !== 'number' || datos.exp < ahora) throw new Error('El token expiró');

  const correo = String(datos.email || '').toLowerCase();
  if (!admins.includes(correo)) throw new Error(`La cuenta ${correo || '(sin correo)'} no está autorizada`);
  return correo;
}
