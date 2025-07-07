# System Architecture

## Overview

"Are We Hiring the Same Guy" is a privacy-first employment verification platform built on the T3 Stack, designed to detect potential employment conflicts by securely cross-referencing employee data across multiple companies and HR systems.

## Technology Stack

### Core Framework
- **Next.js 15** - Full-stack React framework with App Router
- **TypeScript** - Type-safe development across the entire stack
- **tRPC v11** - End-to-end type-safe APIs
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Primary database with encryption capabilities
- **Tailwind CSS** - Utility-first styling framework

### Security & Privacy
- **bcryptjs** - Password hashing and authentication
- **jose** - JWT token handling
- **@prisma/client** - Database access with row-level security
- **crypto** - Built-in Node.js cryptography for PII encryption

### Integrations
- **OAuth 2.0** - Secure HR system authentication
- **Webhook handlers** - Real-time data synchronization
- **Rate limiting** - API protection and usage controls

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  Next.js App Router + React Components + Tailwind CSS      │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                               │
│          tRPC Routers + Middleware + Validation             │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                       │
│    Matching Engine + Integration Services + Privacy         │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│        Prisma ORM + PostgreSQL + Encryption                │
└─────────────────────────────────────────────────────────────┘
```

### 2. Service-Oriented Design

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   ├── dashboard/          # Dashboard UI
│   ├── integrations/       # Integration management
│   └── matches/            # Match review interface
├── lib/
│   ├── integrations/       # HR system integrations
│   ├── matching/           # Employee matching engine
│   ├── privacy/            # Data encryption/anonymization
│   ├── auth/               # Authentication services
│   └── database/           # Database utilities
└── types/                  # TypeScript definitions
```

## Core Components

### 1. Employee Matching Engine

**Location**: `src/lib/matching/`

**Components**:
- `algorithms.ts` - Core matching algorithms
- `fuzzy-match.ts` - Fuzzy string matching with Levenshtein distance
- `confidence-scoring.ts` - ML-based confidence scoring
- `temporal-analysis.ts` - Employment date overlap detection

**Key Features**:
- Multi-factor identity verification
- Configurable confidence thresholds
- Privacy-preserving matching using hashed identifiers
- Temporal overlap detection with grace periods

### 2. HR Integration Layer

**Location**: `src/lib/integrations/`

**Architecture**:
```typescript
abstract class BaseIntegration {
  abstract authenticate(): Promise<AuthResult>
  abstract fetchEmployees(): Promise<Employee[]>
  abstract setupWebhooks(): Promise<void>
  abstract handleWebhook(payload: unknown): Promise<void>
}

// Implementations
class JustWorksIntegration extends BaseIntegration
class BambooHRIntegration extends BaseIntegration
class WorkdayIntegration extends BaseIntegration
class ADPIntegration extends BaseIntegration
```

**Features**:
- Standardized integration interface
- OAuth 2.0 authentication flow
- Automatic retry with exponential backoff
- Webhook event processing
- Rate limiting and quota management

### 3. Privacy & Encryption Layer

**Location**: `src/lib/privacy/`

**Components**:
- `encryption.ts` - AES-256 encryption for PII
- `anonymization.ts` - Data anonymization utilities
- `consent-management.ts` - Employee consent tracking
- `audit-log.ts` - Compliance audit logging

**Privacy Design**:
- **Field-level encryption** for all PII (SSN, emails, phone numbers)
- **Hashed identifiers** for matching without exposing raw data
- **Consent management** with granular permissions
- **Data retention policies** with automatic purging

### 4. Database Schema Design

**Core Tables**:
```prisma
model Company {
  id                String    @id @default(cuid())
  name              String
  domain            String    @unique
  employees         Employee[]
  integrations      Integration[]
  matches           Match[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model Employee {
  id                String    @id @default(cuid())
  companyId         String
  company           Company   @relation(fields: [companyId], references: [id])
  
  // Encrypted PII fields
  encryptedSSN      String?   // AES-256 encrypted
  encryptedEmail    String?   // AES-256 encrypted
  encryptedPhone    String?   // AES-256 encrypted
  
  // Hashed identifiers for matching
  ssnHash           String?   @unique
  emailHash         String?   @unique
  phoneHash         String?   @unique
  
  // Public fields
  firstName         String
  lastName          String
  startDate         DateTime
  endDate           DateTime?
  status            EmployeeStatus
  
  matches           Match[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([companyId])
  @@index([ssnHash])
  @@index([emailHash])
}

model Match {
  id                String    @id @default(cuid())
  employee1Id       String
  employee2Id       String
  employee1         Employee  @relation("Employee1", fields: [employee1Id], references: [id])
  employee2         Employee  @relation("Employee2", fields: [employee2Id], references: [id])
  
  confidenceScore   Float     // 0.0 to 1.0
  matchFactors      Json      // Which fields matched
  temporalOverlap   Boolean   // Employment date overlap
  overlapDays       Int?      // Days of overlap
  
  status            MatchStatus
  reviewedAt        DateTime?
  reviewedBy        String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([employee1Id, employee2Id])
}

model Integration {
  id                String    @id @default(cuid())
  companyId         String
  company           Company   @relation(fields: [companyId], references: [id])
  
  provider          IntegrationProvider
  status            IntegrationStatus
  
  // Encrypted credentials
  encryptedCredentials Json
  
  lastSyncAt        DateTime?
  webhookUrl        String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([companyId])
}
```

