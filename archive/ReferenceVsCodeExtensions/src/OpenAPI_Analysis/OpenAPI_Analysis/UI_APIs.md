# UI APIs
Generated: 07/27/2025 11:29:39

Total endpoints: 12

## Endpoints:
### GET /{sharedoId:guid}/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityBarriersModule.cs.cs.md
- **Parameters**: sharedoId:guid

### GET /{sharedoId:guid}/{isAllowed:bool}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityBarriersModule.cs.cs.md
- **Parameters**: sharedoId:guid, isAllowed:bool

### PUT /{sharedoId:guid}/role/{roleSystemName}/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityBarriersModule.cs.cs.md
- **Parameters**: sharedoId:guid, roleSystemName

### GET /{sharedoId:guid}/role/{roleSystemName}/odsEntity/{odsId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityBarriersModule.cs.cs.md
- **Parameters**: sharedoId:guid, roleSystemName, odsId:guid

### GET /debug/docgen/sharedo/{sharedoId:guid}/tags
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__DocumentGeneration__Debug__TagDebugModule.cs.cs.md
- **Parameters**: sharedoId:guid

### GET /password/changePassword/{token:guid}
- **Source**: Sharedo.Security.IdServer.Host__Custom__Modules__ChangePassword__ChangePasswordModule.cs.cs.md
- **Parameters**: token:guid

### POST /password/changePassword/{token:guid}
- **Source**: Sharedo.Security.IdServer.Host__Custom__Modules__ChangePassword__ChangePasswordModule.cs.cs.md
- **Parameters**: token:guid

### DELETE /systemPermissions/entity/{entityId:guid}/permissionSets
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityModule.cs.cs.md
- **Parameters**: entityId:guid

### GET /systemPermissions/odsEntity/{id:guid}/byCategory
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityModule.cs.cs.md
- **Parameters**: id:guid

### DELETE /systemPermissions/permissionSet/{id:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityModule.cs.cs.md
- **Parameters**: id:guid

### GET /systemPermissions/permissionSet/{id:guid}/isActive/{isActive:bool}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityModule.cs.cs.md
- **Parameters**: id:guid, isActive:bool

### PUT /systemPermissions/permissionSet/{permissionSetId:guid}/entity/{entityId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityModule.cs.cs.md
- **Parameters**: permissionSetId:guid, entityId:guid


