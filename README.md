# lev-wifi

Portal de registro a la red WiFi de la Unidad Educativa Lev Vygotsky.

La meta es que cada estudiante, docente o administrativo genere su propia
clave WiFi entrando con su cuenta de Google @lev.edu.ec, y que esa clave lo
ponga en la VLAN de su perfil (Básica media, Básica superior, Bachillerato,
Docentes, etc.), donde el FortiGate aplica sus restricciones. Así se deja de
registrar cada MAC a mano en Mist.

El proyecto se construye por fases:

| Fase | Qué es | Estado |
|---|---|---|
| 1. Prueba de claves | Herramienta interna para crear claves en Mist por API y comprobar VLAN, límite de dispositivos y revocación. | Lista (en `/admin/`) |
| **2. Portal del estudiante** | Inicio de sesión con Google, curso según el listado importado, clave personal con rol y VLAN del curso. | **Esta versión** |
| 3. Consola y automatización | Fichas, dispositivos, alertas, promoción de año y revocación por retiro (D1, cron y webhooks de Mist). | Pendiente |

La fase 1 existe para responder una pregunta antes de construir lo demás:
**¿las claves creadas por API funcionan con la suscripción actual de Mist,
sin comprar Access Assurance?** Si la respuesta es sí, el resto es software
propio.

---

## Fase 2: portal del estudiante

| Dirección | Quién | Para qué |
|---|---|---|
| `https://wifi.lev.edu.ec/` | Estudiantes (Google @lev.edu.ec) | Ver o generar su clave WiFi |
| `https://wifi.lev.edu.ec/admin/` | TI (Cloudflare Access) | Importar el listado, probar claves, ver todas las claves del sitio |

### Cómo funciona

1. TI importa el listado de estudiantes (Excel con `NIVEL`, `PARALELO_NOMBRE`,
   `ESTUDIANTE`, `CORREO`) desde la consola. Se guarda en D1 como
   correo → nivel y paralelo. Cada importación reemplaza el listado completo.
2. El estudiante entra con Google. El portal busca su correo en el listado y
   muestra su curso, por ejemplo «2do BGU · Honestos».
3. Al generar su clave, el portal crea en Mist (red `MIST_SSID`):

| Campo en Mist | Valor |
|---|---|
| Nombre de clave | Nombre de la cuenta de Google |
| Email | Correo de Google |
| Frase de contraseña | Generada por el portal (cuatro palabras y un número) |
| Uso | Múltiples usuarios, con máximo `MAX_DISPOSITIVOS` (2 por defecto) |
| ID de VLAN | La del nivel (tabla de abajo) |
| Rol | Grado + nivel + paralelo, sin espacios, tildes ni ñ: `2doBGUHonestos` |

4. Si pide una clave nueva, la anterior se borra en Mist y deja de funcionar
   en todos sus equipos. Hay un máximo de `LIMITE_CLAVES` (3 por defecto)
   claves nuevas cada 90 días; después debe acercarse a TI.

### Niveles habilitados y VLAN

Definidos en `worker/reglas.js`:

| Nivel | VLAN | Ejemplo de rol |
|---|---|---|
| 7mo EGB | 94 | `7moEGBResponsables` |
| 8vo, 9no y 10mo EGB | 96 | `10moEGBPositivos` |
| 1ro, 2do y 3ro BGU | 98 | `2doBGUHonestos` |

Los demás niveles ven un mensaje para acercarse a TI y no pueden generar clave.

### Puesta en marcha de la fase 2

1. **Base de datos.** Cloudflare → *Storage & Databases* → *D1* → *Create* →
   nombre `lev-wifi`. Copia el *Database ID* y pégalo en `wrangler.jsonc`
   (`"database_id"`).
2. **Cliente OAuth de Google.** En Google Cloud → *APIs y servicios* →
   *Credenciales*, abre el cliente OAuth que ya usa Lev Link (o crea uno nuevo,
   tipo *Aplicación web*, pantalla de consentimiento *Interna*) y agrega el URI
   de redirección `https://wifi.lev.edu.ec/auth/callback`.
3. **Secretos del Worker** (Settings → Variables and Secrets, tipo *Secret*):
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `SESSION_SECRET` (una cadena
   aleatoria de 48 caracteres o más).
