# Employee Matching Engine Specification

## Overview

The Employee Matching Engine is the core component that identifies potential employment conflicts by comparing employee records across different companies while maintaining privacy and security standards.

## Matching Algorithm Architecture

### 1. Multi-Factor Identity Verification

#### Primary Identifiers
- **SSN (Social Security Number)**: Highest confidence match
- **Email Address**: High confidence for unique domains
- **Phone Number**: Medium-high confidence
- **Full Name + Date of Birth**: Medium confidence

#### Secondary Identifiers
- **Address History**: Medium confidence
- **Emergency Contact Information**: Low-medium confidence
- **Previous Employment History**: Low confidence

### 2. Matching Process Flow

```typescript
interface MatchingProcess {
  1. DataIngestion: {
    source: 'hr_integration' | 'manual_upload' | 'api_import'
    preprocessing: 'normalize' | 'validate' | 'encrypt'
  }
  
  2. IdentifierExtraction: {
    primary: PrimaryIdentifier[]
    secondary: SecondaryIdentifier[]
    hashing: 'sha256' | 'bcrypt'
  }
  
  3. CrossCompanyMatching: {
    algorithm: 'exact' | 'fuzzy' | 'ml_enhanced'
    threshold: number // 0.0 to 1.0
    excludeOwnCompany: boolean
  }
  
  4. ConfidenceScoring: {
    weights: IdentifierWeights
    temporalAnalysis: boolean
    contextualFactors: boolean
  }
  
  5. ResultProcessing: {
    minimumConfidence: number
    maxResults: number
    deduplication: boolean
  }
}
```

### 3. Fuzzy Matching Implementation

#### String Matching Algorithms
```typescript
// Levenshtein Distance for name variations
function levenshteinDistance(a: string, b: string): number {
  const matrix = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

// Jaro-Winkler for name similarity
function jaroWinkler(s1: string, s2: string): number {
  // Implementation for handling common name variations
}

// Soundex for phonetic matching
function soundex(name: string): string {
  // Implementation for phonetic name matching
}
```

#### Name Normalization
```typescript
interface NameNormalization {
  preprocessing: {
    removeSpecialChars: boolean
    standardizeSpacing: boolean
    handlePrefixSuffix: boolean // Jr., Sr., III, etc.
  }
  
  variations: {
    nicknames: Map<string, string[]> // Robert -> Bob, Rob, Bobby
    culturalVariations: Map<string, string[]> // José -> Jose
    commonMisspellings: Map<string, string[]>
  }
  
  phoneticMatching: {
    soundex: boolean
    metaphone: boolean
    doubleMetaphone: boolean
  }
}
```

### 4. Confidence Scoring System

#### Scoring Weights
```typescript
interface ConfidenceWeights {
  identifierWeights: {
    ssn: 0.45         // 45% weight
    email: 0.25       // 25% weight
    phone: 0.15       // 15% weight
    fullName: 0.10    // 10% weight
    address: 0.05     // 5% weight
  }
  
  temporalFactors: {
    employmentOverlap: 0.8    // High penalty for overlapping employment
    proximityBonus: 0.2       // Bonus for employment at similar times
    recentActivity: 0.1       // Bonus for recent activity
  }
  
  contextualFactors: {
    industryMatch: 0.1        // Same industry bonus
    geographicProximity: 0.05 // Same location bonus
    rolesSimilarity: 0.05     // Similar job titles bonus
  }
}
```

#### Confidence Calculation
```typescript
interface ConfidenceScore {
  calculate(match: EmployeeMatch): number {
    const baseScore = this.calculateBaseScore(match.identifiers)
    const temporalScore = this.calculateTemporalScore(match.employmentHistory)
    const contextualScore = this.calculateContextualScore(match.context)
    
    return Math.min(1.0, baseScore + temporalScore + contextualScore)
  }
  
  private calculateBaseScore(identifiers: MatchedIdentifiers): number {
    let score = 0
    
    if (identifiers.ssn?.isExact) score += this.weights.ssn
    if (identifiers.email?.isExact) score += this.weights.email
    if (identifiers.phone?.isExact) score += this.weights.phone
    if (identifiers.name?.similarity >= 0.9) {
      score += this.weights.fullName * identifiers.name.similarity
    }
    
    return score
  }
}
```

