# Cross-Client Comparison Specification
## Multi-Client Multi-Environment Comparison Capabilities

### Overview

The ShareDo CLI provides comprehensive comparison capabilities across multiple clients and their environments. This enables consultants and administrators to:
- Identify configuration differences between clients
- Compare best practices across deployments
- Validate environment promotions
- Audit configuration drift
- Generate consulting reports

---

## Comparison Types

### 1. Work Type Comparisons

```typescript
interface IWorkTypeComparison {
  compareWorkTypes(
    source: ClientEnvironment,
    target: ClientEnvironment,
    options?: IComparisonOptions
  ): Promise<IWorkTypeComparisonResult>;
}

interface ClientEnvironment {
  clientId: string;      // e.g., "clientA"
  environment: string;   // e.g., "vnext", "uat", "prod"
  component: string;     // e.g., "matter", "claim", "transaction"
}

interface IWorkTypeComparisonResult {
  identical: boolean;
  differences: {
    properties: IDifference[];
    aspects: IDifference[];
    permissions: IDifference[];
    participantRoles: IDifference[];
    phases: IDifference[];
    triggers: IDifference[];
    forms: IDifference[];
    workflows: IDifference[];
  };
  summary: {
    totalDifferences: number;
    criticalDifferences: number;
    recommendations: string[];
  };
}
```

### 2. Workflow Comparisons

```typescript
interface IWorkflowComparison {
  compareWorkflows(
    source: ClientEnvironment,
    target: ClientEnvironment,
    options?: IComparisonOptions
  ): Promise<IWorkflowComparisonResult>;
}

interface IWorkflowComparisonResult {
  identical: boolean;
  differences: {
    steps: IStepDifference[];
    conditions: IConditionDifference[];
    parameters: IParameterDifference[];
    actions: IActionDifference[];
    errorHandlers: IDifference[];
  };
  visualDiff: {
    addedSteps: string[];
    removedSteps: string[];
    modifiedSteps: string[];
    flowChanges: IFlowChange[];
  };
}
```

### 3. IDE Component Comparisons

```typescript
interface IIDEComparison {
  compareIDEComponents(
    source: ClientEnvironment,
    target: ClientEnvironment,
    path: string  // e.g., "workflows/payment", "forms/registration"
  ): Promise<IIDEComparisonResult>;
}

interface IIDEComparisonResult {
  identical: boolean;
  fileComparisons: {
    added: IFileInfo[];
    removed: IFileInfo[];
    modified: IFileDiff[];
    identical: IFileInfo[];
  };
  codeAnalysis: {
    linesAdded: number;
    linesRemoved: number;
    linesModified: number;
    complexity: IComplexityMetrics;
  };
}
```

### 4. Full System Comparisons

```typescript
interface ISystemComparison {
  compareFullSystems(
    source: ClientEnvironment,
    target: ClientEnvironment,
    options?: ISystemComparisonOptions
  ): Promise<ISystemComparisonResult>;
}

interface ISystemComparisonOptions {
  components: ('worktypes' | 'workflows' | 'forms' | 'ide' | 'permissions' | 'all')[];
  depth: 'shallow' | 'deep' | 'full';
  ignoreFields?: string[];
  includeMetadata?: boolean;
}

interface ISystemComparisonResult {
  overview: {
    source: ClientEnvironmentInfo;
    target: ClientEnvironmentInfo;
    comparisonDate: Date;
    totalComponents: number;
    identicalComponents: number;
    differentComponents: number;
  };
  componentResults: Map<string, IComponentComparisonResult>;
  recommendations: IRecommendation[];
  risks: IRisk[];
  report: IComparisonReport;
}
```

---

## Comparison Engine Implementation

### 1. Comparison Orchestrator

```typescript
class ComparisonOrchestrator {
  private comparators: Map<string, IComparator>;
  
  async compareAcrossClients(
    type: ComparisonType,
    source: string,  // Format: "clientA-env:component"
    target: string,  // Format: "clientB-env:component"
    options?: IComparisonOptions
  ): Promise<IComparisonResult> {
    // Parse source and target
    const sourceEnv = this.parseEnvironmentString(source);
    const targetEnv = this.parseEnvironmentString(target);
    
    // Validate access to both environments
    await this.validateAccess(sourceEnv, targetEnv);
    
    // Get comparator for type
    const comparator = this.getComparator(type);
    
    // Fetch data from both environments (no caching)
    const [sourceData, targetData] = await Promise.all([
      this.fetchFreshData(sourceEnv),
      this.fetchFreshData(targetEnv)
    ]);
    
    // Perform comparison
    const result = await comparator.compare(sourceData, targetData, options);
    
    // Add metadata
    return this.enrichWithMetadata(result, sourceEnv, targetEnv);
  }
  
  private async fetchFreshData(env: ClientEnvironment): Promise<any> {
    // Always fetch fresh data - no caching for exports
    const client = await this.getClient(env);
    return await client.export(env.component, { noCache: true });
  }
}
```

