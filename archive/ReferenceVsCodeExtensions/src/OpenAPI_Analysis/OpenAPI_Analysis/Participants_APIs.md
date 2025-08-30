# Participants APIs
Generated: 07/27/2025 11:29:39

Total endpoints: 29

## Endpoints:
### GET /{sharedoId:guid}/role/{roleSystemName}/participant/{participantId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__SecurityBarriersModule.cs.cs.md
- **Parameters**: sharedoId:guid, roleSystemName, participantId:guid

### GET /api/modeller/referenceData/participantRoleCategories
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modeller__ReferenceData__ParticipantReferenceDataModule.cs.cs.md

### GET /api/modeller/referenceData/participantRoles
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modeller__ReferenceData__ParticipantReferenceDataModule.cs.cs.md

### GET /api/modeller/referenceData/participantRoles/for/{sharedoTypeSystemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modeller__ReferenceData__ParticipantReferenceDataModule.cs.cs.md
- **Parameters**: sharedoTypeSystemName

### GET /api/modeller/referenceData/participantTypes
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modeller__ReferenceData__ParticipantReferenceDataModule.cs.cs.md

### GET /api/modeller/referenceData/participantTypes/for/{sharedoTypeSystemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modeller__ReferenceData__ParticipantReferenceDataModule.cs.cs.md
- **Parameters**: sharedoTypeSystemName

### POST /api/participant
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Participants__ParticipantsPostModule.cs.cs.md

### POST /api/participant/{id:guid}/reassign
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Participants__ParticipantsPostModule.cs.cs.md
- **Parameters**: id:guid

### GET /api/participantTypes/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Participants__ParticipantTypesModule.cs.cs.md

### GET /api/participantTypes/forOdsEntityType/{odsEntityType}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Participants__ParticipantTypesModule.cs.cs.md
- **Parameters**: odsEntityType

### GET /api/sharedo/{sharedoId}/participants/internal
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Participants__InternalParticipantsModule.cs.cs.md
- **Parameters**: sharedoId

### POST /api/sharedo/{sharedoId}/participants/internal
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Participants__InternalParticipantsModule.cs.cs.md
- **Parameters**: sharedoId

### GET /api/sharedoTypes/{typeSystemName}/participantRoles/{roleSystemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__SharedoTypes__SharedoTypesModule.cs.cs.md
- **Parameters**: typeSystemName, roleSystemName

### GET /enrichment/participant/{participantId:guid}/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Enrichments__ParticipantEnrichmentModule.cs.cs.md
- **Parameters**: participantId:guid

### GET /participantRoleConnectionCategories
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModellerModule.cs.cs.md

### POST /participantRoleConnectionCategory
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModellerModule.cs.cs.md

### DELETE /participantRoleConnectionCategory/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModellerModule.cs.cs.md
- **Parameters**: systemName

### GET /participantRoleConnectionCategory/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModellerModule.cs.cs.md
- **Parameters**: systemName

### POST /participantRoleConnections/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModellerModule.cs.cs.md

### POST /participantRoleConnections/_find
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModellerModule.cs.cs.md

### GET /participantRoleConnections/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModellerModule.cs.cs.md
- **Parameters**: systemName

### PUT /participantRoleConnections/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModellerModule.cs.cs.md
- **Parameters**: systemName

### PUT /participantRoleConnections/{systemName}/enabled
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModellerModule.cs.cs.md
- **Parameters**: systemName

### POST /participants/{participantId}/connections
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModule.cs.cs.md
- **Parameters**: participantId

### DELETE /participants/{participantId}/connections/{connectionId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModule.cs.cs.md
- **Parameters**: participantId, connectionId:guid

### POST /participants/{participantId}/connections/find
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__ParticipantRoles__RoleConnectionsModule.cs.cs.md
- **Parameters**: participantId

### GET api/participants/{participantId}/connections/stats/ods/{connectionSystemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__Stats__ConnectionsStatsModule.cs.cs.md
- **Parameters**: participantId, connectionSystemName

### POST api/participants/{participantId}/connections/stats/sharedo-breakdown
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__Stats__ConnectionsStatsModule.cs.cs.md
- **Parameters**: participantId

### POST api/participants/{participantId}/connections/stats/summary
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__Stats__ConnectionsStatsModule.cs.cs.md
- **Parameters**: participantId


