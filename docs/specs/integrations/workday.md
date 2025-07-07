# Workday Integration Guide

## Overview

The Workday integration provides comprehensive employee data synchronization using Workday's SOAP-based Human Capital Management (HCM) API. This integration supports OAuth 2.0 authentication, complex data hierarchies, and real-time webhooks.

## Authentication Setup

### 1. OAuth 2.0 Configuration

Workday uses OAuth 2.0 with specific tenant configuration:

```typescript
interface WorkdayOAuthConfig {
  clientId: string
  clientSecret: string
  tenantName: string
  environment: 'production' | 'sandbox' | 'preview'
  scope: string[]
  
  // OAuth endpoints (tenant-specific)
  authorizationUrl: string // https://wd2-impl-services1.workday.com/{tenant}/oauth2/authorize
  tokenUrl: string         // https://wd2-impl-services1.workday.com/{tenant}/oauth2/token
  apiBaseUrl: string       // https://wd2-impl-services1.workday.com/ccx/service/{tenant}
}

const workdayScopes = [
  'Human_Resources',
  'Core',
  'Staffing',
  'Benefits_Administration'
]

class WorkdayOAuthClient {
  constructor(private config: WorkdayOAuthConfig) {}
  
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: this.config.scope.join(' '),
      state,
      redirect_uri: process.env.WORKDAY_REDIRECT_URI!
    })
    
    return `${this.config.authorizationUrl}?${params}`
  }
  
  async exchangeCodeForTokens(code: string): Promise<WorkdayTokens> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.WORKDAY_REDIRECT_URI!
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token exchange failed: ${error}`)
    }
    
    const tokens = await response.json()
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope
    }
  }
}
```

### 2. SOAP Service Authentication

```typescript
class WorkdaySOAPClient {
  private accessToken: string
  private tenantName: string
  private environment: string
  
  constructor(accessToken: string, tenantName: string, environment: string = 'production') {
    this.accessToken = accessToken
    this.tenantName = tenantName
    this.environment = environment
  }
  
  private getSOAPHeaders(): Record<string, string> {
    return {
      'Content-Type': 'text/xml; charset=utf-8',
      'Authorization': `Bearer ${this.accessToken}`,
      'SOAPAction': ''
    }
  }
  
