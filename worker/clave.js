// Generador de claves fáciles de dictar y escribir en un celular:
// cuatro palabras + dos dígitos, p. ej. "ceibo-lago-72-norte-pan".
// Usa el generador criptográfico del Worker (crypto.getRandomValues).
//
// Nota: es suficiente para la fase de pruebas. Antes de producción se
// revisará la longitud según el riesgo de que capturen el saludo WPA2
// y prueben claves por fuerza bruta fuera de línea.

const PALABRAS = [
  'agua', 'aire', 'alba', 'ancla', 'arco', 'arena', 'astro', 'avena',
  'bahia', 'balsa', 'barco', 'bosque', 'brisa', 'bruma', 'cabra', 'cacao',
  'calle', 'campo', 'canoa', 'carbon', 'casa', 'cedro', 'ceibo', 'cerro',
  'cielo', 'cisne', 'clavo', 'cobre', 'cometa', 'conejo', 'copa', 'coral',
  'cuarzo', 'cueva', 'delta', 'duna', 'eco', 'faro', 'feria', 'flor',
  'foca', 'fruta', 'fuego', 'gato', 'globo', 'grano', 'grillo', 'guante',
  'hielo', 'hoja', 'huerto', 'isla', 'jade', 'jardin', 'lago', 'lana',
  'laurel', 'leon', 'lima', 'lince', 'lirio', 'llama', 'lobo', 'luna',
  'maiz', 'mango', 'mapa', 'mar', 'menta', 'mesa', 'miel', 'mirlo',
  'monte', 'mora', 'musgo', 'nido', 'niebla', 'nieve', 'norte', 'nube',
  'nuez', 'ola', 'olivo', 'oro', 'oso', 'palma', 'pan', 'papel',
  'pato', 'perla', 'piedra', 'pino', 'plata', 'playa', 'pluma', 'polen',
  'puente', 'puma', 'quinua', 'rama', 'rana', 'rayo', 'remo', 'rio',
  'roble', 'roca', 'rosa', 'sal', 'salvia', 'selva', 'sierra', 'sol',
  'sur', 'tapir', 'tierra', 'tigre', 'trigo', 'trueno', 'tucan', 'tuna',
  'valle', 'vela', 'verde', 'viento', 'volcan', 'yuca', 'zafiro', 'zorro',
];

function aleatorio(n) {
  // Rechazo de muestras para no sesgar el resultado.
  const limite = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limite);
  return buf[0] % n;
}

export function generarClave() {
  const p = () => PALABRAS[aleatorio(PALABRAS.length)];
  const numero = String(aleatorio(90) + 10);
  return [p(), p(), numero, p(), p()].join('-');
}
