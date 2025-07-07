# HR System Integrations Specification

## Overview

The HR Integrations system provides secure, standardized connectivity to major HR platforms, enabling automated employee data synchronization while maintaining strict privacy and security controls.

## Integration Architecture

### 1. Base Integration Interface

```typescript
abstract class BaseIntegration {
  abstract readonly provider: IntegrationProvider
  abstract readonly requiredScopes: string[]
  abstract readonly rateLimit: RateLimitConfig
  
  // Authentication
  abstract authenticate(credentials: IntegrationCredentials): Promise<AuthResult>
  abstract refreshAuth(refreshToken: string): Promise<AuthResult>
  abstract validateAuth(): Promise<boolean>
  
  // Employee Data
  abstract fetchEmployees(options?: FetchOptions): Promise<Employee[]>
  abstract fetchEmployee(id: string): Promise<Employee | null>
  abstract syncEmployeeData(lastSync?: Date): Promise<SyncResult>
  
  // Webhooks
  abstract setupWebhooks(endpoints: WebhookEndpoint[]): Promise<void>
  abstract handleWebhook(payload: unknown): Promise<WebhookResult>
  abstract validateWebhook(payload: unknown, signature: string): boolean
  
  // Utilities
  abstract mapEmployeeData(rawData: unknown): Employee
  abstract handleError(error: unknown): IntegrationError
}
```

### 2. Integration Provider Types

```typescript
enum IntegrationProvider {
  JUSTWORKS = 'justworks',
  BAMBOO_HR = 'bamboo_hr',
  WORKDAY = 'workday',
  ADP = 'adp',
  CUSTOM = 'custom'
}

interface IntegrationCredentials {
  provider: IntegrationProvider
  clientId: string
  clientSecret: string
  redirectUri?: string
  apiKey?: string
  refreshToken?: string
  accessToken?: string
  expiresAt?: Date
}
```

### 3. Standardized Employee Data Model

```typescript
interface Employee {
  // Required fields
  id: string
  companyId: string
  firstName: string
  lastName: string
  startDate: Date
  status: EmployeeStatus
  
  // Optional PII (encrypted)
  email?: string
  phone?: string
  ssn?: string
  address?: Address
  
  // Employment details
  endDate?: Date
  jobTitle?: string
  department?: string
  employeeType?: EmployeeType
  workLocation?: string
  
  // Integration metadata
  integrationId: string
  externalId: string
  lastSyncAt: Date
  dataSource: IntegrationProvider
}

enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
  ON_LEAVE = 'on_leave'
}

enum EmployeeType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern'
}
```

## JustWorks Integration

### 1. Authentication Flow

```typescript
class JustWorksIntegration extends BaseIntegration {
  readonly provider = IntegrationProvider.JUSTWORKS
  readonly requiredScopes = ['read:employees', 'read:company']
  readonly rateLimit = {
    requests: 100,
    windowMs: 60000, // 1 minute
    burst: 10
  }
  
  async authenticate(credentials: IntegrationCredentials): Promise<AuthResult> {
    // JustWorks uses OAuth 2.0
    const authUrl = `https://secure.justworks.com/oauth/authorize?` +
      `client_id=${credentials.clientId}&` +
      `redirect_uri=${credentials.redirectUri}&` +
      `response_type=code&` +
      `scope=${this.requiredScopes.join(' ')}`
    
    return { authUrl, requiresUserInteraction: true }
  }
  
  async exchangeCodeForToken(code: string, credentials: IntegrationCredentials): Promise<AuthResult> {
    const response = await fetch('https://secure.justworks.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: credentials.redirectUri!
      })
    })
    
    const tokens = await response.json()
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope
    }
  }
}
```

### 2. Employee Data Fetching

```typescript
class JustWorksIntegration extends BaseIntegration {
  async fetchEmployees(options: FetchOptions = {}): Promise<Employee[]> {
    const response = await this.authenticatedRequest('/v1/employees', {
      params: {
        page: options.page || 1,
        per_page: options.limit || 100,
        status: options.status || 'active'
      }
    })
    
    return response.employees.map(emp => this.mapEmployeeData(emp))
  }
  
