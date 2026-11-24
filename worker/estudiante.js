// API del portal del estudiante.
//
//   GET  /api/yo        → quién es, su curso y su clave actual (si tiene)
//   POST /api/mi-clave  → genera su clave (o una nueva, que reemplaza la anterior)
//
// El curso sale del listado importado (tabla estudiantes). Con él se arman
// el rol y la VLAN que se envían a Mist.

import { uno, ejecutar, registrarEvento } from './db.js';
import { reglaDe, rolMist, etiquetaCurso, limites } from './reglas.js';
import { generarClave } from './clave.js';
import { ErrorMist, faltantes, crearClave, obtenerClave, borrarClavePortal } from './mist.js';
import { json, error } from './util.js';

const MOTIVOS = {
  primera: 'Primer registro',
  compartida: 'La compartió o cree que alguien más la tiene',
  cambio: 'Quiere cambiarla',
  equipo: 'Cambió de equipo',
};

async function situacion(env, sesion) {
  const lim = limites(env);
  const base = {
    nombre: sesion.nombre,
    correo: sesion.correo,
    red: env.MIST_SSID || '',
    maxDispositivos: lim.maxDispositivos,
    limite: lim.limiteClaves,
  };
  const est = await uno(env.DB, 'SELECT nivel, paralelo FROM estudiantes WHERE correo = ?', sesion.correo);
  if (!est) return { ...base, permitido: false, motivo: 'no-listado' };
  const curso = etiquetaCurso(est.nivel, est.paralelo);
  const regla = reglaDe(est.nivel);
  if (!regla) return { ...base, curso, permitido: false, motivo: 'nivel' };

  const desde = new Date(Date.now() - lim.diasVentana * 86400000).toISOString();
  const fila = await uno(env.DB, 'SELECT COUNT(*) AS n FROM claves WHERE correo = ? AND creada >= ?', sesion.correo, desde);
  const activa = await uno(
    env.DB,
    'SELECT id, creada FROM claves WHERE correo = ? AND revocada IS NULL ORDER BY creada DESC LIMIT 1',
    sesion.correo
  );
  return {
    ...base,
    curso,
    rol: rolMist(est.nivel, est.paralelo),
    vlan: regla.vlan,
    permitido: true,
    usadas: fila ? fila.n : 0,
    activa,
  };
}

export async function apiYo(env, sesion) {
  const s = await situacion(env, sesion);
  const respuesta = {
    nombre: s.nombre,
    correo: s.correo,
    curso: s.curso || null,
    permitido: s.permitido,
    motivo: s.motivo || null,
    red: s.red,
    maxDispositivos: s.maxDispositivos,
    limite: s.limite,
    usadas: s.usadas ?? 0,
    clave: null,
  };
  if (s.permitido && s.activa) {
    const k = await obtenerClave(env, s.activa.id);
    if (k && k.passphrase) {
      respuesta.clave = { frase: k.passphrase, creada: s.activa.creada };
    } else {
      // La borraron en Mist: se marca como revocada para que pueda generar otra.
      await ejecutar(
        env.DB,
        "UPDATE claves SET revocada = ?, motivo_revocacion = 'No existe en Mist' WHERE id = ?",
        new Date().toISOString(), s.activa.id
      );
    }
  }
  return json(respuesta);
}

export async function apiMiClave(request, env, sesion) {
  const falta = faltantes(env);
  if (falta.length) return error('El portal aún no está configurado. Avisa al área de TI.', 503);

  let cuerpo = {};
  try { cuerpo = await request.json(); } catch { /* sin cuerpo */ }
  const motivo = Object.hasOwn(MOTIVOS, cuerpo.motivo) ? cuerpo.motivo : 'primera';

  const s = await situacion(env, sesion);
  if (!s.permitido) return error('Tu cuenta no puede generar una clave. Acércate al área de TI.', 403);
  if (s.usadas >= s.limite) {
    return error(`Ya generaste ${s.limite} claves en los últimos ${limites(env).diasVentana} días. Acércate al área de TI.`, 429);
  }
  if (s.activa && Date.now() - Date.parse(s.activa.creada) < 60 * 1000) {
    return error('Acabas de generar una clave. Espera un minuto antes de pedir otra.', 429);
  }

  const frase = generarClave();
  const datos = {
    name: s.nombre,
    email: s.correo,
    passphrase: frase,
    usage: 'multi',
    max_usage: s.maxDispositivos,
    vlan_id: s.vlan,
    role: s.rol,
    note: `lev-wifi · ${s.curso}`,
  };

  const ahora = new Date().toISOString();

  // Primero se borra la clave anterior (así el nombre en Mist queda libre y
  // la clave vieja deja de funcionar). Si después falla la creación, el
  // estudiante puede volver a intentarlo: ya no tiene clave activa.
  if (s.activa) {
    await borrarClavePortal(env, s.activa.id);
    await ejecutar(
      env.DB,
      'UPDATE claves SET revocada = ?, motivo_revocacion = ? WHERE id = ?',
      ahora, `Reemplazada: ${MOTIVOS[motivo]}`, s.activa.id
    );
  }

  let creada;
  try {
    try {
      creada = await crearClave(env, datos);
    } catch (e) {
      // Si Mist rechaza el nombre (por ejemplo, porque otra clave ya se llama
      // igual), se reintenta agregando el usuario del correo.
      if (e instanceof ErrorMist && e.estado === 400) {
        creada = await crearClave(env, { ...datos, name: `${s.nombre} (${s.correo.split('@')[0]})` });
      } else {
        throw e;
      }
    }
    if (!creada || !creada.id) throw new Error('Mist no devolvió el ID de la clave nueva');
  } catch (e) {
    await registrarEvento(env.DB, {
      correo: s.correo, actor: s.correo, accion: 'error-crear', detalle: { error: String(e.message || e) },
    });
    console.error('No se pudo crear la clave', s.correo, e);
    return error(
      s.activa
        ? 'Tu clave anterior ya no funciona, pero no se pudo crear la nueva. Vuelve a intentarlo en un momento.'
        : 'No se pudo crear tu clave. Vuelve a intentarlo en un momento.',
      502
    );
  }

  await ejecutar(
    env.DB,
    'INSERT INTO claves (id, correo, nombre_mist, rol, vlan, creada, motivo) VALUES (?, ?, ?, ?, ?, ?, ?)',
    creada.id, s.correo, creada.name || datos.name, s.rol, s.vlan, ahora, MOTIVOS[motivo]
  );

  await registrarEvento(env.DB, {
    correo: s.correo, actor: s.correo, accion: s.activa ? 'clave-nueva' : 'clave-primera',
    detalle: { id: creada.id, rol: s.rol, vlan: s.vlan, motivo: MOTIVOS[motivo] },
  });

  return json({ frase, red: s.red, maxDispositivos: s.maxDispositivos, creada: ahora }, 201);
}