  private buildSOAPEnvelope(operation: string, body: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope 
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
  xmlns:bsvc="urn:com.workday/bsvc">
  <soapenv:Header>
    <bsvc:Workday_Common_Header>
      <bsvc:Include_Reference_Descriptors_In_Response>true</bsvc:Include_Reference_Descriptors_In_Response>
    </bsvc:Workday_Common_Header>
  </soapenv:Header>
  <soapenv:Body>
    ${body}
  </soapenv:Body>
</soapenv:Envelope>`
  }
}
```

## Employee Data Integration

### 1. Complex Worker Data Structure

```typescript
interface WorkdayWorker {
  Worker_Reference: {
    ID: string
    Descriptor: string
  }
  Worker_Data: {
    Personal_Data: {
      Name_Data: {
        Legal_Name_Data: {
          Name_Detail_Data: {
            First_Name: string
            Last_Name: string
            Middle_Name?: string
            Suffix?: string
          }
        }
        Preferred_Name_Data?: {
          Name_Detail_Data: {
            First_Name: string
            Last_Name: string
          }
        }
      }
      Contact_Data: {
        Email_Address_Data: Array<{
          Email_Address: string
          Usage_Data: {
            Type_Data: {
              Primary: boolean
              Type_Reference: {
                ID: string
              }
            }
          }
        }>
        Phone_Data: Array<{
          Phone_Number: string
          Usage_Data: {
            Type_Data: {
              Primary: boolean
              Type_Reference: {
                ID: string
              }
            }
          }
        }>
        Address_Data: Array<{
          Country_Reference: { ID: string }
          Address_Line_Data: Array<{
            Type: string
            Address_Line: string
          }>
          Municipality: string
          Country_Region_Reference: { ID: string }
          Postal_Code: string
          Usage_Data: {
            Type_Data: {
              Primary: boolean
            }
          }
        }>
      }
      Identification_Data: {
        National_Identification_Data: Array<{
          National_Identification_Type: string
          National_Identification_Number: string
          Country_Reference: { ID: string }
        }>
      }
    }
    Employment_Data: {
      Worker_Job_Data: Array<{
        Position_Data: {
          Position_Reference: { ID: string }
          Position_Title: string
          Start_Date: string
          End_Date?: string
          Job_Profile_Summary_Data: {
            Job_Profile_Name: string
            Job_Category_Reference: { ID: string }
          }
          Organization_Data: Array<{
            Organization_Reference: { ID: string }
            Organization_Name: string
            Organization_Type_Reference: { ID: string }
          }>
          Business_Site_Summary_Data: {
            Name: string
            Address_Data: any
          }
          Position_Time_Type_Reference: { ID: string }
        }
      }>
      Worker_Status_Data: {
        Active: boolean
        Status_Date: string
        Hire_Date: string
        Termination_Date?: string
      }
    }
  }
}

function mapWorkdayWorker(workdayWorker: WorkdayWorker): Employee {
  const personalData = workdayWorker.Worker_Data.Personal_Data
  const employmentData = workdayWorker.Worker_Data.Employment_Data
  const primaryJob = employmentData.Worker_Job_Data[0] // Primary position
  
  // Extract names
  const legalName = personalData.Name_Data.Legal_Name_Data.Name_Detail_Data
  const preferredName = personalData.Name_Data.Preferred_Name_Data?.Name_Detail_Data
  
  // Extract contact information
  const primaryEmail = personalData.Contact_Data.Email_Address_Data
    .find(email => email.Usage_Data.Type_Data.Primary)?.Email_Address
  
  const primaryPhone = personalData.Contact_Data.Phone_Data
    .find(phone => phone.Usage_Data.Type_Data.Primary)?.Phone_Number
  
  const primaryAddress = personalData.Contact_Data.Address_Data
    .find(addr => addr.Usage_Data.Type_Data.Primary)
  
  // Extract SSN
  const ssn = personalData.Identification_Data.National_Identification_Data
    .find(id => id.National_Identification_Type === 'SSN')?.National_Identification_Number
  
  // Extract organization data
  const organization = primaryJob?.Position_Data.Organization_Data
    .find(org => org.Organization_Type_Reference.ID === 'DEPARTMENT')
  
  return {
    id: generateId(),
    companyId: '', // Set by integration context
    firstName: preferredName?.First_Name || legalName.First_Name,
    lastName: preferredName?.Last_Name || legalName.Last_Name,
    middleName: legalName.Middle_Name,
    suffix: legalName.Suffix,
    email: primaryEmail,
    phone: primaryPhone,
    ssn: ssn,
    startDate: new Date(employmentData.Worker_Status_Data.Hire_Date),
    endDate: employmentData.Worker_Status_Data.Termination_Date 
      ? new Date(employmentData.Worker_Status_Data.Termination_Date) 
      : undefined,
    status: mapWorkdayEmployeeStatus(employmentData.Worker_Status_Data.Active),
    jobTitle: primaryJob?.Position_Data.Position_Title,
    department: organization?.Organization_Name,
    positionId: primaryJob?.Position_Data.Position_Reference.ID,
    jobProfile: primaryJob?.Position_Data.Job_Profile_Summary_Data.Job_Profile_Name,
    workLocation: primaryJob?.Position_Data.Business_Site_Summary_Data.Name,
    employeeType: mapWorkdayPositionType(primaryJob?.Position_Data.Position_Time_Type_Reference.ID),
    address: primaryAddress ? mapWorkdayAddress(primaryAddress) : undefined,
    integrationId: 'workday',
    externalId: workdayWorker.Worker_Reference.ID,
    lastSyncAt: new Date(),
    dataSource: IntegrationProvider.WORKDAY,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function mapWorkdayEmployeeStatus(active: boolean): EmployeeStatus {
  return active ? EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE
}

function mapWorkdayPositionType(positionTypeId?: string): EmployeeType {
  switch (positionTypeId) {
    case 'Full_Time':
    case 'FULL_TIME':
      return EmployeeType.FULL_TIME
    case 'Part_Time':
    case 'PART_TIME':
      return EmployeeType.PART_TIME
    case 'Contract':
    case 'CONTRACTOR':
      return EmployeeType.CONTRACT
    case 'Intern':
    case 'INTERN':
      return EmployeeType.INTERN
    default:
      return EmployeeType.FULL_TIME
  }
}

function mapWorkdayAddress(addressData: any): Address {
  const addressLines = addressData.Address_Line_Data
    .map((line: any) => line.Address_Line)
    .join(', ')
  
  return {
    street: addressLines,
    city: addressData.Municipality,
    state: addressData.Country_Region_Reference.ID,
    zipCode: addressData.Postal_Code,
    country: addressData.Country_Reference.ID
  }
}
```

### 2. Advanced SOAP Queries

```typescript
class WorkdayHRService {
  private soapClient: WorkdaySOAPClient
  
  constructor(soapClient: WorkdaySOAPClient) {
    this.soapClient = soapClient
  }
  
  async getWorkers(options: GetWorkersOptions = {}): Promise<WorkdayWorker[]> {
    const requestBody = this.buildGetWorkersRequest(options)
    const soapEnvelope = this.soapClient.buildSOAPEnvelope('Get_Workers', requestBody)
    
    const response = await fetch(this.getHRServiceUrl(), {
      method: 'POST',
      headers: this.soapClient.getSOAPHeaders(),
      body: soapEnvelope
    })
    
    if (!response.ok) {
      throw new Error(`Workday API error: ${response.status} ${response.statusText}`)
    }
    
    const xmlResponse = await response.text()
    return this.parseGetWorkersResponse(xmlResponse)
  }
  
  async getWorkerById(workerId: string): Promise<WorkdayWorker> {
    const requestBody = `
      <bsvc:Get_Workers_Request>
        <bsvc:Request_References>
          <bsvc:Worker_Reference>
            <bsvc:ID bsvc:type="Employee_ID">${workerId}</bsvc:ID>
          </bsvc:Worker_Reference>
        </bsvc:Request_References>
        <bsvc:Response_Filter>
          <bsvc:Page>1</bsvc:Page>
          <bsvc:Count>1</bsvc:Count>
        </bsvc:Response_Filter>
        <bsvc:Response_Group>
          <bsvc:Include_Reference>true</bsvc:Include_Reference>
          <bsvc:Include_Personal_Information>true</bsvc:Include_Personal_Information>
          <bsvc:Include_Employment_Information>true</bsvc:Include_Employment_Information>
          <bsvc:Include_Organizations>true</bsvc:Include_Organizations>
        </bsvc:Response_Group>
      </bsvc:Get_Workers_Request>
    `
    
    const workers = await this.makeSOAPRequest('Get_Workers', requestBody)
    
    if (workers.length === 0) {
      throw new Error(`Worker not found: ${workerId}`)
    }
    
    return workers[0]
  }
  
  async getWorkersChangedSince(since: Date): Promise<WorkdayWorker[]> {
    const requestBody = `
      <bsvc:Get_Workers_Request>
        <bsvc:Request_Criteria>
          <bsvc:Transaction_Log_Criteria_Data>
            <bsvc:Transaction_Date_Range_Data>
              <bsvc:Updated_From>${since.toISOString()}</bsvc:Updated_From>
              <bsvc:Updated_Through>${new Date().toISOString()}</bsvc:Updated_Through>
            </bsvc:Transaction_Date_Range_Data>
          </bsvc:Transaction_Log_Criteria_Data>
        </bsvc:Request_Criteria>
        <bsvc:Response_Filter>
          <bsvc:Page>1</bsvc:Page>
          <bsvc:Count>1000</bsvc:Count>
        </bsvc:Response_Filter>
        <bsvc:Response_Group>
          <bsvc:Include_Reference>true</bsvc:Include_Reference>
          <bsvc:Include_Personal_Information>true</bsvc:Include_Personal_Information>
          <bsvc:Include_Employment_Information>true</bsvc:Include_Employment_Information>
        </bsvc:Response_Group>
      </bsvc:Get_Workers_Request>
    `
    
    return await this.makeSOAPRequest('Get_Workers', requestBody)
  }
  
  private buildGetWorkersRequest(options: GetWorkersOptions): string {
    const page = options.page || 1
    const count = options.count || 100
    
    let requestCriteria = ''
    if (options.activeOnly) {
      requestCriteria = `
        <bsvc:Request_Criteria>
          <bsvc:Exclude_Inactive_Workers>true</bsvc:Exclude_Inactive_Workers>
        </bsvc:Request_Criteria>
      `
    }
    
    return `
      <bsvc:Get_Workers_Request>
        ${requestCriteria}
        <bsvc:Response_Filter>
          <bsvc:Page>${page}</bsvc:Page>
          <bsvc:Count>${count}</bsvc:Count>
        </bsvc:Response_Filter>
        <bsvc:Response_Group>
          <bsvc:Include_Reference>true</bsvc:Include_Reference>
          <bsvc:Include_Personal_Information>true</bsvc:Include_Personal_Information>
          <bsvc:Include_Employment_Information>true</bsvc:Include_Employment_Information>
          <bsvc:Include_Organizations>true</bsvc:Include_Organizations>
          <bsvc:Include_Roles>false</bsvc:Include_Roles>
          <bsvc:Include_Management_Chain_Data>false</bsvc:Include_Management_Chain_Data>
        </bsvc:Response_Group>
      </bsvc:Get_Workers_Request>
    `
  }
  
  private async makeSOAPRequest(operation: string, requestBody: string): Promise<WorkdayWorker[]> {
    const soapEnvelope = this.soapClient.buildSOAPEnvelope(operation, requestBody)
    
    const response = await fetch(this.getHRServiceUrl(), {
      method: 'POST',
      headers: {
        ...this.soapClient.getSOAPHeaders(),
        'SOAPAction': operation
      },
      body: soapEnvelope
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Workday SOAP error: ${response.status} - ${errorText}`)
    }
    
    const xmlResponse = await response.text()
    return this.parseGetWorkersResponse(xmlResponse)
  }
  
  private parseGetWorkersResponse(xmlResponse: string): WorkdayWorker[] {
    // Use XML parser (xml2js, fast-xml-parser, etc.)
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text'
    })
    
    const parsed = parser.parse(xmlResponse)
    const envelope = parsed['soapenv:Envelope'] || parsed['soap:Envelope']
    const body = envelope['soapenv:Body'] || envelope['soap:Body']
    const response = body['bsvc:Get_Workers_Response']
    
    if (!response || !response['bsvc:Response_Data']) {
      return []
    }
    
    const workers = response['bsvc:Response_Data']['bsvc:Worker']
    return Array.isArray(workers) ? workers : [workers]
  }
  
  private getHRServiceUrl(): string {
    return `https://wd2-impl-services1.workday.com/ccx/service/${this.soapClient.tenantName}/Human_Resources/v40.0`
  }
}
```

## Organizational Data Integration

### 1. Organization Hierarchy

```typescript
interface WorkdayOrganization {
  Organization_Reference: {
    ID: string
    Descriptor: string
  }
  Organization_Data: {
    Organization_Code: string
    Organization_Name: string
    Organization_Type_Reference: {
      ID: string
      Descriptor: string
    }
    Organization_Support_Role_Data: {
      Organization_Roles: Array<{
        Organization_Role_Reference: { ID: string }
        Primary: boolean
      }>
    }
    Hierarchy_Data: {
      Superior_Organization_Reference?: { ID: string }
      Subordinate_Organization_References?: Array<{ ID: string }>
    }
    Contact_Data: any
    Location_Data: any
  }
}

