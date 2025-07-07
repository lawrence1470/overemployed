# JustWorks Integration Guide

## Overview

The JustWorks integration provides seamless employee data synchronization using JustWorks' official API. This integration supports real-time webhooks, automated data sync, and comprehensive employee lifecycle management.

## Prerequisites

### 1. JustWorks Account Requirements

- **JustWorks API Access**: Requires JustWorks Pro or Enterprise plan
- **Admin Permissions**: Account admin access to configure API credentials
- **Webhook Support**: Webhooks available on Enterprise plans only

### 2. Required Information

- JustWorks Company ID
- API Client ID and Secret
- Webhook endpoint URL (for real-time sync)

## Authentication Setup

### 1. OAuth 2.0 Configuration

JustWorks uses OAuth 2.0 for secure API access:

```typescript
interface JustWorksOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string[]
  
  // OAuth endpoints
  authorizationUrl: 'https://secure.justworks.com/oauth/authorize'
  tokenUrl: 'https://secure.justworks.com/oauth/token'
  apiBaseUrl: 'https://api.justworks.com/v1'
}

const requiredScopes = [
  'read:employees',
  'read:company',
  'read:employment_history',
  'webhook:employee_events'
]
```

### 2. Authorization Flow

```typescript
// Step 1: Redirect user to JustWorks authorization
const authUrl = `https://secure.justworks.com/oauth/authorize?` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `response_type=code&` +
  `scope=${requiredScopes.join(' ')}&` +
  `state=${generateStateToken()}`

// Step 2: Exchange authorization code for tokens
async function exchangeCodeForTokens(code: string): Promise<JustWorksTokens> {
  const response = await fetch('https://secure.justworks.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  })
  
  const tokens = await response.json()
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    scope: tokens.scope,
    tokenType: tokens.token_type
  }
}
```

### 3. Token Refresh

```typescript
async function refreshAccessToken(refreshToken: string): Promise<JustWorksTokens> {
  const response = await fetch('https://secure.justworks.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }
  
  return await response.json()
}
```

## API Integration

### 1. Employee Data Fetching

```typescript
class JustWorksClient {
  private accessToken: string
  private baseUrl = 'https://api.justworks.com/v1'
  
  constructor(accessToken: string) {
    this.accessToken = accessToken
  }
  
  async getEmployees(options: GetEmployeesOptions = {}): Promise<JustWorksEmployee[]> {
    const params = new URLSearchParams({
      page: options.page?.toString() || '1',
      per_page: options.perPage?.toString() || '100'
    })
    
    if (options.status) {
      params.append('status', options.status)
    }
    
    if (options.updatedSince) {
      params.append('updated_since', options.updatedSince.toISOString())
    }
    
    const response = await this.authenticatedRequest(`/employees?${params}`)
    return response.employees
  }
  
  async getEmployee(employeeId: string): Promise<JustWorksEmployee> {
    const response = await this.authenticatedRequest(`/employees/${employeeId}`)
    return response.employee
  }
  
  private async authenticatedRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED - Token may be expired')
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`JustWorks API Error: ${error.message}`)
    }
    
    return await response.json()
  }
}
```

### 2. Employee Data Mapping

```typescript
interface JustWorksEmployee {
  id: string
  first_name: string
  last_name: string
  email: string
  personal_email?: string
  phone?: string
  ssn?: string
  date_of_birth?: string
  hire_date: string
  termination_date?: string
  status: 'active' | 'inactive' | 'terminated'
  
  // Job information
  job_title?: string
  department?: string
  employment_type: 'full_time' | 'part_time' | 'contractor'
  work_location?: string
  manager_id?: string
  
  // Address information
  address?: {
    street: string
    city: string
    state: string
    zip_code: string
    country: string
  }
  
  // Metadata
  created_at: string
  updated_at: string
  company_id: string
}

