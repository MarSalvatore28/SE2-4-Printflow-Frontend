# PrintFlow · Frontend

[![CI frontend](https://github.com/MarSalvatore28/SE2-4-Printflow-Frontend/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/MarSalvatore28/SE2-4-Printflow-Frontend/actions/workflows/ci.yml)

Aplicación web de **PrintFlow**, el sistema con el que DOX S.A. registra los contadores de las impresoras instaladas en sus clientes, revisa los reportes recibidos y genera el consolidado mensual a facturar.

Proyecto de la materia **Ingeniería de Software II** (ESPOL, sección 4).

| | |
|---|---|
| Backend (API, base de datos y Docker) | [MGabrielaVillon/SE2-4-Printflow](https://github.com/MGabrielaVillon/SE2-4-Printflow) |
| Plan de trabajo | [`PLAN.md`](https://github.com/MGabrielaVillon/SE2-4-Printflow/blob/develop/PLAN.md) en el repositorio del backend |

---

## Contenido

1. [Funcionalidades](#funcionalidades)
2. [Tecnologías](#tecnologías)
3. [Requisitos](#requisitos)
4. [Inicio rápido con Docker](#inicio-rápido-con-docker)
5. [Desarrollo local](#desarrollo-local)
6. [Variables de entorno](#variables-de-entorno)
7. [Scripts](#scripts)
8. [Estructura del proyecto](#estructura-del-proyecto)
9. [Imagen de producción](#imagen-de-producción)
10. [Flujo de trabajo](#flujo-de-trabajo)
11. [Equipo](#equipo)

---

## Funcionalidades

Se incorporan por fases, según el plan del proyecto:

| Módulo | Descripción |
|---|---|
| Acceso | Inicio de sesión por rol (administrador, operador y auditor) y rutas protegidas |
| Catálogos | Clientes, contratos con tarifas, áreas, máquinas y cambio de máquinas |
| Asignaciones | Máquina asignada a un área de un cliente, bajo un contrato vigente |
| Reportes recibidos | Lotes en revisión, detalle de errores, aprobación y reprocesamiento |
| Notificaciones | Avisos en tiempo real cuando llega un lote nuevo |
| Informes | Consolidado por cliente y período, con exportación a PDF y Excel |
| Usuarios | Gestión de usuarios y roles, con menú según el rol |

## Tecnologías

| Uso | Herramienta |
|---|---|
| Interfaz | React 19 · TypeScript |
| Compilación | Vite |
| Componentes y estilos | MUI · Tailwind CSS · Lucide |
| Navegación | React Router |
| Comunicación con la API | Axios · Socket.IO Client |
| Exportación | jsPDF · SheetJS (`xlsx`) |
| Producción | nginx (en Docker) |

## Requisitos

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), para levantar el sistema completo
- [Node.js 22](https://nodejs.org/), para el desarrollo local

## Inicio rápido con Docker

El sistema completo (base de datos, API, web y n8n) se levanta **desde el repositorio del backend**. Los dos repositorios deben estar en la misma carpeta:

```powershell
mkdir C:\printflow; cd C:\printflow
git clone https://github.com/MGabrielaVillon/SE2-4-Printflow.git
git clone https://github.com/MarSalvatore28/SE2-4-Printflow-Frontend.git

cd SE2-4-Printflow
copy .env.example .env     # completar DB_PASSWORD y SECRET_KEY
docker compose up -d --build
```

La web queda en http://localhost:8080.

## Desarrollo local

Para trabajar en la interfaz con recarga automática, con la API corriendo (ver el README del backend):

```powershell
cd C:\printflow\SE2-4-Printflow-Frontend
copy .env.example .env
npm install
npm run dev                # http://localhost:5173
```

## Variables de entorno

| Variable | Descripción | Valor en desarrollo |
|---|---|---|
| `VITE_API_BASE_URL` | Dirección de la API. Vacía cuando la web y la API comparten dominio (Docker) | `http://localhost:9000` |

Las variables `VITE_*` se incluyen en el código compilado: **nunca** deben contener claves ni secretos.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Verificación de tipos y compilación para producción |
| `npm run preview` | Sirve localmente la compilación de producción |
| `npm run lint` | Análisis estático con ESLint |

## Estructura del proyecto

```text
.
├── src/
│   ├── main.tsx             # punto de entrada
│   ├── App.tsx              # rutas de la aplicación
│   ├── app/                 # páginas, agrupadas por módulo
│   ├── components/          # layout, autenticación y componentes compartidos
│   ├── context/             # sesión y notificaciones
│   ├── services/            # llamadas a la API por módulo
│   ├── data/                # configuración del menú lateral
│   ├── utils/               # utilidades (exportación a PDF y Excel)
│   └── styles/
├── nginx.conf               # servidor web y proxy hacia la API
├── Dockerfile
└── vite.config.ts
```

Las carpetas de `src/` se completan a medida que cada equipo integra su módulo.

## Imagen de producción

El `Dockerfile` compila la aplicación con Node y la sirve con **nginx**, que además:

- reenvía `/api`, `/api-docs` y `/socket.io` al servicio de la API;
- bloquea desde fuera `/api/ingesta`, que solo puede usar n8n dentro de la red de Docker;
- redirige cualquier otra ruta a `index.html`, para que funcione la navegación de la aplicación.

## Flujo de trabajo

- **Ramas:** `main` para lo entregado, `develop` para la integración y `feature/<fase>-<tema>` para cada tarea.
- **Pull requests** hacia `develop`, con la plantilla completa, una aprobación y el CI en verde.
- **El CI** comprueba en cada PR los tipos, la compilación y la imagen de Docker. ESLint informa sin bloquear mientras se depura el código heredado.
- **Textos de la interfaz** en español.
- **Nunca se suben** archivos `.env` ni datos reales de clientes.

## Equipo

| Equipo | Integrantes | Responsabilidades |
|---|---|---|
| A | Kiara Morán · Marlo Valle | Infraestructura, CI, máquinas, notificaciones, n8n y despliegue |
| B | María Gabriela Villón · Roberto Barrios | Interfaz web, clientes, contratos, áreas, informes y usuarios |
| C | Samuel Chichande · Christian Villacrés | Base de datos, autenticación, ingesta, cálculo del informe y pruebas |

Cliente: **DOX S.A.**

---

Proyecto académico. El código no se distribuye bajo una licencia de código abierto.