class WorkdayOrganizationService {
  private soapClient: WorkdaySOAPClient
  
  async getOrganizations(): Promise<WorkdayOrganization[]> {
    const requestBody = `
      <bsvc:Get_Organizations_Request>
        <bsvc:Response_Filter>
          <bsvc:Page>1</bsvc:Page>
          <bsvc:Count>1000</bsvc:Count>
        </bsvc:Response_Filter>
        <bsvc:Response_Group>
          <bsvc:Include_Reference>true</bsvc:Include_Reference>
          <bsvc:Include_Organization_Data>true</bsvc:Include_Organization_Data>
          <bsvc:Include_Hierarchy_Data>true</bsvc:Include_Hierarchy_Data>
        </bsvc:Response_Group>
      </bsvc:Get_Organizations_Request>
    `
    
    return await this.makeSOAPRequest('Get_Organizations', requestBody)
  }
  
  async buildOrganizationHierarchy(): Promise<OrganizationHierarchy> {
    const organizations = await this.getOrganizations()
    
    const orgMap = new Map<string, WorkdayOrganization>()
    const hierarchy: OrganizationHierarchy = {
      root: [],
      departments: new Map(),
      locations: new Map(),
      costCenters: new Map()
    }
    
    // Build organization map and categorize
    for (const org of organizations) {
      orgMap.set(org.Organization_Reference.ID, org)
      
      const orgType = org.Organization_Data.Organization_Type_Reference.ID
      const orgData = {
        id: org.Organization_Reference.ID,
        name: org.Organization_Data.Organization_Name,
        code: org.Organization_Data.Organization_Code,
        type: orgType,
        parentId: org.Organization_Data.Hierarchy_Data.Superior_Organization_Reference?.ID
      }
      
      switch (orgType) {
        case 'DEPARTMENT':
        case 'Department':
          hierarchy.departments.set(orgData.id, orgData)
          break
        case 'LOCATION':
        case 'Location':
          hierarchy.locations.set(orgData.id, orgData)
          break
        case 'COST_CENTER':
        case 'Cost_Center':
          hierarchy.costCenters.set(orgData.id, orgData)
          break
      }
    }
    
    return hierarchy
  }
}
```

## Webhooks & Event Notifications

### 1. Workday Event Framework

```typescript
interface WorkdayWebhookConfig {
  eventTypes: WorkdayEventType[]
  deliveryUrl: string
  secretKey: string
  includeReferenceData: boolean
  includeTransactionLogData: boolean
}

