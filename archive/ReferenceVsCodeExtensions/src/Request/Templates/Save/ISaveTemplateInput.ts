export interface ISaveTemplateInput {
  id: string;
  systemName: string;
  templateType: string;
  active: boolean;
  isPinned: boolean;
  title: string;
  description: string;
  tags: any[];
  processTags: any[];
  toRoleRequired: boolean;
  regardingRoleRequired: boolean;
  toRoles: any[];
  regardingRoles: any[];
  recipientLocationRequired: boolean;
  recipientConfig: IRecipientConfig;
  contextTypeSystemName: string;
  formIds: any[];
  approval: IApproval;
  deliveryChannels: any[];
  refreshOnDelivery: boolean;
  deliveryRefreshTags: any[];
  defaultFolderId: number;
  outputDestinations: IOutputDestination[];
  pdfOptions: IPdfOptions;
  packDocuments: IPackDocument[];
  emailSubject?: any;
  templateRepository: string;
  displayInMenus: boolean;
  displayContexts: any[];
  displayRules: any[];
  legacyPhaseRestrictions: any[];
  contentBlock: IContentBlock;
  participantSearchScopeSystemName?: any;
  multiPartyTemplateSources: any[];
}

export interface IContentBlock {
  availableForTemplateAuthors: boolean;
  availableForDocumentAuthors: boolean;
}

export interface IPackDocument {
  id: string;
  type: string;
  outputTitle: string;
  outputFileName: string;
  copies: number;
  isMandatory: boolean;
  order: number;
  sources: ISource[];
}

export interface ISource {
  id: string;
  htmlContent?: any;
  filePath: string;
  order: number;
  status?: any;
  rules: any[];
}

export interface IPdfOptions {
  generate: boolean;
  deleteOriginal: boolean;
  fileName: string;
}

export interface IOutputDestination {
  typeSystemName: string;
  repository: string;
  path: string;
}

export interface IApproval {
  approvalSystemName?: any;
  competencyApprovalSystemName?: any;
  competencySystemNames: any[];
}

export interface IRecipientConfig {
  recipientLocationRequired: boolean;
}