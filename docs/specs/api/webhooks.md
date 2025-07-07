# Webhook Integration Guide

## Overview

Webhooks provide real-time notifications about events in the "Are We Hiring the Same Guy" platform, allowing your systems to respond immediately to employment conflicts, integration updates, and compliance alerts.

## Webhook Configuration

### 1. Creating Webhooks

```typescript
// POST /api/webhooks
const webhook = await fetch('/api/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://your-app.com/webhooks/employment-conflicts',
    events: [
      'match.created',
      'match.reviewed',
      'compliance.alert'
    ],
    description: 'Employment conflict notifications'
  })
})
```

### 2. Webhook Events

#### Available Event Types

```typescript
enum WebhookEvent {
  // Match Events
  MATCH_CREATED = 'match.created',
  MATCH_UPDATED = 'match.updated', 
  MATCH_REVIEWED = 'match.reviewed',
  
  // Employee Events
  EMPLOYEE_CREATED = 'employee.created',
  EMPLOYEE_UPDATED = 'employee.updated',
  EMPLOYEE_DELETED = 'employee.deleted',
  
  // Integration Events
  INTEGRATION_SYNC_COMPLETED = 'integration.sync.completed',
  INTEGRATION_SYNC_FAILED = 'integration.sync.failed',
  INTEGRATION_ERROR = 'integration.error',
  
  // Compliance Events
  COMPLIANCE_ALERT = 'compliance.alert',
  PRIVACY_REQUEST = 'privacy.request',
  DATA_RETENTION_DUE = 'data.retention.due'
}
```

## Webhook Payload Structure

### 1. Common Payload Format

All webhooks follow a consistent structure:

```typescript
interface WebhookPayload {
  // Event metadata
  event: WebhookEvent
  eventId: string
  timestamp: string // ISO 8601
  version: string // API version
  
  // Company context
  companyId: string
  
  // Event-specific data
  data: EventData
  
  // Additional context
  context?: {
    triggeredBy?: string // User ID that triggered the event
    source?: string // System source (api, integration, scheduled)
    correlationId?: string // For tracking related events
  }
}
```

### 2. Event-Specific Payloads

#### Match Created Event

```json
{
  "event": "match.created",
  "eventId": "evt_123456789",
  "timestamp": "2023-12-07T10:30:00Z",
  "version": "1.0",
  "companyId": "comp_abc123",
  "data": {
    "match": {
      "id": "match_xyz789",
      "employee1Id": "emp_111",
      "employee2Id": "emp_222",
      "confidenceScore": 0.87,
      "riskLevel": "high",
      "status": "pending",
      "temporalOverlap": true,
      "overlapDays": 45,
      "matchFactors": [
        {
          "type": "ssn",
          "similarity": 1.0,
          "weight": 0.45
        },
        {
          "type": "email",
          "similarity": 0.95,
          "weight": 0.25
        }
      ],
      "employee1Summary": {
        "name": "John D***",
        "company": "TechCorp Inc",
        "jobTitle": "Software Engineer",
        "startDate": "2023-01-15"
      },
      "employee2Summary": {
        "name": "John D***",
        "company": "DataSoft LLC", 
        "jobTitle": "Senior Developer",
        "startDate": "2023-02-01"
      },
      "createdAt": "2023-12-07T10:30:00Z"
    }
  },
  "context": {
    "triggeredBy": "system",
    "source": "matching_engine",
    "correlationId": "batch_match_456"
  }
}
```

#### Match Reviewed Event

```json
{
  "event": "match.reviewed",
  "eventId": "evt_123456790",
  "timestamp": "2023-12-07T14:15:00Z",
  "version": "1.0",
  "companyId": "comp_abc123",
  "data": {
    "match": {
      "id": "match_xyz789",
      "status": "confirmed",
      "previousStatus": "pending",
      "reviewedBy": "user_hr_manager",
      "reviewedAt": "2023-12-07T14:15:00Z",
      "reviewNotes": "Confirmed dual employment - escalating to legal team",
      "confidenceScore": 0.87,
      "riskLevel": "high"
    },
    "actions": [
      {
        "type": "notification_sent",
        "target": "legal_team",
        "timestamp": "2023-12-07T14:15:30Z"
      }
    ]
  },
  "context": {
    "triggeredBy": "user_hr_manager",
    "source": "api"
  }
}
```

#### Employee Created Event

