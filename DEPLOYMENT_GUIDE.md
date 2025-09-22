# Mortgage Calculator - Digital Ocean Deployment Guide

This guide will help you deploy your Python FastAPI backend and React frontend to Digital Ocean using Docker.

## Prerequisites

- Digital Ocean account
- Docker installed locally
- Git repository with your code

## Architecture Overview

- **Backend**: Python FastAPI (Port 8000)
- **Frontend**: React with Vite + Nginx (Port 80/443)
- **No Database**: Stateless calculations only

## Deployment Options

### Option 1: Digital Ocean App Platform (Recommended)

The easiest way to deploy is using Digital Ocean's App Platform:

1. **Create a new App**:
   ```bash
   # Push your code to a Git repository (GitHub, GitLab, etc.)
   git add .
   git commit -m "Python FastAPI mortgage calculator"
   git push origin main
   ```

2. **Configure App Platform**:
   - Go to Digital Ocean Console → Apps → Create App
   - Connect your Git repository
   - Configure services:

   **Backend Service**:
   - Name: `mortgage-api`
   - Source: `/python-backend`
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - HTTP Port: 8000
   - Instance Size: Basic ($5/month)

   **Frontend Service**:
   - Name: `mortgage-webapp`
   - Source: `/webapp`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Instance Size: Basic ($5/month)

3. **Environment Variables**:
   Set these in the App Platform dashboard:
   ```
   ENVIRONMENT=production
   VITE_API_URL=https://your-api-url.ondigitalocean.app
   ```

### Option 2: Digital Ocean Droplets with Docker

For more control, deploy on a Droplet:

1. **Create a Droplet**:
   - Ubuntu 22.04 LTS
   - Basic plan ($6/month minimum)
   - Add your SSH key

2. **Setup the Droplet**:
   ```bash
   # SSH into your droplet
   ssh root@your-droplet-ip

   # Update system
   apt update && apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   apt install docker-compose-plugin -y

   # Clone your repository
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

3. **Deploy with Docker Compose**:
   ```bash
   # Production deployment
   docker compose -f docker-compose.prod.yml up -d

   # Check status
   docker compose -f docker-compose.prod.yml ps
   ```

4. **Setup Nginx (Optional)**:
   If you want SSL/HTTPS:
   ```bash
   # Install Certbot for SSL
   apt install certbot python3-certbot-nginx -y

   # Get SSL certificate
   certbot --nginx -d yourdomain.com
   ```

### Option 3: Digital Ocean Container Registry + Kubernetes

For scalable production:

1. **Build and Push Images**:
   ```bash
   # Create container registry
   doctl registry create mortgage-calculator

   # Build and tag images
   docker build -t registry.digitalocean.com/mortgage-calculator/api:latest ./python-backend
   docker build -t registry.digitalocean.com/mortgage-calculator/webapp:latest ./webapp

   # Push images
   docker push registry.digitalocean.com/mortgage-calculator/api:latest
   docker push registry.digitalocean.com/mortgage-calculator/webapp:latest
   ```

## Local Development

### Quick Start
```bash
# Development with hot reload
docker compose -f docker-compose.dev.yml up

# Production build locally
docker compose -f docker-compose.yml up

# Access the application
# Frontend: http://localhost:3000 (dev) or http://localhost (prod)
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Manual Setup
```bash
# Backend
cd python-backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd webapp
npm install
npm run dev
```

## API Endpoints

Your Python FastAPI backend provides these endpoints:

- `GET /health` - Health check
- `POST /api/v1/mortgage_calculations/calculate` - Calculate mortgage
- `POST /api/v1/mortgage_calculations/scenario_comparison` - Compare scenarios
- `GET /docs` - Interactive API documentation

## Environment Variables

### Backend (.env file in python-backend/)
```env
ENVIRONMENT=production
ALLOWED_ORIGINS=["https://yourdomain.com"]
```

### Frontend (.env file in webapp/)
```env
VITE_API_URL=https://your-api-domain.com
```

## Monitoring and Logs

### Digital Ocean App Platform
- Logs available in the App Platform dashboard
- Built-in monitoring and alerts

### Droplet Deployment
```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Monitor resources
docker stats

# Health checks
curl http://localhost:8000/health
curl http://localhost/
```

## Scaling

### App Platform
- Auto-scaling available in higher tiers
- Horizontal scaling through dashboard

### Droplet
- Vertical scaling: Resize droplet
- Horizontal scaling: Load balancer + multiple droplets

## Cost Estimates

### App Platform (Recommended for simplicity)
- Backend: $5/month (Basic)
- Frontend: $5/month (Basic)
- **Total: ~$10/month**

### Droplet (More control)
- Single Droplet: $6-12/month
- Load Balancer (if needed): $12/month
- **Total: $6-24/month**

## Security Considerations

1. **HTTPS**: Always use SSL in production
2. **CORS**: Configure allowed origins properly
3. **Rate Limiting**: Consider adding rate limiting for production
4. **Firewall**: Configure UFW on droplets

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   ```python
   # Update python-backend/app/config.py
   allowed_origins = ["https://yourdomain.com"]
   ```

2. **Build Failures**:
   ```bash
   # Check Docker logs
   docker compose logs api
   docker compose logs webapp
   ```

3. **Port Conflicts**:
   ```bash
   # Check what's using ports
   netstat -tulpn | grep :8000
   netstat -tulpn | grep :80
   ```

## Next Steps

1. Deploy using your preferred method above
2. Configure your domain name
3. Set up SSL certificates
4. Monitor application performance
5. Consider adding analytics or error tracking

## Support

- Digital Ocean Documentation: https://docs.digitalocean.com/
- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