enum WorkdayEventType {
  WORKER_HIRED = 'Worker_Hired',
  WORKER_TERMINATED = 'Worker_Terminated',
  WORKER_DATA_CHANGED = 'Worker_Data_Changed',
  POSITION_CHANGED = 'Position_Changed',
  ORGANIZATION_ASSIGNED = 'Organization_Assigned'
}

class WorkdayWebhookManager {
  private soapClient: WorkdaySOAPClient
  
  async createEventSubscription(config: WorkdayWebhookConfig): Promise<string> {
    const requestBody = `
      <bsvc:Put_Integration_Event_Request>
        <bsvc:Integration_Event_Data>
          <bsvc:Integration_Event_Name>Employee_Change_Notification</bsvc:Integration_Event_Name>
          <bsvc:Event_Type_References>
            ${config.eventTypes.map(eventType => `
              <bsvc:Event_Type_Reference>
                <bsvc:ID bsvc:type="Event_Type_ID">${eventType}</bsvc:ID>
              </bsvc:Event_Type_Reference>
            `).join('')}
          </bsvc:Event_Type_References>
          <bsvc:Delivery_Configuration_Data>
            <bsvc:Delivery_Method>REST</bsvc:Delivery_Method>
            <bsvc:REST_Delivery_Configuration_Data>
              <bsvc:Endpoint_URL>${config.deliveryUrl}</bsvc:Endpoint_URL>
              <bsvc:HTTP_Method>POST</bsvc:HTTP_Method>
              <bsvc:Authentication_Type>API_Key</bsvc:Authentication_Type>
              <bsvc:API_Key>${config.secretKey}</bsvc:API_Key>
            </bsvc:REST_Delivery_Configuration_Data>
          </bsvc:Delivery_Configuration_Data>
          <bsvc:Include_Reference_Data>${config.includeReferenceData}</bsvc:Include_Reference_Data>
          <bsvc:Include_Transaction_Log_Data>${config.includeTransactionLogData}</bsvc:Include_Transaction_Log_Data>
        </bsvc:Integration_Event_Data>
      </bsvc:Put_Integration_Event_Request>
    `
    
    const response = await this.makeSOAPRequest('Put_Integration_Event', requestBody)
    return response.Integration_Event_Reference.ID
  }
}
```

### 2. Webhook Event Processing

```typescript
interface WorkdayWebhookPayload {
  eventType: WorkdayEventType
  eventId: string
  eventDate: string
  workerReference: {
    ID: string
    Descriptor: string
  }
  transactionLogData?: {
    transactionId: string
    effectiveDate: string
    enteredDate: string
    transactionStatus: string
  }
  eventData: any
}