  mapEmployeeData(rawData: JustWorksEmployee): Employee {
    return {
      id: generateId(),
      companyId: rawData.company_id,
      firstName: rawData.first_name,
      lastName: rawData.last_name,
      email: rawData.email,
      phone: rawData.phone,
      ssn: rawData.ssn,
      startDate: new Date(rawData.start_date),
      endDate: rawData.end_date ? new Date(rawData.end_date) : undefined,
      status: this.mapEmployeeStatus(rawData.status),
      jobTitle: rawData.job_title,
      department: rawData.department,
      employeeType: this.mapEmployeeType(rawData.employment_type),
      workLocation: rawData.work_location,
      integrationId: this.id,
      externalId: rawData.id,
      lastSyncAt: new Date(),
      dataSource: IntegrationProvider.JUSTWORKS
    }
  }
  
  private mapEmployeeStatus(status: string): EmployeeStatus {
    switch (status.toLowerCase()) {
      case 'active': return EmployeeStatus.ACTIVE
      case 'inactive': return EmployeeStatus.INACTIVE
      case 'terminated': return EmployeeStatus.TERMINATED
      case 'on_leave': return EmployeeStatus.ON_LEAVE
      default: return EmployeeStatus.INACTIVE
    }
  }
}
```

### 3. Webhook Implementation

```typescript
class JustWorksIntegration extends BaseIntegration {
  async setupWebhooks(endpoints: WebhookEndpoint[]): Promise<void> {
    for (const endpoint of endpoints) {
      await this.authenticatedRequest('/v1/webhooks', {
        method: 'POST',
        body: {
          url: endpoint.url,
          events: endpoint.events,
          secret: endpoint.secret
        }
      })
    }
  }
  
  async handleWebhook(payload: JustWorksWebhookPayload): Promise<WebhookResult> {
    switch (payload.event) {
      case 'employee.created':
        return this.handleEmployeeCreated(payload.data)
      case 'employee.updated':
        return this.handleEmployeeUpdated(payload.data)
      case 'employee.terminated':
        return this.handleEmployeeTerminated(payload.data)
      default:
        return { success: false, error: 'Unknown event type' }
    }
  }
  
  private async handleEmployeeCreated(employeeData: JustWorksEmployee): Promise<WebhookResult> {
    const employee = this.mapEmployeeData(employeeData)
    
    // Store in database
    await this.db.employee.create({ data: employee })
    
    // Trigger matching process
    await this.triggerMatching(employee)
    
    return { success: true, action: 'employee_created' }
  }
}
```

## BambooHR Integration

### 1. API Key Authentication

```typescript
class BambooHRIntegration extends BaseIntegration {
  readonly provider = IntegrationProvider.BAMBOO_HR
  readonly requiredScopes = ['read']
  readonly rateLimit = {
    requests: 1000,
    windowMs: 60000,
    burst: 10
  }
  
  async authenticate(credentials: IntegrationCredentials): Promise<AuthResult> {
    // BambooHR uses API key authentication
    const response = await fetch(`https://api.bamboohr.com/api/gateway.php/${credentials.companyDomain}/v1/employees/directory`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:x`).toString('base64')}`,
        'Accept': 'application/json'
      }
    })
    
    if (response.ok) {
      return { 
        success: true, 
        accessToken: credentials.apiKey,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // API keys don't expire
      }
    }
    
    throw new Error('Invalid BambooHR API key')
  }
  
  async fetchEmployees(options: FetchOptions = {}): Promise<Employee[]> {
    const fields = [
      'firstName', 'lastName', 'workEmail', 'mobilePhone', 'ssn',
      'hireDate', 'terminationDate', 'status', 'jobTitle', 'department',
      'employmentHistoryStatus', 'location'
    ].join(',')
    
    const response = await this.authenticatedRequest(`/v1/reports/custom`, {
      params: {
        format: 'json',
        fields
      }
    })
    
    return response.employees.map(emp => this.mapEmployeeData(emp))
  }
}
```

### 2. Custom Field Mapping

```typescript
class BambooHRIntegration extends BaseIntegration {
  private customFieldMapping: Record<string, string> = {
    'customSSN': 'ssn',
    'customStartDate': 'startDate',
    'customEmployeeType': 'employeeType'
  }
  
