# Reporting Dashboard Specification

## Overview

The Reporting Dashboard provides comprehensive analytics, visualization, and reporting capabilities for employment conflict detection, enabling stakeholders to understand patterns, trends, and risks across their organization and partner networks.

## Dashboard Architecture

### 1. Multi-Tenant Dashboard Framework

```typescript
interface DashboardConfig {
  companyId: string
  userId: string
  role: UserRole
  permissions: DashboardPermission[]
  customizations: DashboardCustomization
  dataFilters: DataFilter[]
}

interface DashboardCustomization {
  layout: LayoutConfig
  widgets: WidgetConfig[]
  themes: ThemeConfig
  defaultViews: DefaultView[]
}

enum DashboardPermission {
  VIEW_MATCHES = 'view_matches',
  VIEW_EMPLOYEE_DATA = 'view_employee_data',
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  MANAGE_INTEGRATIONS = 'manage_integrations',
  VIEW_COMPLIANCE = 'view_compliance'
}
```

### 2. Real-Time Data Pipeline

```typescript
class DashboardDataPipeline {
  private websocketConnection: WebSocket
  private dataCache: Map<string, CachedData> = new Map()
  
  async initializeRealTimeUpdates(dashboardId: string): Promise<void> {
    // Establish WebSocket connection
    this.websocketConnection = new WebSocket(
      `wss://${process.env.NEXT_PUBLIC_WS_URL}/dashboard/${dashboardId}`
    )
    
    // Set up event handlers
    this.websocketConnection.onmessage = (event) => {
      const update = JSON.parse(event.data) as DashboardUpdate
      this.handleRealTimeUpdate(update)
    }
    
    // Initialize data subscriptions
    await this.subscribeToDataStreams([
      'matches',
      'employee_changes',
      'integration_status',
      'compliance_alerts'
    ])
  }
  
  private async handleRealTimeUpdate(update: DashboardUpdate): Promise<void> {
    switch (update.type) {
      case 'new_match':
        await this.updateMatchesWidget(update.data)
        break
      case 'employee_updated':
        await this.updateEmployeeStats(update.data)
        break
      case 'integration_sync':
        await this.updateIntegrationStatus(update.data)
        break
      case 'compliance_alert':
        await this.updateComplianceWidget(update.data)
        break
    }
    
    // Invalidate relevant cache entries
    this.invalidateCache(update.affectedWidgets)
  }
}
```

## Core Dashboard Widgets

### 1. Match Overview Widget

```typescript
interface MatchOverviewWidget {
  type: 'match_overview'
  data: {
    totalMatches: number
    pendingReview: number
    confirmedMatches: number
    rejectedMatches: number
    averageConfidenceScore: number
    riskDistribution: RiskDistribution
    trending: MatchTrend[]
  }
  
  filters: {
    dateRange: DateRange
    confidenceThreshold: number
    matchStatus: MatchStatus[]
    companies: string[]
  }
}

class MatchOverviewController {
  async generateWidget(config: WidgetConfig): Promise<MatchOverviewWidget> {
    const baseQuery = this.buildBaseQuery(config.filters)
    
    const [
      totalMatches,
      statusBreakdown,
      confidenceStats,
      riskDistribution,
      trendData
    ] = await Promise.all([
      this.getTotalMatches(baseQuery),
      this.getStatusBreakdown(baseQuery),
      this.getConfidenceStats(baseQuery),
      this.getRiskDistribution(baseQuery),
      this.getTrendData(baseQuery, config.filters.dateRange)
    ])
    
    return {
      type: 'match_overview',
      data: {
        totalMatches,
        pendingReview: statusBreakdown.pending,
        confirmedMatches: statusBreakdown.confirmed,
        rejectedMatches: statusBreakdown.rejected,
        averageConfidenceScore: confidenceStats.average,
        riskDistribution,
        trending: trendData
      },
      filters: config.filters
    }
  }
  
