// Página del estudiante (wifi.lev.edu.ec). Pensada para el celular.
// Todo lo que viene del servidor se pinta con textContent.

export function paginaPortal(nonce) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#2a1454">
<title>WiFi del Lev</title>
<style nonce="${nonce}">
:root{--morado:#8750f7;--morado-osc:#2a1454;--lavanda:#f6f2ff;--borde:#e3d9fb;--tinta:#1d1630;--suave:#5a5270;--dorado:#f5b82e;--turquesa:#1f8f85;--rojo:#b3261e}
*{box-sizing:border-box}
html,body{margin:0}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--lavanda);color:var(--tinta);line-height:1.5;min-height:100vh}
.marco{max-width:460px;margin:0 auto;padding:20px 16px 40px;display:flex;flex-direction:column;gap:16px}
.marca{display:flex;align-items:center;justify-content:space-between;gap:12px}
.marca span{font-weight:700;color:var(--morado-osc);letter-spacing:.01em}
.marca small{display:block;font-weight:500;color:var(--suave);font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.tarjeta{background:#fff;border:1px solid var(--borde);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:26px;line-height:1.2;color:var(--morado-osc)}
h2{margin:0;font-size:18px}
p{margin:0}
.suave{color:var(--suave);font-size:14px}
.oculto{display:none !important}
.boton{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 18px;border-radius:12px;font:inherit;font-weight:600;font-size:16px;cursor:pointer;text-decoration:none;border:1px solid var(--morado);background:var(--morado);color:#fff;width:100%}
.boton.claro{background:#fff;color:var(--morado-osc);border-color:#cfc3f0}
.boton.google{background:#fff;color:#1f1f1f;border-color:#c9c9c9}
.boton:disabled{opacity:.6;cursor:wait}
.enlace{background:none;border:0;padding:0;color:var(--morado-osc);font:inherit;font-weight:600;text-decoration:underline;cursor:pointer}
.chip{display:inline-block;padding:4px 12px;border-radius:999px;background:#efe7ff;color:var(--morado-osc);font-weight:600;font-size:14px}
.aviso{padding:12px 14px;border-radius:12px;font-size:15px}
.aviso.error{background:#fdecea;color:var(--rojo)}
.aviso.info{background:#fff6dd;color:#6b4a00}
.aviso.ok{background:#e3f5f2;color:#0f5e57}
.dato{display:flex;flex-direction:column;gap:2px}
.dato span{font-size:13px;color:var(--suave)}
.dato strong{font-size:18px}
.frase{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:21px;font-weight:600;letter-spacing:.02em;word-break:break-all;color:var(--morado-osc)}
.fila{display:flex;gap:10px}
.fila .boton{flex:1}
ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px}
fieldset{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
legend{font-weight:600;margin-bottom:6px}
label.opcion{display:flex;gap:10px;align-items:center;min-height:48px;padding:0 14px;border:1px solid #d9cff3;border-radius:12px;background:#fff;cursor:pointer}
label.opcion input{width:20px;height:20px;accent-color:var(--morado)}
details summary{cursor:pointer;font-weight:600;color:var(--morado-osc);min-height:44px;display:flex;align-items:center}
.pie{text-align:center;font-size:13px;color:var(--suave)}
.centro{text-align:center}
.pila{display:flex;flex-direction:column;gap:14px}
.arriba{margin-top:8px}
</style>
</head>
<body>
<div class="marco">
<div class="marca"><span><small>Unidad Educativa Lev Vygotsky</small>WiFi del Lev</span><button id="salir" type="button" class="enlace oculto">Salir</button></div>

<div id="aviso" class="aviso oculto" role="status"></div>

<section id="cargando" class="tarjeta"><p class="suave">Cargando…</p></section>

<section id="entrar" class="tarjeta oculto">
<h1>Conéctate a la red del colegio</h1>
<p>Entra con tu cuenta institucional de Google. Te daremos una clave WiFi personal, ligada a tu nombre y a tu curso.</p>
<p class="suave">La clave es personal. No la compartas: si alguien más la usa, puedes perder el acceso.</p>
<a class="boton google" href="/auth/login">
<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.2 5.6c4.2-3.9 7.1-9.6 7.1-17z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.8l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.2-5.6c-2 1.4-4.7 2.3-8.7 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>
Continuar con Google</a>
<p class="suave centro">Solo cuentas @lev.edu.ec</p>
</section>

<section id="panel" class="tarjeta oculto">
<div><h1 id="saludo">Hola</h1><p class="suave" id="correo"></p></div>
<div><span class="chip" id="curso"></span></div>

<div id="sinPermiso" class="aviso info oculto"></div>

<div id="sinClave" class="pila oculto">
<p>Todavía no tienes una clave para la red <b class="nombreRed"></b>. Genérala aquí y úsala en tus dispositivos.</p>
<p class="suave" id="infoMax"></p>
<button id="generarPrimera" class="boton" type="button">Generar mi clave</button>
</div>

<div id="conClave" class="pila oculto">
<div class="dato"><span>Red WiFi</span><strong class="nombreRed"></strong></div>
<div class="dato"><span>Tu clave personal</span><div class="frase" id="frase">••••••••••••</div></div>
<div class="fila">
<button id="mostrar" class="boton claro" type="button">Mostrar</button>
<button id="copiar" class="boton claro" type="button">Copiar</button>
</div>
<ol>
<li>Abre los ajustes WiFi de tu dispositivo.</li>
<li>Elige la red <b class="nombreRed"></b>. Si ya la tenías guardada, primero «olvídala».</li>
<li>Escribe tu clave personal.</li>
</ol>
<p class="suave" id="infoMax2"></p>
</div>
</section>

<section id="nueva" class="tarjeta oculto">
<details id="detallesNueva">
<summary>¿Necesitas una clave nueva?</summary>
<div class="pila arriba">
<p class="suave">Al generar una clave nueva, la anterior deja de funcionar en <b>todos</b> tus dispositivos y tendrás que escribir la nueva en cada uno. Si solo la olvidaste, no hace falta: está arriba.</p>
<fieldset>
<legend>¿Por qué la necesitas?</legend>
<label class="opcion"><input type="radio" name="motivo" value="equipo" checked> Cambié de equipo y no puedo conectarlo</label>
<label class="opcion"><input type="radio" name="motivo" value="compartida"> La compartí o creo que alguien más la tiene</label>
<label class="opcion"><input type="radio" name="motivo" value="cambio"> Quiero cambiarla</label>
</fieldset>
<p class="suave" id="restantes"></p>
<button id="generarNueva" class="boton" type="button">Generar una clave nueva</button>
</div>
</details>
</section>

<p class="pie">¿Problemas para conectarte? Acércate al área de TI.</p>
</div>
<script nonce="${nonce}">
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var datos = null, visible = false;

  function mostrarAviso(texto, tipo){
    var a = $('aviso');
    a.textContent = texto; a.className = 'aviso ' + (tipo || 'error');
  }
  function ocultarAviso(){ $('aviso').className = 'aviso oculto'; }
  function ver(id, si){ $(id).classList.toggle('oculto', !si); }
  function textoEn(clase, texto){
    var els = document.querySelectorAll('.' + clase);
    for (var i = 0; i < els.length; i++) els[i].textContent = texto;
  }

  function pedir(metodo, ruta, cuerpo){
    var op = { method: metodo, headers: { 'X-Lev-Wifi': '1' }, credentials: 'same-origin' };
    if (cuerpo) { op.headers['Content-Type'] = 'application/json'; op.body = JSON.stringify(cuerpo); }
    return fetch(ruta, op).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(d){
        if (!r.ok) { var e = new Error(d.error || ('Error ' + r.status)); e.estado = r.status; throw e; }
        return d;
      });
    });
  }

  var MENSAJES = {
    dominio: 'Entra con tu cuenta del colegio (@lev.edu.ec), no con una cuenta personal.',
    error: 'No se pudo completar el inicio de sesión. Inténtalo otra vez.',
    configuracion: 'El portal aún no está listo. Avisa al área de TI.'
  };
  var estadoUrl = new URLSearchParams(location.search).get('estado');
  if (estadoUrl && MENSAJES[estadoUrl]) mostrarAviso(MENSAJES[estadoUrl]);
  if (estadoUrl) history.replaceState(null, '', '/');

  function pintarFrase(){
    $('frase').textContent = datos && datos.clave ? (visible ? datos.clave.frase : '••••••••••••') : '';
    $('mostrar').textContent = visible ? 'Ocultar' : 'Mostrar';
  }

  function pintar(){
    ver('cargando', false);
    if (!datos) { ver('entrar', true); ver('panel', false); ver('nueva', false); ver('salir', false); return; }
    ver('entrar', false); ver('panel', true); ver('salir', true);
    var primerNombre = String(datos.nombre || '').split(' ')[0];
    $('saludo').textContent = 'Hola, ' + primerNombre;
    $('correo').textContent = datos.correo;
    $('curso').textContent = datos.curso || 'Sin curso asignado';
    ver('curso', !!datos.curso);
    textoEn('nombreRed', datos.red || 'LEV');
    var max = 'Tu clave sirve para hasta ' + datos.maxDispositivos + (datos.maxDispositivos === 1 ? ' dispositivo.' : ' dispositivos.');
    $('infoMax').textContent = max; $('infoMax2').textContent = max;

    if (!datos.permitido) {
      $('sinPermiso').textContent = datos.motivo === 'nivel'
        ? 'Tu curso todavía no puede registrar dispositivos en la red. Si crees que es un error, acércate al área de TI.'
        : 'Tu cuenta no aparece en el listado de estudiantes. Acércate al área de TI para que te registren.';
      ver('sinPermiso', true); ver('sinClave', false); ver('conClave', false); ver('nueva', false);
      return;
    }
    ver('sinPermiso', false);
    var tiene = !!datos.clave;
    ver('sinClave', !tiene); ver('conClave', tiene); ver('nueva', tiene);
    var quedan = Math.max(0, datos.limite - datos.usadas);
    $('restantes').textContent = quedan > 0
      ? 'Te quedan ' + quedan + ' de ' + datos.limite + ' claves nuevas en este trimestre.'
      : 'Ya usaste tus ' + datos.limite + ' claves nuevas de este trimestre. Para otra, acércate al área de TI.';
    $('generarNueva').disabled = quedan === 0;
    pintarFrase();
  }

  function cargar(){
    return pedir('GET', '/api/yo').then(function(d){ datos = d.sesion === false ? null : d; pintar(); })
      .catch(function(e){
        if (e.estado === 401) { datos = null; pintar(); return; }
        ver('cargando', false); mostrarAviso(e.message);
      });
  }

  function generar(boton, motivo){
    boton.disabled = true; ocultarAviso();
    pedir('POST', '/api/mi-clave', { motivo: motivo }).then(function(){
      visible = true;
      $('detallesNueva').open = false;
      return cargar().then(function(){
        mostrarAviso('¡Listo! Esta es tu clave. Escríbela en tus dispositivos.', 'ok');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }).catch(function(e){ mostrarAviso(e.message); })
      .then(function(){ boton.disabled = false; });
  }

  $('generarPrimera').addEventListener('click', function(){ generar(this, 'primera'); });
  $('generarNueva').addEventListener('click', function(){
    var m = document.querySelector('input[name=motivo]:checked');
    if (!window.confirm('Tu clave actual dejará de funcionar en todos tus dispositivos. ¿Generar una nueva?')) return;
    generar(this, m ? m.value : 'cambio');
  });
  $('mostrar').addEventListener('click', function(){ visible = !visible; pintarFrase(); });
  $('copiar').addEventListener('click', function(){
    if (!datos || !datos.clave) return;
    var b = this;
    var listo = function(){ b.textContent = 'Copiada'; setTimeout(function(){ b.textContent = 'Copiar'; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(datos.clave.frase).then(listo, function(){ visible = true; pintarFrase(); });
    } else { visible = true; pintarFrase(); }
  });
  $('salir').addEventListener('click', function(){ location.href = '/auth/salir'; });

  cargar();
})();
</script>
</body>
</html>`;
}