4. **Opcionales** (tipo *Text*): `MAX_DISPOSITIVOS` (por defecto 2) y
   `LIMITE_CLAVES` (por defecto 3).
5. **Cloudflare Access solo para la consola.** Edita la aplicación de Access
   *Lev WiFi* y en el dominio agrega la ruta `admin` (queda
   `wifi.lev.edu.ec/admin`). Así los estudiantes pueden entrar a la página
   principal y la consola sigue protegida. **Hazlo solo cuando el portal esté
   probado**: mientras Access cubra todo el dominio, solo TI puede entrar.
6. Entra a `/admin/`, importa el listado y prueba el portal con una cuenta de
   estudiante que esté en el listado.

### Datos personales

El listado (nombres y correos de menores) **no se sube al repositorio**: se
carga solo desde la consola, directo a D1. D1 guarda el listado, el ID de cada
clave en Mist, su motivo y un registro de eventos. **Las frases de contraseña
no se guardan en D1**: el portal las lee de Mist cuando el estudiante las pide.

---

## Fase 1: herramienta de prueba (ahora en `/admin/`)

Una página protegida con Cloudflare Access (solo administradores) que:

- crea claves Multi-PSK en Mist para la red indicada en `MIST_SSID` (hoy
  **`LEV`**, que ya es Multi-PSK), con VLAN, máximo de dispositivos y vigencia
  (por defecto 48 horas, para que no queden claves olvidadas);
- lista esas claves de prueba y permite borrarlas;
- muestra los dispositivos conectados con ellas: qué clave usan, en qué VLAN
  cayeron, su IP y qué equipo detecta Mist (fabricante, modelo, sistema).

Por seguridad, **solo ve y borra claves cuyo nombre empieza con `prueba-`**
(las que crea ella misma). Las claves reales de estudiantes y personal no se
listan ni se pueden borrar desde aquí, y sus dispositivos no aparecen.

### Archivos

- `worker/index.js`: rutas (portal, `/auth`, `/api`, `/admin`).
- `worker/reglas.js`: niveles habilitados, VLAN, armado del rol y límites.
- `worker/auth.js`: inicio de sesión con Google (basado en Lev Link).
- `worker/estudiante.js`: API del portal (`/api/yo`, `/api/mi-clave`).
- `worker/portal.js`: página del estudiante.
- `worker/admin.js`: API de la consola (listado, claves, clientes).
- `worker/pagina.js`: página de la consola, con el lector de Excel.
- `worker/acceso.js`: verifica la firma del token de Cloudflare Access.
- `worker/mist.js`: llamadas a la API de Mist.
- `worker/db.js`: tablas de D1.
- `worker/clave.js`: generador de claves (cuatro palabras y un número).
- `pruebas/servidor-local.mjs`: prueba local con Access, Mist y D1 simulados.

---

## Puesta en marcha (todo desde las consolas web)

### 1. En Mist: la red y los datos de la API

1. La red **`LEV`** ya es Multi-PSK. Revisa en su configuración de seguridad si
   las claves están **en la nube de Mist** (Cloud PSK: se ven en
   Organization → Pre-Shared Keys) o **locales** (escritas dentro de la WLAN).
   La herramienta crea claves **en la nube**; si la red solo usa claves
   locales, avísalo antes de probar.
2. VLAN: la WLAN debe poder asignar varias VLAN (etiquetada o dinámica) e
   incluir las VLAN de prueba, por ejemplo la de Básica superior y la de
   Bachillerato.
3. Anota los datos:
   - **ID de la organización**: Organization → Settings.
   - **ID del sitio**: Organization → Site Configuration → el sitio (también
     aparece en la dirección del navegador).
   - **Servidor de la API**: la dirección con la que entras a Mist cambiando
     `manage` por `api`. Ejemplo: `manage.mist.com` → `https://api.mist.com`;
     `manage.gc1.mist.com` → `https://api.gc1.mist.com`.
