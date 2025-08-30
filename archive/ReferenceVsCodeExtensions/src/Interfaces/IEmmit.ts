/**
 * Server Event Emission Types and Interfaces for ShareDo
 *
 * This file defines enums and interfaces for server-side events related to publishing files and folders.
 * Used for event-driven communication between the extension and the ShareDo server.
 */
import path = require("path");
import { SharedoClient } from "../sharedoClient";




export enum ServerEmmitType {
    publishingFiles = "publishingFile",
    publishingFileComplete = "publishingFileComplete",
    publishingFilesError = "publishingFileError",
    publishingFilesUpdated = "publishingFilesUpdated",
    publishingFolder = "publishingFolder",
    publishingFileStarted = "publishingFileStarted"
}

export interface IServerEventPublishingBase
{
    batchId:string,
    server:SharedoClient
}

export interface IServerEventPublishingFolder extends IServerEventPublishingBase
{
    folderName:string
}

export interface IServerEventPublishingFileCompleted  extends IServerEventPublishingBase
{      
        file:string
}

export interface IServerEventPublishingFilesUpdated  extends IServerEventPublishingBase
{
    files: Array<string>
}


export interface IServerEvent<T>
{
    type:ServerEmmitType
    data: T;
}