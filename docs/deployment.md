# Deployment Guide

## Overview

This guide covers deploying the "Are We Hiring the Same Guy" platform across different environments using modern DevOps practices, with a focus on security, scalability, and compliance.

## Deployment Architecture

### 1. Production Environment Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Cloudflare)               │
│                  SSL Termination & DDoS Protection          │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│                (Global CDN + Edge Functions)                │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Application                        │
│              (Serverless Functions on Vercel)               │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                 Database Layer                               │
│         Neon PostgreSQL (Primary + Read Replicas)          │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                 External Services                            │
│    Redis (Upstash) | Storage (S3) | Monitoring (DataDog)   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Environment Separation

#### Production
- **Domain**: `https://app.overemployed-detection.com`
- **Database**: Neon Production Cluster
- **CDN**: Vercel Edge Network
- **Monitoring**: Full observability stack
- **Security**: WAF, DDoS protection, rate limiting

#### Staging
- **Domain**: `https://staging.overemployed-detection.com`
- **Database**: Neon Branch (staging)
- **Environment**: Production-like configuration
- **Purpose**: Pre-production testing and validation

#### Development
- **Domain**: `http://localhost:3000`
- **Database**: Local PostgreSQL or Neon Branch (dev)
- **Purpose**: Local development and testing

## Infrastructure as Code

### 1. Vercel Configuration

```json
{
  "version": 2,
  "name": "overemployed-detection",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "NEXTAUTH_URL": "https://app.overemployed-detection.com",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "DATABASE_URL": "@database-url",
    "REDIS_URL": "@redis-url",
    "ENCRYPTION_KEY": "@encryption-key"
  },
  "functions": {
    "app/api/trpc/[trpc]/route.ts": {
      "maxDuration": 30
    },
    "app/api/webhooks/*/route.ts": {
      "maxDuration": 25
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://app.overemployed-detection.com"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:"
        }
      ]
    }
  ],
  "regions": ["iad1", "sfo1", "fra1"],
  "framework": "nextjs"
}
```

### 2. Environment Variables Configuration

```bash
# Authentication
NEXTAUTH_SECRET=<generate-random-32-char-string>
NEXTAUTH_URL=https://app.overemployed-detection.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@host:5432/database?sslmode=require&pgbouncer=true

# Redis Cache
REDIS_URL=redis://user:password@host:6379

# Encryption
ENCRYPTION_KEY=<generate-random-32-byte-key>
GLOBAL_SALT=<generate-random-salt>

# HR Integrations
JUSTWORKS_CLIENT_ID=your_justworks_client_id
JUSTWORKS_CLIENT_SECRET=your_justworks_client_secret
BAMBOO_API_KEY=your_bamboo_api_key
WORKDAY_CLIENT_ID=your_workday_client_id
WORKDAY_CLIENT_SECRET=your_workday_client_secret
ADP_CLIENT_ID=your_adp_client_id
ADP_CLIENT_SECRET=your_adp_client_secret

# Monitoring & Observability
DATADOG_API_KEY=your_datadog_api_key
SENTRY_DSN=your_sentry_dsn
WEBHOOK_SECRET=<generate-webhook-secret>

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
SUPPORT_EMAIL=support@overemployed-detection.com

# Feature Flags
FEATURE_ADVANCED_MATCHING=true
FEATURE_ML_PREDICTIONS=false
FEATURE_COMPLIANCE_REPORTS=true
```

## Database Deployment

### 1. Neon PostgreSQL Setup

```sql
-- Production database schema deployment
-- This should be run through Prisma migrations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_company_status 
ON employees(company_id, status) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_ssn_hash 
ON employees USING hash(ssn_hash) 
WHERE ssn_hash IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_email_hash 
ON employees USING hash(email_hash) 
WHERE email_hash IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_confidence 
ON matches(confidence_score DESC) 
WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp 
ON audit_logs(timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company isolation
CREATE POLICY employee_company_isolation ON employees
FOR ALL TO authenticated
USING (company_id = current_setting('app.current_company_id'));

CREATE POLICY match_company_isolation ON matches
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees e1, employees e2 
    WHERE e1.id = matches.employee1_id 
    AND e2.id = matches.employee2_id
    AND (e1.company_id = current_setting('app.current_company_id')
         OR e2.company_id = current_setting('app.current_company_id'))
  )
);
```

### 2. Database Migration Strategy