### 5. Temporal Analysis

#### Employment Overlap Detection
```typescript
interface TemporalAnalysis {
  checkEmploymentOverlap(
    employee1: EmploymentRecord,
    employee2: EmploymentRecord
  ): OverlapResult {
    const overlap = this.calculateOverlap(
      employee1.startDate,
      employee1.endDate,
      employee2.startDate,
      employee2.endDate
    )
    
    return {
      hasOverlap: overlap.days > 0,
      overlapDays: overlap.days,
      overlapPercentage: overlap.percentage,
      riskLevel: this.assessRiskLevel(overlap),
      gracePeriod: this.applyGracePeriod(overlap)
    }
  }
  
  private calculateOverlap(
    start1: Date, end1: Date | null,
    start2: Date, end2: Date | null
  ): OverlapCalculation {
    // Handle ongoing employment (null end dates)
    const effectiveEnd1 = end1 || new Date()
    const effectiveEnd2 = end2 || new Date()
    
    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()))
    const overlapEnd = new Date(Math.min(effectiveEnd1.getTime(), effectiveEnd2.getTime()))
    
    if (overlapStart > overlapEnd) {
      return { days: 0, percentage: 0 }
    }
    
    const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))
    const totalDays1 = Math.ceil((effectiveEnd1.getTime() - start1.getTime()) / (1000 * 60 * 60 * 24))
    const totalDays2 = Math.ceil((effectiveEnd2.getTime() - start2.getTime()) / (1000 * 60 * 60 * 24))
    
    const overlapPercentage = overlapDays / Math.min(totalDays1, totalDays2)
    
    return { days: overlapDays, percentage: overlapPercentage }
  }
}
```

#### Grace Period Handling
```typescript
interface GracePeriodConfig {
  standardGracePeriod: number // 30 days
  contractorGracePeriod: number // 7 days
  executiveGracePeriod: number // 90 days
  
  applyGracePeriod(overlap: OverlapCalculation, employeeType: EmployeeType): OverlapResult {
    const gracePeriod = this.getGracePeriod(employeeType)
    
    if (overlap.days <= gracePeriod) {
      return {
        ...overlap,
        adjustedDays: 0,
        withinGracePeriod: true,
        riskLevel: 'low'
      }
    }
    
    return {
      ...overlap,
      adjustedDays: overlap.days - gracePeriod,
      withinGracePeriod: false,
      riskLevel: this.assessRiskLevel(overlap.days - gracePeriod)
    }
  }
}
```

## Privacy-Preserving Matching

### 1. Hashed Identifier System

```typescript
interface HashedIdentifierSystem {
  createHashedIdentifier(rawValue: string, salt: string): string {
    // Use SHA-256 with company-specific salt
    return crypto.createHash('sha256')
      .update(rawValue + salt)
      .digest('hex')
  }
  
  // For cross-company matching, use a global salt
  createGlobalHash(rawValue: string): string {
    return crypto.createHash('sha256')
      .update(rawValue + process.env.GLOBAL_SALT)
      .digest('hex')
  }
}
```

### 2. Differential Privacy

```typescript
interface DifferentialPrivacy {
  addNoise(trueCount: number, epsilon: number): number {
    // Add Laplace noise for differential privacy
    const sensitivity = 1
    const scale = sensitivity / epsilon
    const noise = this.sampleLaplace(0, scale)
    
    return Math.max(0, Math.round(trueCount + noise))
  }
  
  private sampleLaplace(mean: number, scale: number): number {
    const u = Math.random() - 0.5
    return mean - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
  }
}
```

### 3. Secure Multi-Party Computation (Future Enhancement)