  private async getRiskDistribution(query: QueryBuilder): Promise<RiskDistribution> {
    const results = await query
      .select('confidence_score', 'temporal_overlap')
      .where('status', 'pending')
      .get()
    
    return results.reduce((acc, match) => {
      const risk = this.calculateRiskLevel(match.confidence_score, match.temporal_overlap)
      acc[risk] = (acc[risk] || 0) + 1
      return acc
    }, {} as RiskDistribution)
  }
}
```

### 2. Employee Network Visualization

```typescript
interface NetworkVisualizationWidget {
  type: 'network_visualization'
  data: {
    nodes: NetworkNode[]
    edges: NetworkEdge[]
    clusters: NetworkCluster[]
    metrics: NetworkMetrics
  }
  
  layout: {
    algorithm: 'force' | 'hierarchical' | 'circular'
    nodeSize: 'employee_count' | 'risk_score' | 'uniform'
    edgeWeight: 'confidence' | 'overlap_days' | 'uniform'
    clustering: 'company' | 'industry' | 'geographic' | 'none'
  }
}

interface NetworkNode {
  id: string
  label: string
  type: 'company' | 'employee'
  size: number
  color: string
  metadata: {
    employeeCount?: number
    riskScore?: number
    industry?: string
    location?: string
  }
}

interface NetworkEdge {
  source: string
  target: string
  weight: number
  type: 'match' | 'employment' | 'collaboration'
  metadata: {
    confidenceScore?: number
    overlapDays?: number
    matchCount?: number
  }
}

class NetworkVisualizationController {
  async generateNetworkData(config: WidgetConfig): Promise<NetworkVisualizationWidget> {
    const matches = await this.getMatchesForNetwork(config.filters)
    
    // Build nodes (companies and employees)
    const companyNodes = await this.buildCompanyNodes(matches)
    const employeeNodes = await this.buildEmployeeNodes(matches, config.privacy.showEmployees)
    
    // Build edges (relationships)
    const matchEdges = this.buildMatchEdges(matches)
    const employmentEdges = await this.buildEmploymentEdges(matches)
    
    // Apply clustering algorithm
    const clusters = await this.applyClustering(
      [...companyNodes, ...employeeNodes],
      config.layout.clustering
    )
    
    // Calculate network metrics
    const metrics = this.calculateNetworkMetrics(
      [...companyNodes, ...employeeNodes],
      [...matchEdges, ...employmentEdges]
    )
    
    return {
      type: 'network_visualization',
      data: {
        nodes: [...companyNodes, ...employeeNodes],
        edges: [...matchEdges, ...employmentEdges],
        clusters,
        metrics
      },
      layout: config.layout
    }
  }
  
  private calculateNetworkMetrics(nodes: NetworkNode[], edges: NetworkEdge[]): NetworkMetrics {
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      density: (2 * edges.length) / (nodes.length * (nodes.length - 1)),
      averageClusteringCoefficient: this.calculateClusteringCoefficient(nodes, edges),
      connectedComponents: this.findConnectedComponents(nodes, edges),
      centralityMeasures: this.calculateCentrality(nodes, edges)
    }
  }
}
```

### 3. Risk Heatmap Widget

```typescript
interface RiskHeatmapWidget {
  type: 'risk_heatmap'
  data: {
    matrix: RiskCell[][]
    xAxis: AxisConfig
    yAxis: AxisConfig
    colorScale: ColorScale
    annotations: RiskAnnotation[]
  }
  
  configuration: {
    xDimension: 'company' | 'department' | 'location' | 'time'
    yDimension: 'company' | 'department' | 'location' | 'time'
    metric: 'match_count' | 'risk_score' | 'confidence' | 'overlap_days'
    aggregation: 'sum' | 'average' | 'max' | 'count'
  }
}

interface RiskCell {
  x: string
  y: string
  value: number
  normalizedValue: number // 0-1 scale for color mapping
  matchCount: number
  tooltip: string
  drillDown?: DrillDownData
}