### 2. Deep Comparison Algorithm

```typescript
class DeepComparator {
  compare(
    source: any,
    target: any,
    options: IDeepCompareOptions = {}
  ): IDifference[] {
    const differences: IDifference[] = [];
    const visited = new Set<string>();
    
    this.compareRecursive(
      source,
      target,
      '',
      differences,
      visited,
      options
    );
    
    return differences;
  }
  
  private compareRecursive(
    source: any,
    target: any,
    path: string,
    differences: IDifference[],
    visited: Set<string>,
    options: IDeepCompareOptions
  ): void {
    // Handle circular references
    const key = `${path}:${JSON.stringify(source)}:${JSON.stringify(target)}`;
    if (visited.has(key)) return;
    visited.add(key);
    
    // Check if field should be ignored
    if (options.ignoreFields?.includes(path)) return;
    
    // Type checking
    if (typeof source !== typeof target) {
      differences.push({
        path,
        type: 'type-mismatch',
        sourceType: typeof source,
        targetType: typeof target,
        sourceValue: source,
        targetValue: target
      });
      return;
    }
    
    // Object comparison
    if (typeof source === 'object' && source !== null) {
      const sourceKeys = Object.keys(source);
      const targetKeys = Object.keys(target);
      const allKeys = new Set([...sourceKeys, ...targetKeys]);
      
      for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in source)) {
          differences.push({
            path: newPath,
            type: 'added',
            targetValue: target[key]
          });
        } else if (!(key in target)) {
          differences.push({
            path: newPath,
            type: 'removed',
            sourceValue: source[key]
          });
        } else {
          this.compareRecursive(
            source[key],
            target[key],
            newPath,
            differences,
            visited,
            options
          );
        }
      }
    } else if (source !== target) {
      // Primitive comparison
      differences.push({
        path,
        type: 'modified',
        sourceValue: source,
        targetValue: target
      });
    }
  }
}
```

### 3. Comparison Report Generator

```typescript
class ComparisonReportGenerator {
  async generateReport(
    result: IComparisonResult,
    format: 'json' | 'html' | 'markdown' | 'excel'
  ): Promise<Buffer | string> {
    switch (format) {
      case 'json':
        return this.generateJSONReport(result);
      case 'html':
        return this.generateHTMLReport(result);
      case 'markdown':
        return this.generateMarkdownReport(result);
      case 'excel':
        return this.generateExcelReport(result);
    }
  }
  
  private generateHTMLReport(result: IComparisonResult): string {
    const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ShareDo Comparison Report</title>
      <style>
        .added { background-color: #d4edda; }
        .removed { background-color: #f8d7da; }
        .modified { background-color: #fff3cd; }
        .identical { background-color: #d1ecf1; }
      </style>
    </head>
    <body>
      <h1>Comparison Report</h1>
      <div class="summary">
        <h2>Summary</h2>
        <p>Source: ${result.source.client} - ${result.source.environment}</p>
        <p>Target: ${result.target.client} - ${result.target.environment}</p>
        <p>Total Differences: ${result.totalDifferences}</p>
      </div>
      <div class="differences">
        ${this.renderDifferences(result.differences)}
      </div>
      <div class="recommendations">
        ${this.renderRecommendations(result.recommendations)}
      </div>
    </body>
    </html>`;
    
    return template;
  }
  
  private generateExcelReport(result: IComparisonResult): Buffer {
    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    this.addSummaryData(summarySheet, result);
    
    // Differences sheet
    const diffSheet = workbook.addWorksheet('Differences');
    this.addDifferenceData(diffSheet, result);
    
    // Recommendations sheet
    const recSheet = workbook.addWorksheet('Recommendations');
    this.addRecommendationData(recSheet, result);
    
    return workbook.xlsx.writeBuffer();
  }
}
```

---

## CLI Usage Examples

### Basic Comparisons

```bash
# Compare work type between clients
sharedo compare worktype clientA-vnext:matter clientB-vnext:matter

# Compare with detailed output
sharedo compare worktype clientA-prod:matter clientB-uat:matter --depth full --output comparison.html --format html

# Compare ignoring certain fields
sharedo compare workflow clientA-uat:onboarding clientB-uat:onboarding --ignore-fields createdDate,modifiedDate,userId
```

### Batch Comparisons

```bash
# Compare all work types between environments
sharedo compare system clientA-vnext clientB-vnext --components worktypes --output full-comparison.xlsx --format excel

# Compare multiple components
sharedo compare system clientA-prod clientB-prod --components worktypes,workflows,forms --depth deep
```

### IDE Component Comparisons

```bash
# Compare specific IDE folder
sharedo compare ide clientA-uat:workflows/payment clientB-uat:workflows/payment