```typescript
interface SecureMultiPartyComputation {
  // Future implementation for completely private matching
  // where companies don't share raw data
  
  createSecretShares(identifier: string): SecretShare[] {
    // Split identifier into secret shares
  }
  
  computeMatchWithoutRevealing(
    shares1: SecretShare[],
    shares2: SecretShare[]
  ): boolean {
    // Compute match without revealing actual values
  }
}
```

## Machine Learning Enhancements

### 1. Match Classification Model

```typescript
interface MatchClassificationModel {
  features: {
    identifierSimilarities: number[]
    temporalFeatures: number[]
    contextualFeatures: number[]
    historicalMatchData: number[]
  }
  
  predict(features: MatchFeatures): MatchPrediction {
    // Use trained model to predict match probability
    return {
      probability: number,
      confidence: number,
      reasoning: string[]
    }
  }
}
```

### 2. Anomaly Detection

```typescript
interface AnomalyDetection {
  detectUnusualPatterns(employeeData: EmployeeRecord[]): Anomaly[] {
    // Detect patterns that might indicate fraudulent data
    return [
      this.detectDuplicateSSNs(),
      this.detectImpossibleEmploymentHistory(),
      this.detectUnusualNameVariations(),
      this.detectSuspiciousAddressPatterns()
    ]
  }
}
```

## Performance Optimization

### 1. Indexing Strategy

```sql
-- Database indexes for efficient matching
CREATE INDEX idx_employee_ssn_hash ON employees(ssn_hash) WHERE ssn_hash IS NOT NULL;
CREATE INDEX idx_employee_email_hash ON employees(email_hash) WHERE email_hash IS NOT NULL;
CREATE INDEX idx_employee_phone_hash ON employees(phone_hash) WHERE phone_hash IS NOT NULL;
CREATE INDEX idx_employee_name_soundex ON employees(name_soundex);
CREATE INDEX idx_employee_employment_dates ON employees(start_date, end_date);

-- Composite indexes for common queries
CREATE INDEX idx_employee_company_status ON employees(company_id, status);
CREATE INDEX idx_match_confidence_status ON matches(confidence_score, status);
```

### 2. Batch Processing

```typescript
interface BatchProcessor {
  processBatch(employees: EmployeeRecord[], batchSize: number = 1000): Promise<MatchResult[]> {
    const batches = this.chunkArray(employees, batchSize)
    const results = []
    
    for (const batch of batches) {
      const batchResults = await this.processEmployeeBatch(batch)
      results.push(...batchResults)
      
      // Prevent overwhelming the database
      await this.sleep(100)
    }
    
    return results
  }
}
```

### 3. Caching Strategy

```typescript
interface MatchingCache {
  // Cache frequently accessed hashes
  hashCache: Map<string, string>
  
  // Cache match results for recently processed employees
  matchCache: Map<string, MatchResult[]>
  
  // Cache similarity calculations
  similarityCache: Map<string, number>
  
  getCachedMatch(employee1Id: string, employee2Id: string): MatchResult | null {
    const cacheKey = this.generateCacheKey(employee1Id, employee2Id)
    return this.matchCache.get(cacheKey) || null
  }
}
```

## Quality Assurance

### 1. Match Validation

```typescript
interface MatchValidator {
  validateMatch(match: MatchResult): ValidationResult {
    const validations = [
      this.validateIdentifierConsistency(match),
      this.validateConfidenceScore(match),
      this.validateTemporalLogic(match),
      this.validateBusinessRules(match)
    ]
    
    return {
      isValid: validations.every(v => v.isValid),
      errors: validations.flatMap(v => v.errors),
      warnings: validations.flatMap(v => v.warnings)
    }
  }
}
```

### 2. False Positive Detection

