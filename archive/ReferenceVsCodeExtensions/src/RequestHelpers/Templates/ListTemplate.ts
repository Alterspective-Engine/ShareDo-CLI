
/**
 * List Document Templates Helper for ShareDo
 *
 * Provides a function to retrieve document templates from the ShareDo server using a list view request.
 * Used for admin/document template management in the extension.
 */

import { IListViewFilterItem } from "../../Request/ListViews/IListViewInput";
import { ListViewRequest } from "../../Request/ListViews/listViewRequest";
import { SharedoClient } from "../../sharedoClient";
import { ITemplateListData } from "./ITemplateListData";


export async function listDocumentTemplates(sharedoClient: SharedoClient,filter: IListViewFilterItem[])
{
    let exec = new ListViewRequest<ITemplateListData>(sharedoClient);
    exec.inputProperties.listView=  "core-admin-document-templates-documents";
    if(filter){exec.inputProperties.filters = filter;};

    return exec.execute().then((result) => {
            console.log("Result Length:", result.result?.rows.length);
            console.log("Result Total :", result.result?.resultCount);         
            if(result.success !== true)
            {
                console.log("Result Success :", result.success);
                console.log("Result Error :", result.error);
                //TODO: see if there is a freindly error message
                Promise.reject(result.error);
            }            
            return result.result;            
        }
        ).catch((error) => {
            console.log(error);
           
            // assert.fail(error);
        });
}