  mapEmployeeData(rawData: BambooHREmployee): Employee {
    // Handle custom fields
    const customFields = rawData.customFields || {}
    const mappedCustomFields = Object.entries(customFields).reduce((acc, [key, value]) => {
      const mappedKey = this.customFieldMapping[key]
      if (mappedKey) {
        acc[mappedKey] = value
      }
      return acc
    }, {} as Record<string, any>)
    
    return {
      id: generateId(),
      companyId: rawData.companyId,
      firstName: rawData.firstName,
      lastName: rawData.lastName,
      email: rawData.workEmail,
      phone: rawData.mobilePhone,
      ssn: rawData.ssn || mappedCustomFields.ssn,
      startDate: new Date(rawData.hireDate || mappedCustomFields.startDate),
      endDate: rawData.terminationDate ? new Date(rawData.terminationDate) : undefined,
      status: this.mapEmployeeStatus(rawData.employmentHistoryStatus),
      jobTitle: rawData.jobTitle,
      department: rawData.department,
      employeeType: this.mapEmployeeType(rawData.employmentType || mappedCustomFields.employeeType),
      workLocation: rawData.location,
      integrationId: this.id,
      externalId: rawData.id.toString(),
      lastSyncAt: new Date(),
      dataSource: IntegrationProvider.BAMBOO_HR
    }
  }
}
```

## Workday Integration

### 1. SOAP API Implementation

```typescript
class WorkdayIntegration extends BaseIntegration {
  readonly provider = IntegrationProvider.WORKDAY
  readonly requiredScopes = ['Human_Resources']
  readonly rateLimit = {
    requests: 500,
    windowMs: 60000,
    burst: 5
  }
  
  async authenticate(credentials: IntegrationCredentials): Promise<AuthResult> {
    // Workday uses OAuth 2.0 with SOAP endpoints
    const authUrl = `https://services1.myworkday.com/${credentials.tenant}/ccx/oauth2/authorize?` +
      `client_id=${credentials.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${credentials.redirectUri}&` +
      `scope=Human_Resources`
    
    return { authUrl, requiresUserInteraction: true }
  }
  