function mapJustWorksEmployee(jwEmployee: JustWorksEmployee): Employee {
  return {
    id: generateId(),
    companyId: jwEmployee.company_id,
    firstName: jwEmployee.first_name,
    lastName: jwEmployee.last_name,
    email: jwEmployee.email,
    personalEmail: jwEmployee.personal_email,
    phone: jwEmployee.phone,
    ssn: jwEmployee.ssn,
    dateOfBirth: jwEmployee.date_of_birth ? new Date(jwEmployee.date_of_birth) : undefined,
    startDate: new Date(jwEmployee.hire_date),
    endDate: jwEmployee.termination_date ? new Date(jwEmployee.termination_date) : undefined,
    status: mapEmployeeStatus(jwEmployee.status),
    jobTitle: jwEmployee.job_title,
    department: jwEmployee.department,
    employeeType: mapEmployeeType(jwEmployee.employment_type),
    workLocation: jwEmployee.work_location,
    managerId: jwEmployee.manager_id,
    address: jwEmployee.address ? {
      street: jwEmployee.address.street,
      city: jwEmployee.address.city,
      state: jwEmployee.address.state,
      zipCode: jwEmployee.address.zip_code,
      country: jwEmployee.address.country
    } : undefined,
    integrationId: 'justworks',
    externalId: jwEmployee.id,
    lastSyncAt: new Date(),
    dataSource: IntegrationProvider.JUSTWORKS,
    createdAt: new Date(jwEmployee.created_at),
    updatedAt: new Date(jwEmployee.updated_at)
  }
}

function mapEmployeeStatus(jwStatus: string): EmployeeStatus {
  switch (jwStatus) {
    case 'active': return EmployeeStatus.ACTIVE
    case 'inactive': return EmployeeStatus.INACTIVE
    case 'terminated': return EmployeeStatus.TERMINATED
    default: return EmployeeStatus.INACTIVE
  }
}

function mapEmployeeType(jwType: string): EmployeeType {
  switch (jwType) {
    case 'full_time': return EmployeeType.FULL_TIME
    case 'part_time': return EmployeeType.PART_TIME
    case 'contractor': return EmployeeType.CONTRACT
    default: return EmployeeType.FULL_TIME
  }
}
```

## Webhook Integration

### 1. Webhook Configuration

```typescript
async function setupJustWorksWebhooks(
  client: JustWorksClient,
  webhookUrl: string
): Promise<void> {
  const webhookConfig = {
    url: webhookUrl,
    events: [
      'employee.created',
      'employee.updated', 
      'employee.terminated',
      'employee.rehired'
    ],
    secret: generateWebhookSecret()
  }
  
  const webhook = await client.createWebhook(webhookConfig)
  
  // Store webhook config for verification
  await storeWebhookConfig({
    provider: 'justworks',
    webhookId: webhook.id,
    secret: webhookConfig.secret,
    events: webhookConfig.events
  })
}
```

### 2. Webhook Event Handling

```typescript
interface JustWorksWebhookPayload {
  event: string
  data: {
    employee: JustWorksEmployee
  }
  timestamp: string
  webhook_id: string
}

async function handleJustWorksWebhook(
  payload: JustWorksWebhookPayload,
  signature: string
): Promise<WebhookResult> {
  // Verify webhook signature
  const isValid = verifyJustWorksSignature(payload, signature)
  if (!isValid) {
    throw new Error('Invalid webhook signature')
  }
  
  const { event, data, timestamp } = payload
  
  switch (event) {
    case 'employee.created':
      return await handleEmployeeCreated(data.employee)
    case 'employee.updated':
      return await handleEmployeeUpdated(data.employee)
    case 'employee.terminated':
      return await handleEmployeeTerminated(data.employee)
    case 'employee.rehired':
      return await handleEmployeeRehired(data.employee)
    default:
      console.warn(`Unhandled JustWorks webhook event: ${event}`)
      return { success: true, message: 'Event ignored' }
  }
}

