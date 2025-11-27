# ---------- 1. Build Stage ----------
FROM node:20 AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# ---------- 2. Serve Stage ----------
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy build output
COPY --from=build /app/build .

# Copy default config.js (so app still works if external config not mounted)
COPY public/config.js ./config.js

COPY nginx.conf /etc/nginx/conf.d/default.conf


# Expose port
EXPOSE 8888

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