  async fetchEmployees(options: FetchOptions = {}): Promise<Employee[]> {
    const soapEnvelope = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bsvc="urn:com.workday/bsvc">
        <soapenv:Header>
          <bsvc:Workday_Common_Header>
            <bsvc:Include_Reference_Descriptors_In_Response>true</bsvc:Include_Reference_Descriptors_In_Response>
          </bsvc:Workday_Common_Header>
        </soapenv:Header>
        <soapenv:Body>
          <bsvc:Get_Workers_Request>
            <bsvc:Response_Filter>
              <bsvc:Page>${options.page || 1}</bsvc:Page>
              <bsvc:Count>${options.limit || 100}</bsvc:Count>
            </bsvc:Response_Filter>
            <bsvc:Response_Group>
              <bsvc:Include_Reference>true</bsvc:Include_Reference>
              <bsvc:Include_Personal_Information>true</bsvc:Include_Personal_Information>
              <bsvc:Include_Employment_Information>true</bsvc:Include_Employment_Information>
              <bsvc:Include_Compensation>false</bsvc:Include_Compensation>
            </bsvc:Response_Group>
          </bsvc:Get_Workers_Request>
        </soapenv:Body>
      </soapenv:Envelope>
    `
    
    const response = await this.authenticatedRequest('/Human_Resources/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'Get_Workers'
      },
      body: soapEnvelope
    })
    
    return this.parseWorkdayResponse(response)
  }
  
  private parseWorkdayResponse(xmlResponse: string): Employee[] {
    // Parse SOAP XML response
    const parser = new XMLParser()
    const parsed = parser.parse(xmlResponse)
    
    const workers = parsed['soapenv:Envelope']['soapenv:Body']['bsvc:Get_Workers_Response']['bsvc:Response_Data']['bsvc:Worker']
    
    return workers.map(worker => this.mapEmployeeData(worker))
  }
}
```

### 2. Complex Data Mapping

```typescript
class WorkdayIntegration extends BaseIntegration {
  mapEmployeeData(rawData: WorkdayWorker): Employee {
    const personalInfo = rawData.Worker_Data.Personal_Data
    const employmentInfo = rawData.Worker_Data.Employment_Data
    
    return {
      id: generateId(),
      companyId: employmentInfo.Organization_Data.Organization_Reference.ID,
      firstName: personalInfo.Name_Data.Legal_Name_Data.Name_Detail_Data.First_Name,
      lastName: personalInfo.Name_Data.Legal_Name_Data.Name_Detail_Data.Last_Name,
      email: personalInfo.Contact_Data.Email_Address_Data.find(e => e.Primary)?.Email_Address,
      phone: personalInfo.Contact_Data.Phone_Data.find(p => p.Primary)?.Phone_Number,
      ssn: personalInfo.Identification_Data.National_Identification_Data.find(n => n.National_Identification_Type === 'SSN')?.National_Identification_Number,
      startDate: new Date(employmentInfo.Worker_Job_Data.Position_Data.Start_Date),
      endDate: employmentInfo.Worker_Job_Data.Position_Data.End_Date ? new Date(employmentInfo.Worker_Job_Data.Position_Data.End_Date) : undefined,
      status: this.mapEmployeeStatus(employmentInfo.Worker_Status_Data.Active),
      jobTitle: employmentInfo.Worker_Job_Data.Position_Data.Job_Profile_Summary_Data.Job_Profile_Name,
      department: employmentInfo.Worker_Job_Data.Position_Data.Organization_Data.Organization_Name,
      employeeType: this.mapEmployeeType(employmentInfo.Worker_Job_Data.Position_Data.Position_Time_Type_Reference.ID),
      workLocation: employmentInfo.Worker_Job_Data.Position_Data.Business_Site_Summary_Data.Name,
      integrationId: this.id,
      externalId: rawData.Worker_Reference.ID,
      lastSyncAt: new Date(),
      dataSource: IntegrationProvider.WORKDAY
    }
  }
}
```

## ADP Integration

### 1. API Authentication

```typescript
class ADPIntegration extends BaseIntegration {
  readonly provider = IntegrationProvider.ADP
  readonly requiredScopes = ['read:workers', 'read:company']
  readonly rateLimit = {
    requests: 100,
    windowMs: 60000,
    burst: 10
  }
  
  async authenticate(credentials: IntegrationCredentials): Promise<AuthResult> {
    // ADP uses OAuth 2.0 with client credentials flow
    const response = await fetch('https://accounts.adp.com/auth/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: this.requiredScopes.join(' ')
      })
    })
    
    const tokens = await response.json()
    
    return {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope
    }
  }
  
  async fetchEmployees(options: FetchOptions = {}): Promise<Employee[]> {
    const response = await this.authenticatedRequest('/hr/v2/workers', {
      params: {
        $top: options.limit || 100,
        $skip: ((options.page || 1) - 1) * (options.limit || 100),
        $filter: options.status ? `workAssignments/assignmentStatus/statusCode/codeValue eq '${options.status}'` : undefined
      }
    })
    
    return response.workers.map(worker => this.mapEmployeeData(worker))
  }
}
```

### 2. Nested Data Structure Handling

```typescript
class ADPIntegration extends BaseIntegration {
  mapEmployeeData(rawData: ADPWorker): Employee {
    const person = rawData.person
    const workAssignment = rawData.workAssignments?.[0] // Primary work assignment
    
    return {
      id: generateId(),
      companyId: workAssignment?.organizationalUnits?.[0]?.organizationalUnitID,
      firstName: person.legalName?.givenName,
      lastName: person.legalName?.familyName1,
      email: person.communicationContacts?.find(c => c.communicationContactType?.codeValue === 'Email')?.communicationContactValue,
      phone: person.communicationContacts?.find(c => c.communicationContactType?.codeValue === 'Phone')?.communicationContactValue,
      ssn: person.governmentIDs?.find(id => id.governmentIDType?.codeValue === 'SSN')?.governmentIDValue,
      startDate: new Date(workAssignment?.hireDate || workAssignment?.assignmentStartDate),
      endDate: workAssignment?.assignmentEndDate ? new Date(workAssignment.assignmentEndDate) : undefined,
      status: this.mapEmployeeStatus(workAssignment?.assignmentStatus?.statusCode?.codeValue),
      jobTitle: workAssignment?.jobTitle,
      department: workAssignment?.organizationalUnits?.find(ou => ou.organizationalUnitType?.codeValue === 'Department')?.organizationalUnitName,
      employeeType: this.mapEmployeeType(workAssignment?.employmentType?.codeValue),
      workLocation: workAssignment?.workLocation?.locationName,
      integrationId: this.id,
      externalId: rawData.associateOID,
      lastSyncAt: new Date(),
      dataSource: IntegrationProvider.ADP
    }
  }
}
```

## Integration Management

### 1. Integration Registry

```typescript
class IntegrationRegistry {
  private integrations: Map<IntegrationProvider, BaseIntegration> = new Map()
  
  constructor() {
    this.register(IntegrationProvider.JUSTWORKS, new JustWorksIntegration())
    this.register(IntegrationProvider.BAMBOO_HR, new BambooHRIntegration())
    this.register(IntegrationProvider.WORKDAY, new WorkdayIntegration())
    this.register(IntegrationProvider.ADP, new ADPIntegration())
  }
  
  register(provider: IntegrationProvider, integration: BaseIntegration): void {
    this.integrations.set(provider, integration)
  }
  
  get(provider: IntegrationProvider): BaseIntegration | undefined {
    return this.integrations.get(provider)
  }
  
  getAll(): BaseIntegration[] {
    return Array.from(this.integrations.values())
  }
}
```

### 2. Integration Configuration

```typescript
interface IntegrationConfig {
  id: string
  companyId: string
  provider: IntegrationProvider
  status: IntegrationStatus
  credentials: EncryptedCredentials
  settings: IntegrationSettings
  lastSyncAt?: Date
  syncFrequency: SyncFrequency
  webhookConfig?: WebhookConfig
}

enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending'
}

interface IntegrationSettings {
  syncEmployees: boolean
  syncEmploymentHistory: boolean
  syncPersonalInfo: boolean
  enableWebhooks: boolean
  
  // Field mapping overrides
  fieldMapping?: Record<string, string>
  
  // Custom filters
  includeTerminated: boolean
  includeContractors: boolean
  departmentFilters?: string[]
  locationFilters?: string[]
}
```

### 3. Sync Orchestration

```typescript
class SyncOrchestrator {
  async syncAllIntegrations(): Promise<SyncSummary> {
    const integrations = await this.getActiveIntegrations()
    const results = []
    
    for (const config of integrations) {
      try {
        const result = await this.syncIntegration(config)
        results.push(result)
      } catch (error) {
        await this.handleSyncError(config, error)
        results.push({ 
          integrationId: config.id, 
          success: false, 
          error: error.message 
        })
      }
    }
    
    return {
      totalIntegrations: integrations.length,
      successfulSyncs: results.filter(r => r.success).length,
      failedSyncs: results.filter(r => !r.success).length,
      results
    }
  }
  
  private async syncIntegration(config: IntegrationConfig): Promise<SyncResult> {
    const integration = this.integrationRegistry.get(config.provider)
    if (!integration) {
      throw new Error(`Integration provider ${config.provider} not found`)
    }
    
    // Validate authentication
    const isValid = await integration.validateAuth()
    if (!isValid) {
      await integration.refreshAuth(config.credentials.refreshToken)
    }
    
    // Perform sync
    const employees = await integration.fetchEmployees({
      lastSync: config.lastSyncAt
    })
    
    // Process employees
    const processed = await this.processEmployeeData(employees, config)
    
    // Update last sync time
    await this.updateLastSyncTime(config.id)
    
    return {
      integrationId: config.id,
      success: true,
      employeesProcessed: processed.length,
      newEmployees: processed.filter(e => e.isNew).length,
      updatedEmployees: processed.filter(e => e.isUpdated).length
    }
  }
}
```

## Error Handling & Resilience

### 1. Retry Logic

```typescript
class RetryHandler {
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoff: BackoffStrategy = 'exponential'
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw lastError
        }
        
        const delay = this.calculateDelay(attempt, backoff)
        await this.sleep(delay)
      }
    }
    
    throw lastError!
  }
  
  private calculateDelay(attempt: number, strategy: BackoffStrategy): number {
    switch (strategy) {
      case 'exponential':
        return Math.pow(2, attempt) * 1000 // 1s, 2s, 4s, 8s
      case 'linear':
        return (attempt + 1) * 1000 // 1s, 2s, 3s, 4s
      case 'fixed':
        return 1000 // Always 1s
      default:
        return 1000
    }
  }
}
```

### 2. Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0
  private lastFailure?: Date
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
    this.lastFailure = undefined
  }
  
