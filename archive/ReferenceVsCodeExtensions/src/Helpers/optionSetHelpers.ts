/**
 * Option Set Helpers for ShareDo VS Code Extension
 *
 * Provides functions to search and process option sets and their values from the ShareDo server.
 * Used for dynamic lookup and tree node generation for option sets.
 */
import { IOptionsSet } from "../Request/OptionSets/GetOptionsSetsRequest";
import { IOptionSetValueProperty } from "../Request/OptionSets/IOptionSet";
import { SharedoClient } from "../sharedoClient";
import { TreeNode } from "../treeprovider";

export type OptionSetOptionSearchResult = {
    serverUrl: string,
    searchId: number,
    optionSet: IOptionsSet | undefined,
    optionSetOption: IOptionSetValueProperty | undefined,
    totalOptionSetsSearched: number,
    endResult: "Found" | "NotFound"
};


export async function findOptionSetOptionById(id:number, server: SharedoClient)
{
    let result : OptionSetOptionSearchResult=
    {
        serverUrl: server.url,
        searchId: id,
        optionSet: undefined,
        optionSetOption: undefined,
        totalOptionSetsSearched: 0,
        endResult: "NotFound"
    };

    let promiseArray : Promise<any>[] = [];
     await server.getOptionSets().then((optionSets) => {
        let returnValue: IOptionSetValueProperty | undefined = undefined;
        for (const optionSet of optionSets) {

           
            let search= server.getOptionSetInfo(optionSet.optionSetName).then((optionSetInfo) => {
                let optionSetOptions = optionSetInfo?.optionSetValueProperties;
                
                if(optionSetInfo?.optionSetProperty.optionSetName === "ud-states")
                {
                    console.log("ud-states");
                }

                if (optionSetOptions) {

                    

                    for (const optionSetOption of optionSetOptions) {
                        result.totalOptionSetsSearched++;
                        if (optionSetOption.id === id) {
                           
                            result.optionSet = optionSet;
                            result.optionSetOption = optionSetOption;
                            result.endResult = "Found";
                        }
                    }
                    console.log("Total OptionSets Searched: " + result.totalOptionSetsSearched);
                }
            });
            promiseArray.push(search);
        }
     
    });

    return Promise.all(promiseArray).then((values) => {
        // for (const value of values) {
        //     if(value)
        //     {
            
                return result;
        //     }
        // }
    });
}