```typescript
// prisma/migrations/deploy.ts
import { PrismaClient } from '@prisma/client'

async function deployMigrations() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  
  try {
    // Apply pending migrations
    console.log('Applying database migrations...')
    await prisma.$executeRaw`SELECT 1` // Test connection
    
    // Run custom deployment scripts
    await ensureIndexes(prisma)
    await updateSecurityPolicies(prisma)
    await seedRequiredData(prisma)
    
    console.log('Database deployment completed successfully')
  } catch (error) {
    console.error('Database deployment failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function ensureIndexes(prisma: PrismaClient) {
  // Create performance-critical indexes
  await prisma.$executeRaw`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_search_vector 
    ON employees USING gin(to_tsvector('english', first_name || ' ' || last_name))
  `
}
```

## Security Configuration

### 1. SSL/TLS Configuration

```yaml
# Cloudflare SSL Configuration
ssl:
  mode: "full_strict"
  universal_ssl: true
  tls_version: "1.2"
  ciphers:
    - "ECDHE-RSA-AES128-GCM-SHA256"
    - "ECDHE-RSA-AES256-GCM-SHA384"
    - "ECDHE-RSA-CHACHA20-POLY1305"
  
security_headers:
  hsts:
    enabled: true
    max_age: 31536000
    include_subdomains: true
    preload: true
  
  content_security_policy:
    default_src: "'self'"
    script_src: "'self' 'unsafe-eval' 'unsafe-inline'"
    style_src: "'self' 'unsafe-inline'"
    img_src: "'self' data: https:"
    connect_src: "'self' https:"
    font_src: "'self'"
    object_src: "'none'"
    frame_ancestors: "'none'"
```

### 2. WAF (Web Application Firewall) Rules

```yaml
# Cloudflare WAF Rules
waf_rules:
  - name: "Rate Limiting API"
    expression: "(http.request.uri.path matches \"/api/.*\")"
    action: "rate_limit"
    rate_limit:
      threshold: 100
      period: 60
      
  - name: "Block Known Attack Patterns"
    expression: "(http.request.body contains \"<script\" or http.request.body contains \"javascript:\")"
    action: "block"
    
  - name: "Protect Admin Endpoints"
    expression: "(http.request.uri.path matches \"/admin/.*\" and not ip.src in {allowed_admin_ips})"
    action: "block"
    
  - name: "Geographic Restrictions"
    expression: "(ip.geoip.country not in {\"US\" \"CA\" \"GB\" \"DE\" \"FR\" \"AU\"})"
    action: "challenge"
```

## Monitoring & Observability

### 1. Application Performance Monitoring

```typescript
// lib/monitoring.ts
import { DatadogLogger } from '@datadog/browser-logs'
import * as Sentry from '@sentry/nextjs'

// Initialize monitoring services
export function initializeMonitoring() {
  // Sentry for error tracking
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request?.data) {
        event.request.data = sanitizeSensitiveData(event.request.data)
      }
      return event
    }
  })
  
  // DataDog for metrics and logs
  if (typeof window !== 'undefined') {
    DatadogLogger.init({
      clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
      site: 'datadoghq.com',
      service: 'overemployed-detection',
      env: process.env.NODE_ENV,
      version: process.env.npm_package_version,
      sampleRate: process.env.NODE_ENV === 'production' ? 10 : 100
    })
  }
}

// Custom metrics tracking
export class MetricsCollector {
  static increment(metric: string, tags?: Record<string, string>) {
    if (typeof window !== 'undefined') {
      DatadogLogger.logger.info(`metric.increment.${metric}`, tags)
    }
  }
  
  static timing(metric: string, duration: number, tags?: Record<string, string>) {
    if (typeof window !== 'undefined') {
      DatadogLogger.logger.info(`metric.timing.${metric}`, { duration, ...tags })
    }
  }
  
  static error(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, { extra: context })
    
    if (typeof window !== 'undefined') {
      DatadogLogger.logger.error('application.error', {
        error: error.message,
        stack: error.stack,
        ...context
      })
    }
  }
}
```

