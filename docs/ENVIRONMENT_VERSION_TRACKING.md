# Environment Version Tracking Specification
## Multi-Client Version Management and Comparison

### Overview

The ShareDo CLI provides comprehensive version tracking capabilities to monitor and compare versions across multiple client environments. This enables administrators to ensure consistency, track deployments, and identify version discrepancies.

---

## Version Info API

### Endpoint
```http
GET /api/version-info?_={timestamp}
Authorization: Bearer {token}
```

### Expected Response Structure
```json
{
  "version": "4.2.0.0",
  "buildNumber": "4.2.0.12345",
  "buildDate": "2025-08-28T10:00:00Z",
  "environment": "demo-aus",
  "serverName": "demo-aus.sharedo.tech",
  "commitHash": "abc123def456",
  "branch": "release/4.2.0",
  "features": {
    "workflowEngine": "v3.1",
    "formBuilder": "v2.5",
    "exportApi": "v1.8",
    "auditApi": "v2.0"
  },
  "modules": [
    {
      "name": "Core",
      "version": "4.2.0",
      "status": "Active",
      "lastUpdated": "2025-08-27T09:00:00Z"
    },
    {
      "name": "Workflow",
      "version": "3.1.0",
      "status": "Active",
      "lastUpdated": "2025-08-26T14:00:00Z"
    },
    {
      "name": "FormBuilder",
      "version": "2.5.0",
      "status": "Active",
      "lastUpdated": "2025-08-25T10:00:00Z"
    }
  ],
  "database": {
    "version": "4.2.0",
    "lastMigration": "2025-08-27T09:00:00Z",
    "migrationCount": 245
  },
  "plugins": [
    {
      "name": "ShareDo.Export",
      "version": "1.8.0",
      "enabled": true
    },
    {
      "name": "ShareDo.Audit",
      "version": "2.0.0",
      "enabled": true
    }
  ]
}
```

---

## Version Tracking Service

### Implementation

```typescript
interface IVersionInfo {
  version: string;
  buildNumber: string;
  buildDate: Date;
  environment: string;
  serverName: string;
  commitHash?: string;
  branch?: string;
  features: Map<string, string>;
  modules: IModuleInfo[];
  database: IDatabaseInfo;
  plugins?: IPluginInfo[];
}

interface IModuleInfo {
  name: string;
  version: string;
  status: 'Active' | 'Inactive' | 'Error';
  lastUpdated?: Date;
}

class VersionTrackingService {
  private versionCache: Map<string, IVersionInfo> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  async getVersion(clientEnvironment: string): Promise<IVersionInfo> {
    const client = await this.environmentManager.getClient(clientEnvironment);
    
    // Add cache buster to prevent stale version info
    const timestamp = Date.now();
    const response = await client.get(`/api/version-info?_=${timestamp}`);
    
    return this.parseVersionInfo(response.data);
  }
  
  async compareVersions(
    environments: string[]
  ): Promise<IVersionComparison> {
    const versions = await Promise.all(
      environments.map(env => this.getVersion(env))
    );
    
    return this.analyzeVersionDifferences(versions);
  }
  
  private analyzeVersionDifferences(
    versions: IVersionInfo[]
  ): IVersionComparison {
    const comparison: IVersionComparison = {
      environments: [],
      discrepancies: [],
      recommendations: []
    };
    
    // Group by version
    const versionGroups = this.groupByVersion(versions);
    
    // Identify discrepancies
    if (versionGroups.size > 1) {
      comparison.discrepancies.push({
        type: 'version-mismatch',
        severity: 'high',
        message: `Multiple versions detected across environments`,
        details: Array.from(versionGroups.entries())
      });
    }
    
    // Check module versions
    this.checkModuleConsistency(versions, comparison);
    
    // Check feature flags
    this.checkFeatureConsistency(versions, comparison);
    
    // Generate recommendations
    this.generateRecommendations(comparison);
    
    return comparison;
  }
}
```

---

## CLI Commands

### Get Version Info
```bash
# Single environment
sharedo version clientA-prod

# Multiple environments
sharedo version clientA-prod clientA-uat clientA-vnext

# All environments for a client
sharedo version clientA-*

# Format output
sharedo version clientA-prod --format json
sharedo version clientA-prod --format table
```

### Compare Versions
```bash
# Compare specific environments
sharedo compare-versions clientA-prod clientA-uat

# Compare all environments for a client
sharedo compare-versions clientA-*

# Compare across clients
sharedo compare-versions clientA-prod clientB-prod clientC-prod

# Generate version report
sharedo compare-versions --all --output version-report.html
```

### Version History
```bash
# Track version changes over time
sharedo version-history clientA-prod --last 30d

# Show deployment timeline
sharedo version-timeline --all --format gantt
```

---

## Version Comparison Output

### Table Format
```
ShareDo Version Comparison
==========================

Environment         | Version  | Build Date  | Core    | Workflow | Forms
--------------------|----------|-------------|---------|----------|-------
clientA-prod        | 4.2.0    | 2025-08-28  | 4.2.0   | 3.1.0    | 2.5.0
clientA-uat         | 4.2.0    | 2025-08-28  | 4.2.0   | 3.1.0    | 2.5.0
clientA-vnext       | 4.3.0    | 2025-08-29  | 4.3.0   | 3.2.0    | 2.6.0
clientB-prod        | 4.1.0    | 2025-08-15  | 4.1.0   | 3.0.0    | 2.4.0
clientB-uat         | 4.2.0    | 2025-08-28  | 4.2.0   | 3.1.0    | 2.5.0

Discrepancies:
- ⚠ Version mismatch: clientA-vnext (4.3.0) differs from production (4.2.0)
- ⚠ Outdated: clientB-prod (4.1.0) is behind other environments

Recommendations:
1. Update clientB-prod to version 4.2.0 to match UAT
2. Test clientA-vnext (4.3.0) before promoting to UAT
```

