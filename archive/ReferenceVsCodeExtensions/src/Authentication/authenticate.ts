/* eslint-disable @typescript-eslint/naming-convention */

import axios from "axios";
import { IShareDoAuthorizeResponse } from "../Request/IauthorizeResponse";
import { SharedoClient } from "../sharedoClient";
import * as https from 'https';

//write function to authenticate and get token
export const authenticate = async (sharedoClient: SharedoClient) : Promise<IShareDoAuthorizeResponse> => {

  if(!sharedoClient.tokenEndpoint) {
    throw new Error("No token endpoint");
  }
  
  let url = sharedoClient.tokenEndpoint;

  const params = new URLSearchParams();
  params.append('grant_type', 'Impersonate.Specified');
  // params.append('grant_type', 'client_credentials');
  params.append('scope', 'sharedo');
  if(sharedoClient.impersonateUser){
  params.append('impersonate_user', sharedoClient.impersonateUser);
  }
  if(sharedoClient.impersonateProvider){
  params.append('impersonate_provider', sharedoClient.impersonateProvider);
  }

  const instance = axios.create({
    baseURL: sharedoClient.tokenEndpoint,
});

instance.defaults.httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

instance.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

  return instance.post<IShareDoAuthorizeResponse>(url, params, {
     
    headers: {
 
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `${sharedoClient.authenticationBearer}`
    }
  }).then(result => {
      //check if result is of type IShareDoAuthorizeResponse
    //if not throw error

    if (!result.data.access_token) {
      throw new Error("No access token in response");
    }
    if (!result.data.expires_in) {
      throw new Error("No expires in in response");
    }
    if (!result.data.token_type) {
      throw new Error("No token type in response");
    }
    
    return result.data;
  })
  .catch(error => {
    console.log("Error in execute: " + error);

    return Promise.reject(error);
  }
  );

};


