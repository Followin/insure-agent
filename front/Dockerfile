# Stage 1: Build the Angular application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci


# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS production

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy built assets from build stage
COPY --from=build /app/dist/insure/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Default backend URL (overridable at runtime)
ENV BACKEND_URL=backend:80

# Substitute env vars in nginx config template, then start nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
