// Reglas del colegio: qué niveles pueden generar clave, qué VLAN les toca
// y cómo se arma el rol que se envía a Mist.
//
// Para cambiar una VLAN o habilitar otro nivel, se edita esta tabla.
// La clave es el nivel tal como viene en el listado (columna NIVEL).

export const NIVELES = {
  '7MO EGB': { vlan: 94 },
  '8VO EGB': { vlan: 96 },
  '9NO EGB': { vlan: 96 },
  '10MO EGB': { vlan: 96 },
  '1RO BGU': { vlan: 98 },
  '2DO BGU': { vlan: 98 },
  '3RO BGU': { vlan: 98 },
};

// Dispositivos por clave y claves nuevas permitidas por trimestre.
// Se pueden cambiar con las variables MAX_DISPOSITIVOS y LIMITE_CLAVES.
export function limites(env) {
  const max = Number.parseInt(env.MAX_DISPOSITIVOS, 10);
  const lim = Number.parseInt(env.LIMITE_CLAVES, 10);
  return {
    maxDispositivos: Number.isInteger(max) && max >= 1 && max <= 10 ? max : 2,
    limiteClaves: Number.isInteger(lim) && lim >= 1 && lim <= 20 ? lim : 3,
    diasVentana: 90,
  };
}

export function sinTildes(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes y la virgulilla de la ñ
    .replace(/[^\x20-\x7e]/g, '');
}

// "  10mo   egb " → "10MO EGB"
export function normalizarNivel(texto) {
  return sinTildes(texto).toUpperCase().replace(/\s+/g, ' ').trim();
}

function capitalizar(palabra) {
  const p = palabra.toLowerCase();
  return p.charAt(0).toUpperCase() + p.slice(1);
}

// ("2DO BGU", "HONESTOS") → "2doBGUHonestos"; ("10MO EGB", "POSITIVOS") → "10moEGBPositivos"
// Sin espacios, sin tildes y con la ñ cambiada por n, porque Mist no los acepta.
export function rolMist(nivel, paralelo) {
  const [grado = '', tipo = ''] = normalizarNivel(nivel).split(' ');
  const par = sinTildes(paralelo)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map(capitalizar)
    .join('');
  return `${grado.toLowerCase()}${tipo.toUpperCase()}${par}`;
}

// Texto para mostrar al estudiante: "2do BGU · Honestos" (conserva las tildes).
export function etiquetaCurso(nivel, paralelo) {
  const [grado = '', tipo = ''] = String(nivel ?? '').trim().split(/\s+/);
  const par = String(paralelo ?? '').trim().toLocaleLowerCase('es');
  const parBonito = par.charAt(0).toLocaleUpperCase('es') + par.slice(1);
  return `${grado.toLowerCase()} ${tipo.toUpperCase()} · ${parBonito}`.trim();
}

export function reglaDe(nivel) {
  return NIVELES[normalizarNivel(nivel)] || null;
}
