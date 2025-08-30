import { camelCase } from "lodash";

export type ISharedoIDERequestResult = ISharedoIDEItem[];
export type IPostProcessedSharedoIDERequestResult = IPostProcessedSharedoIDEItem[];

export interface  ISharedoIDEItem {
    id:       string;
    name:     string;
    type:     SharedoIDEType;
    children: ISharedoIDEItem[] | undefined;
}

export interface IPostProcessedSharedoIDEItem extends ISharedoIDEItem {
    parent: IPostProcessedSharedoIDEItem | undefined;
    children: IPostProcessedSharedoIDEItem[] | undefined;
}

export function sharedoIDETypeTypesParser(elementTypeAsString: string) : SharedoIDEType
{

	let lowerCaseString = elementTypeAsString.toLocaleLowerCase();

   
    

    if(lowerCaseString.includes(".wf-action.json"))
    {
        lowerCaseString = "wfActionManifest";
    }else if(lowerCaseString.includes(".widget.json"))
    {
        lowerCaseString = "WidgetManifest";
    }else if(lowerCaseString.endsWith(".txt"))
    {
        lowerCaseString = "text";
    }
    else   //if we are getting a file name, extract the end portion
    if(lowerCaseString.includes("."))
    {
        lowerCaseString = lowerCaseString.split(".")[1];
    }

    let camelCaseString = camelCase(lowerCaseString);

  let retValue = SharedoIDEType[camelCaseString as keyof typeof SharedoIDEType];
  if(!retValue)
  {
    retValue = SharedoIDEType.text;
  }	
  return retValue;
}

export enum SharedoIDEType {
    css = "Css",
    folder = "Folder",
    html = "Html",
    js = "Js",
    json = "Json",
    text = "Text",
    wfActionManifest = "WfActionManifest",
    widgetManifest = "WidgetManifest",
    
}