```json
{
  "event": "employee.created",
  "eventId": "evt_123456791",
  "timestamp": "2023-12-07T09:00:00Z",
  "version": "1.0",
  "companyId": "comp_abc123",
  "data": {
    "employee": {
      "id": "emp_333",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "j***@company.com",
      "startDate": "2023-12-01",
      "status": "active",
      "jobTitle": "Marketing Manager",
      "department": "Marketing",
      "employeeType": "full_time",
      "integrationId": "int_justworks_123",
      "createdAt": "2023-12-07T09:00:00Z"
    },
    "source": {
      "integration": "justworks",
      "externalId": "jw_emp_567"
    }
  },
  "context": {
    "triggeredBy": "integration_sync",
    "source": "integration",
    "correlationId": "sync_justworks_20231207"
  }
}
```

#### Integration Sync Completed Event

```json
{
  "event": "integration.sync.completed",
  "eventId": "evt_123456792",
  "timestamp": "2023-12-07T08:30:00Z",
  "version": "1.0",
  "companyId": "comp_abc123",
  "data": {
    "integration": {
      "id": "int_justworks_123",
      "provider": "justworks",
      "name": "TechCorp JustWorks Integration"
    },
    "syncResult": {
      "jobId": "sync_789",
      "startedAt": "2023-12-07T08:00:00Z",
      "completedAt": "2023-12-07T08:30:00Z",
      "status": "completed",
      "employeesProcessed": 150,
      "employeesAdded": 3,
      "employeesUpdated": 7,
      "employeesRemoved": 1,
      "errors": []
    }
  },
  "context": {
    "triggeredBy": "scheduled_sync",
    "source": "integration"
  }
}
```

#### Compliance Alert Event

```json
{
  "event": "compliance.alert",
  "eventId": "evt_123456793",
  "timestamp": "2023-12-07T16:45:00Z",
  "version": "1.0",
  "companyId": "comp_abc123",
  "data": {
    "alert": {
      "id": "alert_compliance_001",
      "type": "data_retention_violation",
      "severity": "high",
      "title": "Employee data past retention period",
      "description": "5 terminated employees have data older than 7 years",
      "regulation": "gdpr",
      "affectedRecords": 5,
      "dueDate": "2023-12-15T00:00:00Z",
      "recommendations": [
        "Review and delete employee records past retention period",
        "Update data retention policies",
        "Schedule automatic cleanup"
      ]
    },
    "affectedEmployees": [
      {
        "id": "emp_old_001",
        "name": "John D***",
        "terminationDate": "2015-06-30",
        "dataAge": "8.5 years"
      }
    ]
  },
  "context": {
    "triggeredBy": "compliance_monitor",
    "source": "scheduled"
  }
}
```

## Webhook Security

### 1. Signature Verification

All webhooks include a signature header for verification:

```typescript
// Webhook headers
const headers = {
  'Content-Type': 'application/json',
  'X-Webhook-Signature': 'sha256=<signature>',
  'X-Webhook-Event': 'match.created',
  'X-Webhook-Delivery': 'delivery_uuid',
  'X-Webhook-Timestamp': '1701946200'
}

// Verify signature
function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  const receivedSignature = signature.replace('sha256=', '')
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  )
}
```

### 2. Example Webhook Handler (Node.js/Express)