async function handleWorkdayWebhook(
  payload: WorkdayWebhookPayload,
  signature: string
): Promise<WebhookResult> {
  // Verify webhook signature
  if (!verifyWorkdaySignature(payload, signature)) {
    throw new Error('Invalid webhook signature')
  }
  
  const { eventType, workerReference, eventData } = payload
  
  switch (eventType) {
    case WorkdayEventType.WORKER_HIRED:
      return await handleWorkerHired(workerReference.ID, eventData)
    case WorkdayEventType.WORKER_TERMINATED:
      return await handleWorkerTerminated(workerReference.ID, eventData)
    case WorkdayEventType.WORKER_DATA_CHANGED:
      return await handleWorkerDataChanged(workerReference.ID, eventData)
    case WorkdayEventType.POSITION_CHANGED:
      return await handlePositionChanged(workerReference.ID, eventData)
    default:
      console.warn(`Unhandled Workday event: ${eventType}`)
      return { success: true, message: 'Event ignored' }
  }
}

async function handleWorkerHired(workerId: string, eventData: any): Promise<WebhookResult> {
  try {
    // Fetch complete worker data from Workday
    const hrService = new WorkdayHRService(workdaySOAPClient)
    const worker = await hrService.getWorkerById(workerId)
    
    // Map and store employee
    const employee = mapWorkdayWorker(worker)
    await db.employee.create({ data: employee })
    
    // Trigger matching process
    await triggerEmployeeMatching(employee.id)
    
    return {
      success: true,
      message: 'Worker hired processed',
      employeeId: employee.id
    }
  } catch (error) {
    console.error('Error processing worker hired event:', error)
    return { success: false, error: error.message }
  }
}

