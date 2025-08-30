export interface IShareDoTemplate {
  systemName: string;
  id: string;
  title: string;
  description: string;
  active: boolean;
  isPinned: boolean;
  categories: string[];
  processTags: any[];
  templateType: string;
  sendActivityType: string;
  documentGeneratorId: string;
  dataContextTypeSystemName: string;
  dataContextTypePath: string;
  templateRepository: string;
  documentPackContents: IDocumentPackContent[];
  outputFile: string;
  outputTitle: string;
  outputDestinations: IOutputDestination[];
  defaultOutputDestination: IOutputDestination;
  defaultDocumentClassOptionSetId: number;
  emailSubject?: any;
  displayInMenus: boolean;
  legacyPhaseRestrictions: any[];
  displayContextTypeSystemNames: any[];
  displayRules: any[];
  toRoleRequired: boolean;
  toParticipantRole: string;
  toRoles: any[];
  regardingRoleRequired: boolean;
  regardingParticipantRole: string;
  regardingRoles: any[];
  recipientConfig: IRecipientConfig;
  forms: any[];
  approvalSystemName?: any;
  competencyApprovalSystemName?: any;
  competencySystemNames: any[];
  generatePdfAutomatically: boolean;
  generatePdfAutomaticallyDeleteOriginalDocument: boolean;
  pdfVersionFileName: string;
  participantSearchScopeSystemName?: any;
  multiPartyDocumentTemplateSources: any[];
  documentChannelConfigs: any[];
  documentChannels: any[];
  refreshDocumentsOnDelivery: boolean;
  deliveryRefreshTags: any[];
  questionnaireMenuId?: any;
  tagSources: string;
  tagLibraries: ITagLibraries;
  upgradeVersion: string;
  upgradeStatus?: any;
  upgradeMessage?: any;
  contentBlock: IContentBlock;
  type: IType;
  dataQualityRules: any[];
}

export interface IType {
  baseTemplateType: string;
  generator: string;
  isActive: boolean;
  isSystem: boolean;
  systemName: string;
  name: string;
  description: string;
  iconClass: string;
  sendActivityType: string;
  alternateActivityTypes: any[];
  isMultiParty: boolean;
  isDocument: boolean;
  isEmail: boolean;
  isSms: boolean;
  isBundleSeparator: boolean;
  isEmailNotification: boolean;
  isNotification: boolean;
  isContentBlock: boolean;
  supportsWorkTypeDataContext: boolean;
  isDisplayEnabled: boolean;
  inlineTemplateEditingOnly: boolean;
  supportsAttachments: boolean;
  supportsEnclosures: boolean;
  supportsAlternateTemplates: boolean;
  supportsMultipleTemplates: boolean;
  supportsToRecipient: boolean;
  supportsRegardingRecipient: boolean;
  supportsQuestionnaires: boolean;
  supportsApproval: boolean;
  supportsDelivery: boolean;
  supportsDocumentActions: boolean;
  supportsLegacyTagLibraries: boolean;
  supportsOutput: boolean;
  supportsPdfConversion: boolean;
  supportsProcessTags: boolean;
  supportsContentBlocks: boolean;
  graphName: string;
}

export interface IContentBlock {
  availableForTemplateAuthors: boolean;
  availableForDocumentAuthors: boolean;
}

export interface ITagLibraries {
}

export interface IRecipientConfig {
  recipientLocationRequired: boolean;
}

export interface IOutputDestination {
  typeSystemName: string;
  repository: string;
  path: string;
}

export interface IDocumentPackContent {
  id: string;
  order: number;
  templateType: string;
  outputFileName: string;
  outputTitle: string;
  copies: number;
  isMandatory: boolean;
  sources: ISource[];
}

export interface ISource {
  id: string;
  packDocumentId: string;
  filePath: string;
  htmlContent?: any;
  status?: any;
  order: number;
  rules: any[];
}