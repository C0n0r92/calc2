# Docker Deployment Guide

This guide explains how to build and deploy your mortgage calculator application using Docker.

## Project Structure

The application consists of:
- **Frontend**: React TypeScript app (webapp/)
- **Backend**: Rails API (backend-api/)
- **Database**: PostgreSQL

## Docker Files Overview

### Individual Service Dockerfiles
- `backend-api/Dockerfile` - Rails API container
- `webapp/Dockerfile` - Production React app with Nginx
- `webapp/Dockerfile.dev` - Development React app

### Combined Production Dockerfile
- `Dockerfile` - Multi-stage build combining frontend and backend in a single container

### Development Environment
- `docker-compose.yml` - Complete development environment with PostgreSQL

## Local Development

### Option 1: Docker Compose (Recommended for Development)
```bash
# Start all services (PostgreSQL, Rails API, React frontend)
docker-compose up

# Build and start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

### Option 2: Individual Containers
```bash
# Build and run backend API
cd backend-api
docker build -t mortgage-api .
docker run -p 3001:3000 mortgage-api

# Build and run frontend
cd ../webapp
docker build -t mortgage-webapp .
docker run -p 3000:80 mortgage-webapp
```

## Production Deployment

### Option 1: Single Container (Recommended for Simple Deployments)
```bash
# Build the combined production image
docker build -t mortgage-calculator .

# Run the container
docker run -p 80:80 -e DATABASE_URL="your_postgres_url" mortgage-calculator
```

### Option 2: Separate Containers
```bash
# Build backend
docker build -t mortgage-api ./backend-api

# Build frontend
docker build -t mortgage-webapp ./webapp

# Run with external PostgreSQL
docker run -d -p 3001:3000 \
  -e DATABASE_URL="your_postgres_url" \
  mortgage-api

docker run -d -p 80:80 mortgage-webapp
```

## Digital Ocean Deployment

### Using Digital Ocean Container Registry

1. **Install and authenticate Digital Ocean CLI**:
```bash
# Install doctl (if not already installed)
# macOS: brew install doctl
# Other platforms: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init
```

2. **Create a Container Registry** (if not exists):
```bash
doctl registry create your-registry-name
```

3. **Login to registry**:
```bash
doctl registry login
```

4. **Build and push images**:
```bash
# Build the production image
docker build -t mortgage-calculator .

# Tag for Digital Ocean registry
docker tag mortgage-calculator registry.digitalocean.com/your-registry-name/mortgage-calculator:latest

# Push to registry
docker push registry.digitalocean.com/your-registry-name/mortgage-calculator:latest
```

### Deploy to Digital Ocean App Platform

1. **Create app.yaml** for App Platform:
```yaml
name: mortgage-calculator
services:
- name: web
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: /app/start.sh
  environment_slug: docker
  instance_count: 1
  instance_size_slug: basic-xxs
  image:
    registry: your-registry-name
    repository: mortgage-calculator
    tag: latest
  envs:
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: RAILS_ENV
    value: production
  http_port: 80
databases:
- name: db
  engine: PG
  version: "15"
  size: db-s-dev-database
```

2. **Deploy using doctl**:
```bash
doctl apps create --spec app.yaml
```

### Deploy to Digital Ocean Droplet

1. **Create a Droplet** with Docker pre-installed
2. **SSH into the droplet**
3. **Pull and run the image**:
```bash
# Login to registry
doctl registry login

# Pull the image
docker pull registry.digitalocean.com/your-registry-name/mortgage-calculator:latest

# Run the container
docker run -d \
  --name mortgage-app \
  -p 80:80 \
  -e DATABASE_URL="your_postgres_connection_string" \
  -e RAILS_ENV=production \
  --restart unless-stopped \
  registry.digitalocean.com/your-registry-name/mortgage-calculator:latest
```

## Environment Variables

### Required for Production
- `DATABASE_URL` - PostgreSQL connection string
- `RAILS_ENV=production`
- `MORTGAGE_CALCULATOR_API_DATABASE_PASSWORD` - Database password (if using separate DB config)

### Optional
- `PORT` - Port to run on (default: 80 for production container)
- `RAILS_LOG_TO_STDOUT=true` - Enable stdout logging
- `RAILS_SERVE_STATIC_FILES=false` - Let Nginx serve static files

## Database Setup

The application will automatically run migrations on startup. For production, ensure your DATABASE_URL points to a PostgreSQL instance.

### Digital Ocean Managed Database
```bash
# Create a managed PostgreSQL database
doctl databases create mortgage-db --engine pg --version 15 --size db-s-1vcpu-1gb --region nyc1

# Get connection details
doctl databases connection mortgage-db
```

## Monitoring and Logs

### View container logs
```bash
# Using Docker
docker logs -f container_name

# Using Docker Compose
docker-compose logs -f service_name
```

### Health Checks
The application includes basic health checks. Access `/api/health` to verify the API is running.

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Verify DATABASE_URL format: `postgres://user:password@host:port/database`
   - Ensure database is accessible from container
   - Check firewall rules

2. **Build failures**:
   - Clear Docker build cache: `docker system prune -a`
   - Check .dockerignore files
   - Verify all dependencies are available

3. **Memory issues**:
   - Increase container memory limits
   - Optimize Docker image size
   - Use multi-stage builds

### Useful Commands

```bash
# Remove all containers and images
docker system prune -a

# View container resource usage
docker stats

# Execute commands in running container
docker exec -it container_name bash

# View container processes
docker top container_name
```

## Next Steps

1. Set up CI/CD pipeline for automatic deployments
2. Configure SSL/TLS certificates
3. Set up monitoring and alerting
4. Implement backup strategies for database
5. Configure load balancing for high availability
