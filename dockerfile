FROM node:22-slim AS base
WORKDIR /usr/src/app

FROM base AS install

COPY backend/package.json backend/package-lock.json /temp/dev/backend/
COPY frontend-vue/package.json frontend-vue/package-lock.json /temp/dev/frontend/

RUN cd /temp/dev/backend && npm install
RUN cd /temp/dev/frontend && npm install

RUN mkdir -p /temp/prod/backend /temp/prod/frontend
COPY backend/package.json backend/package-lock.json /temp/prod/backend/
COPY frontend-vue/package.json frontend-vue/package-lock.json /temp/prod/frontend/

RUN cd /temp/prod/backend && npm install --production
RUN cd /temp/prod/frontend && npm install --production

FROM install AS build-frontend
WORKDIR /usr/src/app/frontend
COPY frontend-vue/ .
COPY --from=install /temp/dev/frontend/node_modules node_modules
RUN npm run build

FROM base AS release
WORKDIR /usr/src/app
COPY backend/ backend/
COPY --from=install /temp/prod/backend/node_modules backend/node_modules
COPY --from=install /temp/prod/frontend/node_modules frontend/node_modules

COPY --from=build-frontend /usr/src/app/frontend/dist backend/public

USER node
WORKDIR /usr/src/app/backend
EXPOSE 3000/tcp
ENTRYPOINT [ "npm", "run", "start"]
