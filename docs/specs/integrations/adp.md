# ADP Integration Guide

## Overview

The ADP integration provides comprehensive employee data synchronization using ADP's Workforce Now API. This integration supports OAuth 2.0 authentication, complex nested data structures, and real-time event notifications.

## Authentication Setup

### 1. OAuth 2.0 Client Credentials Flow

ADP uses OAuth 2.0 with client credentials flow for API access:

```typescript
interface ADPOAuthConfig {
  clientId: string
  clientSecret: string
  environment: 'production' | 'sandbox'
  scope: string[]
  
  // OAuth endpoints
  tokenUrl: string     // https://accounts.adp.com/auth/oauth/v2/token
  apiBaseUrl: string   // https://api.adp.com or https://iat-api.adp.com (sandbox)
}

const adpScopes = [
  'read:workers',
  'read:company',
  'read:employment',
  'read:positions'
]

class ADPOAuthClient {
  constructor(private config: ADPOAuthConfig) {}
  
  async getAccessToken(): Promise<ADPTokens> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')
    
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: this.config.scope.join(' ')
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ADP token request failed: ${error}`)
    }
    
    const tokens = await response.json()
    
    return {
      accessToken: tokens.access_token,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
    }
  }
  
  async refreshToken(): Promise<ADPTokens> {
    // ADP uses client credentials flow, so we get a new token
    return await this.getAccessToken()
  }
}
```

### 2. API Client Implementation

```typescript
class ADPAPIClient {
  private accessToken: string
  private tokenExpiry: Date
  private oauthClient: ADPOAuthClient
  private baseUrl: string
  
  constructor(config: ADPOAuthConfig) {
    this.oauthClient = new ADPOAuthClient(config)
    this.baseUrl = config.apiBaseUrl
  }
  
  async ensureValidToken(): Promise<void> {
    if (!this.accessToken || new Date() >= this.tokenExpiry) {
      const tokens = await this.oauthClient.getAccessToken()
      this.accessToken = tokens.accessToken
      this.tokenExpiry = tokens.expiresAt
    }
  }
  
  async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.ensureValidToken()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    })
    
    if (response.status === 401) {
      // Token expired, refresh and retry
      const tokens = await this.oauthClient.getAccessToken()
      this.accessToken = tokens.accessToken
      this.tokenExpiry = tokens.expiresAt
      
      return await this.authenticatedRequest(endpoint, options)
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`ADP API Error: ${response.status} - ${error.message || error.description}`)
    }
    
    return await response.json()
  }
}
```

## Employee Data Integration

### 1. Complex Worker Data Structure

```typescript
interface ADPWorker {
  associateOID: string
  workerID?: {
    idValue: string
  }
  person: {
    legalName?: {
      givenName: string
      familyName1: string
      middleName?: string
      preferredSalutations?: Array<{
        salutationCode?: {
          codeValue: string
        }
      }>
    }
    preferredName?: {
      givenName: string
      familyName1: string
    }
    birthDate?: string
    genderIdentity?: {
      identityCode?: {
        codeValue: string
      }
    }
    ethnicityIdentities?: Array<{
      identityCode?: {
        codeValue: string
      }
    }>
    communicationContacts?: Array<{
      communicationContactType?: {
        codeValue: string
      }
      communicationContactValue: string
      communicationContactPreferenceCode?: {
        codeValue: string
      }
    }>
    addresses?: Array<{
      addressTypeCode?: {
        codeValue: string
      }
      addressLines?: string[]
      cityName?: string
      countrySubdivisionLevel1?: {
        subdivisionType: string
        codeValue: string
      }
      postalCode?: string
      countryCode?: string
    }>
    governmentIDs?: Array<{
      governmentIDType?: {
        codeValue: string
      }
      governmentIDValue: string
      countryCode?: string
    }>
  }
  workAssignments?: Array<{
    itemID?: string
    assignmentStartDate?: string
    assignmentEndDate?: string
    assignmentTerminationDate?: string
    assignmentStatus?: {
      statusCode?: {
        codeValue: string
      }
      effectiveDate?: string
    }
    positionID?: string
    positionTitle?: string
    jobTitle?: string
    employmentType?: {
      codeValue: string
    }
    employeeClassificationCode?: {
      codeValue: string
    }
    wageLawCoverage?: {
      wageLawNameCode?: {
        codeValue: string
      }
    }
    workLocation?: {
      locationID?: string
      locationName?: string
      address?: {
        addressLines?: string[]
        cityName?: string
        countrySubdivisionLevel1?: {
          codeValue: string
        }
        postalCode?: string
        countryCode?: string
      }
    }
    organizationalUnits?: Array<{
      organizationalUnitID?: string
      organizationalUnitName?: string
      organizationalUnitType?: {
        codeValue: string
      }
    }>
    managers?: Array<{
      managerAssociateOID?: string
      managerPositionID?: string
      managerName?: {
        givenName: string
        familyName1: string
      }
    }>
    reportsTo?: Array<{
      associateOID?: string
      positionID?: string
      workerName?: {
        givenName: string
        familyName1: string
      }
    }>
    compensation?: {
      basePay?: {
        payAmount?: {
          amountValue: number
          currencyCode: string
        }
        payPeriodCode?: {
          codeValue: string
        }
      }
    }
    hireDate?: string
  }>
}

