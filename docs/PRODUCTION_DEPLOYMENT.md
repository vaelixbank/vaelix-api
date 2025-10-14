# 🚀 Production Deployment Guide

> Complete guide for deploying Vaelix Bank API to production using Docker

## 📋 Prerequisites

### System Requirements

- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0
- **Domain name** with DNS configured
- **SSL certificate** (Let's Encrypt will be configured automatically)
- **Reverse proxy** (Traefik included)

### Infrastructure Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB+ recommended
- **Storage**: 20GB+ for database and logs
- **Network**: Stable internet connection

## 🏗️ Production Architecture

```
Internet
    ↓
┌─────────────┐    ┌─────────────┐
│   Traefik   │    │  Vaelix API │
│ (Load       │◄──►│  (Node.js)  │
│  Balancer)  │    │             │
└─────────────┘    └─────────────┘
       │                 │
       ▼                 ▼
┌─────────────┐    ┌─────────────┐
│ PostgreSQL  │    │    Redis    │
│ (Database)  │    │   (Cache)   │
└─────────────┘    └─────────────┘
```

## 📦 Step-by-Step Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/vaelix-api
sudo chown $USER:$USER /opt/vaelix-api
cd /opt/vaelix-api
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/vaelixbank/vaelix-api.git .
git checkout main  # or specific tag

# Copy production environment
cp .env.prod.example .env.prod

# Edit production configuration
nano .env.prod

# Required configurations:
# - DB_PASSWORD: Strong database password
# - REDIS_PASSWORD: Strong Redis password
# - ENCRYPTION_KEY: 64-character hex encryption key
# - JWT_SECRET & JWT_REFRESH_SECRET: Strong JWT secrets
# - WEAVR_API_KEY: Production Weavr API key
# - TRAEFIK_EMAIL: Your email for SSL certificates
```

### 3. Generate Secrets

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secrets
openssl rand -hex 32
openssl rand -hex 32

# Generate database password
openssl rand -base64 24

# Generate Redis password
openssl rand -base64 24
```

### 4. Database Initialization

```bash
# Start only database service first
docker-compose -f docker-compose.prod.yml up -d postgres

# Wait for database to be ready
sleep 30

# Check database health
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U vaelix_prod_user -d vaelix_prod

# Run initial migrations (if needed)
docker-compose -f docker-compose.prod.yml exec api npm run migrate
```

### 5. SSL Certificate Setup

```bash
# Ensure your domain DNS points to this server
# Traefik will automatically obtain Let's Encrypt certificates

# Check certificate status
docker-compose -f docker-compose.prod.yml logs traefik | grep "certificate"
```

### 6. Full Deployment

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 7. Post-Deployment Checks

```bash
# Test API health
curl -k https://your-domain.com/health

# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check Traefik dashboard (if enabled)
open https://traefik.your-domain.com
```

## 🔧 Configuration Management

### Environment Variables

#### Required Production Variables

```bash
# Database
DB_USER=vaelix_prod_user
DB_PASSWORD=your_secure_db_password
DB_NAME=vaelix_prod

# Redis
REDIS_PASSWORD=your_secure_redis_password

# Security
ENCRYPTION_KEY=your_64_char_hex_key
JWT_SECRET=your_32_char_jwt_secret
JWT_REFRESH_SECRET=your_32_char_refresh_secret

# External Services
WEAVR_API_KEY=your_production_weavr_key

# SSL
TRAEFIK_EMAIL=admin@your-domain.com
```

#### Optional Variables

```bash
# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
GRAFANA_PASSWORD=your_secure_grafana_password

# Performance tuning
MAX_WORKERS=4
MEMORY_LIMIT=2gb
```

### Secrets Management

For enhanced security, consider using:

- **Docker Secrets**: `docker secret create`
- **HashiCorp Vault**: External secrets management
- **AWS Secrets Manager**: Cloud-native secrets
- **Azure Key Vault**: Microsoft cloud secrets

## 📊 Monitoring Setup

### Enable Monitoring Stack

```bash
# Start with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access Grafana
open https://grafana.your-domain.com
# Default credentials: admin / GRAFANA_PASSWORD
```

### Monitoring Endpoints

- **API Health**: `GET /health`
- **Metrics**: `GET /metrics` (if enabled)
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `https://grafana.your-domain.com`

### Log Management

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f api

# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# Export logs for analysis
docker-compose -f docker-compose.prod.yml logs > production_logs_$(date +%Y%m%d).log
```

## 🔄 Maintenance Operations

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U vaelix_prod_user -d vaelix_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/opt/vaelix-api/backups"
mkdir -p $BACKUP_DIR
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
  -U vaelix_prod_user -d vaelix_prod > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 30 backups
cd $BACKUP_DIR && ls -t *.sql | tail -n +31 | xargs rm -f
```

### Database Restore

```bash
# Stop API before restore
docker-compose -f docker-compose.prod.yml stop api

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql \
  -U vaelix_prod_user -d vaelix_prod < backup_file.sql

# Restart API
docker-compose -f docker-compose.prod.yml start api
```

### Updates and Rollbacks

```bash
# Update to latest version
git pull origin main
docker-compose -f docker-compose.prod.yml build api
docker-compose -f docker-compose.prod.yml up -d api

# Rollback if needed
docker-compose -f docker-compose.prod.yml up -d --scale api=2
# Test new version
docker-compose -f docker-compose.prod.yml up -d --scale api=1
```

## 🚨 Troubleshooting

### Common Issues

#### API Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api

# Check environment
docker-compose -f docker-compose.prod.yml exec api env

# Test database connection
docker-compose -f docker-compose.prod.yml exec api npm run db:check
```

#### Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U vaelix_prod_user -d vaelix_prod
```

#### SSL Certificate Issues
```bash
# Check Traefik logs
docker-compose -f docker-compose.prod.yml logs traefik

# Force certificate renewal
docker-compose -f docker-compose.prod.yml exec traefik traefik healthcheck

# Check certificate status
curl -v https://your-domain.com
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Check application metrics
curl https://your-domain.com/metrics

# Scale services if needed
docker-compose -f docker-compose.prod.yml up -d --scale api=2
```

### Emergency Procedures

#### Service Outage
```bash
# Quick restart
docker-compose -f docker-compose.prod.yml restart

# Full restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

#### Data Recovery
```bash
# From backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql \
  -U vaelix_prod_user -d vaelix_prod < /path/to/backup.sql
```

## 🔒 Security Hardening

### Network Security

```bash
# Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

### Container Security

- **Non-root users**: All containers run as non-root
- **Minimal images**: Alpine Linux base images
- **Read-only filesystems**: Where possible
- **Resource limits**: CPU and memory constraints
- **Security scanning**: Automated vulnerability scans

### Access Control

- **SSH key authentication**: Disable password auth
- **Fail2Ban**: Automated IP blocking
- **Regular updates**: Automated security updates
- **Audit logging**: Complete access logging

## 📈 Scaling and Performance

### Horizontal Scaling

```bash
# Scale API instances
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# Load balancing is handled automatically by Traefik
```

### Database Scaling

```bash
# Increase database resources
docker-compose -f docker-compose.prod.yml up -d --scale postgres=1
# Note: PostgreSQL clustering requires additional setup
```

### Performance Monitoring

- **Response times**: API response monitoring
- **Error rates**: Application error tracking
- **Resource usage**: CPU, memory, disk monitoring
- **Database performance**: Query performance monitoring

## 🔄 Backup Strategy

### Automated Backups

```bash
# Create cron job for daily backups
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /opt/vaelix-api/scripts/backup.sh
```

### Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/vaelix-api/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
  -U vaelix_prod_user -d vaelix_prod > $BACKUP_DIR/db_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/db_$TIMESTAMP.sql

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

# Log backup completion
echo "$(date): Backup completed - $BACKUP_DIR/db_$TIMESTAMP.sql.gz" >> /opt/vaelix-api/logs/backup.log
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks

- **Weekly**: Review logs and monitoring dashboards
- **Monthly**: Update Docker images and dependencies
- **Quarterly**: Security audit and penetration testing
- **Annually**: Disaster recovery testing

### Support Contacts

- **Technical Issues**: Create GitHub issue
- **Security Issues**: security@vaelixbank.com
- **General Support**: support@vaelixbank.com

### Documentation Updates

Keep deployment documentation current:
- Update IP addresses and domain names
- Document configuration changes
- Update troubleshooting procedures
- Maintain runbooks for common issues

---

## 🎯 Success Metrics

Monitor these KPIs for deployment success:

- **Uptime**: >99.9% availability
- **Response Time**: <200ms average
- **Error Rate**: <0.1% of requests
- **Security**: Zero security incidents
- **Performance**: Consistent resource usage

Your Vaelix Bank API is now production-ready! 🚀