async function handleWorkerDataChanged(workerId: string, eventData: any): Promise<WebhookResult> {
  try {
    // Find existing employee
    const existingEmployee = await db.employee.findFirst({
      where: {
        externalId: workerId,
        dataSource: IntegrationProvider.WORKDAY
      }
    })
    
    if (!existingEmployee) {
      // Employee not found, treat as new hire
      return await handleWorkerHired(workerId, eventData)
    }
    
    // Fetch updated worker data
    const hrService = new WorkdayHRService(workdaySOAPClient)
    const worker = await hrService.getWorkerById(workerId)
    
    // Map updated data
    const updatedEmployee = mapWorkdayWorker(worker)
    
    // Update employee record
    await db.employee.update({
      where: { id: existingEmployee.id },
      data: {
        ...updatedEmployee,
        id: existingEmployee.id,
        lastSyncAt: new Date()
      }
    })
    
    // Check if significant changes require re-matching
    const significantChanges = checkForSignificantChanges(existingEmployee, updatedEmployee)
    if (significantChanges) {
      await triggerEmployeeMatching(existingEmployee.id)
    }
    
    return {
      success: true,
      message: 'Worker data updated',
      employeeId: existingEmployee.id,
      triggeredMatching: significantChanges
    }
  } catch (error) {
    console.error('Error processing worker data change:', error)
    return { success: false, error: error.message }
  }
}

function checkForSignificantChanges(existing: Employee, updated: Employee): boolean {
  const significantFields = ['firstName', 'lastName', 'email', 'phone', 'ssn']
  return significantFields.some(field => existing[field] !== updated[field])
}
```

## Advanced Features

### 1. Compensation Data Integration

```typescript
interface WorkdayCompensationData {
  Worker_Reference: { ID: string }
  Compensation_Data: {
    Base_Pay: {
      Amount: number
      Currency_Reference: { ID: string }
      Frequency_Reference: { ID: string }
    }
    Total_Base_Pay: {
      Amount: number
      Currency_Reference: { ID: string }
    }
    Pay_Plan_Reference: { ID: string }
    Compensation_Grade_Reference: { ID: string }
  }
}