  private onFailure(): void {
    this.failures++
    this.lastFailure = new Date()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
    }
  }
  
  private shouldAttemptReset(): boolean {
    return this.lastFailure && 
           Date.now() - this.lastFailure.getTime() > this.timeout
  }
}
```

## Testing Strategy

### 1. Integration Testing

```typescript
class IntegrationTestSuite {
  async testIntegration(provider: IntegrationProvider): Promise<TestResult> {
    const integration = this.integrationRegistry.get(provider)
    const testCredentials = this.getTestCredentials(provider)
    
    const tests = [
      this.testAuthentication(integration, testCredentials),
      this.testEmployeeFetch(integration),
      this.testWebhookHandling(integration),
      this.testErrorHandling(integration)
    ]
    
    const results = await Promise.allSettled(tests)
    
    return {
      provider,
      totalTests: tests.length,
      passedTests: results.filter(r => r.status === 'fulfilled').length,
      failedTests: results.filter(r => r.status === 'rejected').length,
      results: results.map((r, i) => ({
        test: tests[i].name,
        status: r.status,
        error: r.status === 'rejected' ? r.reason : undefined
      }))
    }
  }
  
  private async testAuthentication(
    integration: BaseIntegration, 
    credentials: IntegrationCredentials
  ): Promise<void> {
    const result = await integration.authenticate(credentials)
    if (!result.success) {
      throw new Error('Authentication failed')
    }
  }
}
```

### 2. Mock Integration for Testing

```typescript
class MockIntegration extends BaseIntegration {
  readonly provider = IntegrationProvider.CUSTOM
  readonly requiredScopes = []
  readonly rateLimit = { requests: 1000, windowMs: 60000, burst: 100 }
  