function mapADPWorker(adpWorker: ADPWorker): Employee {
  const person = adpWorker.person
  const primaryAssignment = adpWorker.workAssignments?.[0] // Primary work assignment
  
  // Extract names
  const legalName = person.legalName
  const preferredName = person.preferredName
  
  // Extract contact information
  const emailContact = person.communicationContacts?.find(
    contact => contact.communicationContactType?.codeValue === 'Email' ||
               contact.communicationContactType?.codeValue === 'BUSINESSEMAIL'
  )
  
  const phoneContact = person.communicationContacts?.find(
    contact => contact.communicationContactType?.codeValue === 'Phone' ||
               contact.communicationContactType?.codeValue === 'WORKPHONE'
  )
  
  const mobileContact = person.communicationContacts?.find(
    contact => contact.communicationContactType?.codeValue === 'Mobile' ||
               contact.communicationContactType?.codeValue === 'MOBILEPHONE'
  )
  
  // Extract address
  const homeAddress = person.addresses?.find(
    addr => addr.addressTypeCode?.codeValue === 'Home' ||
            addr.addressTypeCode?.codeValue === 'RESIDENCE'
  )
  
  // Extract government IDs
  const ssn = person.governmentIDs?.find(
    id => id.governmentIDType?.codeValue === 'SSN' ||
          id.governmentIDType?.codeValue === 'SocialSecurityNumber'
  )
  
  // Extract organizational information
  const department = primaryAssignment?.organizationalUnits?.find(
    ou => ou.organizationalUnitType?.codeValue === 'Department' ||
          ou.organizationalUnitType?.codeValue === 'DEPARTMENT'
  )
  
  const division = primaryAssignment?.organizationalUnits?.find(
    ou => ou.organizationalUnitType?.codeValue === 'Division' ||
          ou.organizationalUnitType?.codeValue === 'DIVISION'
  )
  
  // Extract manager information
  const manager = primaryAssignment?.managers?.[0]
  
  return {
    id: generateId(),
    companyId: '', // Set by integration context
    firstName: preferredName?.givenName || legalName?.givenName || '',
    lastName: preferredName?.familyName1 || legalName?.familyName1 || '',
    middleName: legalName?.middleName,
    displayName: `${preferredName?.givenName || legalName?.givenName} ${preferredName?.familyName1 || legalName?.familyName1}`,
    email: emailContact?.communicationContactValue,
    phone: phoneContact?.communicationContactValue,
    mobilePhone: mobileContact?.communicationContactValue,
    ssn: ssn?.governmentIDValue,
    dateOfBirth: person.birthDate ? new Date(person.birthDate) : undefined,
    gender: person.genderIdentity?.identityCode?.codeValue,
    ethnicity: person.ethnicityIdentities?.[0]?.identityCode?.codeValue,
    
    // Employment information
    startDate: primaryAssignment?.hireDate ? new Date(primaryAssignment.hireDate) : new Date(),
    assignmentStartDate: primaryAssignment?.assignmentStartDate ? new Date(primaryAssignment.assignmentStartDate) : undefined,
    endDate: primaryAssignment?.assignmentEndDate ? new Date(primaryAssignment.assignmentEndDate) : undefined,
    terminationDate: primaryAssignment?.assignmentTerminationDate ? new Date(primaryAssignment.assignmentTerminationDate) : undefined,
    status: mapADPEmployeeStatus(primaryAssignment?.assignmentStatus?.statusCode?.codeValue),
    
    // Job information
    positionId: primaryAssignment?.positionID,
    positionTitle: primaryAssignment?.positionTitle,
    jobTitle: primaryAssignment?.jobTitle,
    employeeType: mapADPEmployeeType(primaryAssignment?.employmentType?.codeValue),
    employeeClassification: primaryAssignment?.employeeClassificationCode?.codeValue,
    
    // Organizational information
    department: department?.organizationalUnitName,
    departmentId: department?.organizationalUnitID,
    division: division?.organizationalUnitName,
    divisionId: division?.organizationalUnitID,
    
    // Location information
    workLocation: primaryAssignment?.workLocation?.locationName,
    workLocationId: primaryAssignment?.workLocation?.locationID,
    
    // Manager information
    managerId: manager?.managerAssociateOID,
    managerName: manager?.managerName ? 
      `${manager.managerName.givenName} ${manager.managerName.familyName1}` : undefined,
    
    // Address information
    address: homeAddress ? mapADPAddress(homeAddress) : undefined,
    
    // Compensation (if included)
    basePay: primaryAssignment?.compensation?.basePay?.payAmount?.amountValue,
    payPeriod: primaryAssignment?.compensation?.basePay?.payPeriodCode?.codeValue,
    currency: primaryAssignment?.compensation?.basePay?.payAmount?.currencyCode,
    
    // Integration metadata
    integrationId: 'adp',
    externalId: adpWorker.associateOID,
    workerId: adpWorker.workerID?.idValue,
    assignmentId: primaryAssignment?.itemID,
    lastSyncAt: new Date(),
    dataSource: IntegrationProvider.ADP,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function mapADPEmployeeStatus(statusCode?: string): EmployeeStatus {
  switch (statusCode?.toUpperCase()) {
    case 'ACTIVE':
    case 'A':
      return EmployeeStatus.ACTIVE
    case 'INACTIVE':
    case 'I':
      return EmployeeStatus.INACTIVE
    case 'TERMINATED':
    case 'T':
      return EmployeeStatus.TERMINATED
    case 'LEAVE':
    case 'L':
      return EmployeeStatus.ON_LEAVE
    default:
      return EmployeeStatus.ACTIVE
  }
}

function mapADPEmployeeType(employmentType?: string): EmployeeType {
  switch (employmentType?.toUpperCase()) {
    case 'FULLTIME':
    case 'FULL_TIME':
    case 'F':
      return EmployeeType.FULL_TIME
    case 'PARTTIME':
    case 'PART_TIME':
    case 'P':
      return EmployeeType.PART_TIME
    case 'CONTRACT':
    case 'CONTRACTOR':
    case 'C':
      return EmployeeType.CONTRACT
    case 'INTERN':
    case 'INTERNSHIP':
    case 'I':
      return EmployeeType.INTERN
    default:
      return EmployeeType.FULL_TIME
  }
}

function mapADPAddress(address: any): Address {
  return {
    street: address.addressLines?.join(', ') || '',
    city: address.cityName || '',
    state: address.countrySubdivisionLevel1?.codeValue || '',
    zipCode: address.postalCode || '',
    country: address.countryCode || 'US'
  }
}
```

### 2. Advanced Querying

```typescript
class ADPWorkersService {
  private apiClient: ADPAPIClient
  
  constructor(apiClient: ADPAPIClient) {
    this.apiClient = apiClient
  }
  
  async getWorkers(options: GetWorkersOptions = {}): Promise<ADPWorker[]> {
    const queryParams = new URLSearchParams()
    
    // Pagination
    if (options.skip) queryParams.append('$skip', options.skip.toString())
    if (options.top) queryParams.append('$top', options.top.toString())
    
    // Filtering
    if (options.filter) queryParams.append('$filter', options.filter)
    if (options.select) queryParams.append('$select', options.select.join(','))
    
    // Ordering
    if (options.orderBy) queryParams.append('$orderby', options.orderBy)
    
    const endpoint = `/hr/v2/workers${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    const response = await this.apiClient.authenticatedRequest(endpoint)
    return response.workers || []
  }
  
  async getWorker(associateOID: string): Promise<ADPWorker> {
    const response = await this.apiClient.authenticatedRequest(`/hr/v2/workers/${associateOID}`)
    return response.worker
  }
  
  async getActiveWorkers(): Promise<ADPWorker[]> {
    return await this.getWorkers({
      filter: "workAssignments/assignmentStatus/statusCode/codeValue eq 'Active'",
      top: 1000
    })
  }
  
  async getWorkersModifiedSince(since: Date): Promise<ADPWorker[]> {
    const isoDate = since.toISOString()
    return await this.getWorkers({
      filter: `lastModifiedDateTime ge ${isoDate}`,
      top: 1000
    })
  }
  
  async getWorkersByDepartment(departmentId: string): Promise<ADPWorker[]> {
    return await this.getWorkers({
      filter: `workAssignments/organizationalUnits/any(ou: ou/organizationalUnitID eq '${departmentId}')`,
      top: 1000
    })
  }
  
  async getTerminatedWorkers(since?: Date): Promise<ADPWorker[]> {
    let filter = "workAssignments/assignmentStatus/statusCode/codeValue eq 'Terminated'"
    
    if (since) {
      const isoDate = since.toISOString()
      filter += ` and workAssignments/assignmentTerminationDate ge ${isoDate}`
    }
    
    return await this.getWorkers({
      filter,
      top: 1000
    })
  }
}
```

## Organizational Data Integration

### 1. Organization Structure

```typescript
interface ADPOrganization {
  organizationalUnitID: string
  organizationalUnitName: string
  organizationalUnitType: {
    codeValue: string
    shortName: string
    longName: string
  }
  parentOrganizationalUnitID?: string
  organizationalUnitCode?: string
  effectiveDate: string
  organizationalUnitStatus: {
    statusCode: {
      codeValue: string
    }
    effectiveDate: string
  }
}

class ADPOrganizationService {
  private apiClient: ADPAPIClient
  
  async getOrganizationalUnits(): Promise<ADPOrganization[]> {
    const response = await this.apiClient.authenticatedRequest('/hr/v2/organizational-units')
    return response.organizationalUnits || []
  }
  
  async getDepartments(): Promise<ADPOrganization[]> {
    return await this.getOrganizationalUnitsByType('Department')
  }
  
  async getDivisions(): Promise<ADPOrganization[]> {
    return await this.getOrganizationalUnitsByType('Division')
  }
  
  async getCostCenters(): Promise<ADPOrganization[]> {
    return await this.getOrganizationalUnitsByType('CostCenter')
  }
  
  private async getOrganizationalUnitsByType(type: string): Promise<ADPOrganization[]> {
    const queryParams = new URLSearchParams({
      '$filter': `organizationalUnitType/codeValue eq '${type}'`
    })
    
    const response = await this.apiClient.authenticatedRequest(
      `/hr/v2/organizational-units?${queryParams}`
    )
    return response.organizationalUnits || []
  }
  
  async buildOrganizationHierarchy(): Promise<OrganizationHierarchy> {
    const allUnits = await this.getOrganizationalUnits()
    
    const hierarchy: OrganizationHierarchy = {
      root: [],
      departments: new Map(),
      divisions: new Map(),
      costCenters: new Map(),
      hierarchy: new Map()
    }
    
    // Build hierarchy map
    for (const unit of allUnits) {
      const orgData = {
        id: unit.organizationalUnitID,
        name: unit.organizationalUnitName,
        code: unit.organizationalUnitCode,
        type: unit.organizationalUnitType.codeValue,
        parentId: unit.parentOrganizationalUnitID,
        status: unit.organizationalUnitStatus.statusCode.codeValue,
        effectiveDate: new Date(unit.effectiveDate)
      }
      
      // Categorize by type
      switch (unit.organizationalUnitType.codeValue.toLowerCase()) {
        case 'department':
          hierarchy.departments.set(orgData.id, orgData)
          break
        case 'division':
          hierarchy.divisions.set(orgData.id, orgData)
          break
        case 'costcenter':
          hierarchy.costCenters.set(orgData.id, orgData)
          break
      }
      
      // Build parent-child relationships
      if (orgData.parentId) {
        if (!hierarchy.hierarchy.has(orgData.parentId)) {
          hierarchy.hierarchy.set(orgData.parentId, [])
        }
        hierarchy.hierarchy.get(orgData.parentId)!.push(orgData)
      } else {
        hierarchy.root.push(orgData)
      }
    }
    
    return hierarchy
  }
}
```

## Event Notifications & Webhooks

### 1. ADP Event Framework

ADP supports event-driven notifications through their Event API:

```typescript
interface ADPEventSubscription {
  subscriptionID?: string
  eventNameCode: {
    codeValue: string
  }
  notificationURI: string
  serviceCategoryCode: {
    codeValue: string
  }
  consumer: {
    consumerID: string
    consumerTypeCode: {
      codeValue: string
    }
  }
  eventContext?: {
    contextExpressions?: Array<{
      expressionValue: string
    }>
  }
}

class ADPEventService {
  private apiClient: ADPAPIClient
  
  async createEventSubscription(config: EventSubscriptionConfig): Promise<string> {
    const subscription: ADPEventSubscription = {
      eventNameCode: {
        codeValue: config.eventType
      },
      notificationURI: config.webhookUrl,
      serviceCategoryCode: {
        codeValue: 'HumanResources'
      },
      consumer: {
        consumerID: config.consumerId,
        consumerTypeCode: {
          codeValue: 'Application'
        }
      }
    }
    
    if (config.contextFilters) {
      subscription.eventContext = {
        contextExpressions: config.contextFilters.map(filter => ({
          expressionValue: filter
        }))
      }
    }
    
    const response = await this.apiClient.authenticatedRequest('/events/hr/v1/event-subscriptions', {
      method: 'POST',
      body: JSON.stringify({ eventSubscription: subscription })
    })
    
    return response.eventSubscription.subscriptionID
  }
  
  async getEventSubscriptions(): Promise<ADPEventSubscription[]> {
    const response = await this.apiClient.authenticatedRequest('/events/hr/v1/event-subscriptions')
    return response.eventSubscriptions || []
  }
  
  async deleteEventSubscription(subscriptionId: string): Promise<void> {
    await this.apiClient.authenticatedRequest(`/events/hr/v1/event-subscriptions/${subscriptionId}`, {
      method: 'DELETE'
    })
  }
}

enum ADPEventType {
  WORKER_HIRE = 'worker.hire',
  WORKER_TERMINATION = 'worker.termination',
  WORKER_DATA_CHANGE = 'worker.personalInformation.change',
  WORKER_JOB_CHANGE = 'worker.workAssignment.change',
  WORKER_COMPENSATION_CHANGE = 'worker.compensation.change'
}
```

### 2. Event Processing

```typescript
interface ADPEventPayload {
  eventID: string
  eventNameCode: {
    codeValue: string
  }
  eventDateTime: string
  eventReasonCode?: {
    codeValue: string
  }
  actor: {
    associateOID?: string
    applicationID?: string
  }
  links: Array<{
    href: string
    rel: string
    method?: string
  }>
  eventContext?: {
    worker?: {
      associateOID: string
    }
    workAssignment?: {
      itemID: string
    }
  }
  data?: {
    eventContext?: any
    output?: any
  }
}

async function handleADPEvent(
  payload: ADPEventPayload,
  signature: string
): Promise<EventResult> {
  // Verify event signature
  if (!verifyADPEventSignature(payload, signature)) {
    throw new Error('Invalid event signature')
  }
  
  const eventType = payload.eventNameCode.codeValue
  const workerOID = payload.eventContext?.worker?.associateOID
  
  if (!workerOID) {
    console.warn('Event received without worker context:', eventType)
    return { success: true, message: 'Event ignored - no worker context' }
  }
  
  switch (eventType) {
    case ADPEventType.WORKER_HIRE:
      return await handleWorkerHire(workerOID, payload)
    case ADPEventType.WORKER_TERMINATION:
      return await handleWorkerTermination(workerOID, payload)
    case ADPEventType.WORKER_DATA_CHANGE:
      return await handleWorkerDataChange(workerOID, payload)
    case ADPEventType.WORKER_JOB_CHANGE:
      return await handleWorkerJobChange(workerOID, payload)
    default:
      console.log(`Unhandled ADP event: ${eventType}`)
      return { success: true, message: 'Event type not handled' }
  }
}

async function handleWorkerHire(workerOID: string, payload: ADPEventPayload): Promise<EventResult> {
  try {
    // Fetch complete worker data from ADP
    const workersService = new ADPWorkersService(adpClient)
    const adpWorker = await workersService.getWorker(workerOID)
    
    // Map and store employee
    const employee = mapADPWorker(adpWorker)
    await db.employee.create({ data: employee })
    
    // Trigger matching process
    await triggerEmployeeMatching(employee.id)
    
    // Log the event
    await auditLogger.log({
      action: 'worker_hired_via_event',
      resourceId: employee.id,
      source: 'adp',
      details: {
        associateOID: workerOID,
        eventId: payload.eventID
      }
    })
    
    return {
      success: true,
      message: 'Worker hire processed',
      employeeId: employee.id
    }
  } catch (error) {
    console.error('Error processing worker hire event:', error)
    return { success: false, error: error.message }
  }
}

async function handleWorkerDataChange(workerOID: string, payload: ADPEventPayload): Promise<EventResult> {
  try {
    // Find existing employee
    const existingEmployee = await db.employee.findFirst({
      where: {
        externalId: workerOID,
        dataSource: IntegrationProvider.ADP
      }
    })
    
    if (!existingEmployee) {
      // Employee not found, treat as new hire
      return await handleWorkerHire(workerOID, payload)
    }
    
    // Fetch updated worker data
    const workersService = new ADPWorkersService(adpClient)
    const adpWorker = await workersService.getWorker(workerOID)
    
    // Map updated data
    const updatedEmployee = mapADPWorker(adpWorker)
    
    // Check for significant changes
    const significantChanges = checkForSignificantChanges(existingEmployee, updatedEmployee)
    
    // Update employee record
    await db.employee.update({
      where: { id: existingEmployee.id },
      data: {
        ...updatedEmployee,
        id: existingEmployee.id,
        lastSyncAt: new Date()
      }
    })
    
    // Trigger re-matching if needed
    if (significantChanges) {
      await triggerEmployeeMatching(existingEmployee.id)
    }
    
    return {
      success: true,
      message: 'Worker data change processed',
      employeeId: existingEmployee.id,
      triggeredMatching: significantChanges
    }
  } catch (error) {
    console.error('Error processing worker data change:', error)
    return { success: false, error: error.message }
  }
}

function verifyADPEventSignature(payload: ADPEventPayload, signature: string): boolean {
  const secret = process.env.ADP_WEBHOOK_SECRET!
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

## Bulk Data Operations

### 1. Batch Processing

```typescript
class ADPBatchProcessor {
  private workersService: ADPWorkersService
  private batchSize: number
  
  constructor(workersService: ADPWorkersService, batchSize = 50) {
    this.workersService = workersService
    this.batchSize = batchSize
  }
  
  async processAllWorkers(companyId: string): Promise<BatchProcessResult> {
    const startTime = new Date()
    let skip = 0
    let totalProcessed = 0
    let totalCreated = 0
    let totalUpdated = 0
    const errors: BatchError[] = []
    
    while (true) {
      try {
        // Fetch batch of workers
        const workers = await this.workersService.getWorkers({
          skip,
          top: this.batchSize,
          filter: "workAssignments/assignmentStatus/statusCode/codeValue eq 'Active'"
        })
        
        if (workers.length === 0) {
          break // No more workers
        }
        
        // Process batch
        const batchResult = await this.processBatch(workers, companyId)
        
        totalProcessed += batchResult.processed
        totalCreated += batchResult.created
        totalUpdated += batchResult.updated
        errors.push(...batchResult.errors)
        
        skip += this.batchSize
        
        // Rate limiting - ADP allows ~500 requests per minute
        await new Promise(resolve => setTimeout(resolve, 150))
        
      } catch (error) {
        console.error(`Batch processing error at skip ${skip}:`, error)
        errors.push({
          batch: skip,
          error: error.message,
          timestamp: new Date()
        })
        
        // Continue with next batch
        skip += this.batchSize
      }
    }
    
    return {
      totalProcessed,
      totalCreated,
      totalUpdated,
      totalErrors: errors.length,
      errors: errors.slice(0, 20), // Return first 20 errors
      processingTime: new Date().getTime() - startTime.getTime(),
      startTime,
      endTime: new Date()
    }
  }
  
  private async processBatch(workers: ADPWorker[], companyId: string): Promise<BatchResult> {
    const results = await Promise.allSettled(
      workers.map(worker => this.processWorker(worker, companyId))
    )
    
    let processed = 0
    let created = 0
    let updated = 0
    const errors: BatchError[] = []
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      
      if (result.status === 'fulfilled') {
        processed++
        if (result.value.action === 'created') {
          created++
        } else if (result.value.action === 'updated') {
          updated++
        }
      } else {
        errors.push({
          workerOID: workers[i].associateOID,
          error: result.reason.message,
          timestamp: new Date()
        })
      }
    }
    
    return { processed, created, updated, errors }
  }
  
  private async processWorker(
    adpWorker: ADPWorker, 
    companyId: string
  ): Promise<{ action: 'created' | 'updated' | 'skipped' }> {
    // Check if worker exists
    const existingEmployee = await db.employee.findFirst({
      where: {
        externalId: adpWorker.associateOID,
        dataSource: IntegrationProvider.ADP,
        companyId
      }
    })
    
    // Map worker data
    const mappedEmployee = mapADPWorker(adpWorker)
    mappedEmployee.companyId = companyId
    
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
}
```

## Configuration & Testing

### 1. Environment Configuration

```bash
# ADP OAuth Configuration
ADP_CLIENT_ID=your_client_id
ADP_CLIENT_SECRET=your_client_secret
ADP_ENVIRONMENT=production
ADP_API_BASE_URL=https://api.adp.com
ADP_TOKEN_URL=https://accounts.adp.com/auth/oauth/v2/token

# Event Configuration
ADP_WEBHOOK_SECRET=your_webhook_secret
ADP_WEBHOOK_URL=https://your-app.com/webhooks/adp

# Rate Limiting
ADP_RATE_LIMIT=500
ADP_BATCH_SIZE=50
ADP_REQUEST_DELAY=150
```

### 2. Integration Testing

```typescript
describe('ADP Integration', () => {
  let adpClient: ADPAPIClient
  let workersService: ADPWorkersService
  let mockWorker: ADPWorker
  
  beforeEach(() => {
    const config: ADPOAuthConfig = {
      clientId: 'test_client',
      clientSecret: 'test_secret',
      environment: 'sandbox',
      scope: adpScopes,
      tokenUrl: 'https://test.adp.com/auth/oauth/v2/token',
      apiBaseUrl: 'https://test-api.adp.com'
    }
    
    adpClient = new ADPAPIClient(config)
    workersService = new ADPWorkersService(adpClient)
    mockWorker = createMockADPWorker()
  })
  
  test('should map complex ADP worker data correctly', () => {
    const mapped = mapADPWorker(mockWorker)
    
    expect(mapped.firstName).toBe('John')
    expect(mapped.lastName).toBe('Doe')
    expect(mapped.dataSource).toBe(IntegrationProvider.ADP)
    expect(mapped.externalId).toBe(mockWorker.associateOID)
  })
  
  test('should handle batch processing', async () => {
    const batchProcessor = new ADPBatchProcessor(workersService, 10)
    
    // Mock the workers service
    jest.spyOn(workersService, 'getWorkers').mockResolvedValue([mockWorker])
    
    const result = await batchProcessor.processAllWorkers('test_company')
    
    expect(result.totalProcessed).toBeGreaterThan(0)
    expect(result.totalErrors).toBe(0)
  })
  
  test('should handle event notifications', async () => {
    const eventPayload: ADPEventPayload = {
      eventID: 'evt_123',
      eventNameCode: { codeValue: ADPEventType.WORKER_HIRE },
      eventDateTime: new Date().toISOString(),
      actor: { associateOID: 'test_actor' },
      links: [],
      eventContext: {
        worker: { associateOID: mockWorker.associateOID }
      }
    }
    
    const result = await handleADPEvent(eventPayload, 'valid_signature')
    expect(result.success).toBe(true)
  })
})

function createMockADPWorker(): ADPWorker {
  return {
    associateOID: 'test_oid_123',
    workerID: { idValue: 'EMP001' },
    person: {
      legalName: {
        givenName: 'John',
        familyName1: 'Doe'
      },
      communicationContacts: [
        {
          communicationContactType: { codeValue: 'Email' },
          communicationContactValue: 'john.doe@company.com'
        }
      ],
      governmentIDs: [
        {
          governmentIDType: { codeValue: 'SSN' },
          governmentIDValue: '123-45-6789'
        }
      ]
    },
    workAssignments: [
      {
        itemID: 'assignment_123',
        assignmentStartDate: '2023-01-15',
        hireDate: '2023-01-15',
        assignmentStatus: {
          statusCode: { codeValue: 'Active' }
        },
        positionTitle: 'Software Engineer',
        jobTitle: 'Software Engineer',
        employmentType: { codeValue: 'FullTime' },
        organizationalUnits: [
          {
            organizationalUnitID: 'dept_eng',
            organizationalUnitName: 'Engineering',
            organizationalUnitType: { codeValue: 'Department' }
          }
        ]
      }
    ]
  }
}
```

This ADP integration provides comprehensive employee data synchronization with support for complex nested data structures, real-time event processing, batch operations, and enterprise-grade security features suitable for large organizations.