class WorkdayCompensationService {
  async getWorkerCompensation(workerId: string): Promise<WorkdayCompensationData> {
    const requestBody = `
      <bsvc:Get_Worker_Compensation_Request>
        <bsvc:Request_References>
          <bsvc:Worker_Reference>
            <bsvc:ID bsvc:type="Employee_ID">${workerId}</bsvc:ID>
          </bsvc:Worker_Reference>
        </bsvc:Request_References>
        <bsvc:Response_Group>
          <bsvc:Include_Compensation_Data>true</bsvc:Include_Compensation_Data>
          <bsvc:Include_Salary_and_Hourly_Plans>true</bsvc:Include_Salary_and_Hourly_Plans>
        </bsvc:Response_Group>
      </bsvc:Get_Worker_Compensation_Request>
    `
    
    return await this.makeSOAPRequest('Get_Worker_Compensation', requestBody)
  }
}
```

### 2. Custom Object Integration

```typescript
class WorkdayCustomObjectService {
  async getCustomObjects(objectType: string): Promise<any[]> {
    const requestBody = `
      <bsvc:Get_Custom_Objects_Request>
        <bsvc:Request_Criteria>
          <bsvc:Custom_Object_Type_Reference>
            <bsvc:ID bsvc:type="Custom_Object_Type_ID">${objectType}</bsvc:ID>
          </bsvc:Custom_Object_Type_Reference>
        </bsvc:Request_Criteria>
        <bsvc:Response_Filter>
          <bsvc:Page>1</bsvc:Page>
          <bsvc:Count>1000</bsvc:Count>
        </bsvc:Response_Filter>
      </bsvc:Get_Custom_Objects_Request>
    `
    
    return await this.makeSOAPRequest('Get_Custom_Objects', requestBody)
  }
}
```

## Configuration & Testing

### 1. Environment Configuration

```bash
# Workday OAuth Configuration
WORKDAY_CLIENT_ID=your_client_id
WORKDAY_CLIENT_SECRET=your_client_secret
WORKDAY_TENANT_NAME=your_tenant
WORKDAY_ENVIRONMENT=production
WORKDAY_REDIRECT_URI=https://your-app.com/auth/workday/callback

# Workday API Configuration
WORKDAY_API_VERSION=v40.0
WORKDAY_TIMEOUT=60000
WORKDAY_RATE_LIMIT=500

# Webhook Configuration
WORKDAY_WEBHOOK_SECRET=your_webhook_secret
WORKDAY_WEBHOOK_URL=https://your-app.com/webhooks/workday
```

### 2. Integration Testing

```typescript
describe('Workday Integration', () => {
  let hrService: WorkdayHRService
  let mockWorker: WorkdayWorker
  
  beforeEach(() => {
    // Setup mock Workday worker data
    mockWorker = createMockWorkdayWorker()
    hrService = new WorkdayHRService(mockSOAPClient)
  })
  
  test('should map complex Workday worker data correctly', () => {
    const mapped = mapWorkdayWorker(mockWorker)
    
    expect(mapped.firstName).toBe('John')
    expect(mapped.lastName).toBe('Doe')
    expect(mapped.dataSource).toBe(IntegrationProvider.WORKDAY)
    expect(mapped.department).toBe('Engineering')
  })
  
  test('should handle webhook events', async () => {
    const webhookPayload: WorkdayWebhookPayload = {
      eventType: WorkdayEventType.WORKER_HIRED,
      eventId: 'evt_123',
      eventDate: new Date().toISOString(),
      workerReference: { ID: 'worker_123', Descriptor: 'John Doe' },
      eventData: {}
    }
    
    const result = await handleWorkdayWebhook(webhookPayload, 'valid_signature')
    expect(result.success).toBe(true)
  })
})
```

This Workday integration provides comprehensive employee and organizational data synchronization with support for complex SOAP operations, real-time webhooks, and enterprise-grade security features.