# Integration APIs
Generated: 07/27/2025 11:29:39

Total endpoints: 76

## Endpoints:
### GET /api/{publicApiName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modeller__Portal__PublicApiPageContext.cs.cs.md
- **Parameters**: publicApiName

### GET /api/admin/phases/{phaseSystemName}/transitions
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__Sharedo__SharedoPhaseAdminModule.cs.cs.md
- **Parameters**: phaseSystemName

### POST /api/admin/sharedo/phases/find
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__Sharedo__SharedoPhaseAdminModule.cs.cs.md

### POST /api/admin/sharedoTypes/phases
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Admin__Sharedo__SharedoPhaseAdminModule.cs.cs.md

### GET /api/admin/smartVariables/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__SmartVariables__SmartVariablesAdminModule.cs.cs.md

### DELETE /api/admin/smartVariables/definition/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__SmartVariables__SmartVariablesAdminModule.cs.cs.md
- **Parameters**: systemName

### GET /api/admin/smartVariables/definition/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__SmartVariables__SmartVariablesAdminModule.cs.cs.md
- **Parameters**: systemName

### PUT /api/admin/smartVariables/definition/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__SmartVariables__SmartVariablesAdminModule.cs.cs.md
- **Parameters**: systemName

### GET /api/admin/smartVariables/definition/{systemName}/isUnique
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__SmartVariables__SmartVariablesAdminModule.cs.cs.md
- **Parameters**: systemName

### GET /api/admin/smartVariables/values/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__SmartVariables__SmartVariablesAdminModule.cs.cs.md
- **Parameters**: systemName

### PUT /api/admin/smartVariables/values/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__SmartVariables__SmartVariablesAdminModule.cs.cs.md
- **Parameters**: systemName

### DELETE /api/admin/smartVariables/values/{systemName}/{context}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__SmartVariables__SmartVariablesAdminModule.cs.cs.md
- **Parameters**: systemName, context

### POST /api/bulkAssign/options
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__BulkAssign__BulkAssignModule.cs.cs.md

### POST /api/bulkAssign/related/{id}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__BulkAssign__BulkAssignModule.cs.cs.md
- **Parameters**: id

### GET /api/client/contract
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Client__ClientModule.cs.cs.md

### GET /api/dpaCheck/questionSets
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__DpaCheck__DpaCheckModule.cs.cs.md

### DELETE /api/dpaCheck/questionSets/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__DpaCheck__DpaCheckModule.cs.cs.md
- **Parameters**: systemName

### GET /api/dpaCheck/questionSets/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__DpaCheck__DpaCheckModule.cs.cs.md
- **Parameters**: systemName

### PUT /api/dpaCheck/questionSets/{systemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__DpaCheck__DpaCheckModule.cs.cs.md
- **Parameters**: systemName

### GET /api/dpaCheck/questionSets/{systemName}/_exists
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__DpaCheck__DpaCheckModule.cs.cs.md
- **Parameters**: systemName

### POST /api/dpaCheck/questionSets/{systemName}/buildAnswersForContext/{contextId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__DpaCheck__DpaCheckModule.cs.cs.md
- **Parameters**: systemName, contextId:guid

### DELETE /api/graph/scripting/functions/cache
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__DataGraph__Modules__ScriptFunctionsModule.cs.cs.md

### DELETE /api/graph/scripting/functions/cache/local
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__DataGraph__Modules__ScriptFunctionsModule.cs.cs.md

### POST /api/graph/scripting/functions/validate
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__DataGraph__Modules__ScriptFunctionsModule.cs.cs.md

### GET /api/incident/{id}/description
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Incidents__DesciptionModule.cs.cs.md
- **Parameters**: id

### GET /api/infotrack/my/details
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.InfoTrack__Modules__PortalModule.cs.cs.md

### POST /api/infotrack/my/details
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.InfoTrack__Modules__PortalModule.cs.cs.md

### GET /api/infotrack/my/status
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.InfoTrack__Modules__PortalModule.cs.cs.md

### GET /api/matter/duplicatesearch/client/{id}/divisions
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Matters__DuplicateSearchModule.cs.cs.md
- **Parameters**: id

### GET /api/matter/duplicatesearch/referencedata
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Matters__DuplicateSearchModule.cs.cs.md

### POST /api/matter/duplicatesearch/search
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Matters__DuplicateSearchModule.cs.cs.md

### GET /api/matters/radar
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Matters__MattersPortfolioRadarModule.cs.cs.md

### GET /api/modeller/referenceData/scorecardtemplate
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modeller__ReferenceData__ScorecardTemplateModule.cs.cs.md

### POST /api/moj/test/rta/addAttachmentNote
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__Modules__MojClaims__TestRTAModule_cs.md

### GET /api/moj/test/rta/getClaimsList
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__Modules__MojClaims__TestRTAModule_cs.md

### POST /api/ods/organisations
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__ODS__OrganisationModule.cs.cs.md

### GET /api/ods/organisations/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__ODS__OrganisationModule.cs.cs.md

### GET /api/ods/organisations/{orgId}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__ODS__OrganisationModule.cs.cs.md
- **Parameters**: orgId

### POST /api/ods/organisations/{orgId}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__ODS__OrganisationModule.cs.cs.md
- **Parameters**: orgId

### POST /api/ods/organisations/{orgId}/deactivate
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__ODS__OrganisationModule.cs.cs.md
- **Parameters**: orgId

