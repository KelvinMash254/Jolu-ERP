# Deployment Guide

## Prerequisites

- AWS Account with appropriate IAM permissions
- Domain name (e.g., erp.jolugroup.co.ke)
- SSL certificate (AWS ACM)
- Safaricom Daraja API credentials (production)
- SendGrid API key

## Local Development

```bash
# 1. Start services
docker compose up -d postgres redis elasticsearch

# 2. Backend
cd backend && cp .env.example .env
npm install && npx prisma generate && npx prisma db push && npm run db:seed
npm run dev

# 3. Frontend
cd frontend && npm install && npm run dev
```

## Docker Production Deployment

```bash
# Set environment variables
export JWT_SECRET=$(openssl rand -base64 32)
export JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Build and start all services
docker compose up -d --build

# Run migrations and seed
docker exec jolu-backend npx prisma migrate deploy
docker exec jolu-backend npm run db:seed
```

## AWS Deployment

### 1. Infrastructure (Terraform/CloudFormation)

```
VPC → Public Subnets (ALB) + Private Subnets (ECS, RDS)
├── RDS PostgreSQL 16 (db.r6g.large, Multi-AZ)
├── ElastiCache Redis (cache.r6g.large)
├── OpenSearch (t3.medium.search)
├── S3 Bucket (jolu-erp-files)
├── ECS Fargate Cluster
│   ├── jolu-backend (2+ tasks)
│   └── jolu-frontend (2+ tasks)
├── ALB with HTTPS (ACM certificate)
└── CloudFront CDN (static assets)
```

### 2. Environment Variables (ECS Task Definition)

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/jolu_erp
REDIS_URL=redis://elasticache-endpoint:6379
ELASTICSEARCH_URL=https://opensearch-endpoint
JWT_SECRET=<from-secrets-manager>
JWT_REFRESH_SECRET=<from-secrets-manager>
AWS_ACCESS_KEY_ID=<iam-role-preferred>
AWS_SECRET_ACCESS_KEY=<iam-role-preferred>
AWS_S3_BUCKET=jolu-erp-files
AWS_REGION=eu-west-1
SENDGRID_API_KEY=<from-secrets-manager>
MPESA_CONSUMER_KEY=<production-key>
MPESA_CONSUMER_SECRET=<production-secret>
MPESA_SHORTCODE=<paybill-number>
MPESA_PASSKEY=<production-passkey>
MPESA_CALLBACK_URL=https://erp.jolugroup.co.ke/api/mpesa/callback
MPESA_ENV=production
FRONTEND_URL=https://erp.jolugroup.co.ke
```

### 3. Database Migration

```bash
# From CI/CD or bastion host
npx prisma migrate deploy
npm run db:seed  # First deployment only
```

### 4. SSL & Domain

- Route 53 A record → ALB
- ACM certificate for `*.jolugroup.co.ke`
- ALB listener: HTTPS 443 → target group

### 5. M-PESA Callback

Register production callback URL with Safaricom:
`https://erp.jolugroup.co.ke/api/mpesa/callback`

### 6. Backups

- RDS automated backups (7-day retention, extend to 30)
- S3 versioning enabled
- Daily pg_dump to S3 via Lambda (optional)

### 7. Monitoring

- CloudWatch alarms: CPU, memory, RDS connections
- Application logs → CloudWatch Logs
- Error tracking: Sentry (recommended)
- Uptime monitoring: Route 53 health checks

## CI/CD (GitHub Actions)

The included workflow (`.github/workflows/ci.yml`) runs on push:
1. Backend unit tests
2. Frontend build verification
3. Docker image build (main branch)

Extend with ECR push and ECS deploy:

```yaml
- name: Deploy to ECS
  run: |
    aws ecs update-service --cluster jolu-erp --service backend --force-new-deployment
    aws ecs update-service --cluster jolu-erp --service frontend --force-new-deployment
```

## Health Checks

- Backend: `GET /health` → `{ "status": "ok" }`
- Frontend: Nginx serves index.html
- Database: Prisma connection on startup

## Scaling Guidelines

| Users | API Tasks | RDS Instance | Redis |
|-------|-----------|--------------|-------|
| < 100 | 2 | db.t3.medium | cache.t3.micro |
| 100-500 | 4 | db.r6g.large | cache.r6g.large |
| 500-2000 | 8+ | db.r6g.xlarge + replica | cache.r6g.xlarge |
| 2000+ | Auto-scaling | db.r6g.2xlarge + replicas | Cluster mode |

## Security Checklist

- [ ] Change all default passwords
- [ ] Store secrets in AWS Secrets Manager
- [ ] Enable RDS encryption at rest
- [ ] Configure WAF on ALB
- [ ] Enable VPC flow logs
- [ ] Restrict security groups
- [ ] Enable 2FA for admin accounts
- [ ] Configure CORS for production domain only
- [ ] Set up automated security patching