## API Architecture

### tRPC Router Structure

```typescript
// src/server/api/root.ts
export const appRouter = createTRPCRouter({
  auth: authRouter,
  employees: employeesRouter,
  matches: matchesRouter,
  integrations: integrationsRouter,
  reports: reportsRouter,
  webhooks: webhooksRouter,
})

// Example: src/server/api/routers/matches.ts
export const matchesRouter = createTRPCRouter({
  getMatches: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Return matches with privacy controls
    }),
    
  reviewMatch: protectedProcedure
    .input(z.object({ 
      matchId: z.string(), 
      status: z.enum(['confirmed', 'rejected', 'needs_review']) 
    }))
    .mutation(async ({ ctx, input }) => {
      // Update match status with audit log
    }),
})
```

### Security Middleware

```typescript
// Authentication middleware
const enforceUserIsAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { session: ctx.session } })
})

// Authorization middleware
const enforceCompanyAccess = t.middleware(({ ctx, input, next }) => {
  // Verify user has access to company data
  const { companyId } = input as { companyId: string }
  if (!hasCompanyAccess(ctx.session.user, companyId)) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next()
})
```

## Security Architecture

### 1. Authentication & Authorization

- **NextAuth.js** integration with multiple providers
- **JWT tokens** with short expiration times
- **Role-based access control** (RBAC)
- **Company-level data isolation**

### 2. Data Protection

- **Encryption at rest**: AES-256 for all PII
- **Encryption in transit**: TLS 1.3 for all communications
- **Hashed identifiers**: SHA-256 for matching operations
- **Field-level encryption**: Granular data protection

### 3. Privacy Controls

- **Consent management**: Granular employee permissions
- **Data minimization**: Only collect necessary data
- **Retention policies**: Automatic data purging
- **Audit logging**: Complete activity tracking

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│               (CDN + Edge Functions)                         │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Application                        │
│              (Serverless Functions)                         │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                         │
│              (Neon with encryption)                         │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

```typescript
// src/env.js
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string(),
    ENCRYPTION_KEY: z.string().length(32),
    JUSTWORKS_CLIENT_ID: z.string(),
    JUSTWORKS_CLIENT_SECRET: z.string(),
    BAMBOO_API_KEY: z.string(),
    WORKDAY_CLIENT_ID: z.string(),
    WORKDAY_CLIENT_SECRET: z.string(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    // ... other environment variables
  },
})
```

## Performance Considerations

### 1. Database Optimization

- **Indexing strategy**: Optimize for common query patterns
- **Connection pooling**: Efficient database connections
- **Query optimization**: Minimize N+1 queries
- **Caching layer**: Redis for frequently accessed data

### 2. Matching Engine Performance

- **Batch processing**: Process multiple matches simultaneously
- **Async operations**: Non-blocking matching algorithms
- **Incremental matching**: Only process new/updated records
- **Configurable thresholds**: Adjust matching sensitivity

### 3. Scalability Design

- **Horizontal scaling**: Stateless application design
- **Database sharding**: Partition by company for large datasets
- **Background jobs**: Separate matching from web requests
- **API rate limiting**: Protect against abuse

## Monitoring & Observability

### 1. Application Monitoring

- **Error tracking**: Comprehensive error logging
- **Performance metrics**: Response time monitoring
- **Usage analytics**: Feature usage tracking
- **Audit logs**: Security and compliance logging

### 2. Database Monitoring

- **Query performance**: Slow query identification
- **Connection monitoring**: Pool utilization tracking
- **Data growth**: Storage usage monitoring
- **Backup verification**: Automated backup testing

### 3. Security Monitoring

- **Authentication events**: Login/logout tracking
- **Access patterns**: Unusual access detection
- **Data access logs**: PII access monitoring
- **Integration security**: API key usage tracking

## Compliance & Governance

### 1. Data Governance

- **Data classification**: Sensitivity-based handling
- **Access controls**: Need-to-know principle
- **Data lineage**: Track data sources and transformations
- **Quality assurance**: Data validation and cleansing

### 2. Regulatory Compliance

- **GDPR compliance**: European data protection
- **CCPA compliance**: California privacy rights
- **SOC 2 Type II**: Security controls certification
- **HIPAA considerations**: Healthcare data protection

### 3. Audit & Reporting

- **Compliance reports**: Automated compliance checking
- **Audit trails**: Complete activity logging
- **Data subject requests**: Automated data export/deletion
- **Security assessments**: Regular security reviews