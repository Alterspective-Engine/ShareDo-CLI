
export interface IGetWorkTypeAspectsRequestResult {
  sharedoTypeIcon: string;
  sharedoTypeName: string;
  sharedoTypeColour?: any;
  hasDerivedTypes: boolean;
  isRootType: boolean;
  aspects: IModellerAspectSections;
}

export interface IModellerAspectSections {
  bottom: IModellerAspectInfo[];
  footer: IModellerAspectInfo[];
  main: IModellerAspectInfo[];
  header: IModellerAspectInfo[];
  top: IModellerAspectInfo[];
}


export interface IModellerAspectInfo {
  id: string;
  readOnly: boolean;
  inherited: boolean;
  inheritedFrom?: any;
  inheritedFromTypeSystemName?: any;
  zoneName: string;
  stripingRuleSetSystemNames: any[];
  personaSystemNames: any[];
  configPanelId?: string;
  aspectDefinitionSystemName: string;
  displayName: string;
  description: string;
  data?: any;
  config?: string;
  widgetId: string;
  widgetChrome: boolean;
  widgetTitle: string;
  widgetStartsCollapsed: boolean;
  canConfigureWidget: boolean;
  widgetConfig?: string;
  displayPriority: number;
  views?: any;
  viewPermissionSystemName?: any;
  updatePermissionSystemName?: any;
}