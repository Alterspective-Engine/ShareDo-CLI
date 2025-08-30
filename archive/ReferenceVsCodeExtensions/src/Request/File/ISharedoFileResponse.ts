import { SharedoIDEType } from "../IDE/ISharedoIDERequestResult";





export interface ISharedoFileResponse {
  success: boolean;
  error?: any;
  id: string;
  type: SharedoIDEType;
  name: string;
  content: string;
}