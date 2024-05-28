### BASE IMAGE
FROM node:20-bullseye-slim AS base

### BUILD IMAGE
FROM base AS builder

WORKDIR /whatsapp

COPY package*.json ./

RUN apt-get update && apt-get install -y git && npm install

COPY tsconfig.json .
COPY ./src ./src
COPY ./public ./public
COPY ./docs ./docs
COPY ./prisma ./prisma
COPY ./views ./views
COPY .env.dev .env

# Definindo a variável de ambiente DATABASE_URL aqui para a construção
ENV DATABASE_URL=postgres://postgres:pass@0.0.0.0/db_test
RUN npx prisma generate

RUN npm run build

### PRODUCTION IMAGE
FROM base AS production

WORKDIR /whatsapp

LABEL API_VERSION="1.0.0"
LABEL MANTAINER="https://github.com/wandersonchaves"
LABEL REPOSITORY="https://github.com/wandersonchaves/whatsapp-api"

# Copiando arquivos construídos do estágio builder
COPY --from=builder /whatsapp/dist ./dist
COPY --from=builder /whatsapp/docs ./docs
COPY --from=builder /whatsapp/prisma ./prisma
COPY --from=builder /whatsapp/views ./views
COPY --from=builder /whatsapp/node_modules ./node_modules
COPY --from=builder /whatsapp/package*.json ./
COPY --from=builder /whatsapp/.env ./
COPY --from=builder /whatsapp/public ./public
COPY ./deploy_db.sh ./

RUN chmod +x ./deploy_db.sh

RUN mkdir instances

ENV DOCKER_ENV=true

ENTRYPOINT [ "/bin/bash", "-c", ". ./deploy_db.sh && node ./dist/src/main" ]
