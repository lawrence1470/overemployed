# BambooHR Integration Guide

## Overview

The BambooHR integration provides employee data synchronization using BambooHR's REST API. This integration supports API key authentication, custom field mapping, and comprehensive employee data management.

## Authentication Setup

### 1. API Key Configuration

BambooHR uses API key authentication with HTTP Basic Auth:

```typescript
interface BambooHRConfig {
  apiKey: string
  companyDomain: string // Your BambooHR subdomain
  baseUrl: string // https://api.bamboohr.com/api/gateway.php/{companyDomain}/v1
}

class BambooHRClient {
  private apiKey: string
  private companyDomain: string
  private baseUrl: string
  
  constructor(config: BambooHRConfig) {
    this.apiKey = config.apiKey
    this.companyDomain = config.companyDomain
    this.baseUrl = `https://api.bamboohr.com/api/gateway.php/${config.companyDomain}/v1`
  }
  
  private getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Basic ${Buffer.from(`${this.apiKey}:x`).toString('base64')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
}
```

### 2. API Authentication Test

```typescript
async function testBambooHRConnection(config: BambooHRConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.baseUrl}/employees/directory`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.apiKey}:x`).toString('base64')}`,
        'Accept': 'application/json'
      }
    })
    
    return response.ok
  } catch (error) {
    console.error('BambooHR connection test failed:', error)
    return false
  }
}
```

## Employee Data Integration

### 1. Standard Fields Mapping

```typescript
interface BambooHREmployee {
  id: string
  employeeNumber?: string
  firstName: string
  lastName: string
  displayName: string
  workEmail?: string
  personalEmail?: string
  workPhone?: string
  mobilePhone?: string
  homePhone?: string
  ssn?: string
  dateOfBirth?: string
  hireDate: string
  terminationDate?: string
  employmentHistoryStatus: string
  jobTitle?: string
  department?: string
  division?: string
  location?: string
  workState?: string
  workCountry?: string
  supervisor?: string
  customFields?: Record<string, any>
}

function mapBambooHREmployee(bambooEmployee: BambooHREmployee): Employee {
  return {
    id: generateId(),
    companyId: '', // Set by integration context
    firstName: bambooEmployee.firstName,
    lastName: bambooEmployee.lastName,
    displayName: bambooEmployee.displayName,
    email: bambooEmployee.workEmail,
    personalEmail: bambooEmployee.personalEmail,
    phone: bambooEmployee.workPhone || bambooEmployee.mobilePhone,
    homePhone: bambooEmployee.homePhone,
    ssn: bambooEmployee.ssn,
    dateOfBirth: bambooEmployee.dateOfBirth ? new Date(bambooEmployee.dateOfBirth) : undefined,
    startDate: new Date(bambooEmployee.hireDate),
    endDate: bambooEmployee.terminationDate ? new Date(bambooEmployee.terminationDate) : undefined,
    status: mapBambooHRStatus(bambooEmployee.employmentHistoryStatus),
    jobTitle: bambooEmployee.jobTitle,
    department: bambooEmployee.department,
    division: bambooEmployee.division,
    workLocation: bambooEmployee.location,
    workState: bambooEmployee.workState,
    workCountry: bambooEmployee.workCountry,
    supervisor: bambooEmployee.supervisor,
    employeeNumber: bambooEmployee.employeeNumber,
    integrationId: 'bamboohr',
    externalId: bambooEmployee.id,
    customFields: bambooEmployee.customFields,
    lastSyncAt: new Date(),
    dataSource: IntegrationProvider.BAMBOO_HR,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function mapBambooHRStatus(status: string): EmployeeStatus {
  switch (status?.toLowerCase()) {
    case 'active':
      return EmployeeStatus.ACTIVE
    case 'inactive':
      return EmployeeStatus.INACTIVE
    case 'terminated':
      return EmployeeStatus.TERMINATED
    default:
      return EmployeeStatus.INACTIVE
  }
}
```

### 2. Custom Fields Support

