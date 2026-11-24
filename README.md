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
| **1. Prueba de claves** | Página interna para crear claves en Mist por API y comprobar VLAN, límite de dispositivos y revocación. | **Esta versión** |
| 2. Portal del estudiante | Inicio de sesión con Google, perfil según la unidad organizativa, generación de clave con reglas propias. | Pendiente |
| 3. Consola y automatización | Fichas, dispositivos, alertas, promoción de año y revocación por retiro (D1, cron y webhooks de Mist). | Pendiente |

La fase 1 existe para responder una pregunta antes de construir lo demás:
**¿las claves creadas por API funcionan con la suscripción actual de Mist,
sin comprar Access Assurance?** Si la respuesta es sí, el resto es software
propio.

---

## Fase 1: herramienta de prueba

Una página protegida con Cloudflare Access (solo administradores) que:

- crea claves Multi-PSK en Mist para un **SSID de prueba**, con VLAN, máximo de
  dispositivos y vigencia (por defecto 48 horas, para que no queden claves
  olvidadas);
- lista las claves de ese SSID y permite borrarlas;
- muestra los dispositivos conectados a ese SSID: qué clave usan, en qué VLAN
  cayeron, su IP y qué equipo detecta Mist (fabricante, modelo, sistema).

Por seguridad, **solo trabaja con el SSID de prueba** (`MIST_SSID`): no lista,
crea ni borra claves de otras redes.

### Archivos

- `worker/index.js`: rutas y validaciones.
- `worker/acceso.js`: verifica la firma del token de Cloudflare Access.
- `worker/mist.js`: llamadas a la API de Mist.
- `worker/clave.js`: generador de claves (cuatro palabras y un número).
- `worker/pagina.js`: la página.
- `pruebas/servidor-local.mjs`: prueba local con Access y Mist simulados.

---

## Puesta en marcha (todo desde las consolas web)

### 1. En Mist: SSID de prueba

1. Crea una WLAN nueva, por ejemplo **`LEV-PRUEBA`**, solo en uno o dos APs de
   la zona donde vas a probar (o en todo el sitio, oculta).
2. Seguridad: **WPA2 (o WPA3) Personal con varias claves** (Multi-PSK), y como
   origen de las claves elige la opción **en la nube de Mist** (Cloud PSK).
   > Si tu suscripción no ofrece esa opción, esa es la respuesta de la prueba:
   > anótalo y lo vemos.
3. VLAN: configúrala para que pueda asignar varias VLAN (etiquetada o dinámica)
   e incluye las VLAN de prueba, por ejemplo la de Básica superior y la de
   Bachillerato. Los puertos de los switches hacia esos APs deben llevar esas
   VLAN.
4. Anota los datos:
   - **ID de la organización**: Organization → Settings.
   - **ID del sitio**: Organization → Site Configuration → el sitio (también
     aparece en la dirección del navegador).
   - **Servidor de la API**: la dirección con la que entras a Mist cambiando
     `manage` por `api`. Ejemplo: `manage.mist.com` → `https://api.mist.com`;
     `manage.gc1.mist.com` → `https://api.gc1.mist.com`.
5. Crea un **token de API**: Organization → Settings → API Token → Create.
   Nivel **Network Admin** para toda la organización (las claves de nube son
   de organización). Copia el token: Mist lo muestra una sola vez.

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
| `MIST_SSID` | Text | `LEV-PRUEBA` (exactamente como en Mist) |
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

Entra a `https://wifi.lev.edu.ec` y:

1. Crea la **clave A**: VLAN de Básica superior, máximo **1** dispositivo.
   Conecta un celular a `LEV-PRUEBA` con esa clave.
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

Abre `http://localhost:4325`. Usa datos simulados en memoria; no se conecta a
ningún servicio real.
