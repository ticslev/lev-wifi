// Página de la herramienta de prueba. Todo lo que viene de Mist
// (nombres de equipos, etc.) se muestra con textContent, nunca como HTML.

export function paginaAdmin(nonce) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Consola WiFi · Lev</title>
<style nonce="${nonce}">
:root{--tinta:#1d1630;--morado:#8750f7;--morado-osc:#2a1454;--fondo:#f6f2ff;--borde:#ddd3f5;--suave:#5a5270;--rojo:#b3261e;--verde:#1e6b43}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--fondo);color:var(--tinta);line-height:1.45}
header{background:var(--morado-osc);color:#fff;padding:18px 16px}
header div{max-width:1440px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:baseline;justify-content:space-between}
header h1{margin:0;font-size:20px}
header small{color:#d9ccff}
main{max-width:1440px;margin:0 auto;padding:20px 16px 48px;display:flex;flex-direction:column;gap:20px}
section{background:#fff;border:1px solid var(--borde);border-radius:12px;padding:18px}
h2{margin:0 0 12px;font-size:17px}
p{margin:0 0 10px}
.aviso{background:#fff4e0;border-color:#f0d39b;color:#6b4300}
.error{background:#fdecea;border-color:#f3c1bc;color:var(--rojo)}
.oculto{display:none}
form{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;align-items:end}
label{display:flex;flex-direction:column;gap:4px;font-size:14px;color:var(--suave)}
input{min-height:44px;padding:0 10px;border:1px solid #c8bde6;border-radius:8px;font:inherit;color:var(--tinta);background:#fff}
button{min-height:44px;padding:0 16px;border-radius:8px;font:inherit;font-weight:600;cursor:pointer;border:1px solid var(--morado);background:#fff;color:var(--morado-osc)}
button.primario{background:var(--morado);color:#fff;border-color:var(--morado)}
button.peligro{border-color:var(--rojo);color:var(--rojo);min-height:36px;padding:0 12px}
button:disabled{opacity:.6;cursor:wait}
.nueva{margin-top:14px;padding:14px;border-radius:10px;background:#efe7ff}
.nueva strong{display:block;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:22px;letter-spacing:.02em;word-break:break-all}
.tabla{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:14px;min-width:720px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #eee8fb;vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--suave)}
td.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px}
.fila{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:12px}
.fila h2{margin:0}
.vacio{color:var(--suave);font-size:14px}
.acciones{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
button.enlace{border:0;background:none;color:#1a5fb4;text-decoration:underline;font-weight:500;padding:0 6px}
.filtros{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px}
.segmento{display:inline-flex;border:1px solid #c8bde6;border-radius:8px;overflow:hidden}
.segmento button{border:0;border-radius:0;min-height:40px;font-weight:500;background:#fff;color:var(--tinta)}
.segmento button[aria-pressed=true]{background:var(--morado-osc);color:#fff}
.buscar{flex:1 1 260px}
.buscar input{width:100%}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
table.claves{min-width:1040px}
table.claves th,table.claves td{white-space:nowrap}
td.num{text-align:right;font-variant-numeric:tabular-nums}
.etiqueta{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:#efe7ff;color:var(--morado-osc);font-size:12px;font-weight:600}
ol{margin:0;padding-left:20px}
li{margin-bottom:6px}
form.importar{grid-template-columns:minmax(0,1fr) auto}
@media (max-width:560px){form.importar{grid-template-columns:1fr}}
input[type=file]{padding:8px 10px;min-height:44px}
.totales{font-size:15px;margin:14px 0 10px}
table.cursos{min-width:560px}
td.nohab{color:var(--suave)}
ul.rechazos{margin:8px 0 0;padding-left:20px;font-size:14px}
</style>
</head>
<body>
<header><div><h1>Consola WiFi del Lev</h1><small id="quien">Cargando…</small></div></header>
<main>
<section id="estado" class="aviso oculto"></section>

<section>
<div class="fila"><h2>Listado de estudiantes</h2><span id="ultimaImportacion" class="vacio"></span></div>
<p class="vacio">Sube el Excel con las columnas <b>NIVEL</b>, <b>PARALELO_NOMBRE</b>, <b>ESTUDIANTE</b> y <b>CORREO</b> (o un CSV con las mismas columnas). Reemplaza el listado completo. Con él, el portal sabe el curso de cada estudiante y arma el rol y la VLAN que se envían a Mist.</p>
<form id="importar" class="importar">
<label>Archivo del listado<input id="archivo" name="archivo" type="file" accept=".xlsx,.csv" required></label>
<button class="primario" type="submit">Importar listado</button>
</form>
<div id="resultadoImportar" class="nueva oculto" role="status"></div>
<div id="resumenEstudiantes" class="oculto">
<p id="totales" class="totales"></p>
<div class="tabla"><table class="cursos"><thead><tr><th>Curso</th><th>Rol en Mist</th><th>VLAN</th><th>Estudiantes</th><th>Con clave</th></tr></thead><tbody id="cursos"></tbody></table></div>
</div>
</section>

<section>
<h2>1. Crear una clave de prueba</h2>
<p class="vacio">Se crea en Mist para la red <b id="ssid">—</b> con un nombre que empieza por «prueba-». Solo esas claves se pueden borrar desde aquí. Usa VLANs reales para comprobar que el FortiGate aplica el perfil correcto.</p>
<form id="crear">
<label>Nombre (p. ej. prueba1)<input name="nombre" required maxlength="40" autocomplete="off"></label>
<label>VLAN<input name="vlan" type="number" min="1" max="4094" required></label>
<label>Rol (opcional, p. ej. 10moPositivos)<input name="rol" maxlength="32" autocomplete="off"></label>
<label>Email (opcional)<input name="email" type="email" maxlength="120" autocomplete="off"></label>
<label>Máx. dispositivos (0 = sin límite)<input name="max" type="number" min="0" max="20" value="1" required></label>
<label>Vigencia (horas)<input name="horas" type="number" min="1" max="720" value="48" required></label>
<button class="primario" type="submit">Crear clave</button>
</form>
<div id="nueva" class="nueva oculto" role="status"></div>
</section>

<section>
<div class="fila"><h2>2. Claves compartidas</h2>
<div class="acciones">
<button id="revelar" type="button" class="enlace">Revelar contraseñas</button>
<button id="recargarClaves" type="button">Actualizar</button>
</div></div>
<div class="filtros">
<div role="group" aria-label="Qué claves mostrar" class="segmento">
<button type="button" id="verPrueba" aria-pressed="true">Claves de prueba</button>
<button type="button" id="verTodas" aria-pressed="false">Todas las del sitio</button>
</div>
<label class="buscar"><span class="sr">Filtrar claves</span><input id="filtro" type="search" placeholder="Filtrar por nombre, email, rol, VLAN o SSID" autocomplete="off"></label>
<span id="contador" class="vacio"></span>
</div>
<p id="notaTodas" class="vacio oculto">Vista de solo lectura: las claves reales del sitio no se pueden borrar ni modificar desde aquí.</p>
<div class="tabla"><table class="claves"><thead><tr><th>Nombre de clave</th><th>Email</th><th>Frase de contraseña</th><th>Uso</th><th>SSID</th><th>ID de VLAN</th><th>Rol</th><th>N.º de usuarios</th><th>Vence</th><th></th></tr></thead><tbody id="claves"></tbody></table></div>
<p id="clavesVacio" class="vacio oculto">No hay claves para mostrar.</p>
</section>

<section>
<div class="fila"><h2>3. Dispositivos conectados con claves de prueba</h2><button id="recargarClientes" type="button">Actualizar</button></div>
<div class="tabla"><table><thead><tr><th>Clave</th><th>VLAN</th><th>IP</th><th>MAC</th><th>Nombre del equipo</th><th>Fabricante · modelo · SO</th><th>AP</th></tr></thead><tbody id="clientes"></tbody></table></div>
<p id="clientesVacio" class="vacio oculto">No hay dispositivos conectados con claves de prueba.</p>
</section>

<section>
<h2>Qué comprobar</h2>
<ol>
<li>Con la clave A (máx. 1) conecta un celular: debe aparecer arriba con la VLAN de esa clave, y el FortiGate debe aplicarle el perfil de esa VLAN.</li>
<li>Con la misma clave A conecta un segundo equipo: Mist debe rechazarlo.</li>
<li>Con la clave B (otra VLAN, máx. 2) conecta dos equipos: ambos entran en la VLAN de B.</li>
<li>Borra la clave A: el celular no debe poder volver a conectarse.</li>
<li>Anota si Mist muestra fabricante, modelo y sistema de cada equipo.</li>
</ol>
</section>
</main>
<script nonce="${nonce}">
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var estado = $('estado');

  function mostrarError(msg){
    estado.className = 'error';
    estado.textContent = msg;
  }
  function limpiarError(){ estado.className = 'aviso oculto'; estado.textContent = ''; }

  function pedir(metodo, ruta, cuerpo){
    var op = { method: metodo, headers: { 'X-Lev-Wifi': '1' } };
    if (cuerpo) { op.headers['Content-Type'] = 'application/json'; op.body = JSON.stringify(cuerpo); }
    return fetch(ruta, op).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(d){
        if (!r.ok) throw new Error(d.error || ('Error ' + r.status));
        return d;
      });
    });
  }

  function celda(fila, texto, clase){
    var td = document.createElement('td');
    td.textContent = texto == null || texto === '' ? '—' : String(texto);
    if (clase) td.className = clase;
    fila.appendChild(td);
    return td;
  }

  function fecha(seg){
    if (!seg) return 'Sin vencimiento';
    return new Date(seg * 1000).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
  }

  var vista = { todas: false, revelar: false, filtro: '', lista: [] };

  function formatoMac(m){
    var x = String(m || '').toLowerCase().replace(/[^0-9a-f]/g, '');
    return x.length === 12 ? x.match(/../g).join(':') : (m || 'sin MAC');
  }

  function usoTexto(k){
    if (k.uso === 'single') return 'Usuario (' + formatoMac(k.mac) + ')';
    if (k.uso === 'macs') return 'Lista de MACs (' + k.macs + ')';
    return 'Múltiples usuarios' + (k.max ? ' · máx. ' + k.max : '');
  }

  function pintarClaves(){
    var q = vista.filtro.trim().toLowerCase();
    var lista = vista.lista.filter(function(k){
      if (!q) return true;
      return [k.nombre, k.email, k.rol, k.ssid, String(k.vlan == null ? '' : k.vlan), k.mac].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    var tb = $('claves'); tb.textContent = '';
    $('clavesVacio').className = lista.length ? 'vacio oculto' : 'vacio';
    $('contador').textContent = lista.length + ' de ' + vista.lista.length + ' claves';
    lista.forEach(function(k){
      var tr = document.createElement('tr');
      var tdNombre = celda(tr, k.nombre);
      if (k.prueba && vista.todas) {
        var et = document.createElement('span'); et.className = 'etiqueta'; et.textContent = 'prueba';
        tdNombre.appendChild(et);
      }
      celda(tr, k.email);
      celda(tr, vista.revelar ? k.clave : '********', 'mono');
      celda(tr, usoTexto(k));
      celda(tr, k.ssid);
      celda(tr, k.vlan, 'mono');
      celda(tr, k.rol);
      celda(tr, k.usuarios, 'num');
      celda(tr, k.vence ? fecha(k.vence) : '—');
      var td = document.createElement('td');
      if (k.prueba) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'peligro'; b.textContent = 'Borrar';
        b.addEventListener('click', function(){
          if (!window.confirm('¿Borrar la clave ' + k.nombre + '?')) return;
          b.disabled = true;
          pedir('DELETE', '/admin/api/claves/' + encodeURIComponent(k.id))
            .then(function(){ limpiarError(); return cargarClaves(); })
            .catch(function(e){ b.disabled = false; mostrarError(e.message); });
        });
        td.appendChild(b);
      }
      tr.appendChild(td);
      tb.appendChild(tr);
    });
  }

  function cargarClaves(){
    return pedir('GET', '/admin/api/claves' + (vista.todas ? '?todas=1' : '')).then(function(lista){
      vista.lista = lista;
      pintarClaves();
    });
  }

  function elegirVista(todas){
    vista.todas = todas;
    $('verPrueba').setAttribute('aria-pressed', String(!todas));
    $('verTodas').setAttribute('aria-pressed', String(todas));
    $('notaTodas').className = todas ? 'vacio' : 'vacio oculto';
    cargarClaves().catch(function(e){ mostrarError(e.message); });
  }
  $('verPrueba').addEventListener('click', function(){ elegirVista(false); });
  $('verTodas').addEventListener('click', function(){ elegirVista(true); });
  $('filtro').addEventListener('input', function(e){ vista.filtro = e.target.value; pintarClaves(); });
  $('revelar').addEventListener('click', function(){
    vista.revelar = !vista.revelar;
    $('revelar').textContent = vista.revelar ? 'Ocultar contraseñas' : 'Revelar contraseñas';
    pintarClaves();
  });

  function cargarClientes(){
    return pedir('GET', '/admin/api/clientes').then(function(lista){
      var tb = $('clientes'); tb.textContent = '';
      $('clientesVacio').className = lista.length ? 'vacio oculto' : 'vacio';
      lista.forEach(function(c){
        var tr = document.createElement('tr');
        celda(tr, c.clave);
        celda(tr, c.vlan, 'mono');
        celda(tr, c.ip, 'mono');
        celda(tr, c.mac, 'mono');
        celda(tr, c.nombre);
        celda(tr, [c.fabricante, c.modelo || c.familia, c.so].filter(Boolean).join(' · '));
        celda(tr, c.ap, 'mono');
        tb.appendChild(tr);
      });
    });
  }

  $('crear').addEventListener('submit', function(ev){
    ev.preventDefault();
    var f = ev.target, b = f.querySelector('button');
    b.disabled = true;
    pedir('POST', '/admin/api/claves', {
      nombre: f.nombre.value, vlan: f.vlan.value, rol: f.rol.value, email: f.email.value, max: f.max.value, horas: f.horas.value
    }).then(function(k){
      limpiarError();
      var caja = $('nueva'); caja.textContent = '';
      caja.appendChild(document.createTextNode('Clave ' + k.nombre + ' creada (VLAN ' + k.vlan + (k.rol ? ', rol ' + k.rol : '') + ', máx. ' + (k.max || 'sin límite') + '):'));
      var s = document.createElement('strong'); s.textContent = k.clave; caja.appendChild(s);
      caja.className = 'nueva';
      f.nombre.value = '';
      return cargarClaves();
    }).catch(function(e){ mostrarError(e.message); })
      .then(function(){ b.disabled = false; });
  });

  $('recargarClaves').addEventListener('click', function(){ cargarClaves().catch(function(e){ mostrarError(e.message); }); });
  $('recargarClientes').addEventListener('click', function(){ cargarClientes().catch(function(e){ mostrarError(e.message); }); });

  // ---------- Listado de estudiantes ----------

  function u16(d, o){ return d.getUint16(o, true); }
  function u32(d, o){ return d.getUint32(o, true); }

  // Lector mínimo de .xlsx (un .zip con XML), sin librerías externas.
  async function leerZip(buf){
    var d = new DataView(buf), eocd = -1;
    for (var i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
      if (u32(d, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('El archivo no parece un Excel (.xlsx) válido');
    var n = u16(d, eocd + 10), p = u32(d, eocd + 16), archivos = {};
    for (var k = 0; k < n; k++) {
      if (u32(d, p) !== 0x02014b50) break;
      var ln = u16(d, p + 28), le = u16(d, p + 30), lc = u16(d, p + 32);
      var nombre = new TextDecoder().decode(new Uint8Array(buf, p + 46, ln));
      archivos[nombre] = { metodo: u16(d, p + 10), comp: u32(d, p + 20), off: u32(d, p + 42) };
      p += 46 + ln + le + lc;
    }
    async function texto(nombre){
      var a = archivos[nombre]; if (!a) return null;
      var ini = a.off + 30 + u16(d, a.off + 26) + u16(d, a.off + 28);
      var datos = new Uint8Array(buf.slice(ini, ini + a.comp));
      if (a.metodo === 8) {
        var s = new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        datos = new Uint8Array(await new Response(s).arrayBuffer());
      }
      return new TextDecoder().decode(datos);
    }
    return { texto: texto, nombres: Object.keys(archivos) };
  }

  function xml(texto){ return new DOMParser().parseFromString(texto, 'application/xml'); }
  function etiquetas(nodo, nombre){ return Array.prototype.slice.call(nodo.getElementsByTagNameNS('*', nombre)); }
  function columna(ref){
    var letras = String(ref || '').replace(/[0-9]/g, ''), n = 0;
    for (var i = 0; i < letras.length; i++) n = n * 26 + (letras.charCodeAt(i) - 64);
    return n - 1;
  }

  async function filasXlsx(buf){
    var zip = await leerZip(buf);
    var compartidos = [];
    var ss = await zip.texto('xl/sharedStrings.xml');
    if (ss) compartidos = etiquetas(xml(ss), 'si').map(function(si){
      return etiquetas(si, 't').map(function(t){ return t.textContent; }).join('');
    });
    var hojas = zip.nombres.filter(function(x){ return /^xl\\/worksheets\\/sheet\\d+\\.xml$/.test(x); }).sort();
    var hoja = zip.nombres.indexOf('xl/worksheets/sheet1.xml') >= 0 ? 'xl/worksheets/sheet1.xml' : hojas[0];
    if (!hoja) throw new Error('No se encontró ninguna hoja en el Excel');
    return etiquetas(xml(await zip.texto(hoja)), 'row').map(function(fila){
      var valores = [];
      etiquetas(fila, 'c').forEach(function(c){
        var t = c.getAttribute('t'), v = etiquetas(c, 'v')[0], valor = '';
        if (t === 's' && v) valor = compartidos[Number(v.textContent)] || '';
        else if (t === 'inlineStr') valor = etiquetas(c, 't').map(function(x){ return x.textContent; }).join('');
        else if (v) valor = v.textContent;
        valores[columna(c.getAttribute('r'))] = valor;
      });
      return valores;
    });
  }

  function filasCsv(buf){
    var texto = new TextDecoder('utf-8').decode(buf);
    if (texto.indexOf('\\uFFFD') >= 0) texto = new TextDecoder('windows-1252').decode(buf);
    texto = texto.replace(/^\\uFEFF/, '');
    var primera = texto.split(/\\r?\\n/)[0] || '';
    var sep = (primera.split(';').length > primera.split(',').length) ? ';' : ',';
    var filas = [], fila = [], campo = '', comillas = false;
    for (var i = 0; i < texto.length; i++) {
      var ch = texto[i];
      if (comillas) {
        if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
        else if (ch === '"') comillas = false;
        else campo += ch;
      } else if (ch === '"') comillas = true;
      else if (ch === sep) { fila.push(campo); campo = ''; }
      else if (ch === '\\n' || ch === '\\r') {
        if (ch === '\\r' && texto[i + 1] === '\\n') i++;
        fila.push(campo); filas.push(fila); fila = []; campo = '';
      } else campo += ch;
    }
    if (campo || fila.length) { fila.push(campo); filas.push(fila); }
    return filas;
  }

  function normal(t){ return String(t || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase().trim(); }

  function aEstudiantes(filas){
    var idx = -1, col = null;
    for (var i = 0; i < Math.min(filas.length, 15); i++) {
      var h = (filas[i] || []).map(normal);
      var c = {
        correo: h.findIndex(function(x){ return x.indexOf('CORREO') >= 0 || x.indexOf('EMAIL') >= 0; }),
        nivel: h.findIndex(function(x){ return x === 'NIVEL' || x.indexOf('NIVEL') === 0; }),
        paralelo: h.findIndex(function(x){ return x.indexOf('PARALELO') >= 0; }),
        nombre: h.findIndex(function(x){ return x.indexOf('ESTUDIANTE') >= 0 || x === 'NOMBRE' || x === 'NOMBRES'; })
      };
      if (c.correo >= 0 && c.nivel >= 0 && c.paralelo >= 0) { idx = i; col = c; break; }
    }
    if (idx < 0) throw new Error('No encontré las columnas NIVEL, PARALELO_NOMBRE y CORREO en las primeras filas');
    var lista = [];
    for (var j = idx + 1; j < filas.length; j++) {
      var f = filas[j] || [];
      var vacia = !f.some(function(x){ return String(x || '').trim(); });
      if (vacia) continue;
      lista.push({
        fila: j + 1,
        correo: String(f[col.correo] || '').trim(),
        nivel: String(f[col.nivel] || '').trim(),
        paralelo: String(f[col.paralelo] || '').trim(),
        nombre: col.nombre >= 0 ? String(f[col.nombre] || '').trim() : ''
      });
    }
    return lista;
  }

  function pintarResumen(r){
    $('resumenEstudiantes').className = r.total ? '' : 'oculto';
    $('ultimaImportacion').textContent = r.ultimaImportacion ? 'Última importación: ' + new Date(r.ultimaImportacion).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) : 'Sin listado importado';
    $('totales').textContent = r.total + ' estudiantes en el listado · ' + r.habilitados + ' pueden usar el portal · ' + r.conClave + ' ya generaron su clave';
    var tb = $('cursos'); tb.textContent = '';
    r.cursos.forEach(function(c){
      var tr = document.createElement('tr');
      celda(tr, c.curso);
      celda(tr, c.rol || 'No habilitado', c.rol ? 'mono' : 'nohab');
      celda(tr, c.vlan, 'mono');
      celda(tr, c.total, 'num');
      celda(tr, c.vlan === null ? '' : c.conClave, 'num');
      tb.appendChild(tr);
    });
  }

  function cargarEstudiantes(){
    return pedir('GET', '/admin/api/estudiantes').then(pintarResumen);
  }

  $('importar').addEventListener('submit', function(ev){
    ev.preventDefault();
    var archivo = $('archivo').files[0], b = ev.target.querySelector('button');
    if (!archivo) return;
    b.disabled = true; limpiarError();
    var caja = $('resultadoImportar');
    archivo.arrayBuffer().then(function(buf){
      return /\\.csv$/i.test(archivo.name) ? filasCsv(buf) : filasXlsx(buf);
    }).then(function(filas){
      var lista = aEstudiantes(filas);
      if (!window.confirm('Se reemplazará el listado actual con ' + lista.length + ' filas de «' + archivo.name + '». ¿Continuar?')) return null;
      return pedir('POST', '/admin/api/estudiantes', { filas: lista });
    }).then(function(r){
      if (!r) return;
      caja.textContent = '';
      caja.appendChild(document.createTextNode(r.importados + ' estudiantes importados.' + (r.rechazadas.length ? ' ' + r.rechazadas.length + ' filas no se importaron:' : '')));
      if (r.rechazadas.length) {
        var ul = document.createElement('ul'); ul.className = 'rechazos';
        r.rechazadas.slice(0, 50).forEach(function(x){
          var li = document.createElement('li');
          li.textContent = 'Fila ' + x.fila + (x.correo ? ' (' + x.correo + ')' : '') + ': ' + x.motivo;
          ul.appendChild(li);
        });
        caja.appendChild(ul);
      }
      if (r.fueraDelListadoConClave) {
        var p = document.createElement('p');
        p.textContent = r.fueraDelListadoConClave + ' cuentas con clave activa ya no están en el listado.';
        caja.appendChild(p);
      }
      caja.className = 'nueva';
      pintarResumen(r.resumen);
      ev.target.reset();
    }).catch(function(e){ mostrarError(e.message); })
      .then(function(){ b.disabled = false; });
  });

  cargarEstudiantes().catch(function(e){ mostrarError(e.message); });

  pedir('GET', '/admin/api/estado').then(function(s){
    $('quien').textContent = s.correo;
    $('ssid').textContent = s.ssid || '(sin configurar)';
    if (s.faltan && s.faltan.length) {
      estado.className = 'aviso';
      estado.textContent = 'Falta configurar en Cloudflare: ' + s.faltan.join(', ') + '. Revisa el README.';
      return;
    }
    return Promise.all([cargarClaves(), cargarClientes()]);
  }).catch(function(e){ mostrarError(e.message); });
})();
</script>
</body>
</html>`;
}
