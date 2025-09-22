# Multi-stage production Dockerfile for the complete application
# This builds both the frontend and backend in a single container

# Stage 1: Build React Frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/webapp
COPY webapp/package*.json ./
RUN npm ci

COPY webapp/ ./
RUN npm run build

# Stage 2: Build Rails Backend
FROM ruby:3.2.2-slim as backend-builder

# Install system dependencies
RUN apt-get update -qq && \
    apt-get install -yq --no-install-recommends \
      build-essential \
      gnupg2 \
      git \
      libpq-dev \
      postgresql-client \
      curl \
      nodejs \
      npm && \
    apt-get clean && \
    rm -rf /var/cache/apt/archives/* && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app/backend-api
COPY backend-api/Gemfile backend-api/Gemfile.lock ./
RUN bundle config --global frozen 1 && \
    bundle install --without development test

COPY backend-api/ ./
RUN mkdir -p tmp/pids log storage

# Stage 3: Production Runtime
FROM ruby:3.2.2-slim

# Install runtime dependencies
RUN apt-get update -qq && \
    apt-get install -yq --no-install-recommends \
      libpq-dev \
      postgresql-client \
      nginx \
      curl && \
    apt-get clean && \
    rm -rf /var/cache/apt/archives/* && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copy Rails app from builder
WORKDIR /app
COPY --from=backend-builder /app/backend-api ./
COPY --from=backend-builder /usr/local/bundle /usr/local/bundle

# Copy built frontend files
COPY --from=frontend-builder /app/webapp/dist ./public

# Copy nginx configuration for serving frontend and proxying API
COPY nginx-production.conf /etc/nginx/nginx.conf

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting Nginx..."\n\
nginx &\n\
echo "Running database migrations..."\n\
bundle exec rails db:migrate\n\
echo "Starting Rails server..."\n\
exec bundle exec rails server -b 127.0.0.1 -p 3001' > /app/start.sh && \
    chmod +x /app/start.sh

# Set environment variables
ENV RAILS_ENV=production
ENV RAILS_SERVE_STATIC_FILES=false
ENV RAILS_LOG_TO_STDOUT=true
ENV PORT=80

# Expose port 80
EXPOSE 80

# Start the application
CMD ["/app/start.sh"]
