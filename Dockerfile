# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# 1. Dépendances avec cache
COPY package*.json ./
RUN npm ci

# 2. Assets publics statiques
COPY public ./public

# 3. Code source, configuration et version
COPY .version ./
COPY index.html vite.config.js eslint.config.js ./
COPY src ./src

# Build de l'application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the build output from the build stage to Nginx's public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
