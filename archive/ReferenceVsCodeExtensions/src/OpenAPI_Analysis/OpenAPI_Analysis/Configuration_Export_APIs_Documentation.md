# Sharedo Configuration Export APIs - Documentation

## Overview

The Sharedo Configuration Export APIs provide comprehensive capabilities for exporting and importing configuration data within the Sharedo platform. These APIs are essential for configuration analysis, backup operations, system migration, and data analysis workflows.

## API Categories

### 1. Direct Configuration Export
**Primary Endpoint**: `/api/configuration/export`

Simple, direct export of current system configuration for immediate analysis.

**Use Cases**:
- Quick configuration snapshots
- Configuration analysis and auditing
- Backup operations
- System documentation

### 2. Modeller Import/Export Infrastructure
**Base Endpoints**: `/api/modeller/importexport/*`

Comprehensive job-based import/export system with progress tracking, logging, and provider management.

**Key Features**:
- Asynchronous job processing
- Progress monitoring and status tracking
- Detailed logging and error handling
- Provider-based architecture
- Export set management
- Dependency validation

### 3. Solution Configuration Management
**Endpoint**: `/api/featureFramework/solution-import-export/configuration`

Solution-level configuration management through the feature framework.

**Capabilities**:
- Solution configuration export/import
- Feature framework settings management
- Solution-specific configuration validation

### 4. Financial Configuration Export
**Endpoint**: `/api/finance/budgets/structure/export`

Specialized export for budget structures and financial configuration data.

**Features**:
- Budget hierarchy export
- Financial configuration settings
- Multiple export formats (JSON, CSV, Excel)
- Structure-only or data-inclusive exports

## Configuration Export Capabilities

### System Configuration Data
- Workflow definitions and templates
- Form configurations and schemas
- Participant roles and settings
- Security policies and permissions
- Integration configurations
- System-level settings

### Budget and Financial Data
- Budget hierarchies and structures
- Budget categories and rules
- Financial configuration settings
- Cost center configurations

### Solution-Level Data
- Feature framework configurations
- Plugin and module settings
- Solution-specific customizations
- Integration configurations

### Case Management Data
- Case workflow configurations
- Process definitions
- Business rule configurations
- Participant role definitions

## Job-Based Processing

### Export Job Workflow
1. **Job Creation** - Submit export request with parameters
2. **Validation** - Validate export parameters and dependencies
3. **Processing** - Execute export using selected providers
4. **Progress Tracking** - Monitor job status and progress
5. **Completion** - Download exported configuration package

### Import Job Workflow
1. **Package Upload** - Upload configuration package
2. **Validation** - Validate package integrity and compatibility
3. **Dependency Check** - Verify configuration dependencies
4. **Processing** - Import configuration with selected strategy
5. **Verification** - Validate imported configuration

### Job Status Monitoring
- Real-time progress tracking
- Step-by-step execution monitoring
- Detailed error reporting
- Comprehensive logging

## Provider Architecture

### Configuration Providers
The system uses a provider-based architecture to handle different types of configuration data:

- **Budget Structure Provider** - Financial configuration export/import
- **Workflow Provider** - Workflow and process definition management
- **Form Provider** - Form configuration and schema management
- **Security Provider** - Security policy and permission management
- **Integration Provider** - External system integration settings

### Provider Operations
Each provider supports:
- **Export** - Export configuration data
- **Import** - Import and validate configuration data
- **Validate** - Validate configuration integrity
- **Dependencies** - Manage configuration dependencies

## Export Sets

### Predefined Export Sets
- **Full System Export** - Complete system configuration
- **Workflow Export** - Workflow-specific configurations
- **Security Export** - Security and permission configurations
- **Integration Export** - External integration settings
- **Financial Export** - Budget and financial configurations

### Custom Export Sets
- User-defined export groupings
- Selective configuration export
- Dependency-aware export sets
- Reusable export configurations

## API Authentication and Security

