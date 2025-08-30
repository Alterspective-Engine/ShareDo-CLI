/**
 * Category Interfaces for ShareDo
 *
 * Defines interfaces for categories and category items, used to organize and represent hierarchical data in ShareDo.
 */
import { SharedoClient } from "../sharedoClient";
import { IParentExtention } from "./Common";


export interface ICategory extends  IParentExtention<SharedoClient>
{
  displayName: any;
  name: string;
  id: string;
    //fields
}
export interface ICategoryItem extends IParentExtention<ICategory>
{
  dataType: string;
  displayName: string;

    //fields
}
 