# Compare entire IDE structure
sharedo compare ide clientA-vnext:/ clientB-vnext:/ --show-identical
```

---

## Comparison Outputs

### 1. JSON Output Structure

```json
{
  "comparison": {
    "id": "comp_123456",
    "timestamp": "2025-08-28T10:00:00Z",
    "source": {
      "client": "clientA",
      "environment": "vnext",
      "component": "matter"
    },
    "target": {
      "client": "clientB",
      "environment": "uat",
      "component": "matter"
    },
    "summary": {
      "identical": false,
      "totalDifferences": 42,
      "criticalDifferences": 3,
      "categories": {
        "properties": 5,
        "workflows": 12,
        "permissions": 8,
        "forms": 17
      }
    },
    "differences": [
      {
        "path": "properties.status.options",
        "type": "modified",
        "source": ["open", "closed"],
        "target": ["open", "closed", "archived"],
        "impact": "low",
        "recommendation": "Consider adding 'archived' status to source"
      }
    ],
    "recommendations": [
      {
        "priority": "high",
        "category": "security",
        "message": "Target has additional security permissions not present in source",
        "action": "Review and potentially adopt enhanced security model"
      }
    ]
  }
}
```

### 2. Visual Diff Display

```
ShareDo Comparison Report
========================

Source: ClientA vNext - Matter Work Type
Target: ClientB UAT - Matter Work Type

Summary:
--------
✓ Identical Properties: 45
⚠ Modified Properties: 8
+ Added in Target: 3
- Removed from Target: 2

Differences:
-----------

[MODIFIED] properties.status.options
  Source: ["open", "closed"]
  Target: ["open", "closed", "archived"]
  
[ADDED] workflows.approval
  Target: Complex approval workflow with 5 steps
  
[REMOVED] forms.legacy_intake
  Source: Legacy intake form (deprecated)

Recommendations:
---------------
1. [HIGH] Security: Adopt enhanced permission model from Target
2. [MEDIUM] Workflow: Consider implementing approval workflow
3. [LOW] Cleanup: Remove deprecated forms from Source
```

---

## Best Practices

### 1. Comparison Strategies

- **Always use fresh data**: Never rely on cached exports for comparisons
- **Compare like-for-like**: Compare same environment types when possible
- **Use appropriate depth**: Deep comparison for audits, shallow for quick checks
- **Filter noise**: Ignore timestamps and user IDs for cleaner comparisons

### 2. Performance Considerations

```typescript
class OptimizedComparator {
  async parallelCompare(
    comparisons: IComparisonRequest[]
  ): Promise<IComparisonResult[]> {
    // Limit concurrent comparisons
    const limit = pLimit(5);
    
    const tasks = comparisons.map(req =>
      limit(() => this.compareOne(req))
    );
    
    return await Promise.all(tasks);
  }
  
  // Use streaming for large comparisons
  async* streamCompare(
    source: ClientEnvironment,
    target: ClientEnvironment
  ): AsyncGenerator<IDifference> {
    const sourceStream = await this.getDataStream(source);
    const targetStream = await this.getDataStream(target);
    
    // Stream-based comparison
    yield* this.compareStreams(sourceStream, targetStream);
  }
}
```

### 3. Security Considerations

- **Access Control**: Verify user has access to both environments
- **Data Sanitization**: Remove sensitive data from comparison reports
- **Audit Logging**: Log all comparison operations
- **Rate Limiting**: Prevent comparison abuse

---

## Integration with Other Features

### Environment Configuration Comparison

```typescript
// Compare environment configurations
async function compareEnvironmentConfigs(
  env1: string,
  env2: string
): Promise<IConfigComparison> {
  const [config1, config2] = await Promise.all([
    this.getEnvironmentConfig(env1),
    this.getEnvironmentConfig(env2)
  ]);
  
  return {
    features: this.compareFeatures(config1.features, config2.features),
    settings: this.compareSettings(config1.settings, config2.settings),
    modules: this.compareModules(config1.modules, config2.modules),
    integrations: this.compareIntegrations(config1.integrations, config2.integrations)
  };
}
```

### HLD Generation from Comparisons

```typescript
// Generate HLD highlighting differences
const comparison = await cli.compare('worktype', 'clientA-prod:matter', 'clientB-prod:matter');
const hld = await cli.generateComparativeHLD(comparison, {
  highlightDifferences: true,
  includeRecommendations: true
});
```

### Deployment Based on Comparisons

```typescript
// Selective deployment of missing components
const comparison = await cli.compare('system', 'clientA-vnext', 'clientB-vnext');
const missingComponents = comparison.getMissingInTarget();
await cli.deploy(missingComponents, 'clientB-vnext');
```

---

## Summary

The cross-client comparison capability enables:
- **Comprehensive analysis** across multiple client deployments
- **Best practice identification** through pattern recognition
- **Configuration drift detection** for governance
- **Consulting insights** for optimization recommendations
- **Deployment validation** before and after changes

All comparisons use fresh data (no caching) to ensure accuracy and reflect the current state of each environment.