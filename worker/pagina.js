// Página de la herramienta de prueba. Todo lo que viene de Mist
// (nombres de equipos, etc.) se muestra con textContent, nunca como HTML.

export function pagina(nonce) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Prueba de claves WiFi · Lev</title>
<style nonce="${nonce}">
:root{--tinta:#1d1630;--morado:#8750f7;--morado-osc:#2a1454;--fondo:#f6f2ff;--borde:#ddd3f5;--suave:#5a5270;--rojo:#b3261e;--verde:#1e6b43}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--fondo);color:var(--tinta);line-height:1.45}
header{background:var(--morado-osc);color:#fff;padding:18px 16px}
header div{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:baseline;justify-content:space-between}
header h1{margin:0;font-size:20px}
header small{color:#d9ccff}
main{max-width:1100px;margin:0 auto;padding:20px 16px 48px;display:flex;flex-direction:column;gap:20px}
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
ol{margin:0;padding-left:20px}
li{margin-bottom:6px}
</style>
</head>
<body>
<header><div><h1>Prueba de claves WiFi personales</h1><small id="quien">Cargando…</small></div></header>
<main>
<section id="estado" class="aviso oculto"></section>

<section>
<h2>1. Crear una clave de prueba</h2>
<p class="vacio">Se crea en Mist para la red <b id="ssid">—</b> con un nombre que empieza por «prueba-». La herramienta solo ve y borra esas claves; las de estudiantes y personal no aparecen aquí. Usa VLANs reales para comprobar que el FortiGate aplica el perfil correcto.</p>
<form id="crear">
<label>Nombre (p. ej. prueba1)<input name="nombre" required maxlength="40" autocomplete="off"></label>
<label>VLAN<input name="vlan" type="number" min="1" max="4094" required></label>
<label>Máx. dispositivos (0 = sin límite)<input name="max" type="number" min="0" max="20" value="1" required></label>
<label>Vigencia (horas)<input name="horas" type="number" min="1" max="720" value="48" required></label>
<button class="primario" type="submit">Crear clave</button>
</form>
<div id="nueva" class="nueva oculto" role="status"></div>
</section>

<section>
<div class="fila"><h2>2. Claves de prueba</h2><button id="recargarClaves" type="button">Actualizar</button></div>
<div class="tabla"><table><thead><tr><th>Nombre</th><th>Clave</th><th>VLAN</th><th>Máx.</th><th>Vence</th><th></th></tr></thead><tbody id="claves"></tbody></table></div>
<p id="clavesVacio" class="vacio oculto">No hay claves de prueba.</p>
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

  function cargarClaves(){
    return pedir('GET', '/api/claves').then(function(lista){
      var tb = $('claves'); tb.textContent = '';
      $('clavesVacio').className = lista.length ? 'vacio oculto' : 'vacio';
      lista.forEach(function(k){
        var tr = document.createElement('tr');
        celda(tr, k.nombre);
        celda(tr, k.clave, 'mono');
        celda(tr, k.vlan, 'mono');
        celda(tr, k.max === 0 ? 'Sin límite' : k.max);
        celda(tr, fecha(k.vence));
        var td = document.createElement('td');
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'peligro'; b.textContent = 'Borrar';
        b.addEventListener('click', function(){
          if (!window.confirm('¿Borrar la clave ' + k.nombre + '?')) return;
          b.disabled = true;
          pedir('DELETE', '/api/claves/' + encodeURIComponent(k.id))
            .then(function(){ limpiarError(); return cargarClaves(); })
            .catch(function(e){ b.disabled = false; mostrarError(e.message); });
        });
        td.appendChild(b); tr.appendChild(td);
        tb.appendChild(tr);
      });
    });
  }

  function cargarClientes(){
    return pedir('GET', '/api/clientes').then(function(lista){
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
    pedir('POST', '/api/claves', {
      nombre: f.nombre.value, vlan: f.vlan.value, max: f.max.value, horas: f.horas.value
    }).then(function(k){
      limpiarError();
      var caja = $('nueva'); caja.textContent = '';
      caja.appendChild(document.createTextNode('Clave ' + k.nombre + ' creada (VLAN ' + k.vlan + ', máx. ' + (k.max || 'sin límite') + '):'));
      var s = document.createElement('strong'); s.textContent = k.clave; caja.appendChild(s);
      caja.className = 'nueva';
      f.nombre.value = '';
      return cargarClaves();
    }).catch(function(e){ mostrarError(e.message); })
      .then(function(){ b.disabled = false; });
  });

  $('recargarClaves').addEventListener('click', function(){ cargarClaves().catch(function(e){ mostrarError(e.message); }); });
  $('recargarClientes').addEventListener('click', function(){ cargarClientes().catch(function(e){ mostrarError(e.message); }); });

  pedir('GET', '/api/estado').then(function(s){
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