```typescript
interface FalsePositiveDetection {
  detectFalsePositives(matches: MatchResult[]): FalsePositiveAnalysis {
    return {
      suspiciousMatches: matches.filter(m => this.isSuspicious(m)),
      commonPatterns: this.identifyCommonPatterns(matches),
      recommendations: this.generateRecommendations(matches)
    }
  }
  
  private isSuspicious(match: MatchResult): boolean {
    // High confidence but low temporal overlap
    if (match.confidence > 0.8 && match.temporalOverlap < 0.1) return true
    
    // Multiple exact matches for same identifier
    if (match.exactMatches > 3) return true
    
    // Unusual name similarity patterns
    if (match.nameSimilarity > 0.95 && match.otherSimilarities < 0.3) return true
    
    return false
  }
}
```

## API Integration

### 1. tRPC Endpoints

```typescript
// src/server/api/routers/matching.ts
export const matchingRouter = createTRPCRouter({
  runMatching: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      employeeIds: z.array(z.string()).optional(),
      confidenceThreshold: z.number().min(0).max(1).default(0.7),
      includeTemporalAnalysis: z.boolean().default(true)
    }))
    .mutation(async ({ ctx, input }) => {
      const matchingService = new EmployeeMatchingService(ctx.db)
      return await matchingService.runMatching(input)
    }),
    
  getMatchResults: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      status: z.enum(['pending', 'reviewed', 'confirmed', 'rejected']).optional(),
      confidenceThreshold: z.number().min(0).max(1).optional(),
      limit: z.number().max(100).default(20),
      offset: z.number().default(0)
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.match.findMany({
        where: {
          OR: [
            { employee1: { companyId: input.companyId } },
            { employee2: { companyId: input.companyId } }
          ],
          status: input.status,
          confidenceScore: { gte: input.confidenceThreshold }
        },
        include: {
          employee1: { select: { firstName: true, lastName: true, companyId: true } },
          employee2: { select: { firstName: true, lastName: true, companyId: true } }
        },
        take: input.limit,
        skip: input.offset,
        orderBy: { confidenceScore: 'desc' }
      })
    }),
    
  reviewMatch: protectedProcedure
    .input(z.object({
      matchId: z.string(),
      status: z.enum(['confirmed', 'rejected']),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.match.update({
        where: { id: input.matchId },
        data: {
          status: input.status,
          reviewedAt: new Date(),
          reviewedBy: ctx.session.user.id,
          reviewNotes: input.notes
        }
      })
      
      // Log the review action
      await ctx.db.auditLog.create({
        data: {
          action: 'match_reviewed',
          userId: ctx.session.user.id,
          resourceId: input.matchId,
          details: { status: input.status, notes: input.notes }
        }
      })
    })
})
```

### 2. Webhook Integration

```typescript
// src/app/api/webhooks/matching/route.ts
export async function POST(req: Request) {
  const payload = await req.json()
  
  // Verify webhook signature
  const signature = req.headers.get('x-signature')
  if (!verifyWebhookSignature(payload, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Process matching request
  const matchingService = new EmployeeMatchingService(db)
  const results = await matchingService.runMatching(payload)
  
  // Send results back via webhook
  await sendMatchingResults(payload.callbackUrl, results)
  
  return Response.json({ success: true, matchCount: results.length })
}
```

## Configuration Management

### 1. Matching Configuration

```typescript
interface MatchingConfig {
  algorithms: {
    primary: 'exact' | 'fuzzy' | 'ml_enhanced'
    fallback: 'exact' | 'fuzzy'
  }
  
  thresholds: {
    minimum: number      // 0.5
    autoConfirm: number  // 0.95
    autoReject: number   // 0.3
  }
  
  identifierWeights: IdentifierWeights
  temporalSettings: TemporalSettings
  privacySettings: PrivacySettings
}
```

### 2. Company-Specific Settings

```typescript
interface CompanyMatchingSettings {
  companyId: string
  
  enabledIdentifiers: {
    ssn: boolean
    email: boolean
    phone: boolean
    name: boolean
    address: boolean
  }
  
  confidenceThreshold: number
  gracePeriodDays: number
  
  customWeights?: Partial<IdentifierWeights>
  excludeCompanies?: string[]
  
  notificationSettings: {
    emailAlerts: boolean
    webhookUrl?: string
    slackChannel?: string
  }
}
```