class RiskHeatmapController {
  async generateHeatmap(config: WidgetConfig): Promise<RiskHeatmapWidget> {
    const { xDimension, yDimension, metric, aggregation } = config.configuration
    
    // Get data for heatmap
    const rawData = await this.getRiskData(config.filters)
    
    // Build dimension values
    const xValues = await this.getDimensionValues(xDimension, rawData)
    const yValues = await this.getDimensionValues(yDimension, rawData)
    
    // Create matrix
    const matrix = await this.buildRiskMatrix(
      xValues,
      yValues,
      rawData,
      metric,
      aggregation
    )
    
    // Calculate color scale
    const colorScale = this.calculateColorScale(matrix, metric)
    
    // Generate annotations for high-risk cells
    const annotations = this.generateRiskAnnotations(matrix, config.thresholds)
    
    return {
      type: 'risk_heatmap',
      data: {
        matrix,
        xAxis: { dimension: xDimension, values: xValues },
        yAxis: { dimension: yDimension, values: yValues },
        colorScale,
        annotations
      },
      configuration: config.configuration
    }
  }
  
  private async buildRiskMatrix(
    xValues: string[],
    yValues: string[],
    data: RiskData[],
    metric: string,
    aggregation: string
  ): Promise<RiskCell[][]> {
    const matrix: RiskCell[][] = []
    
    for (let y = 0; y < yValues.length; y++) {
      matrix[y] = []
      for (let x = 0; x < xValues.length; x++) {
        const cellData = data.filter(d => 
          d[xDimension] === xValues[x] && d[yDimension] === yValues[y]
        )
        
        const value = this.aggregateValue(cellData, metric, aggregation)
        const matchCount = cellData.length
        
        matrix[y][x] = {
          x: xValues[x],
          y: yValues[y],
          value,
          normalizedValue: 0, // Will be calculated after full matrix is built
          matchCount,
          tooltip: this.generateTooltip(xValues[x], yValues[y], value, matchCount),
          drillDown: this.prepareDrillDown(cellData)
        }
      }
    }
    
    // Normalize values for color mapping
    const allValues = matrix.flat().map(cell => cell.value)
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    
    matrix.forEach(row => {
      row.forEach(cell => {
        cell.normalizedValue = max > min ? (cell.value - min) / (max - min) : 0
      })
    })
    
    return matrix
  }
}
```

### 4. Integration Status Dashboard

```typescript
interface IntegrationStatusWidget {
  type: 'integration_status'
  data: {
    integrations: IntegrationStatus[]
    overallHealth: HealthScore
    recentActivity: IntegrationActivity[]
    syncStatistics: SyncStatistics
    alerts: IntegrationAlert[]
  }
}

interface IntegrationStatus {
  id: string
  provider: IntegrationProvider
  companyName: string
  status: 'active' | 'inactive' | 'error' | 'warning'
  lastSync: Date
  nextSync: Date
  employeeCount: number
  errorCount: number
  uptime: number // percentage
  latency: number // milliseconds
  dataQuality: DataQualityScore
}

class IntegrationStatusController {
  async generateStatusWidget(config: WidgetConfig): Promise<IntegrationStatusWidget> {
    const integrations = await this.getIntegrationStatuses(config.filters)
    
    // Calculate overall health
    const overallHealth = this.calculateOverallHealth(integrations)
    
    // Get recent activity
    const recentActivity = await this.getRecentActivity(config.filters.timeRange)
    
    // Calculate sync statistics
    const syncStatistics = this.calculateSyncStatistics(integrations, recentActivity)
    
    // Check for active alerts
    const alerts = await this.getActiveAlerts(integrations)
    
    return {
      type: 'integration_status',
      data: {
        integrations,
        overallHealth,
        recentActivity,
        syncStatistics,
        alerts
      }
    }
  }
  
