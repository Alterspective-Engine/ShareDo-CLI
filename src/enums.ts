export enum RunningPromiseStatus {
  pending,
  resolved,
  rejected
}

export enum SortDirection {
  ascending,
  descending
}



export function elementsTypesParser(elementTypeAsString: string) : ElementTypes
{

	let camelCaseString = camelCase(elementTypeAsString);

  let retValue = ElementTypes[camelCaseString as keyof typeof ElementTypes];
  if(!retValue)
  {
	retValue = ElementTypes.object;
  }	
  return retValue;
}

//write method to return camel case from string
export function camelCase(str: string) {
	  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
		return index === 0 ? word.toLowerCase() : word.toUpperCase();
				  }).replace(/\s+/g, '');
}



export enum ElementTypes {
  server = "Server",
  deployToServer = "DeployToServer",
  connectors = "Connectors",
  connector = "Connector",
  workflows = "Workflows",
  workflow = "Workflow",
  error = "Error",
  errors = "Errors",
  info = "Info",
  infos = "Infos",
  favorites = "Favorites",
  favoriteItem = "FavoriteItem",
  workTypes = "WorkTypes",
  workType = "WorkType",
  form = "Form",
  folder = "Folder",
  folderItem = "FolderItem",
  object = "object",
  ide = "IDE",
  css = "Css",
  html = "Html",
  js = "Js",
  json = "json",
  text = "Text",
  wfActionManifest = "WfActionManifest",
  widgetManifest = "WidgetManifest",
  workflowDefinition = "workflowDefinition",
  workflowSteps = "workflowSteps",
  workflowVariables = "workflowVariables",
  workflowStep = "workflowStep",
  workflowStepActions = "workflowStepActions",
  workflowStepIDEData = "workflowStepIDEData",
  workflowStepActionConfig = "workflowStepActionConfig",
  workflowStepActionConnections = "workflowStepActionConnections",
  workflowStepAction = "workflowStepAction"
 
}