async function handleEmployeeCreated(jwEmployee: JustWorksEmployee): Promise<WebhookResult> {
  try {
    // Map JustWorks data to internal format
    const employee = mapJustWorksEmployee(jwEmployee)
    
    // Store employee in database
    await db.employee.create({ data: employee })
    
    // Trigger matching process for new employee
    await triggerEmployeeMatching(employee.id)
    
    // Log the event
    await auditLogger.log({
      action: 'employee_created_via_webhook',
      resourceId: employee.id,
      source: 'justworks',
      details: { externalId: jwEmployee.id }
    })
    
    return { 
      success: true, 
      message: 'Employee created successfully',
      employeeId: employee.id
    }
  } catch (error) {
    console.error('Error handling employee creation:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}

async function handleEmployeeUpdated(jwEmployee: JustWorksEmployee): Promise<WebhookResult> {
  try {
    // Find existing employee by external ID
    const existingEmployee = await db.employee.findFirst({
      where: { 
        externalId: jwEmployee.id,
        dataSource: IntegrationProvider.JUSTWORKS
      }
    })
    
    if (!existingEmployee) {
      // Employee doesn't exist, create it
      return await handleEmployeeCreated(jwEmployee)
    }
    
    // Map updated data
    const updatedEmployee = mapJustWorksEmployee(jwEmployee)
    
    // Update employee in database
    await db.employee.update({
      where: { id: existingEmployee.id },
      data: {
        ...updatedEmployee,
        id: existingEmployee.id, // Preserve internal ID
        lastSyncAt: new Date()
      }
    })
    
    // Check if update triggers new matching
    const significantFields = ['firstName', 'lastName', 'email', 'phone', 'ssn']
    const hasSignificantChanges = significantFields.some(field => 
      existingEmployee[field] !== updatedEmployee[field]
    )
    
    if (hasSignificantChanges) {
      await triggerEmployeeMatching(existingEmployee.id)
    }
    
    return { 
      success: true, 
      message: 'Employee updated successfully',
      employeeId: existingEmployee.id,
      triggeredMatching: hasSignificantChanges
    }
  } catch (error) {
    console.error('Error handling employee update:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}

function verifyJustWorksSignature(
  payload: JustWorksWebhookPayload, 
  signature: string
): boolean {
  const webhookSecret = getWebhookSecret('justworks')
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

## Sync Strategies

### 1. Full Sync

Performs complete data synchronization:

```typescript
async function performFullSync(
  client: JustWorksClient,
  companyId: string
): Promise<SyncResult> {
  const syncJob = await createSyncJob({
    provider: 'justworks',
    companyId,
    type: 'full_sync',
    startedAt: new Date()
  })
  
  try {
    let page = 1
    let totalProcessed = 0
    let totalAdded = 0
    let totalUpdated = 0
    const errors: SyncError[] = []
    
    while (true) {
      // Fetch employees page by page
      const employees = await client.getEmployees({
        page,
        perPage: 100,
        status: 'all' // Include all statuses for full sync
      })
      
      if (employees.length === 0) {
        break // No more employees
      }
      
      // Process each employee
      for (const jwEmployee of employees) {
        try {
          const result = await processEmployee(jwEmployee, companyId)
          totalProcessed++
          
          if (result.action === 'created') {
            totalAdded++
          } else if (result.action === 'updated') {
            totalUpdated++
          }
        } catch (error) {
          errors.push({
            employeeId: jwEmployee.id,
            error: error.message,
            data: jwEmployee
          })
        }
      }
      
      page++
    }
    
    // Update sync job
    await updateSyncJob(syncJob.id, {
      status: 'completed',
      completedAt: new Date(),
      employeesProcessed: totalProcessed,
      employeesAdded: totalAdded,
      employeesUpdated: totalUpdated,
      errors
    })
    
    return {
      success: true,
      totalProcessed,
      totalAdded,
      totalUpdated,
      errorCount: errors.length,
      errors: errors.slice(0, 10) // Return first 10 errors
    }
    
  } catch (error) {
    await updateSyncJob(syncJob.id, {
      status: 'failed',
      completedAt: new Date(),
      error: error.message
    })
    
    throw error
  }
}
```

### 2. Incremental Sync

Syncs only changed data since last sync:

```typescript
async function performIncrementalSync(
  client: JustWorksClient,
  companyId: string
): Promise<SyncResult> {
  const lastSync = await getLastSuccessfulSync(companyId, 'justworks')
  const updatedSince = lastSync?.completedAt || new Date(Date.now() - 24 * 60 * 60 * 1000) // Default to 24 hours ago
  
  const syncJob = await createSyncJob({
    provider: 'justworks',
    companyId,
    type: 'incremental_sync',
    startedAt: new Date(),
    updatedSince
  })
  
  try {
    // Fetch only employees updated since last sync
    const employees = await client.getEmployees({
      updatedSince,
      status: 'all'
    })
    
    let totalProcessed = 0
    let totalAdded = 0
    let totalUpdated = 0
    const errors: SyncError[] = []
    
    for (const jwEmployee of employees) {
      try {
        const result = await processEmployee(jwEmployee, companyId)
        totalProcessed++
        
        if (result.action === 'created') {
          totalAdded++
        } else if (result.action === 'updated') {
          totalUpdated++
        }
      } catch (error) {
        errors.push({
          employeeId: jwEmployee.id,
          error: error.message,
          data: jwEmployee
        })
      }
    }
    
    await updateSyncJob(syncJob.id, {
      status: 'completed',
      completedAt: new Date(),
      employeesProcessed: totalProcessed,
      employeesAdded: totalAdded,
      employeesUpdated: totalUpdated,
      errors
    })
    
    return {
      success: true,
      totalProcessed,
      totalAdded,
      totalUpdated,
      errorCount: errors.length,
      errors: errors.slice(0, 10)
    }
    
  } catch (error) {
    await updateSyncJob(syncJob.id, {
      status: 'failed',
      completedAt: new Date(),
      error: error.message
    })
    
    throw error
  }
}

async function processEmployee(
  jwEmployee: JustWorksEmployee,
  companyId: string
): Promise<{ action: 'created' | 'updated' | 'skipped' }> {
  // Check if employee already exists
  const existingEmployee = await db.employee.findFirst({
    where: {
      externalId: jwEmployee.id,
      dataSource: IntegrationProvider.JUSTWORKS,
      companyId
    }
  })
  
  const mappedEmployee = mapJustWorksEmployee(jwEmployee)
  mappedEmployee.companyId = companyId
  
  if (existingEmployee) {
    // Update existing employee
    await db.employee.update({
      where: { id: existingEmployee.id },
      data: {
        ...mappedEmployee,
        id: existingEmployee.id, // Preserve internal ID
        lastSyncAt: new Date()
      }
    })
    
    return { action: 'updated' }
  } else {
    // Create new employee
    await db.employee.create({ data: mappedEmployee })
    
    // Trigger matching for new employee
    await triggerEmployeeMatching(mappedEmployee.id)
    
    return { action: 'created' }
  }
}
```

## Error Handling

### 1. Rate Limiting

```typescript
class JustWorksRateLimiter {
  private requestCount = 0
  private windowStart = Date.now()
  private readonly limit = 100 // requests per minute
  private readonly window = 60 * 1000 // 1 minute
  
  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    
    // Reset window if needed
    if (now - this.windowStart >= this.window) {
      this.requestCount = 0
      this.windowStart = now
    }
    
    // Check if we've hit the limit
    if (this.requestCount >= this.limit) {
      const waitTime = this.window - (now - this.windowStart)
      console.log(`Rate limit reached, waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      // Reset after waiting
      this.requestCount = 0
      this.windowStart = Date.now()
    }
    
    this.requestCount++
  }
}
```

### 2. Connection Retry Logic

```typescript
async function justWorksRequestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      // Don't retry on certain error types
      if (error.status === 401 || error.status === 403) {
        throw error
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}
```

### 3. Data Validation

```typescript
function validateJustWorksEmployee(employee: JustWorksEmployee): ValidationResult {
  const errors: string[] = []
  
  if (!employee.id) {
    errors.push('Employee ID is required')
  }
  
  if (!employee.first_name) {
    errors.push('First name is required')
  }
  
  if (!employee.last_name) {
    errors.push('Last name is required')
  }
  
  if (!employee.hire_date) {
    errors.push('Hire date is required')
  } else {
    const hireDate = new Date(employee.hire_date)
    if (isNaN(hireDate.getTime())) {
      errors.push('Invalid hire date format')
    }
  }
  
  if (employee.email && !isValidEmail(employee.email)) {
    errors.push('Invalid email format')
  }
  
  if (employee.termination_date) {
    const termDate = new Date(employee.termination_date)
    const hireDate = new Date(employee.hire_date)
    
    if (termDate < hireDate) {
      errors.push('Termination date cannot be before hire date')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

## Testing Integration

### 1. Test Data Setup

```typescript
const testJustWorksEmployee: JustWorksEmployee = {
  id: 'jw_test_123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@company.com',
  phone: '+1-555-0123',
  hire_date: '2023-01-15',
  status: 'active',
  job_title: 'Software Engineer',
  department: 'Engineering',
  employment_type: 'full_time',
  work_location: 'San Francisco, CA',
  company_id: 'jw_company_456',
  created_at: '2023-01-15T09:00:00Z',
  updated_at: '2023-01-15T09:00:00Z'
}
```

### 2. Integration Tests

```typescript
describe('JustWorks Integration', () => {
  let mockClient: jest.Mocked<JustWorksClient>
  
  beforeEach(() => {
    mockClient = createMockJustWorksClient()
  })
  
  test('should fetch and map employees correctly', async () => {
    mockClient.getEmployees.mockResolvedValue([testJustWorksEmployee])
    
    const employees = await mockClient.getEmployees()
    const mappedEmployee = mapJustWorksEmployee(employees[0])
    
    expect(mappedEmployee.firstName).toBe('John')
    expect(mappedEmployee.lastName).toBe('Doe')
    expect(mappedEmployee.email).toBe('john.doe@company.com')
    expect(mappedEmployee.dataSource).toBe(IntegrationProvider.JUSTWORKS)
  })
  
  test('should handle webhook events correctly', async () => {
    const webhookPayload: JustWorksWebhookPayload = {
      event: 'employee.created',
      data: { employee: testJustWorksEmployee },
      timestamp: new Date().toISOString(),
      webhook_id: 'webhook_123'
    }
    
    const result = await handleJustWorksWebhook(webhookPayload, 'valid_signature')
    
    expect(result.success).toBe(true)
    expect(result.employeeId).toBeDefined()
  })
  
  test('should handle rate limiting', async () => {
    const rateLimiter = new JustWorksRateLimiter()
    
    // Simulate hitting rate limit
    for (let i = 0; i < 100; i++) {
      await rateLimiter.waitIfNeeded()
    }
    
    const startTime = Date.now()
    await rateLimiter.waitIfNeeded() // This should wait
    const endTime = Date.now()
    
    expect(endTime - startTime).toBeGreaterThan(0)
  })
})
```

## Configuration Reference

### 1. Environment Variables

```bash
# JustWorks OAuth Configuration
JUSTWORKS_CLIENT_ID=your_client_id
JUSTWORKS_CLIENT_SECRET=your_client_secret
JUSTWORKS_REDIRECT_URI=https://your-app.com/auth/justworks/callback

# Webhook Configuration
JUSTWORKS_WEBHOOK_SECRET=your_webhook_secret
JUSTWORKS_WEBHOOK_URL=https://your-app.com/webhooks/justworks

# API Configuration
JUSTWORKS_API_TIMEOUT=30000
JUSTWORKS_RATE_LIMIT=100
JUSTWORKS_RETRY_ATTEMPTS=3
```

### 2. Integration Settings

```typescript
const justWorksConfig: IntegrationConfig = {
  provider: 'justworks',
  settings: {
    syncEmployees: true,
    syncEmploymentHistory: true,
    syncPersonalInfo: true,
    enableWebhooks: true,
    includeTerminated: false,
    includeContractors: true,
    
    // Sync frequency
    syncFrequency: 'daily',
    fullSyncSchedule: 'weekly',
    
    // Field mapping overrides
    fieldMapping: {
      'work_email': 'email',
      'personal_email': 'personalEmail',
      'employee_id': 'externalId'
    },
    
    // Filters
    departmentFilters: [], // Empty = all departments
    locationFilters: [], // Empty = all locations
    
    // Data privacy
    maskPii: true,
    encryptSensitiveData: true
  }
}
```

This JustWorks integration provides comprehensive employee data synchronization with robust error handling, real-time webhook support, and privacy-compliant data processing.