  private calculateOverallHealth(integrations: IntegrationStatus[]): HealthScore {
    if (integrations.length === 0) {
      return { score: 0, status: 'unknown', message: 'No integrations configured' }
    }
    
    const weights = {
      status: 0.4,
      uptime: 0.3,
      dataQuality: 0.2,
      latency: 0.1
    }
    
    let totalScore = 0
    let activeIntegrations = 0
    
    for (const integration of integrations) {
      if (integration.status === 'active') {
        activeIntegrations++
        
        const statusScore = this.getStatusScore(integration.status)
        const uptimeScore = integration.uptime / 100
        const qualityScore = integration.dataQuality.overall / 100
        const latencyScore = Math.max(0, 1 - (integration.latency / 5000)) // 5 seconds max
        
        const integrationScore = 
          statusScore * weights.status +
          uptimeScore * weights.uptime +
          qualityScore * weights.dataQuality +
          latencyScore * weights.latency
        
        totalScore += integrationScore
      }
    }
    
    const overallScore = activeIntegrations > 0 ? totalScore / activeIntegrations : 0
    
    return {
      score: Math.round(overallScore * 100),
      status: this.getHealthStatus(overallScore),
      message: this.getHealthMessage(overallScore, integrations)
    }
  }
}
```

## Advanced Analytics

### 1. Predictive Analytics Engine

```typescript
class PredictiveAnalyticsEngine {
  async generatePredictions(config: PredictionConfig): Promise<PredictionResults> {
    const historicalData = await this.getHistoricalData(config.timeRange)
    
    const predictions = await Promise.all([
      this.predictMatchVolume(historicalData, config.forecastPeriod),
      this.predictRiskTrends(historicalData, config.forecastPeriod),
      this.predictIntegrationIssues(historicalData),
      this.predictComplianceRisks(historicalData)
    ])
    
    return {
      matchVolumePrediction: predictions[0],
      riskTrendPrediction: predictions[1],
      integrationHealthPrediction: predictions[2],
      complianceRiskPrediction: predictions[3],
      confidence: this.calculatePredictionConfidence(predictions),
      generatedAt: new Date()
    }
  }
  
  private async predictMatchVolume(
    data: HistoricalData,
    forecastPeriod: number
  ): Promise<MatchVolumePrediction> {
    // Time series analysis using ARIMA or similar
    const timeSeries = data.matches.map(m => ({
      date: m.createdAt,
      count: 1
    }))
    
    // Aggregate by day/week/month based on forecast period
    const aggregated = this.aggregateTimeSeries(timeSeries, 'day')
    
    // Apply seasonal decomposition
    const decomposition = this.seasonalDecompose(aggregated)
    
    // Generate forecast
    const forecast = this.arimaForecast(decomposition, forecastPeriod)
    
    return {
      forecast,
      seasonality: decomposition.seasonal,
      trend: decomposition.trend,
      confidence: this.calculateForecastConfidence(aggregated, forecast)
    }
  }
  
  private async predictRiskTrends(
    data: HistoricalData,
    forecastPeriod: number
  ): Promise<RiskTrendPrediction> {
    // Analyze risk patterns over time
    const riskData = data.matches.map(m => ({
      date: m.createdAt,
      riskScore: this.calculateRiskScore(m.confidenceScore, m.temporalOverlap),
      company: m.companyId
    }))
    
    // Group by company and time period
    const companyRiskTrends = this.groupBy(riskData, 'company')
    
    const predictions = {}
    for (const [companyId, trends] of Object.entries(companyRiskTrends)) {
      predictions[companyId] = this.predictCompanyRiskTrend(trends, forecastPeriod)
    }
    
    return {
      companyPredictions: predictions,
      overallTrend: this.calculateOverallRiskTrend(Object.values(predictions)),
      riskFactors: await this.identifyRiskFactors(data)
    }
  }
}
```

### 2. Pattern Recognition

```typescript
class PatternRecognitionEngine {
  async identifyPatterns(data: AnalyticsData): Promise<PatternAnalysis> {
    const patterns = await Promise.all([
      this.detectEmploymentPatterns(data.employees),
      this.detectMatchingPatterns(data.matches),
      this.detectTemporalPatterns(data.timeline),
      this.detectGeographicPatterns(data.locations),
      this.detectIndustryPatterns(data.industries)
    ])
    
    return {
      employmentPatterns: patterns[0],
      matchingPatterns: patterns[1],
      temporalPatterns: patterns[2],
      geographicPatterns: patterns[3],
      industryPatterns: patterns[4],
      anomalies: await this.detectAnomalies(data),
      insights: this.generateInsights(patterns)
    }
  }
  