  async authenticate(): Promise<AuthResult> {
    return { success: true, accessToken: 'mock-token' }
  }
  
  async fetchEmployees(options: FetchOptions = {}): Promise<Employee[]> {
    return this.generateMockEmployees(options.limit || 10)
  }
  
  private generateMockEmployees(count: number): Employee[] {
    const employees = []
    for (let i = 0; i < count; i++) {
      employees.push({
        id: `mock-${i}`,
        companyId: 'mock-company',
        firstName: `FirstName${i}`,
        lastName: `LastName${i}`,
        email: `employee${i}@example.com`,
        startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        status: EmployeeStatus.ACTIVE,
        integrationId: 'mock-integration',
        externalId: `ext-${i}`,
        lastSyncAt: new Date(),
        dataSource: IntegrationProvider.CUSTOM
      })
    }
    return employees
  }
}
```

## Security Considerations

### 1. Credential Management

```typescript
class CredentialManager {
  private encryptionKey: string
  
  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey
  }
  
  encryptCredentials(credentials: IntegrationCredentials): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey)
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }
  
  decryptCredentials(encryptedCredentials: string): IntegrationCredentials {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey)
    let decrypted = decipher.update(encryptedCredentials, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return JSON.parse(decrypted)
  }
}
```

### 2. Request Validation

```typescript
class RequestValidator {
  validateWebhookSignature(
    payload: string, 
    signature: string, 
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
  
  validateIntegrationRequest(request: IntegrationRequest): ValidationResult {
    const errors = []
    
    if (!request.companyId) {
      errors.push('Company ID is required')
    }
    
    if (!request.provider) {
      errors.push('Provider is required')
    }
    
    if (!request.credentials) {
      errors.push('Credentials are required')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
```