// Base de datos D1 "lev-wifi" (binding DB). Las tablas se crean solas.
//
// No guarda frases de contraseña: esas viven solo en Mist.

const ESQUEMA = [
  // Listado de estudiantes importado desde el Excel (correo → curso).
  `CREATE TABLE IF NOT EXISTS estudiantes (
    correo TEXT PRIMARY KEY,
    nombre TEXT,
    nivel TEXT NOT NULL,
    paralelo TEXT NOT NULL,
    importado TEXT NOT NULL
  )`,
  // Cada clave que el portal creó en Mist.
  `CREATE TABLE IF NOT EXISTS claves (
    id TEXT PRIMARY KEY,
    correo TEXT NOT NULL,
    nombre_mist TEXT,
    rol TEXT,
    vlan INTEGER,
    creada TEXT NOT NULL,
    motivo TEXT,
    revocada TEXT,
    motivo_revocacion TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS claves_correo ON claves (correo, creada)`,
  // Registro de lo que pasa (quién hizo qué y cuándo).
  `CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY,
    cuando TEXT NOT NULL,
    correo TEXT,
    actor TEXT,
    accion TEXT NOT NULL,
    detalle TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS eventos_correo ON eventos (correo, cuando)`,
];

let listo = null;

export function asegurarEsquema(db) {
  if (!db) throw new Error('Falta el binding DB (base D1 lev-wifi) en wrangler.jsonc');
  if (!listo) {
    listo = db.batch(ESQUEMA.map((sql) => db.prepare(sql))).catch((e) => {
      listo = null;
      throw e;
    });
  }
  return listo;
}

export async function uno(db, sql, ...params) {
  return db.prepare(sql).bind(...params).first();
}

export async function todos(db, sql, ...params) {
  const r = await db.prepare(sql).bind(...params).all();
  return r.results || [];
}

export async function ejecutar(db, sql, ...params) {
  return db.prepare(sql).bind(...params).run();
}

export async function registrarEvento(db, { correo = null, actor = null, accion, detalle = null }) {
  await ejecutar(
    db,
    'INSERT INTO eventos (cuando, correo, actor, accion, detalle) VALUES (?, ?, ?, ?, ?)',
    new Date().toISOString(), correo, actor, accion, detalle == null ? null : JSON.stringify(detalle)
  );
}