4. Crea un **token de API**. La organización de Mist la administra el
   proveedor, así que lo normal es tener permisos solo sobre el sitio. Por eso
   las claves se crean **a nivel de sitio** y el token se crea desde tu
   propia cuenta: menú de tu usuario (arriba a la derecha) → **Mi cuenta**
   → **Token de API** → **Crear token**. Ese token tiene los mismos permisos
   que tu cuenta, que debe ser al menos **Network Admin** (o Super User) del
   sitio. Copia el token: Mist lo muestra una sola vez.

### 2. En Cloudflare: el Worker

1. **Workers & Pages → Create → Import a repository** → `ticslev/lev-wifi`.
   Nombre del Worker: `lev-wifi`.
2. **Settings → Domains & Routes**:
   - agrega el dominio personalizado **`wifi.lev.edu.ec`**;
   - **desactiva** `workers.dev` y las *Preview URLs* (la herramienta solo
     debe responder en el dominio protegido por Access).
3. **Settings → Variables and Secrets**:

| Nombre | Tipo | Valor |
|---|---|---|
| `MIST_TOKEN` | **Secret** | el token de API de Mist |
| `MIST_API` | Text | p. ej. `https://api.mist.com` (ya viene en `wrangler.jsonc`) |
| `MIST_ORG_ID` | Text | ID de la organización |
| `MIST_SITE_ID` | Text | ID del sitio |
| `MIST_SSID` | Text | `LEV` (exactamente como en Mist) |
| `ACCESS_TEAM` | Text | dominio del equipo de Zero Trust, p. ej. `lev.cloudflareaccess.com` |
| `ACCESS_AUD` | Text | el *AUD tag* de la aplicación de Access (paso 3) |
| `ADMINS` | Text | correos autorizados, separados por comas |

### 3. En Cloudflare: proteger con Access

1. **Zero Trust → Access → Applications → Add an application → Self-hosted**.
2. Dominio: `wifi.lev.edu.ec`.
3. Política **Allow** → *Emails* → tu correo (y el de quien vaya a probar).
4. Método de inicio de sesión: Google Workspace si ya está configurado en Zero
   Trust; si no, *One-time PIN* (te llega un código al correo).
5. Guarda y copia el **Application Audience (AUD) Tag** a la variable
   `ACCESS_AUD`. El dominio del equipo está en Zero Trust → Settings.

El Worker comprueba la firma del token de Access en cada pedido, así que
aunque alguien llegara por otra ruta no podría entrar.

---

## Plan de pruebas

Entra a `https://wifi.lev.edu.ec/admin/` y:

1. Crea la **clave A**: VLAN de Básica superior, máximo **1** dispositivo.
   Conecta un celular a `LEV` con esa clave (si ya estaba conectado, olvida
   la red primero).
   - En la sección 3 debe aparecer con la clave A y esa VLAN.
   - En el FortiGate, el equipo debe recibir IP de esa VLAN y su perfil de
     filtrado.
2. Con la misma **clave A**, conecta un segundo equipo: **debe ser rechazado**.
3. Crea la **clave B**: VLAN de Bachillerato, máximo **2**. Conecta dos equipos:
   ambos deben caer en la VLAN de Bachillerato.
4. **Borra la clave A**: el celular no debe poder volver a conectarse (puede
   tardar unos minutos si ya estaba conectado; prueba olvidando la red y
   reconectando).
5. Anota qué muestra Mist de cada equipo: fabricante, modelo, sistema.

| Prueba | Resultado esperado | ¿Cumple? |
|---|---|---|
| Clave → VLAN correcta | Sí | |
| Perfil del FortiGate aplicado | Sí | |
| Límite de dispositivos | Rechaza el excedente | |
| Revocación al borrar | No vuelve a conectar | |
| Identificación del equipo | Fabricante / modelo / SO | |

Con estos resultados se decide si seguimos con la fase 2 sin Access Assurance.

---

## Prueba local (sin Mist ni Cloudflare)

Con Node 18 o superior:

```
node pruebas/servidor-local.mjs
```

Necesita Node 22.5 o superior (usa SQLite para imitar D1). Abre
`http://localhost:4325/admin/` para la consola y `http://localhost:4325/` para
el portal: «Continuar con Google» entra directo como `DEV_EMAIL`
(`estudiante.prueba@lev.edu.ec` por defecto), que debe estar en el listado
importado. Usa datos simulados; no se conecta a ningún servicio real.
