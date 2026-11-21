# Etapa 1: compilar la SPA
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Sin scripts de instalación: ninguna dependencia los necesita para compilar
RUN npm ci --ignore-scripts
COPY . .
# Vacío = la API está en la misma URL que la página (nginx la reenvía).
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Etapa 2: servirla con nginx, que también hace de proxy inverso hacia la API.
# Imagen sin root: nginx corre con el usuario nginx (uid 101). Docker deja que un usuario
# sin privilegios escuche en el puerto 80 dentro del contenedor, así que el puerto no cambia.
FROM nginxinc/nginx-unprivileged:1.30-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY errores/ /usr/share/nginx/_errores/
USER 101
EXPOSE 80
