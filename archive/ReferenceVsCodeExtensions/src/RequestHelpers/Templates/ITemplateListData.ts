
export interface ITemplateListData {
  id: string;
  systemName: string;
  title: string;
  description: string;
  contextTypeSystemName: string;
  contextTypeName: string;
  baseTemplateType: string;
  templateType: string;
  isActive: boolean;
  isPinned: boolean;
  status: string;
  upgradeStatus?: any;
  upgradeMessage?: any;
  hasPlans: boolean;
  planCount: IPlanCount[];
  planCountValue: number;
  tags: string[];
  totalUsageCountValue: number;
  totalUsageCount: IPlanCount[];
  isContentBlock: boolean;
  isDocumentTemplate: boolean;
  isEmailTemplate: boolean;
  isSmsTemplate: boolean;
}

export interface IPlanCount {
  title?: string;
  countClass: string;
  value: number;
}