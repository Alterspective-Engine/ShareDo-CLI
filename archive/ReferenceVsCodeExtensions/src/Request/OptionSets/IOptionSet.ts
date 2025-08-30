

export  interface IOptionSetInfo {
  optionSetProperty: IOptionSetProperty;
  optionSetValueProperties: IOptionSetValueProperty[];
}

export interface IOptionSetValueProperty {
  stripingRuleSetSystemNames: any[];
  children: any[];
  id: number;
  optionSetName: string;
  parentValueId?: any;
  name: string;
  shortName?: any;
  iconClass?: any;
  isActive: boolean;
  meaningCode?: any;
  migrationId?: any;
  displayColour?: any;
  deleted: boolean;
  defaultActive: boolean;
  displayOrder: number;
}

export interface IOptionSetProperty {
  optionSetName: string;
  name: string;
  description: string;
  allowHierarchy: boolean;
  isSystem: boolean;
  isActive: boolean;
  enableDisplayRules: boolean;
  requiresGlobalFeature?: any;
}