# syntax=docker/dockerfile:1.7

FROM node:20.19.0-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --fund=false

COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.29-alpine

ENV BACKEND_UPSTREAM=http://backend:8080 \
    NGINX_ENVSUBST_FILTER=^BACKEND_UPSTREAM$

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