  private async detectEmploymentPatterns(employees: Employee[]): Promise<EmploymentPattern[]> {
    const patterns = []
    
    // Serial employment pattern (multiple jobs in sequence)
    const serialPattern = this.detectSerialEmployment(employees)
    if (serialPattern.confidence > 0.7) {
      patterns.push(serialPattern)
    }
    
    // Rapid succession pattern (quick job changes)
    const rapidPattern = this.detectRapidSuccession(employees)
    if (rapidPattern.confidence > 0.6) {
      patterns.push(rapidPattern)
    }
    
    // Industry hopping pattern
    const industryPattern = this.detectIndustryHopping(employees)
    if (industryPattern.confidence > 0.5) {
      patterns.push(industryPattern)
    }
    
    // Geographic mobility pattern
    const mobilityPattern = this.detectGeographicMobility(employees)
    if (mobilityPattern.confidence > 0.6) {
      patterns.push(mobilityPattern)
    }
    
    return patterns
  }
  
  private detectSerialEmployment(employees: Employee[]): EmploymentPattern {
    // Group employees by potential identity (fuzzy matching)
    const identityGroups = this.groupByPotentialIdentity(employees)
    
    let serialCount = 0
    let totalGroups = 0
    const examples = []
    
    for (const group of identityGroups) {
      totalGroups++
      
      if (group.length > 1) {
        // Check if employments are sequential (non-overlapping)
        const sortedEmployments = group.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        
        let isSerial = true
        for (let i = 1; i < sortedEmployments.length; i++) {
          const prevEnd = sortedEmployments[i-1].endDate
          const currentStart = sortedEmployments[i].startDate
          
          if (prevEnd && currentStart < prevEnd) {
            isSerial = false
            break
          }
        }
        
        if (isSerial) {
          serialCount++
          examples.push({
            employeeIds: group.map(e => e.id),
            employmentCount: group.length,
            duration: this.calculateTotalDuration(group)
          })
        }
      }
    }
    
    return {
      type: 'serial_employment',
      confidence: totalGroups > 0 ? serialCount / totalGroups : 0,
      occurrences: serialCount,
      description: `${serialCount} instances of serial employment detected`,
      examples: examples.slice(0, 5) // Top 5 examples
    }
  }
}
```

## Export & Reporting

### 1. Report Generation Engine

```typescript
class ReportGenerator {
  async generateReport(config: ReportConfig): Promise<GeneratedReport> {
    const reportData = await this.collectReportData(config)
    
    const report: GeneratedReport = {
      id: generateId(),
      title: config.title,
      type: config.type,
      generatedAt: new Date(),
      generatedBy: config.userId,
      filters: config.filters,
      sections: []
    }
    
    // Generate sections based on report type
    switch (config.type) {
      case 'executive_summary':
        report.sections = await this.generateExecutiveSummary(reportData)
        break
      case 'detailed_analysis':
        report.sections = await this.generateDetailedAnalysis(reportData)
        break
      case 'compliance_report':
        report.sections = await this.generateComplianceReport(reportData)
        break
      case 'risk_assessment':
        report.sections = await this.generateRiskAssessment(reportData)
        break
    }
    
    return report
  }
  
