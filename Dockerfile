# ETAPA 1: Construcción (Builder)
FROM node:22-alpine AS builder
WORKDIR /app

# Copiar solo package files primero para aprovechar caché de Docker
COPY package*.json ./

# Instalar todas las dependencias (incluye devDependencies para build)
RUN npm install

# Copiar el resto del código
COPY . .

# Generar el cliente de Prisma ANTES de compilar TypeScript
RUN npx prisma generate --schema=prisma/schema.prisma

# Compilar TypeScript
RUN npm run build

# ETAPA 2: Ejecución (Producción)
FROM node:22-alpine
WORKDIR /app

# Copiar solo lo necesario para ejecutar
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Asegurar que solo dependencias de producción
RUN npm install --omit=dev

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# Ejecutamos la app
CMD ["node", "dist/main.js"]