### Authentication
- **Bearer Token Authentication** - JWT tokens required for all endpoints
- **Role-Based Access Control** - Appropriate permissions required
- **Audit Logging** - All export/import operations logged

### Security Features
- **Data Encryption** - Optional encryption for sensitive data
- **Access Control** - Fine-grained permission management
- **Audit Trail** - Comprehensive operation tracking
- **Data Validation** - Input and output validation

## Data Formats and Schemas

### Export Formats
- **JSON** - Structured data export with schema validation
- **Binary Packages** - Compressed configuration packages
- **CSV** - Tabular data export for analysis
- **Excel** - Spreadsheet format for budget data

### Schema Validation
- **OpenAPI 3.0.3 Schemas** - Complete request/response validation
- **Configuration Validation** - Business rule validation
- **Dependency Validation** - Configuration dependency checking
- **Version Compatibility** - Cross-version compatibility validation

## Error Handling and Logging

### Error Categories
- **Validation Errors** - Invalid configuration data
- **Dependency Errors** - Missing or invalid dependencies
- **Permission Errors** - Insufficient access rights
- **System Errors** - Infrastructure or system failures

### Logging Levels
- **Debug** - Detailed operation information
- **Info** - General operation status
- **Warning** - Non-critical issues
- **Error** - Operation failures and problems

## Usage Examples

### Direct Configuration Export
```bash
curl -X GET "https://app.sharedo.com/api/configuration/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

### Create Export Job
```bash
curl -X POST "https://app.sharedo.com/api/modeller/importexport/export/package" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exportType": "selective",
    "providers": ["workflow", "forms", "security"],
    "includeData": false,
    "options": {
      "compressionEnabled": true,
      "validateDependencies": true
    }
  }'
```

### Monitor Job Status
```bash
curl -X GET "https://app.sharedo.com/api/modeller/importexport/export/package/JOB_ID/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Export Budget Structure
```bash
curl -X GET "https://app.sharedo.com/api/finance/budgets/structure/export?format=json&includeData=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Integration Recommendations

### For Configuration Analysis
1. **Use Direct Export** for quick configuration snapshots
2. **Use Job-Based Export** for comprehensive analysis
3. **Monitor Job Progress** for large exports
4. **Validate Dependencies** before analysis

### For System Migration
1. **Create Full Export** using job-based system
2. **Validate Export Package** before migration
3. **Use Incremental Import** for staged migration
4. **Monitor Import Progress** during migration

### For Backup Operations
1. **Schedule Regular Exports** using job-based system
2. **Include All Providers** for complete backup
3. **Enable Compression** to reduce storage
4. **Validate Backup Integrity** after export

## Best Practices

### Performance Optimization
- Use selective exports for specific analysis needs
- Enable compression for large configuration exports
- Monitor job progress for long-running operations
- Use appropriate export formats for your use case

### Data Security
- Always use HTTPS for API communication
- Store JWT tokens securely
- Enable encryption for sensitive configuration data
- Follow audit logging requirements

### Error Handling
- Implement retry logic for transient failures
- Check job status before processing results
- Validate configuration data after import
- Monitor system logs for error patterns

## Support and Troubleshooting

### Common Issues
- **Authentication Failures** - Verify JWT token validity
- **Permission Denied** - Check user permissions for export operations
- **Job Timeouts** - Use smaller export sets or contact support
- **Validation Errors** - Review configuration dependencies

### Getting Help
- Review API documentation and schemas
- Check system logs for detailed error information
- Contact Sharedo API support for assistance
- Use the provided error codes for troubleshooting

## Conclusion

The Sharedo Configuration Export APIs provide a comprehensive solution for configuration data export and analysis. With support for direct exports, job-based processing, multiple data formats, and comprehensive monitoring, these APIs enable effective configuration management, analysis, and migration workflows.

The provider-based architecture ensures extensibility and maintainability, while the job-based processing system provides reliability and scalability for large configuration exports. Combined with comprehensive error handling, logging, and validation, these APIs provide a robust foundation for configuration data management in the Sharedo platform.
