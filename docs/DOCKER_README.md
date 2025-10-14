# 🐳 Vaelix Bank API - Docker Documentation

> Complete Docker setup for Vaelix Bank API with development, production, and monitoring environments.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Development Environment](#-development-environment)
- [Production Environment](#-production-environment)
- [Monitoring Stack](#-monitoring-stack)
- [Database Management](#-database-management)
- [Troubleshooting](#-troubleshooting)
- [Security Considerations](#-security-considerations)

## 🚀 Quick Start

### Prerequisites

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Make** (optional, for simplified commands)

### One-Line Setup

```bash
# Clone and start development environment
git clone https://github.com/vaelixbank/vaelix-api.git
cd vaelix-api
make dev
```

That's it! The API will be available at `http://localhost:3000`.

## 🛠️ Development Environment

### Start Development Stack

```bash
# Using Make (recommended)
make dev

# Or using Docker Compose directly
docker-compose -f docker-compose.dev.yml up --build
```

### Development Services

| Service | URL | Description |
|---------|-----|-------------|
| **API** | `http://localhost:3000` | Main application with hot reload |
| **PostgreSQL** | `localhost:5432` | Database (user: `vaelix_user`, pass: `dev_password`) |
| **Redis** | `localhost:6379` | Cache & session store |
| **pgAdmin** | `http://localhost:8080` | Database management UI |
| **Redis Commander** | `http://localhost:8081` | Redis management UI |
| **MailHog** | `http://localhost:8025` | Email testing interface |

### Development Commands

```bash
# Start services
make dev-up

# View logs
make dev-logs

# Stop services
make dev-down

# Clean everything (including volumes)
make dev-clean

# Open shell in API container
make shell

# Check service health
make health
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=vaelix_dev
DB_USER=vaelix_user
DB_PASSWORD=dev_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# API
ENCRYPTION_KEY=c6494d72aeea79c0f50ec82e06f427d239d5d04d7629b15770e08cb8b98a9221
JWT_SECRET=dev-jwt-secret-for-development-only
JWT_REFRESH_SECRET=dev-refresh-secret-for-development-only

# Weavr (Sandbox)
WEAVR_API_BASE_URL=https://sandbox.weavr.io
WEAVR_API_KEY=your_sandbox_api_key
```

## 🏭 Production Environment

### Production Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Traefik       │    │   Vaelix API    │    │   PostgreSQL     │
│   (Reverse      │◄──►│   (Node.js)     │◄──►│   (Database)     │
│    Proxy)       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Let's Encrypt │    │     Redis       │    │   Monitoring    │
│  (SSL/TLS)      │    │   (Cache)       │    │   (Optional)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Deploy Production Stack

```bash
# Using Make
make prod

# Or using Docker Compose
docker-compose -f docker-compose.prod.yml up -d --build
```

### Production Services

| Service | URL | Description |
|---------|-----|-------------|
| **API** | `https://api.vaelixbank.com` | Production API with SSL |
| **Traefik Dashboard** | `https://traefik.vaelixbank.com` | Load balancer management |
| **PostgreSQL** | Internal only | Production database |
| **Redis** | Internal only | Production cache |
| **Prometheus** | `https://prometheus.vaelixbank.com` | Metrics collection |
| **Grafana** | `https://grafana.vaelixbank.com` | Monitoring dashboard |

### Production Configuration

Create a `.env.prod` file:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=vaelix_prod
DB_USER=your_prod_db_user
DB_PASSWORD=your_secure_db_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password

# Security
ENCRYPTION_KEY=your_64_char_hex_encryption_key
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret

# Weavr (Production)
WEAVR_API_BASE_URL=https://api.weavr.io
WEAVR_API_KEY=your_production_weavr_key

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# SSL/TLS
TRAEFIK_EMAIL=admin@vaelixbank.com

# Monitoring
GRAFANA_PASSWORD=your_secure_grafana_password
```

### Production Commands

```bash
# Deploy
make deploy-prod

# Scale API instances
make prod-scale API=3

# View logs
make prod-logs

# Backup database
make db-backup

# Start monitoring
make monitoring
```

## 📊 Monitoring Stack

### Enable Monitoring

```bash
# Start with monitoring
make monitoring

# Or with Docker Compose
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

### Monitoring Services

- **Prometheus**: `http://localhost:9090` - Metrics collection
- **Grafana**: `http://localhost:3001` - Visualization dashboard
- **Node Exporter**: System metrics
- **cAdvisor**: Container metrics

### Default Credentials

- **Grafana**: admin / `GRAFANA_PASSWORD`

### Custom Dashboards

Pre-configured dashboards are available in `monitoring/grafana/dashboards/`:
- API Performance
- Database Metrics
- System Resources
- Error Rates

## 🗄️ Database Management

### Database Initialization

```bash
# Initialize with schema
make db-init

# Run migrations
make db-migrate
```

### Backup & Restore

```bash
# Create backup
make db-backup

# Restore from backup
make db-restore FILE=backup_20240101.sql
```

### Database Tools

```bash
# Open PostgreSQL shell
make shell-db

# Open Redis CLI
make shell-redis

# Access pgAdmin
open http://localhost:8080
# User: dev@vaelixbank.com
# Password: dev123
```

## 🔧 Troubleshooting

### Common Issues

#### API Won't Start
```bash
# Check logs
make logs

# Check environment variables
docker-compose -f docker-compose.dev.yml exec api env

# Check database connection
make shell-db
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.dev.yml ps postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.dev.yml logs postgres

# Reset database
make dev-clean
make dev
```

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :5432

# Change ports in docker-compose.override.yml
```

#### Memory Issues
```bash
# Check container resources
docker stats

# Increase Docker memory limit
# Docker Desktop: Preferences > Resources > Memory
```

### Debug Mode

```bash
# Start with debug port exposed
docker-compose -f docker-compose.dev.yml up

# Attach debugger in VS Code
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "port": 9229,
  "restart": true,
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app"
}
```

## 🔒 Security Considerations

### Production Security

- **Non-root containers**: All containers run as non-root users
- **Minimal base images**: Alpine Linux for smaller attack surface
- **Secrets management**: Environment variables for sensitive data
- **Network isolation**: Services communicate through defined networks
- **Regular updates**: Automated security updates via Dependabot

### Security Scanning

```bash
# Scan for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasecurity/trivy:latest image vaelix-api:latest

# Scan running containers
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasecurity/trivy:latest container --container vaelix-api
```

### SSL/TLS Configuration

Production automatically configures:
- **Let's Encrypt** SSL certificates
- **HSTS** headers
- **Secure redirects** (HTTP → HTTPS)
- **Certificate renewal** automation

## 📈 Performance Optimization

### Container Optimization

- **Multi-stage builds**: Separate build and runtime images
- **Layer caching**: Optimized Dockerfile for better caching
- **Alpine Linux**: Minimal base images
- **dumb-init**: Proper signal handling

### Database Optimization

- **Connection pooling**: Efficient database connections
- **Query optimization**: Indexed queries
- **Memory limits**: Configured memory limits
- **Backup automation**: Regular automated backups

### Monitoring & Alerting

- **Health checks**: Automatic service health monitoring
- **Metrics collection**: Prometheus metrics
- **Log aggregation**: Centralized logging
- **Alert rules**: Configurable alerting thresholds

## 🚀 Deployment Strategies

### Blue-Green Deployment

```bash
# Deploy new version
docker tag vaelix-api:latest vaelix-api:v2
docker-compose -f docker-compose.prod.yml up -d api

# Test new version
curl -f https://api.vaelixbank.com/health

# Switch traffic (if using load balancer)
# Update load balancer configuration

# Remove old version
docker-compose -f docker-compose.prod.yml up -d --scale api=0
```

### Rolling Updates

```bash
# Update with zero downtime
docker-compose -f docker-compose.prod.yml up -d --scale api=2
docker-compose -f docker-compose.prod.yml up -d --scale api=1
```

## 📚 Additional Resources

- [API Documentation](../docs/API.md)
- [Security Guidelines](../SECURITY.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Overview](../README.md)

---

<div align="center">

**🐳 Docker Setup Complete!**

Your Vaelix Bank API is now containerized and ready for any environment.

[📖 Back to Main README](../README.md) • [🐛 Report Issues](https://github.com/vaelixbank/vaelix-api/issues)

</div>