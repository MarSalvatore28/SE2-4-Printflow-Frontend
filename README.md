# PrintFlow · Frontend

SPA de PrintFlow (React 19 + Vite + TypeScript + MUI + Tailwind).
Backend: repo `SE2-4-Printflow`.

## Correr en local

```bash
cp .env.example .env      # en Windows: copy .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Requiere el backend corriendo en `VITE_API_BASE_URL` (por defecto `http://localhost:9000`).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Chequeo de tipos + build de producción |
| `npm run lint` | ESLint |

## Cómo trabajamos

Ver `PLAN.md` en el repo del backend: equipos, fases, ramas y reglas de PR.