### JSON Format
```json
{
  "comparison": {
    "timestamp": "2025-08-28T12:00:00Z",
    "environments": [
      {
        "id": "clientA-prod",
        "version": "4.2.0",
        "buildDate": "2025-08-28T10:00:00Z",
        "modules": {
          "Core": "4.2.0",
          "Workflow": "3.1.0",
          "FormBuilder": "2.5.0"
        }
      }
    ],
    "analysis": {
      "versionsFound": ["4.1.0", "4.2.0", "4.3.0"],
      "mostCommon": "4.2.0",
      "latest": "4.3.0",
      "oldest": "4.1.0"
    },
    "discrepancies": [
      {
        "type": "version-mismatch",
        "severity": "high",
        "environments": ["clientB-prod"],
        "currentVersion": "4.1.0",
        "expectedVersion": "4.2.0",
        "recommendation": "Update to match other environments"
      }
    ]
  }
}
```

---

## Version Monitoring

### Automated Checks

```typescript
class VersionMonitor {
  async checkVersionConsistency(): Promise<IConsistencyReport> {
    const allEnvironments = await this.getAllEnvironments();
    const report: IConsistencyReport = {
      timestamp: new Date(),
      checks: [],
      alerts: []
    };
    
    // Group by client
    const clientGroups = this.groupByClient(allEnvironments);
    
    for (const [client, environments] of clientGroups) {
      const versions = await this.getVersionsForEnvironments(environments);
      
      // Check promotion path consistency
      this.checkPromotionPath(client, versions, report);
      
      // Check version age
      this.checkVersionAge(client, versions, report);
      
      // Check module compatibility
      this.checkModuleCompatibility(client, versions, report);
    }
    
    return report;
  }
  
  private checkPromotionPath(
    client: string,
    versions: Map<string, IVersionInfo>,
    report: IConsistencyReport
  ): void {
    // Expected path: vnext >= uat >= sit >= prod
    const vnext = versions.get(`${client}-vnext`);
    const uat = versions.get(`${client}-uat`);
    const prod = versions.get(`${client}-prod`);
    
    if (vnext && uat && this.isVersionOlder(vnext.version, uat.version)) {
      report.alerts.push({
        severity: 'warning',
        client,
        message: 'vNext version is older than UAT',
        details: `vNext: ${vnext.version}, UAT: ${uat.version}`
      });
    }
    
    if (uat && prod && this.isVersionOlder(uat.version, prod.version)) {
      report.alerts.push({
        severity: 'critical',
        client,
        message: 'UAT version is older than Production',
        details: `UAT: ${uat.version}, Production: ${prod.version}`
      });
    }
  }
}
```

---

## Integration with Other Features

### Deployment Validation

```typescript
// Validate version before deployment
async function validateDeployment(
  source: string,
  target: string
): Promise<IValidationResult> {
  const sourceVersion = await versionService.getVersion(source);
  const targetVersion = await versionService.getVersion(target);
  
  // Check if source version is compatible with target
  if (this.isVersionOlder(sourceVersion.version, targetVersion.version)) {
    return {
      valid: false,
      reason: 'Cannot deploy older version to newer environment',
      sourceVersion: sourceVersion.version,
      targetVersion: targetVersion.version
    };
  }
  
  // Check module compatibility
  const incompatibleModules = this.checkModuleCompatibility(
    sourceVersion.modules,
    targetVersion.modules
  );
  
  if (incompatibleModules.length > 0) {
    return {
      valid: false,
      reason: 'Module version incompatibility detected',
      incompatibleModules
    };
  }
  
  return { valid: true };
}
```

### Audit Integration

```typescript
// Track version changes in audit log
async function auditVersionChange(
  environment: string,
  oldVersion: string,
  newVersion: string
): Promise<void> {
  await auditService.log({
    type: 'version-change',
    environment,
    timestamp: new Date(),
    details: {
      from: oldVersion,
      to: newVersion,
      user: getCurrentUser()
    }
  });
}
```

---

## Best Practices

### Version Checking Strategy

1. **Regular Monitoring**: Check versions daily or before deployments
2. **Promotion Path Validation**: Ensure versions follow the correct path
3. **Cross-Client Comparison**: Identify best practices and standard versions
4. **Module Compatibility**: Verify all modules are compatible
5. **Feature Flag Alignment**: Ensure feature flags are consistent

### CLI Usage Examples

```bash
# Morning check - verify all environments
sharedo version-check --all --alert-on-mismatch

# Pre-deployment validation
sharedo validate-deployment clientA-uat clientA-prod

# Weekly report
sharedo version-report --all --last 7d --output weekly-version-report.pdf

# Compare client configurations
sharedo compare-clients --version --modules --features
```

---

## Error Handling

### Common Issues

1. **Version Info Unavailable**
   - Fallback to basic health check
   - Cache last known version
   - Alert on repeated failures

2. **Version Parse Errors**
   - Handle different version formats
   - Support semantic versioning
   - Parse custom version strings

3. **Network Issues**
   - Retry with exponential backoff
   - Use cached data if available
   - Provide offline mode

---

## Summary

The version tracking system provides:
- **Real-time version monitoring** across all environments
- **Version comparison** between clients and environments
- **Deployment validation** based on version compatibility
- **Audit trail** of version changes
- **Automated alerts** for version discrepancies
- **Comprehensive reporting** for version management

This ensures consistent deployments and helps maintain version alignment across the entire ShareDo ecosystem.