### GET /api/odsTypes/forQuickLinks
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__ODS__OdsTypesModule.cs.cs.md

### POST /api/pageview/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__PageView__PageViewModule.cs.cs.md

### POST /api/pageview/summary
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__PageView__PageViewModule.cs.cs.md

### DELETE /api/path
- **Source**: API_Analysis_Report.md

### GET /api/path
- **Source**: API_Analysis_Report.md

### PATCH /api/path
- **Source**: API_Analysis_Report.md

### POST /api/path
- **Source**: API_Analysis_Report.md

### PUT /api/path
- **Source**: API_Analysis_Report.md

### DELETE /api/relatedSharedos/{forId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__RelatedSharedos__RelatedSharedosModule.cs.cs.md
- **Parameters**: forId:guid

### GET /api/relatedSharedos/{forId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__RelatedSharedos__RelatedSharedosModule.cs.cs.md
- **Parameters**: forId:guid

### GET /api/relatedSharedos/{forId:guid}/allowedRelationships/{ofType}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__RelatedSharedos__RelatedSharedosModule.cs.cs.md
- **Parameters**: forId:guid, ofType

### GET /api/relatedSharedos/{forId:guid}/allowedRelationships/{ofType}/typePaths
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__RelatedSharedos__RelatedSharedosModule.cs.cs.md
- **Parameters**: forId:guid, ofType

### GET /api/relatedSharedos/allowedRelationships/{ofType}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__RelatedSharedos__RelatedSharedosModule.cs.cs.md
- **Parameters**: ofType

### GET /api/relatedSharedos/infoFor/{forId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__RelatedSharedos__RelatedSharedosModule.cs.cs.md
- **Parameters**: forId:guid

### GET /api/relatedSharedos/leftToRight/{forId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__RelatedSharedos__RelatedSharedosModule.cs.cs.md
- **Parameters**: forId:guid

### GET /api/relatedSharedos/rightToLeft/{forId:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__RelatedSharedos__RelatedSharedosModule.cs.cs.md
- **Parameters**: forId:guid

### POST /api/rulesEngine/_selectors/phase/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__RulesEngine__Modules__SelectorsModule.cs.cs.md

### POST /api/rulesEngine/_selectors/phase/autocomplete
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__RulesEngine__Modules__SelectorsModule.cs.cs.md

### POST /api/rulesEngine/_selectors/teams/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__RulesEngine__Modules__SelectorsModule.cs.cs.md

### GET /api/sharedo/{sharedoId:guid}/{typeName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Tasks__TaskProcessTagModule.cs.cs.md
- **Parameters**: sharedoId:guid, typeName

### GET /api/sharedo/{sharedoId:guid}/childrenByTagPrefix/{tag}/{isOpen?true}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Tasks__TaskProcessTagModule.cs.cs.md
- **Parameters**: sharedoId:guid, tag, isOpen?true

### GET /api/sharedo/{sharedoId:guid}/dpaCheck/{id:guid}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__DpaCheck__DpaCheckModule.cs.cs.md
- **Parameters**: sharedoId:guid, id:guid

### GET /api/sharedo/{sharedoId:guid}/infotrack/launchurl
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.InfoTrack__Modules__PortalModule.cs.cs.md
- **Parameters**: sharedoId:guid

### GET /api/sharedo/{sharedoId:guid}/openChildren
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Tasks__TaskProcessTagModule.cs.cs.md
- **Parameters**: sharedoId:guid

### GET /api/sharedo/{sharedoId:guid}/openChildren/{typeName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Tasks__TaskProcessTagModule.cs.cs.md
- **Parameters**: sharedoId:guid, typeName

### POST /api/sharedo/search
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Sharedos__SharedoSearchModule.cs.cs.md

### GET /api/sharedo/search/referencedata
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Legal__API__Sharedos__SharedoSearchModule.cs.cs.md

### GET /api/sharedoTypes/{typeSystemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__SharedoTypes__SharedoTypesModule.cs.cs.md
- **Parameters**: typeSystemName

### GET /api/sharedoTypes/{typeSystemName}/workScheduling
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__SharedoTypes__SharedoTypesModule.cs.cs.md
- **Parameters**: typeSystemName

### GET /api/sharedoTypes/byTypePath/{typePath}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__SharedoTypes__SharedoTypesModule.cs.cs.md
- **Parameters**: typePath

### GET /api/sharedoTypes/tree/
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__SharedoTypes__SharedoTypesModule.cs.cs.md

### GET /api/wordaddin/contentBlockTypes
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__WordAddin__WordAddinBlocksModule.cs.cs.md

### GET api/ods/{odsId}/connections/stats
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__Stats__ConnectionsStatsModule.cs.cs.md
- **Parameters**: odsId

### GET api/ods/{odsId}/connections/stats/connection/{connectionSystemName}
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__Stats__ConnectionsStatsModule.cs.cs.md
- **Parameters**: odsId, connectionSystemName

### POST api/ods/{odsId}/connections/stats/sharedo-breakdown
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Connections__Stats__ConnectionsStatsModule.cs.cs.md
- **Parameters**: odsId

### GET api/sharedo/tags
- **Source**: Sharedo.Web.UI__Plugins__Sharedo.Core.Case__Modules__Sharedo__TagsModule.cs.cs.md