  private async generateExecutiveSummary(data: ReportData): Promise<ReportSection[]> {
    return [
      {
        title: 'Key Metrics',
        type: 'metrics',
        content: {
          totalEmployees: data.employees.length,
          totalMatches: data.matches.length,
          riskLevel: this.calculateOverallRisk(data.matches),
          complianceStatus: await this.getComplianceStatus()
        }
      },
      {
        title: 'Risk Overview',
        type: 'visualization',
        content: {
          type: 'risk_distribution_chart',
          data: this.generateRiskDistribution(data.matches)
        }
      },
      {
        title: 'Key Findings',
        type: 'findings',
        content: {
          findings: await this.generateKeyFindings(data),
          recommendations: await this.generateRecommendations(data)
        }
      }
    ]
  }
}
```

### 2. Multi-Format Export

```typescript
class ReportExporter {
  async exportReport(report: GeneratedReport, format: ExportFormat): Promise<ExportResult> {
    switch (format) {
      case 'pdf':
        return await this.exportToPDF(report)
      case 'excel':
        return await this.exportToExcel(report)
      case 'csv':
        return await this.exportToCSV(report)
      case 'json':
        return await this.exportToJSON(report)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }
  
  private async exportToPDF(report: GeneratedReport): Promise<ExportResult> {
    const pdf = new PDFDocument()
    
    // Add header
    this.addPDFHeader(pdf, report)
    
    // Add sections
    for (const section of report.sections) {
      await this.addPDFSection(pdf, section)
    }
    
    // Add footer with metadata
    this.addPDFFooter(pdf, report)
    
    const buffer = await this.finalizePDF(pdf)
    
    return {
      format: 'pdf',
      fileName: `report_${report.id}.pdf`,
      size: buffer.length,
      buffer,
      downloadUrl: await this.uploadToStorage(buffer, `report_${report.id}.pdf`)
    }
  }
  
  private async exportToExcel(report: GeneratedReport): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook()
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary')
    this.populateSummarySheet(summarySheet, report)
    
    // Data sheets
    for (const section of report.sections) {
      if (section.type === 'data_table') {
        const sheet = workbook.addWorksheet(section.title)
        this.populateDataSheet(sheet, section.content.data)
      }
    }
    
    const buffer = await workbook.xlsx.writeBuffer()
    
    return {
      format: 'excel',
      fileName: `report_${report.id}.xlsx`,
      size: buffer.byteLength,
      buffer,
      downloadUrl: await this.uploadToStorage(buffer, `report_${report.id}.xlsx`)
    }
  }
}
```

## Dashboard Performance Optimization

### 1. Data Caching Strategy

```typescript
class DashboardCache {
  private redis: Redis
  private memoryCache: Map<string, CachedData> = new Map()
  
  async getCachedData(key: string): Promise<any | null> {
    // Try memory cache first (fastest)
    const memoryData = this.memoryCache.get(key)
    if (memoryData && !this.isExpired(memoryData)) {
      return memoryData.data
    }
    
    // Try Redis cache (fast)
    const redisData = await this.redis.get(key)
    if (redisData) {
      const parsed = JSON.parse(redisData)
      
      // Populate memory cache
      this.memoryCache.set(key, {
        data: parsed.data,
        expiresAt: new Date(parsed.expiresAt)
      })
      
      return parsed.data
    }
    
    return null
  }
  
  async setCachedData(
    key: string, 
    data: any, 
    ttl: number = 300 // 5 minutes default
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl * 1000)
    const cachedData = { data, expiresAt }
    
    // Store in memory cache
    this.memoryCache.set(key, cachedData)
    
    // Store in Redis with TTL
    await this.redis.setex(
      key, 
      ttl, 
      JSON.stringify(cachedData)
    )
  }
  
  generateCacheKey(
    widgetType: string, 
    filters: any, 
    companyId: string
  ): string {
    const filterHash = crypto
      .createHash('md5')
      .update(JSON.stringify(filters))
      .digest('hex')
    
    return `dashboard:${widgetType}:${companyId}:${filterHash}`
  }
}
```

### 2. Query Optimization

```typescript
class QueryOptimizer {
  async optimizeQuery(query: QueryBuilder, context: QueryContext): Promise<QueryBuilder> {
    // Add appropriate indexes based on query pattern
    query = this.addOptimalIndexes(query, context)
    
    // Optimize WHERE clauses
    query = this.optimizeWhereClause(query)
    
    // Add query hints for large datasets
    if (context.expectedRowCount > 10000) {
      query = this.addQueryHints(query)
    }
    
    // Use materialized views for common aggregations
    if (this.shouldUseMaterializedView(query)) {
      query = this.rewriteForMaterializedView(query)
    }
    
    return query
  }
  