```typescript
interface BambooHRCustomFieldConfig {
  fieldId: string
  fieldName: string
  mappedTo: string
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'list'
  required: boolean
}

class BambooHRCustomFieldMapper {
  private fieldConfigs: Map<string, BambooHRCustomFieldConfig> = new Map()
  
  addFieldMapping(config: BambooHRCustomFieldConfig) {
    this.fieldConfigs.set(config.fieldId, config)
  }
  
  mapCustomFields(customFields: Record<string, any>): Record<string, any> {
    const mappedFields: Record<string, any> = {}
    
    for (const [fieldId, value] of Object.entries(customFields)) {
      const config = this.fieldConfigs.get(fieldId)
      if (config && value !== null && value !== '') {
        const mappedValue = this.convertFieldValue(value, config.dataType)
        mappedFields[config.mappedTo] = mappedValue
      }
    }
    
    return mappedFields
  }
  
  private convertFieldValue(value: any, dataType: string): any {
    switch (dataType) {
      case 'date':
        return new Date(value)
      case 'number':
        return parseFloat(value)
      case 'boolean':
        return value === 'true' || value === '1' || value === 1
      default:
        return value
    }
  }
}

// Example usage
const customFieldMapper = new BambooHRCustomFieldMapper()
customFieldMapper.addFieldMapping({
  fieldId: 'customField1',
  fieldName: 'Employee Type',
  mappedTo: 'employeeType',
  dataType: 'list',
  required: false
})
```

## API Operations

### 1. Employee Directory Fetching

