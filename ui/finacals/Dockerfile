FROM node:20-alpine AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL CI=false
RUN npm run build

FROM nginx:alpine
COPY --from=build /src/build /usr/share/nginx/html
RUN mkdir -p /etc/nginx/templates && printf 'server {\n  listen ${PORT};\n  root /usr/share/nginx/html;\n  location / { try_files $uri /index.html; }\n}\n' > /etc/nginx/templates/default.conf.template