  private shouldUseMaterializedView(query: QueryBuilder): boolean {
    // Check if query matches patterns suitable for materialized views
    const sql = query.toSQL()
    
    return sql.includes('GROUP BY') && 
           sql.includes('COUNT(') && 
           (sql.includes('matches') || sql.includes('employees'))
  }
}
```

## Security & Privacy Controls

### 1. Dashboard Access Control

```typescript
class DashboardSecurityManager {
  async validateAccess(
    userId: string, 
    dashboardConfig: DashboardConfig
  ): Promise<AccessValidation> {
    // Check user permissions
    const userPermissions = await this.getUserPermissions(userId)
    const requiredPermissions = this.getRequiredPermissions(dashboardConfig)
    
    const hasAccess = requiredPermissions.every(perm => 
      userPermissions.includes(perm)
    )
    
    if (!hasAccess) {
      return {
        allowed: false,
        reason: 'Insufficient permissions',
        missingPermissions: requiredPermissions.filter(perm => 
          !userPermissions.includes(perm)
        )
      }
    }
    
    // Check data access restrictions
    const dataRestrictions = await this.getDataRestrictions(userId)
    const sanitizedConfig = this.applyDataRestrictions(dashboardConfig, dataRestrictions)
    
    return {
      allowed: true,
      sanitizedConfig,
      appliedRestrictions: dataRestrictions
    }
  }
  
  private applyDataRestrictions(
    config: DashboardConfig, 
    restrictions: DataRestriction[]
  ): DashboardConfig {
    const sanitized = { ...config }
    
    for (const restriction of restrictions) {
      switch (restriction.type) {
        case 'field_masking':
          sanitized.widgets = this.maskSensitiveFields(
            sanitized.widgets, 
            restriction.fields
          )
          break
        case 'row_filtering':
          sanitized.dataFilters.push(restriction.filter)
          break
        case 'aggregation_only':
          sanitized.widgets = this.enforceAggregationOnly(sanitized.widgets)
          break
      }
    }
    
    return sanitized
  }
}
```

### 2. Data Anonymization for Dashboard

```typescript
class DashboardAnonymizer {
  async anonymizeWidgetData(
    widgetData: any, 
    anonymizationLevel: AnonymizationLevel
  ): Promise<any> {
    switch (anonymizationLevel) {
      case AnonymizationLevel.NONE:
        return widgetData
        
      case AnonymizationLevel.PSEUDONYMOUS:
        return this.pseudonymizeData(widgetData)
        
      case AnonymizationLevel.ANONYMOUS:
        return this.anonymizeData(widgetData)
        
      case AnonymizationLevel.AGGREGATED_ONLY:
        return this.aggregateData(widgetData)
    }
  }
  
  private pseudonymizeData(data: any): any {
    // Replace identifiable information with consistent pseudonyms
    const pseudonymMap = new Map<string, string>()
    
    return this.traverseAndReplace(data, (value, key) => {
      if (this.isIdentifiableField(key)) {
        if (!pseudonymMap.has(value)) {
          pseudonymMap.set(value, this.generatePseudonym(key))
        }
        return pseudonymMap.get(value)
      }
      return value
    })
  }
  
  private anonymizeData(data: any): any {
    // Remove or generalize identifying information
    return this.traverseAndReplace(data, (value, key) => {
      if (this.isIdentifiableField(key)) {
        return this.generalizeValue(value, key)
      }
      return value
    })
  }
}