```typescript
class BambooHRClient {
  async getEmployeeDirectory(): Promise<BambooHREmployee[]> {
    const response = await fetch(`${this.baseUrl}/employees/directory`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`BambooHR API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.employees || []
  }
  
  async getEmployeeDetails(employeeId: string, fields?: string[]): Promise<BambooHREmployee> {
    const fieldList = fields?.join(',') || 'all'
    
    const response = await fetch(`${this.baseUrl}/employees/${employeeId}?fields=${fieldList}`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get employee ${employeeId}: ${response.status}`)
    }
    
    return await response.json()
  }
  
  async getCustomFields(): Promise<BambooHRCustomField[]> {
    const response = await fetch(`${this.baseUrl}/meta/fields`, {
      headers: this.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get custom fields: ${response.status}`)
    }
    
    return await response.json()
  }
}
```

### 2. Bulk Employee Data Sync

```typescript
async function syncBambooHREmployees(
  client: BambooHRClient,
  companyId: string,
  customFieldMapper: BambooHRCustomFieldMapper
): Promise<SyncResult> {
  const syncJob = await createSyncJob({
    provider: 'bamboohr',
    companyId,
    type: 'full_sync',
    startedAt: new Date()
  })
  
  try {
    // Get employee directory (lightweight)
    const directory = await client.getEmployeeDirectory()
    
    let totalProcessed = 0
    let totalAdded = 0
    let totalUpdated = 0
    const errors: SyncError[] = []
    
    // Process employees in batches
    const batchSize = 10
    for (let i = 0; i < directory.length; i += batchSize) {
      const batch = directory.slice(i, i + batchSize)
      
      // Fetch detailed data for each employee in batch
      const detailedEmployees = await Promise.allSettled(
        batch.map(emp => client.getEmployeeDetails(emp.id))
      )
      
      for (let j = 0; j < detailedEmployees.length; j++) {
        const result = detailedEmployees[j]
        
        if (result.status === 'fulfilled') {
          try {
            const bambooEmployee = result.value
            const processResult = await processBambooHREmployee(
              bambooEmployee, 
              companyId, 
              customFieldMapper
            )
            
            totalProcessed++
            if (processResult.action === 'created') {
              totalAdded++
            } else if (processResult.action === 'updated') {
              totalUpdated++
            }
          } catch (error) {
            errors.push({
              employeeId: batch[j].id,
              error: error.message,
              data: result.value
            })
          }
        } else {
          errors.push({
            employeeId: batch[j].id,
            error: result.reason.message,
            data: null
          })
        }
      }
      
      // Rate limiting - BambooHR allows 1000 requests per day
      await new Promise(resolve => setTimeout(resolve, 100))
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

async function processBambooHREmployee(
  bambooEmployee: BambooHREmployee,
  companyId: string,
  customFieldMapper: BambooHRCustomFieldMapper
): Promise<{ action: 'created' | 'updated' | 'skipped' }> {
  // Check if employee exists
  const existingEmployee = await db.employee.findFirst({
    where: {
      externalId: bambooEmployee.id,
      dataSource: IntegrationProvider.BAMBOO_HR,
      companyId
    }
  })
  
  // Map employee data
  const mappedEmployee = mapBambooHREmployee(bambooEmployee)
  mappedEmployee.companyId = companyId
  
  // Process custom fields
  if (bambooEmployee.customFields) {
    const mappedCustomFields = customFieldMapper.mapCustomFields(bambooEmployee.customFields)
    mappedEmployee.customFields = mappedCustomFields
  }
  
  if (existingEmployee) {
    // Update existing employee
    await db.employee.update({
      where: { id: existingEmployee.id },
      data: {
        ...mappedEmployee,
        id: existingEmployee.id,
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

## Reports Integration

### 1. Custom Reports

```typescript
interface BambooHRReportConfig {
  title: string
  fields: string[]
  filters?: Record<string, any>
  format: 'JSON' | 'CSV' | 'PDF' | 'XLS'
}

class BambooHRReportsClient {
  private client: BambooHRClient
  
  constructor(client: BambooHRClient) {
    this.client = client
  }
  
  async createCustomReport(config: BambooHRReportConfig): Promise<string> {
    const reportData = {
      title: config.title,
      fields: config.fields,
      filters: config.filters || {},
      format: config.format
    }
    
    const response = await fetch(`${this.client.baseUrl}/reports/custom`, {
      method: 'POST',
      headers: this.client.getAuthHeaders(),
      body: JSON.stringify(reportData)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create report: ${response.status}`)
    }
    
    const result = await response.json()
    return result.reportId
  }
  
  async getReportData(reportId: string): Promise<any[]> {
    const response = await fetch(`${this.client.baseUrl}/reports/${reportId}`, {
      headers: this.client.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get report data: ${response.status}`)
    }
    
    const data = await response.json()
    return data.employees || []
  }
  
  async getStandardReport(reportType: string): Promise<any[]> {
    const response = await fetch(`${this.client.baseUrl}/reports/${reportType}`, {
      headers: this.client.getAuthHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get ${reportType} report: ${response.status}`)
    }
    
    return await response.json()
  }
}

// Example: Get employment history report
async function getEmploymentHistoryReport(reportsClient: BambooHRReportsClient): Promise<any[]> {
  const reportConfig: BambooHRReportConfig = {
    title: 'Employment History Report',
    fields: [
      'employeeNumber',
      'firstName',
      'lastName',
      'hireDate',
      'terminationDate',
      'employmentHistoryStatus',
      'jobTitle',
      'department'
    ],
    format: 'JSON'
  }
  
  const reportId = await reportsClient.createCustomReport(reportConfig)
  return await reportsClient.getReportData(reportId)
}
```

## Webhooks Alternative

Since BambooHR doesn't support webhooks directly, implement polling-based change detection:

### 1. Change Detection Strategy

```typescript
interface BambooHRChangeDetector {
  lastSyncTimestamp: Date
  employeeHashes: Map<string, string>
}

class BambooHRChangeDetector {
  private lastSyncTimestamp: Date
  private employeeHashes: Map<string, string> = new Map()
  
  constructor(lastSyncTimestamp?: Date) {
    this.lastSyncTimestamp = lastSyncTimestamp || new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
  
  async detectChanges(client: BambooHRClient): Promise<ChangeDetectionResult> {
    const currentEmployees = await client.getEmployeeDirectory()
    const changes: EmployeeChange[] = []
    const currentHashes = new Map<string, string>()
    
    for (const employee of currentEmployees) {
      const employeeHash = this.calculateEmployeeHash(employee)
      currentHashes.set(employee.id, employeeHash)
      
      const previousHash = this.employeeHashes.get(employee.id)
      
      if (!previousHash) {
        // New employee
        changes.push({
          type: 'created',
          employeeId: employee.id,
          employee: await client.getEmployeeDetails(employee.id)
        })
      } else if (previousHash !== employeeHash) {
        // Updated employee
        changes.push({
          type: 'updated',
          employeeId: employee.id,
          employee: await client.getEmployeeDetails(employee.id)
        })
      }
    }
    
    // Check for deleted employees
    for (const [employeeId, hash] of this.employeeHashes) {
      if (!currentHashes.has(employeeId)) {
        changes.push({
          type: 'deleted',
          employeeId,
          employee: null
        })
      }
    }
    
    // Update state
    this.employeeHashes = currentHashes
    this.lastSyncTimestamp = new Date()
    
    return {
      changes,
      timestamp: this.lastSyncTimestamp,
      totalEmployees: currentEmployees.length
    }
  }
  
  private calculateEmployeeHash(employee: Partial<BambooHREmployee>): string {
    // Create hash based on key fields that indicate changes
    const hashInput = [
      employee.firstName,
      employee.lastName,
      employee.workEmail,
      employee.jobTitle,
      employee.department,
      employee.employmentHistoryStatus,
      employee.hireDate,
      employee.terminationDate
    ].join('|')
    
    return crypto.createHash('md5').update(hashInput).digest('hex')
  }
}
```

### 2. Scheduled Change Detection

```typescript
class BambooHRScheduledSync {
  private detector: BambooHRChangeDetector
  private client: BambooHRClient
  private intervalId?: NodeJS.Timeout
  
  constructor(client: BambooHRClient, detector: BambooHRChangeDetector) {
    this.client = client
    this.detector = detector
  }
  
  startScheduledSync(intervalMinutes: number = 60): void {
    this.intervalId = setInterval(async () => {
      try {
        await this.performChangeDetection()
      } catch (error) {
        console.error('Scheduled sync error:', error)
      }
    }, intervalMinutes * 60 * 1000)
  }
  
  stopScheduledSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }
  
  private async performChangeDetection(): Promise<void> {
    console.log('Starting BambooHR change detection...')
    
    const result = await this.detector.detectChanges(this.client)
    
    if (result.changes.length > 0) {
      console.log(`Detected ${result.changes.length} changes`)
      
      for (const change of result.changes) {
        await this.processEmployeeChange(change)
      }
    }
    
    console.log(`Change detection completed. Total employees: ${result.totalEmployees}`)
  }
  
  private async processEmployeeChange(change: EmployeeChange): Promise<void> {
    switch (change.type) {
      case 'created':
        await this.handleEmployeeCreated(change.employee!)
        break
      case 'updated':
        await this.handleEmployeeUpdated(change.employee!)
        break
      case 'deleted':
        await this.handleEmployeeDeleted(change.employeeId)
        break
    }
  }
  
  private async handleEmployeeCreated(employee: BambooHREmployee): Promise<void> {
    // Similar to webhook handling
    console.log(`New employee detected: ${employee.firstName} ${employee.lastName}`)
    // Process and store employee...
  }
  
  private async handleEmployeeUpdated(employee: BambooHREmployee): Promise<void> {
    console.log(`Employee updated: ${employee.firstName} ${employee.lastName}`)
    // Update employee record...
  }
  
  private async handleEmployeeDeleted(employeeId: string): Promise<void> {
    console.log(`Employee deleted: ${employeeId}`)
    // Soft delete or mark as inactive...
  }
}
```

## Configuration & Testing

### 1. Environment Configuration

```bash
# BambooHR Configuration
BAMBOOHR_API_KEY=your_api_key
BAMBOOHR_COMPANY_DOMAIN=your_subdomain
BAMBOOHR_RATE_LIMIT=1000
BAMBOOHR_SYNC_INTERVAL=60

# Custom field mappings (JSON)
BAMBOOHR_CUSTOM_FIELDS='[{"fieldId":"customField1","mappedTo":"employeeType"}]'
```

### 2. Integration Testing

```typescript
describe('BambooHR Integration', () => {
  let client: BambooHRClient
  let mockEmployee: BambooHREmployee
  
  beforeEach(() => {
    client = new BambooHRClient({
      apiKey: 'test_key',
      companyDomain: 'test_company',
      baseUrl: 'https://api.bamboohr.com/api/gateway.php/test_company/v1'
    })
    
    mockEmployee = {
      id: '123',
      firstName: 'John',
      lastName: 'Doe',
      workEmail: 'john.doe@company.com',
      hireDate: '2023-01-15',
      employmentHistoryStatus: 'Active',
      jobTitle: 'Software Engineer',
      department: 'Engineering'
    }
  })
  
  test('should map BambooHR employee correctly', () => {
    const mapped = mapBambooHREmployee(mockEmployee)
    
    expect(mapped.firstName).toBe('John')
    expect(mapped.lastName).toBe('Doe')
    expect(mapped.email).toBe('john.doe@company.com')
    expect(mapped.status).toBe(EmployeeStatus.ACTIVE)
    expect(mapped.dataSource).toBe(IntegrationProvider.BAMBOO_HR)
  })
  
  test('should detect employee changes', async () => {
    const detector = new BambooHRChangeDetector()
    
    // Mock client methods
    jest.spyOn(client, 'getEmployeeDirectory').mockResolvedValue([mockEmployee])
    jest.spyOn(client, 'getEmployeeDetails').mockResolvedValue(mockEmployee)
    
    const result = await detector.detectChanges(client)
    
    expect(result.changes).toHaveLength(1)
    expect(result.changes[0].type).toBe('created')
  })
})
```

This BambooHR integration provides comprehensive employee data synchronization with custom field support, change detection, and robust error handling for organizations using BambooHR as their HRIS.