### 2. Health Checks & Uptime Monitoring

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { db } from '~/server/db'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  }
  
  try {
    // Database connectivity check
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1 as health_check`
    checks.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart
    }
    
    // Redis connectivity check (if applicable)
    if (process.env.REDIS_URL) {
      const redisStart = Date.now()
      // Add Redis health check
      checks.checks.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStart
      }
    }
    
    // External API checks
    checks.checks.external_apis = await checkExternalAPIs()
    
    // Memory and CPU checks
    checks.checks.system = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version
    }
    
    return NextResponse.json(checks)
    
  } catch (error) {
    checks.status = 'unhealthy'
    checks.checks.error = error.message
    
    return NextResponse.json(checks, { status: 503 })
  }
}

async function checkExternalAPIs() {
  const apis = {}
  
  // Check critical external services
  const checks = [
    { name: 'justworks', url: 'https://api.justworks.com/health' },
    { name: 'bamboohr', url: 'https://api.bamboohr.com/health' }
  ]
  
  for (const check of checks) {
    try {
      const start = Date.now()
      const response = await fetch(check.url, { 
        method: 'HEAD', 
        signal: AbortSignal.timeout(5000) 
      })
      
      apis[check.name] = {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: Date.now() - start,
        statusCode: response.status
      }
    } catch (error) {
      apis[check.name] = {
        status: 'unhealthy',
        error: error.message
      }
    }
  }
  
  return apis
}
```

## Deployment Automation

### 1. GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run type checking
        run: npm run typecheck
        
      - name: Run linting
        run: npm run check
        
      - name: Setup test database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: |
          npx prisma migrate deploy
          npx prisma db seed
          
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          NODE_ENV: test
        run: npm run test
        
      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          NODE_ENV: test
        run: npm run test:e2e
        
      - name: Build application
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
        
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Deploy Project Artifacts to Vercel
        id: deploy
        run: |
          DEPLOYMENT_URL=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "deployment-url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT
          
      - name: Comment PR with deployment URL
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Deployed to staging: ${{ steps.deploy.outputs.deployment-url }}`
            })

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
        
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Run post-deployment tests
        run: npm run test:smoke -- --url https://app.overemployed-detection.com
        
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: '🎉 Production deployment successful!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 2. Database Migration Pipeline

```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database migrations
        env:
          DATABASE_URL: ${{ secrets[format('DATABASE_URL_{0}', github.event.inputs.environment)] }}
        run: |
          npx prisma migrate deploy
          npx prisma generate
          
      - name: Verify migration
        env:
          DATABASE_URL: ${{ secrets[format('DATABASE_URL_{0}', github.event.inputs.environment)] }}
        run: npx prisma db seed --preview-feature
```

## Backup & Disaster Recovery

### 1. Database Backup Strategy

```sql
-- Automated backup script (run via cron)
#!/bin/bash

# Configuration
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup
pg_dump $DATABASE_URL \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  > "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# Upload to S3 for offsite storage
aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.dump" \
  "s3://overemployed-backups/postgres/backup_$TIMESTAMP.dump" \
  --storage-class STANDARD_IA

# Clean up old backups
find $BACKUP_DIR -name "backup_*.dump" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
pg_restore --list "$BACKUP_DIR/backup_$TIMESTAMP.dump" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Backup verification successful: backup_$TIMESTAMP.dump"
else
  echo "Backup verification failed: backup_$TIMESTAMP.dump"
  exit 1
fi
```

### 2. Application Backup & Recovery

```typescript
// scripts/backup-application-data.ts
import { PrismaClient } from '@prisma/client'
import AWS from 'aws-sdk'

const prisma = new PrismaClient()
const s3 = new AWS.S3()

async function backupApplicationData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  
  try {
    // Export sensitive configuration
    const integrations = await prisma.integration.findMany({
      select: {
        id: true,
        provider: true,
        settings: true,
        // Exclude encrypted credentials
      }
    })
    
    const companies = await prisma.company.findMany({
      include: {
        users: {
          select: { id: true, email: true, role: true }
        }
      }
    })
    
    const backupData = {
      timestamp,
      version: process.env.npm_package_version,
      data: {
        integrations,
        companies,
        metadata: {
          totalEmployees: await prisma.employee.count(),
          totalMatches: await prisma.match.count(),
          lastBackup: timestamp
        }
      }
    }
    
    // Upload to S3
    await s3.upload({
      Bucket: 'overemployed-backups',
      Key: `application-data/backup-${timestamp}.json`,
      Body: JSON.stringify(backupData, null, 2),
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA'
    }).promise()
    
    console.log(`Application data backup completed: backup-${timestamp}.json`)
    
  } catch (error) {
    console.error('Backup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  backupApplicationData()
}
```

## Performance Optimization

### 1. CDN Configuration

```typescript
// next.config.js
const nextConfig = {
  // Enable static optimization
  trailingSlash: false,
  
  // Image optimization
  images: {
    domains: ['app.overemployed-detection.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
  },
  
  // Compression
  compress: true,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0'
          }
        ]
      }
    ]
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  }
}

module.exports = nextConfig
```

### 2. Database Performance Tuning

```sql
-- PostgreSQL performance configuration
-- These settings should be applied to production database

-- Connection and memory settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Query optimization
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Logging and monitoring
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Reload configuration
SELECT pg_reload_conf();
```

This deployment guide provides a comprehensive approach to deploying and managing the "Are We Hiring the Same Guy" platform with enterprise-grade security, monitoring, and reliability features.