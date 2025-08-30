import { RequestBase, MethodType, ResultType } from "../../../Execution/ExecutionBase";
import { IShareDoTemplate } from "../IShareDoTemplate";
import { ISaveTemplateInput } from "./ISaveTemplateInput";

 const defaultData : any ={
     id: "",
     systemName: "",
     templateType: "",
     active: false,
     isPinned: false,
     title: "",
     description: "",
     tags: [],
     processTags: [],
     toRoleRequired: false,
     regardingRoleRequired: false,
     toRoles: [],
     regardingRoles: [],
     recipientLocationRequired: false,
     recipientConfig: undefined,
     contextTypeSystemName: "",
     formIds: [],
     approval: undefined,
     deliveryChannels: [],
     refreshOnDelivery: false,
     deliveryRefreshTags: [],
     defaultFolderId: 0,
     outputDestinations: [],
     pdfOptions: undefined,
     packDocuments: [],
     templateRepository: "",
     displayInMenus: false,
     displayContexts: [],
     displayRules: [],
     legacyPhaseRestrictions: [],
     contentBlock: undefined,
     multiPartyTemplateSources: []
 };

export class SaveTemplate extends RequestBase <undefined,ISaveTemplateInput>
{
    resultType: ResultType = ResultType.json;
    method: MethodType = MethodType.post;
    inputProperties=defaultData;
    information= 
    {
        description: "Save Template",
        displayName: "Save Template",
        created: "2023-May-10",
        categories: "Templates"
    };
    
    get path()
    {
        return `/api/admin/docGen/templates/${(this.inputProperties! as IShareDoTemplate).systemName}`;  
    }

    get body()
    {
        return this.inputProperties;
    }
 

        
}