```typescript
import express from 'express'
import crypto from 'crypto'

const app = express()

// Middleware to capture raw body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }))

app.post('/webhooks/employment-conflicts', (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string
  const event = req.headers['x-webhook-event'] as string
  const deliveryId = req.headers['x-webhook-delivery'] as string
  const timestamp = req.headers['x-webhook-timestamp'] as string
  
  // Verify signature
  const webhookSecret = process.env.WEBHOOK_SECRET!
  if (!verifyWebhookSignature(req.body.toString(), signature, webhookSecret)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }
  
  // Verify timestamp (prevent replay attacks)
  const currentTime = Math.floor(Date.now() / 1000)
  const webhookTime = parseInt(timestamp)
  if (Math.abs(currentTime - webhookTime) > 300) { // 5 minutes tolerance
    return res.status(401).json({ error: 'Request timestamp too old' })
  }
  
  // Parse payload
  const payload = JSON.parse(req.body.toString())
  
  // Handle event
  try {
    switch (event) {
      case 'match.created':
        handleMatchCreated(payload.data.match)
        break
      case 'match.reviewed':
        handleMatchReviewed(payload.data.match)
        break
      case 'compliance.alert':
        handleComplianceAlert(payload.data.alert)
        break
      default:
        console.log(`Unhandled event: ${event}`)
    }
    
    // Acknowledge receipt
    res.status(200).json({ 
      success: true, 
      deliveryId,
      processedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ 
      error: 'Processing failed',
      deliveryId 
    })
  }
})

// Event handlers
async function handleMatchCreated(match: MatchData) {
  console.log(`New employment conflict detected: ${match.id}`)
  
  if (match.riskLevel === 'high' || match.riskLevel === 'critical') {
    // Send immediate alert to HR team
    await sendSlackAlert({
      channel: '#hr-alerts',
      text: `🚨 High-risk employment conflict detected`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Match ID:* ${match.id}\n*Risk Level:* ${match.riskLevel}\n*Confidence:* ${Math.round(match.confidenceScore * 100)}%`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Employee 1:* ${match.employee1Summary.name} at ${match.employee1Summary.company}\n*Employee 2:* ${match.employee2Summary.name} at ${match.employee2Summary.company}`
          }
        }
      ]
    })
    
    // Create ticket in support system
    await createSupportTicket({
      title: `Employment Conflict - ${match.id}`,
      priority: match.riskLevel === 'critical' ? 'urgent' : 'high',
      description: `Potential dual employment detected with ${match.confidenceScore * 100}% confidence`,
      assignee: 'hr-team'
    })
  }
}

async function handleMatchReviewed(match: MatchData) {
  console.log(`Match reviewed: ${match.id} - Status: ${match.status}`)
  
  if (match.status === 'confirmed') {
    // Trigger compliance workflow
    await triggerComplianceWorkflow({
      matchId: match.id,
      reviewNotes: match.reviewNotes,
      escalationLevel: match.riskLevel
    })
    
    // Update internal systems
    await updateEmployeeFlags({
      employeeIds: [match.employee1Id, match.employee2Id],
      flag: 'dual_employment_confirmed',
      evidence: {
        matchId: match.id,
        reviewDate: match.reviewedAt
      }
    })
  }
}

async function handleComplianceAlert(alert: ComplianceAlert) {
  console.log(`Compliance alert: ${alert.type} - Severity: ${alert.severity}`)
  
  // Log to compliance system
  await logComplianceEvent({
    alertId: alert.id,
    type: alert.type,
    severity: alert.severity,
    regulation: alert.regulation,
    affectedRecords: alert.affectedRecords
  })
  
  if (alert.severity === 'critical' || alert.severity === 'high') {
    // Notify compliance team immediately
    await sendEmailAlert({
      to: ['compliance@company.com', 'legal@company.com'],
      subject: `Urgent: ${alert.title}`,
      body: `
        A ${alert.severity} compliance alert has been triggered:
        
        Type: ${alert.type}
        Regulation: ${alert.regulation}
        Affected Records: ${alert.affectedRecords}
        Due Date: ${alert.dueDate}
        
        Recommendations:
        ${alert.recommendations.map(r => `- ${r}`).join('\n')}
        
        Please review and take action immediately.
      `
    })
  }
}
```

## Webhook Delivery & Reliability

### 1. Delivery Guarantees

- **At-least-once delivery**: Webhooks may be delivered multiple times
- **Retry mechanism**: Failed deliveries are retried with exponential backoff
- **Timeout handling**: Webhook endpoints must respond within 30 seconds
- **Ordering**: Events are delivered in chronological order when possible

### 2. Retry Policy

```typescript
interface RetryPolicy {
  maxAttempts: 5
  initialDelay: 1000      // 1 second
  maxDelay: 300000        // 5 minutes
  backoffMultiplier: 2    // Exponential backoff
  
  // Retry schedule: 1s, 2s, 4s, 8s, 16s (capped at 5 minutes)
  getRetryDelay(attempt: number): number {
    const delay = this.initialDelay * Math.pow(this.backoffMultiplier, attempt - 1)
    return Math.min(delay, this.maxDelay)
  }
}
```

### 3. Delivery Status Codes

Your webhook endpoint should return appropriate HTTP status codes:

- **200-299**: Success - webhook processed successfully
- **400-499**: Client error - webhook will not be retried
- **500-599**: Server error - webhook will be retried according to retry policy

### 4. Idempotency

Handle duplicate deliveries by checking the `X-Webhook-Delivery` header:

```typescript
const processedDeliveries = new Set<string>()

app.post('/webhook', (req, res) => {
  const deliveryId = req.headers['x-webhook-delivery'] as string
  
  if (processedDeliveries.has(deliveryId)) {
    return res.status(200).json({ 
      success: true, 
      message: 'Already processed' 
    })
  }
  
  // Process webhook...
  processedDeliveries.add(deliveryId)
  
  res.status(200).json({ success: true })
})
```

## Webhook Management

### 1. Testing Webhooks

Use the webhook test endpoint to verify your integration:

```typescript
// POST /api/webhooks/{webhookId}/test
await fetch(`/api/webhooks/${webhookId}/test`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event: 'match.created',
    sampleData: true
  })
})
```

### 2. Webhook Logs

Monitor webhook delivery status via the API:

```typescript
// GET /api/webhooks/{webhookId}/deliveries
const deliveries = await fetch(`/api/webhooks/${webhookId}/deliveries`)
const data = await deliveries.json()

// Example response
{
  "data": [
    {
      "id": "del_123",
      "event": "match.created",
      "status": "success",
      "attempts": 1,
      "lastAttempt": "2023-12-07T10:30:00Z",
      "responseStatus": 200,
      "responseTime": 150
    },
    {
      "id": "del_124", 
      "event": "match.reviewed",
      "status": "failed",
      "attempts": 3,
      "lastAttempt": "2023-12-07T11:15:00Z",
      "responseStatus": 500,
      "errorMessage": "Internal server error"
    }
  ]
}
```

### 3. Webhook Configuration Best Practices

#### Production Setup

```typescript
const productionWebhook = {
  url: 'https://your-secure-app.com/webhooks/employment-conflicts',
  events: [
    'match.created',
    'match.reviewed', 
    'compliance.alert'
  ],
  // Use environment-specific URLs
  description: 'Production employment conflict notifications',
  
  // Configure security
  secret: process.env.WEBHOOK_SECRET,
  
  // Set appropriate timeouts
  timeout: 30000,
  
  // Enable retry for critical events
  retryPolicy: {
    enabled: true,
    maxAttempts: 5
  }
}
```

#### Development/Testing Setup

```typescript
const developmentWebhook = {
  url: 'https://webhook-test-site.com/your-unique-id',
  events: ['*'], // Subscribe to all events for testing
  description: 'Development testing webhook',
  
  // Disable retries for testing
  retryPolicy: {
    enabled: false
  }
}
```

## Event Filtering & Customization

### 1. Event Filters

Configure webhooks to only receive relevant events:

```typescript
const webhookConfig = {
  url: 'https://your-app.com/webhooks',
  events: ['match.created', 'match.reviewed'],
  
  // Additional filters
  filters: {
    // Only high and critical risk matches
    riskLevels: ['high', 'critical'],
    
    // Only matches above confidence threshold
    minimumConfidence: 0.8,
    
    // Specific departments
    departments: ['Engineering', 'Finance'],
    
    // Exclude certain event sources
    excludeSources: ['test', 'migration']
  }
}
```

### 2. Custom Data Fields

Request additional data in webhook payloads:

```typescript
const webhookConfig = {
  url: 'https://your-app.com/webhooks',
  events: ['match.created'],
  
  // Include additional employee data
  includeFields: [
    'employee.department',
    'employee.manager',
    'employee.location',
    'match.detailedAnalysis'
  ],
  
  // Data privacy settings
  dataPrivacy: {
    maskPii: true,
    anonymizeNames: false,
    includeInternalIds: true
  }
}
```

## Error Handling & Troubleshooting

### 1. Common Issues

#### SSL Certificate Errors
```bash
# Ensure your webhook endpoint has valid SSL certificate
curl -I https://your-app.com/webhooks
```

#### Timeout Issues
```typescript
// Optimize webhook handler for quick response
app.post('/webhook', (req, res) => {
  // Acknowledge immediately
  res.status(200).json({ received: true })
  
  // Process asynchronously
  processWebhookAsync(req.body)
})
```

#### Signature Verification Failures
```typescript
// Debug signature verification
function debugSignature(payload: string, signature: string, secret: string) {
  const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  console.log('Received signature:', signature)
  console.log('Computed signature:', computed)
  console.log('Match:', signature.replace('sha256=', '') === computed)
}
```

### 2. Monitoring & Alerting

Set up monitoring for webhook health:

```typescript
// Monitor webhook success rates
const webhookMetrics = {
  successRate: 0.98,
  averageResponseTime: 200,
  lastSuccessfulDelivery: '2023-12-07T16:45:00Z',
  failureCount24h: 2
}

// Alert if success rate drops below threshold
if (webhookMetrics.successRate < 0.95) {
  sendAlert('Webhook success rate below 95%')
}
```

## Webhook Events Reference

### Quick Reference Table

| Event | Description | Retry | Typical Use Case |
|-------|-------------|-------|------------------|
| `match.created` | New employment conflict detected | Yes | Immediate alerts, ticket creation |
| `match.reviewed` | Match status updated by reviewer | Yes | Workflow triggers, compliance tracking |
| `employee.created` | New employee added to system | No | Profile updates, access provisioning |
| `employee.updated` | Employee information changed | No | Profile synchronization |
| `integration.sync.completed` | HR sync finished successfully | No | Status updates, reporting |
| `compliance.alert` | Compliance violation detected | Yes | Legal notifications, audit trails |

### Event Payload Sizes

- **Standard events**: < 5KB
- **Detailed match events**: < 50KB
- **Bulk sync events**: < 100KB
- **Maximum payload size**: 1MB

Webhook payloads are optimized for quick processing and minimal bandwidth usage while providing all necessary information for effective automation and monitoring.