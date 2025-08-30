// import { SharedoClient } from "../../sharedoClient"
// import { SharedoExecutionBase } from "../ExecutionBase"



// //#region  : DisplayName [Category Data] - SystemName [com_K2_System_Management_WorkItem_CategoryData] - Methods [9]
// export namespace WorkItem_CategoryData {
// 	//#region Method --- CopyForm ---
// 	export interface ICopyForm_Result {
// 		CategoryId: number
// 		CategoryData__CategoryData_: string
// 	}

// 	export interface ICopyForm_Inputs {
// 		CategoryXml: string
// 		Data: string
// 		DisplayName: string
// 	}

// 	let CopyFormSettings =
// 	{
// 		"method": "CopyForm",
// 		"inputProperties": {
// 			"CategoryXml": "",
// 			"Data": "",
// 			"DisplayName": ""
// 		},
// 		"information": {
// 			"displayName": "Category Data",
// 			"created": "2020-05-18T19:01:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "abc4e713-135c-4ccb-aaab-ea4c50071923",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryData"
// 	}
// 	export class CopyForm extends SharedoExecutionBase.ExecutionBase<ICopyForm_Result, ICopyForm_Inputs> {
// 		constructor(sharedoClient: SharedoClient) {
// 			super(sharedoClient, CopyFormSettings);
// 		}
// 	}
// 	//#endregion Method --- CopyForm ---
// 	//#region Method --- CopyWorkItem ---
// 	export interface ICopyWorkItem_Result {
// 		CategoryData__CategoryData_: string
// 	}

// 	export interface ICopyWorkItem_Inputs {
// 		CategoryData: string
// 		CategoryId: number
// 		Data: string
// 		DisplayName: string
// 	}

// 	let CopyWorkItemSettings =
// 	{
// 		"method": "CopyWorkItem",
// 		"inputProperties": {
// 			"CategoryData": "",
// 			"CategoryId": "",
// 			"Data": "",
// 			"DisplayName": ""
// 		},
// 		"information": {
// 			"displayName": "Category Data",
// 			"created": "2020-05-18T19:01:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "abc4e713-135c-4ccb-aaab-ea4c50071923",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryData"
// 	}
// 	export class CopyWorkItem extends SharedoExecutionBase.ExecutionBase<ICopyWorkItem_Result, ICopyWorkItem_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, CopyWorkItemSettings)
// 		}
// 	}
// 	//#endregion Method --- CopyWorkItem ---
// 	//#region Method --- CopyView ---
// 	export interface ICopyView_Result {
// 		CategoryId: number
// 		CategoryData__CategoryData_: string
// 	}

// 	export interface ICopyView_Inputs {
// 		CategoryXml: string
// 		Data: string
// 		DisplayName: string
// 	}

// 	let CopyViewSettings =
// 	{
// 		"method": "CopyView",
// 		"inputProperties": {
// 			"CategoryXml": "",
// 			"Data": "",
// 			"DisplayName": ""
// 		},
// 		"information": {
// 			"displayName": "Category Data",
// 			"created": "2020-05-18T19:01:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "abc4e713-135c-4ccb-aaab-ea4c50071923",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryData"
// 	}
// 	export class CopyView extends SharedoExecutionBase.ExecutionBase<ICopyView_Result, ICopyView_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, CopyViewSettings)
// 		}
// 	}
// 	//#endregion Method --- CopyView ---
// 	//#region Method --- GetCategoryDataByGuid ---
// 	export interface IGetCategoryDataByGuid_Result {
// 		CategoryId: number
// 		Data: string
// 		DataType: string
// 		DisplayName: string
// 		Name: string
// 	}

// 	export interface IGetCategoryDataByGuid_Inputs {
// 		CategoryDataGuid: string
// 	}

// 	let GetCategoryDataByGuidSettings =
// 	{
// 		"method": "GetCategoryDataByGuid",
// 		"inputProperties": {
// 			"CategoryDataGuid": ""
// 		},
// 		"information": {
// 			"displayName": "Category Data",
// 			"created": "2020-05-18T19:01:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "abc4e713-135c-4ccb-aaab-ea4c50071923",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryData"
// 	}
// 	export class GetCategoryDataByGuid extends SharedoExecutionBase.ExecutionBase<IGetCategoryDataByGuid_Result, IGetCategoryDataByGuid_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetCategoryDataByGuidSettings)
// 		}
// 	}
// 	//#endregion Method --- GetCategoryDataByGuid ---
// 	//#region Method --- List ---
// 	export interface IList_Result {
// 		CategoryId: number
// 		Data: string
// 		DataType: string
// 		DisplayName: string
// 	}

// 	export interface IList_Inputs {
// 	}

// 	let ListSettings =
// 	{
// 		"method": "List",
// 		"inputProperties": {
// 			"null": ""
// 		},
// 		"information": {
// 			"displayName": "Category Data",
// 			"created": "2020-05-18T19:01:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "abc4e713-135c-4ccb-aaab-ea4c50071923",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryData"
// 	}
// 	export class List extends SharedoExecutionBase.ExecutionBase<IList_Result, IList_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, ListSettings)
// 		}
// 	}
// 	//#endregion Method --- List ---
// 	//#region Method --- ListByCategoryId ---
// 	export interface IListByCategoryId_Result {
// 		CategoryId: number
// 		Data: string
// 		DataType: string
// 		DisplayName: string
// 		TreeIcon_ID: number
// 		TreeIcon_Name: string
// 		TreeIcon_Type: string
// 	}

// 	export interface IListByCategoryId_Inputs {
// 		SearchAllChildren: boolean
// 		CategoryId: number
// 		TreeIcon_ID: number
// 		TreeIcon_Name: string
// 		TreeIcon_Type: string
// 	}

// 	let ListByCategoryIdSettings =
// 	{
// 		"method": "ListByCategoryId",
// 		"inputProperties": {
// 			"SearchAllChildren": "",
// 			"CategoryId": "",
// 			"TreeIcon_ID": "",
// 			"TreeIcon_Name": "",
// 			"TreeIcon_Type": ""
// 		},
// 		"information": {
// 			"displayName": "Category Data",
// 			"created": "2020-05-18T19:01:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "abc4e713-135c-4ccb-aaab-ea4c50071923",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryData"
// 	}
// 	export class ListByCategoryId extends SharedoExecutionBase.ExecutionBase<IListByCategoryId_Result, IListByCategoryId_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, ListByCategoryIdSettings)
// 		}
// 	}
// 	//#endregion Method --- ListByCategoryId ---
// 	//#region Method --- MoveWorkItem ---
// 	export interface IMoveWorkItem_Result {
// 		CategoryId: number
// 		CategoryData__CategoryData_: string
// 	}

// 	export interface IMoveWorkItem_Inputs {
// 		CategoryXml: string
// 		Data: string
// 		DisplayName: string
// 	}

// 	let MoveWorkItemSettings =
// 	{
// 		"method": "Move_WorkItem",
// 		"inputProperties": {
// 			"CategoryXml": "",
// 			"Data": "",
// 			"DisplayName": ""
// 		},
// 		"information": {
// 			"displayName": "Category Data",
// 			"created": "2020-05-18T19:01:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "abc4e713-135c-4ccb-aaab-ea4c50071923",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryData"
// 	}
// 	export class MoveWorkItem extends SharedoExecutionBase.ExecutionBase<IMoveWorkItem_Result, IMoveWorkItem_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, MoveWorkItemSettings)
// 		}
// 	}
// 	//#endregion Method --- MoveWorkItem ---
// 	//#region Method --- MoveForm ---
// 	export interface IMoveForm_Result {
// 		CategoryId: number
// 		CategoryData__CategoryData_: string
// 	}

// 	export interface IMoveForm_Inputs {
// 		CategoryXml: string
// 		Data: string
// 		DisplayName: string
// 	}

// 	let MoveFormSettings =
// 	{
// 		"method": "MoveForm",
// 		"inputProperties": {
// 			"CategoryXml": "",
// 			"Data": "",
// 			"DisplayName": ""
// 		},
// 		"information": {
// 			"displayName": "Category Data",
// 			"created": "2020-05-18T19:01:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "abc4e713-135c-4ccb-aaab-ea4c50071923",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryData"
// 	}
// 	export class MoveForm extends SharedoExecutionBase.ExecutionBase<IMoveForm_Result, IMoveForm_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, MoveFormSettings)
// 		}
// 	}
// 	//#endregion Method --- MoveForm ---
// 	//#region Method --- MoveView ---
// 	export interface IMoveView_Result {
// 		CategoryId: number
// 		CategoryData__CategoryData_: string
// 	}

// 	export interface IMoveView_Inputs {
// 		CategoryXml: string
// 		Data: string
// 		DisplayName: string
// 	}

// 	let MoveViewSettings =
// 	{
// 		"method": "MoveView",
// 		"inputProperties": {
// 			"CategoryXml": "",
// 			"Data": "",
// 			"DisplayName": ""
// 		},
// 		"information": {
// 			"displayName": "Category Data",
// 			"created": "2020-05-18T19:01:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "abc4e713-135c-4ccb-aaab-ea4c50071923",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryData"
// 	}
// 	export class MoveView extends SharedoExecutionBase.ExecutionBase<IMoveView_Result, IMoveView_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, MoveViewSettings)
// 		}
// 	}
// 	//#endregion Method --- MoveView ---
// } //WorkItem_CategoryData
// //#endregion WorkItem --- Category Data - com_K2_System_Management_WorkItem_CategoryData ---

// //#region WorkItem : DisplayName [Category Object Info] - SystemName [com_K2_System_Management_WorkItem_CategoryObjectInfo] - Methods [1]
// export namespace WorkItem_CategoryObjectInfo {
// 	//#region Method --- GetCategoryObjectsInfo ---
// 	export interface IGetCategoryObjectsInfo_Result {
// 		Id: string
// 		Name: string
// 		DisplayName: string
// 		Type: string
// 		CreatedBy: string
// 		CreatedDisplayName: string
// 		CreatedDate: Date
// 		ModifiedBy: string
// 		ModifiedDisplayName: string
// 		ModifiedDate: Date
// 		Status: string
// 	}

// 	export interface IGetCategoryObjectsInfo_Inputs {
// 		CategoryId: string
// 	}

// 	let GetCategoryObjectsInfoSettings =
// 	{
// 		"method": "GetCategoryObjectsInfo",
// 		"inputProperties": {
// 			"CategoryId": ""
// 		},
// 		"information": {
// 			"displayName": "Category Object Info",
// 			"created": "2020-05-18T19:01:51",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "f0b17aab-c694-4018-bd07-8094a730a1e2",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryObjectInfo"
// 	}
// 	export class GetCategoryObjectsInfo extends SharedoExecutionBase.ExecutionBase<IGetCategoryObjectsInfo_Result, IGetCategoryObjectsInfo_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetCategoryObjectsInfoSettings)
// 		}
// 	}
// 	//#endregion Method --- GetCategoryObjectsInfo ---
// } //WorkItem_CategoryObjectInfo
// //#endregion WorkItem --- Category Object Info - com_K2_System_Management_WorkItem_CategoryObjectInfo ---

// //#region WorkItem : DisplayName [Category] - SystemName [com_K2_System_Management_WorkItem_Category] - Methods [10]
// export namespace WorkItem_Category {
// 	//#region Method --- AddCategory ---
// 	export interface IAddCategory_Result {
// 	}

// 	export interface IAddCategory_Inputs {
// 		CategoryName: string
// 		ParentCategoryId_1: number
// 	}

// 	let AddCategorySettings =
// 	{
// 		"method": "AddCategory",
// 		"inputProperties": {
// 			"CategoryName": "",
// 			"ParentCategoryId_1": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class AddCategory extends SharedoExecutionBase.ExecutionBase<IAddCategory_Result, IAddCategory_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, AddCategorySettings)
// 		}
// 	}
// 	//#endregion Method --- AddCategory ---
// 	//#region Method --- DeleteCategoryAndData ---
// 	export interface IDeleteCategoryAndData_Result {
// 		CategoryId: number
// 	}

// 	export interface IDeleteCategoryAndData_Inputs {
// 		CategoryId: number
// 		RemoveLogs: boolean
// 	}

// 	let DeleteCategoryAndDataSettings =
// 	{
// 		"method": "Read",
// 		"inputProperties": {
// 			"CategoryId": "",
// 			"RemoveLogs": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class DeleteCategoryAndData extends SharedoExecutionBase.ExecutionBase<IDeleteCategoryAndData_Result, IDeleteCategoryAndData_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, DeleteCategoryAndDataSettings)
// 		}
// 	}
// 	//#endregion Method --- DeleteCategoryAndData ---
// 	//#region Method --- GetCategoryByGuid ---
// 	export interface IGetCategoryByGuid_Result {
// 		CategoryId: number
// 		DisplayName: string
// 		HasChildren: boolean
// 		Name: string
// 		ParentCategoryId: number
// 	}

// 	export interface IGetCategoryByGuid_Inputs {
// 		CategoryGuid: string
// 	}

// 	let GetCategoryByGuidSettings =
// 	{
// 		"method": "GetCategoryByGuid",
// 		"inputProperties": {
// 			"CategoryGuid": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class GetCategoryByGuid extends SharedoExecutionBase.ExecutionBase<IGetCategoryByGuid_Result, IGetCategoryByGuid_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetCategoryByGuidSettings)
// 		}
// 	}
// 	//#endregion Method --- GetCategoryByGuid ---
// 	//#region Method --- GetCategoryById ---
// 	export interface IGetCategoryById_Result {
// 		CategoryId: number
// 		CategoryGuid: string
// 		DisplayName: string
// 		HasChildren: boolean
// 		Name: string
// 		ParentCategoryId: number
// 		Path: string
// 	}

// 	export interface IGetCategoryById_Inputs {
// 		CategoryId_1: number
// 	}

// 	let GetCategoryByIdSettings =
// 	{
// 		"method": "GetCategoryById",
// 		"inputProperties": {
// 			"CategoryId_1": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class GetCategoryById extends SharedoExecutionBase.ExecutionBase<IGetCategoryById_Result, IGetCategoryById_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetCategoryByIdSettings)
// 		}
// 	}
// 	//#endregion Method --- GetCategoryById ---
// 	//#region Method --- GetCategoryByName ---
// 	export interface IGetCategoryByName_Result {
// 		CategoryId: number
// 		DisplayName: string
// 		HasChildren: boolean
// 		Name: string
// 		ParentCategoryId: number
// 	}

// 	export interface IGetCategoryByName_Inputs {
// 		Name_1: string
// 	}

// 	let GetCategoryByNameSettings =
// 	{
// 		"method": "GetCategoryByName",
// 		"inputProperties": {
// 			"Name_1": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class GetCategoryByName extends SharedoExecutionBase.ExecutionBase<IGetCategoryByName_Result, IGetCategoryByName_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetCategoryByNameSettings)
// 		}
// 	}
// 	//#endregion Method --- GetCategoryByName ---
// 	//#region Method --- GetCategoryIdByPath ---
// 	export interface IGetCategoryIdByPath_Result {
// 		CategoryId: number
// 	}

// 	export interface IGetCategoryIdByPath_Inputs {
// 		DisplayName: string
// 	}

// 	let GetCategoryIdByPathSettings =
// 	{
// 		"method": "Read_1",
// 		"inputProperties": {
// 			"DisplayName": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class GetCategoryIdByPath extends SharedoExecutionBase.ExecutionBase<IGetCategoryIdByPath_Result, IGetCategoryIdByPath_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetCategoryIdByPathSettings)
// 		}
// 	}
// 	//#endregion Method --- GetCategoryIdByPath ---
// 	//#region Method --- List ---
// 	export interface IList_Result {
// 		CategoryId: number
// 		DisplayName: string
// 		HasChildren: boolean
// 		Name: string
// 		ParentCategoryId: number
// 	}

// 	export interface IList_Inputs {
// 	}

// 	let ListSettings =
// 	{
// 		"method": "List",
// 		"inputProperties": {
// 			"null": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class List extends SharedoExecutionBase.ExecutionBase<IList_Result, IList_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, ListSettings)
// 		}
// 	}
// 	//#endregion Method --- List ---
// 	//#region Method --- ListByParentCategoryId ---
// 	export interface IListByParentCategoryId_Result {
// 		CategoryId: number
// 		DisplayName: string
// 		HasChildren: boolean
// 		Name: string
// 		ParentCategoryId: number
// 	}

// 	export interface IListByParentCategoryId_Inputs {
// 		ParentCategoryId: string
// 	}

// 	let ListByParentCategoryIdSettings =
// 	{
// 		"method": "ListByParentCategoryId",
// 		"inputProperties": {
// 			"ParentCategoryId": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class ListByParentCategoryId extends SharedoExecutionBase.ExecutionBase<IListByParentCategoryId_Result, IListByParentCategoryId_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, ListByParentCategoryIdSettings)
// 		}
// 	}
// 	//#endregion Method --- ListByParentCategoryId ---
// 	//#region Method --- MoveCategory ---
// 	export interface IMoveCategory_Result {
// 	}

// 	export interface IMoveCategory_Inputs {
// 		CategoryId_1: number
// 		ParentCategoryId_1: number
// 	}

// 	let MoveCategorySettings =
// 	{
// 		"method": "MoveCategory",
// 		"inputProperties": {
// 			"CategoryId_1": "",
// 			"ParentCategoryId_1": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class MoveCategory extends SharedoExecutionBase.ExecutionBase<IMoveCategory_Result, IMoveCategory_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, MoveCategorySettings)
// 		}
// 	}
// 	//#endregion Method --- MoveCategory ---
// 	//#region Method --- UpdateCategoryName ---
// 	export interface IUpdateCategoryName_Result {
// 	}

// 	export interface IUpdateCategoryName_Inputs {
// 		CategoryId_1: string
// 		CategoryName: string
// 	}

// 	let UpdateCategoryNameSettings =
// 	{
// 		"method": "UpdateCategoryName",
// 		"inputProperties": {
// 			"CategoryId_1": "",
// 			"CategoryName": ""
// 		},
// 		"information": {
// 			"displayName": "Category",
// 			"created": "2020-05-18T19:01:46",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "8554945a-57cf-4ed5-b4a6-2fe0673c4b1b",
// 		"systemName": "com_K2_System_Management_WorkItem_Category"
// 	}
// 	export class UpdateCategoryName extends SharedoExecutionBase.ExecutionBase<IUpdateCategoryName_Result, IUpdateCategoryName_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, UpdateCategoryNameSettings)
// 		}
// 	}
// 	//#endregion Method --- UpdateCategoryName ---
// } //WorkItem_Category
// //#endregion WorkItem --- Category - com_K2_System_Management_WorkItem_Category ---

// //#region WorkItem : DisplayName [Category Object] - SystemName [com_K2_System_Management_WorkItem_CategoryObject] - Methods [1]
// export namespace WorkItem_CategoryObject {
// 	//#region Method --- List ---
// 	export interface IList_Result {
// 		DisplayName: string
// 		HasChildren: boolean
// 		Id: string
// 		Name: string
// 		ParentCategoryId: string
// 		Type: string
// 	}

// 	export interface IList_Inputs {
// 		ParentCategoryId: string
// 	}

// 	let ListSettings =
// 	{
// 		"method": "List",
// 		"inputProperties": {
// 			"ParentCategoryId": ""
// 		},
// 		"information": {
// 			"displayName": "Category Object",
// 			"created": "2020-05-18T19:01:51",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "f2f8fd53-1fef-4b83-91f4-0af53ae5512a",
// 		"systemName": "com_K2_System_Management_WorkItem_CategoryObject"
// 	}
// 	export class List extends SharedoExecutionBase.ExecutionBase<IList_Result, IList_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, ListSettings)
// 		}
// 	}
// 	//#endregion Method --- List ---
// } //WorkItem_CategoryObject
// //#endregion WorkItem --- Category Object - com_K2_System_Management_WorkItem_CategoryObject ---

// //#region WorkItem : DisplayName [Categories.Authorization.Class] - SystemName [Categories_Authorization_Class] - Methods [2]
// export namespace WorkItem_CategoriesAuthorizationClass {
// 	//#region Method --- GetClassActions ---
// 	export interface IGetClassActions_Result {
// 		ClassActions: string
// 	}

// 	export interface IGetClassActions_Inputs {
// 		ClassId: string
// 	}

// 	let GetClassActionsSettings =
// 	{
// 		"method": "GetClassActions",
// 		"inputProperties": {
// 			"ClassId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Class",
// 			"created": "2020-05-18T19:10:02",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5e3ceec8-6aaa-48d6-914d-619c0437059d",
// 		"systemName": "Categories_Authorization_Class"
// 	}
// 	export class GetClassActions extends SharedoExecutionBase.ExecutionBase<IGetClassActions_Result, IGetClassActions_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetClassActionsSettings)
// 		}
// 	}
// 	//#endregion Method --- GetClassActions ---
// 	//#region Method --- IsCurrentUserAuthorized ---
// 	export interface IIsCurrentUserAuthorized_Result {
// 		IsAuthorized: string
// 	}

// 	export interface IIsCurrentUserAuthorized_Inputs {
// 		ClassName: string
// 		Rights: string
// 	}

// 	let IsCurrentUserAuthorizedSettings =
// 	{
// 		"method": "Read",
// 		"inputProperties": {
// 			"ClassName": "",
// 			"Rights": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Class",
// 			"created": "2020-05-18T19:10:02",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5e3ceec8-6aaa-48d6-914d-619c0437059d",
// 		"systemName": "Categories_Authorization_Class"
// 	}
// 	export class IsCurrentUserAuthorized extends SharedoExecutionBase.ExecutionBase<IIsCurrentUserAuthorized_Result, IIsCurrentUserAuthorized_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, IsCurrentUserAuthorizedSettings)
// 		}
// 	}
// 	//#endregion Method --- IsCurrentUserAuthorized ---
// } //WorkItem_CategoriesAuthorizationClass
// //#endregion WorkItem --- Categories.Authorization.Class - Categories_Authorization_Class ---

// //#region WorkItem : DisplayName [Categories.Authorization.CategoryObject] - SystemName [Categories_Authorization_CategoryObject] - Methods [1]
// export namespace WorkItem_CategoriesAuthorizationCategoryObject {
// 	//#region Method --- GetCategoryObjects ---
// 	export interface IGetCategoryObjects_Result {
// 		ObjectId: string
// 		ObjectName: string
// 		ParentObjectId: string
// 	}

// 	export interface IGetCategoryObjects_Inputs {
// 		ParentObjectId: string
// 	}

// 	let GetCategoryObjectsSettings =
// 	{
// 		"method": "GetCategoryObjects",
// 		"inputProperties": {
// 			"ParentObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.CategoryObject",
// 			"created": "2020-05-18T19:10:03",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "b4fa24da-8945-4a20-b1aa-6ae7e61a5f4a",
// 		"systemName": "Categories_Authorization_CategoryObject"
// 	}
// 	export class GetCategoryObjects extends SharedoExecutionBase.ExecutionBase<IGetCategoryObjects_Result, IGetCategoryObjects_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetCategoryObjectsSettings)
// 		}
// 	}
// 	//#endregion Method --- GetCategoryObjects ---
// } //WorkItem_CategoriesAuthorizationCategoryObject
// //#endregion WorkItem --- Categories.Authorization.CategoryObject - Categories_Authorization_CategoryObject ---

// //#region WorkItem : DisplayName [Categories.Authorization.PermissionTrace] - SystemName [Categories_Authorization_PermissionTrace] - Methods [1]
// export namespace WorkItem_CategoriesAuthorizationPermissionTrace {
// 	//#region Method --- GetPermissionsTrace ---
// 	export interface IGetPermissionsTrace_Result {
// 		CategoryPath: string
// 		EntityType: string
// 		ClassName: string
// 		IdentityName: string
// 		Username: string
// 		IdentityType: string
// 		Right: string
// 	}

// 	export interface IGetPermissionsTrace_Inputs {
// 		Username: string
// 		IdentityType: string
// 		ObjectId: string
// 		Action: string
// 	}

// 	let GetPermissionsTraceSettings =
// 	{
// 		"method": "GetPermissionsTrace",
// 		"inputProperties": {
// 			"Username": "",
// 			"IdentityType": "",
// 			"ObjectId": "",
// 			"Action": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.PermissionTrace",
// 			"created": "2020-05-18T19:10:03",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "07b67ea0-fc02-476a-953b-9f45f273b86b",
// 		"systemName": "Categories_Authorization_PermissionTrace"
// 	}
// 	export class GetPermissionsTrace extends SharedoExecutionBase.ExecutionBase<IGetPermissionsTrace_Result, IGetPermissionsTrace_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetPermissionsTraceSettings)
// 		}
// 	}
// 	//#endregion Method --- GetPermissionsTrace ---
// } //WorkItem_CategoriesAuthorizationPermissionTrace
// //#endregion WorkItem --- Categories.Authorization.PermissionTrace - Categories_Authorization_PermissionTrace ---

// //#region WorkItem : DisplayName [Categories.Authorization.User] - SystemName [Categories_Authorization_User] - Methods [8]
// export namespace WorkItem_CategoriesAuthorizationUser {
// 	//#region Method --- DeserializeTypedArray ---
// 	export interface IDeserializeTypedArray_Result {
// 		UserId: string
// 		IdentityType: string
// 		Name: string
// 		Domain: string
// 		HasInheritedRights: string
// 		HasExplicitRights: string
// 		IdentityTypeAsString: string
// 		FQN: string
// 	}

// 	export interface IDeserializeTypedArray_Inputs {
// 		SerializedUser: string
// 	}

// 	let DeserializeTypedArraySettings =
// 	{
// 		"method": "Deserialize_Typed_Array",
// 		"inputProperties": {
// 			"SerializedUser": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.User",
// 			"created": "2020-05-18T19:09:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5d882caa-88ca-4d94-bdf4-c5853bb1f88e",
// 		"systemName": "Categories_Authorization_User"
// 	}
// 	export class DeserializeTypedArray extends SharedoExecutionBase.ExecutionBase<IDeserializeTypedArray_Result, IDeserializeTypedArray_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, DeserializeTypedArraySettings)
// 		}
// 	}
// 	//#endregion Method --- DeserializeTypedArray ---
// 	//#region Method --- DeserializeIdentity ---
// 	export interface IDeserializeIdentity_Result {
// 		Name: string
// 		Domain: string
// 		IdentityTypeAsString: string
// 		FQN: string
// 	}

// 	export interface IDeserializeIdentity_Inputs {
// 		SerializedUser: string
// 	}

// 	let DeserializeIdentitySettings =
// 	{
// 		"method": "DeserializeIdentity",
// 		"inputProperties": {
// 			"SerializedUser": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.User",
// 			"created": "2020-05-18T19:09:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5d882caa-88ca-4d94-bdf4-c5853bb1f88e",
// 		"systemName": "Categories_Authorization_User"
// 	}
// 	export class DeserializeIdentity extends SharedoExecutionBase.ExecutionBase<IDeserializeIdentity_Result, IDeserializeIdentity_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, DeserializeIdentitySettings)
// 		}
// 	}
// 	//#endregion Method --- DeserializeIdentity ---
// 	//#region Method --- DeserializeUser ---
// 	export interface IDeserializeUser_Result {
// 		UserId: string
// 		IdentityType: string
// 		Name: string
// 		Domain: string
// 		HasInheritedRights: string
// 		HasExplicitRights: string
// 		IdentityTypeAsString: string
// 		FQN: string
// 	}

// 	export interface IDeserializeUser_Inputs {
// 		SerializedUser: string
// 	}

// 	let DeserializeUserSettings =
// 	{
// 		"method": "DeserializeUser",
// 		"inputProperties": {
// 			"SerializedUser": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.User",
// 			"created": "2020-05-18T19:09:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5d882caa-88ca-4d94-bdf4-c5853bb1f88e",
// 		"systemName": "Categories_Authorization_User"
// 	}
// 	export class DeserializeUser extends SharedoExecutionBase.ExecutionBase<IDeserializeUser_Result, IDeserializeUser_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, DeserializeUserSettings)
// 		}
// 	}
// 	//#endregion Method --- DeserializeUser ---
// 	//#region Method --- GetObjectUsers ---
// 	export interface IGetObjectUsers_Result {
// 		UserId: string
// 		IdentityType: string
// 		Name: string
// 		Domain: string
// 		HasInheritedRights: string
// 		HasExplicitRights: string
// 		IdentityTypeAsString: string
// 		FQN: string
// 	}

// 	export interface IGetObjectUsers_Inputs {
// 		ObjectId: string
// 	}

// 	let GetObjectUsersSettings =
// 	{
// 		"method": "GetObjectUsers",
// 		"inputProperties": {
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.User",
// 			"created": "2020-05-18T19:09:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5d882caa-88ca-4d94-bdf4-c5853bb1f88e",
// 		"systemName": "Categories_Authorization_User"
// 	}
// 	export class GetObjectUsers extends SharedoExecutionBase.ExecutionBase<IGetObjectUsers_Result, IGetObjectUsers_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetObjectUsersSettings)
// 		}
// 	}
// 	//#endregion Method --- GetObjectUsers ---
// 	//#region Method --- GetSerializedObjectUsers ---
// 	export interface IGetSerializedObjectUsers_Result {
// 		UserList1: string
// 	}

// 	export interface IGetSerializedObjectUsers_Inputs {
// 		ObjectId: string
// 	}

// 	let GetSerializedObjectUsersSettings =
// 	{
// 		"method": "GetSerializedObjectUsers",
// 		"inputProperties": {
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.User",
// 			"created": "2020-05-18T19:09:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5d882caa-88ca-4d94-bdf4-c5853bb1f88e",
// 		"systemName": "Categories_Authorization_User"
// 	}
// 	export class GetSerializedObjectUsers extends SharedoExecutionBase.ExecutionBase<IGetSerializedObjectUsers_Result, IGetSerializedObjectUsers_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetSerializedObjectUsersSettings)
// 		}
// 	}
// 	//#endregion Method --- GetSerializedObjectUsers ---
// 	//#region Method --- MergeUniqueIdentityLists ---
// 	export interface IMergeUniqueIdentityLists_Result {
// 		UserId: string
// 		IdentityType: string
// 		Name: string
// 		Domain: string
// 		HasInheritedRights: string
// 		HasExplicitRights: string
// 		IdentityTypeAsString: string
// 		FQN: string
// 	}

// 	export interface IMergeUniqueIdentityLists_Inputs {
// 		UserList1: string
// 		UserList2: string
// 	}

// 	let MergeUniqueIdentityListsSettings =
// 	{
// 		"method": "MergeUniqueIdentityLists",
// 		"inputProperties": {
// 			"UserList1": "",
// 			"UserList2": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.User",
// 			"created": "2020-05-18T19:09:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5d882caa-88ca-4d94-bdf4-c5853bb1f88e",
// 		"systemName": "Categories_Authorization_User"
// 	}
// 	export class MergeUniqueIdentityLists extends SharedoExecutionBase.ExecutionBase<IMergeUniqueIdentityLists_Result, IMergeUniqueIdentityLists_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, MergeUniqueIdentityListsSettings)
// 		}
// 	}
// 	//#endregion Method --- MergeUniqueIdentityLists ---
// 	//#region Method --- SearchUsers ---
// 	export interface ISearchUsers_Result {
// 		UserId: string
// 		IdentityType: string
// 		Name: string
// 		Domain: string
// 		HasInheritedRights: string
// 		HasExplicitRights: string
// 		IdentityTypeAsString: string
// 		FQN: string
// 	}

// 	export interface ISearchUsers_Inputs {
// 		SecurityLabel: string
// 		SearchString: string
// 		SearchMode: string
// 		SearchType: string
// 		Domain: string
// 	}

// 	let SearchUsersSettings =
// 	{
// 		"method": "SearchUsers",
// 		"inputProperties": {
// 			"SecurityLabel": "",
// 			"SearchString": "",
// 			"SearchMode": "",
// 			"SearchType": "",
// 			"Domain": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.User",
// 			"created": "2020-05-18T19:09:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5d882caa-88ca-4d94-bdf4-c5853bb1f88e",
// 		"systemName": "Categories_Authorization_User"
// 	}
// 	export class SearchUsers extends SharedoExecutionBase.ExecutionBase<ISearchUsers_Result, ISearchUsers_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, SearchUsersSettings)
// 		}
// 	}
// 	//#endregion Method --- SearchUsers ---
// 	//#region Method --- SerializeIdentity ---
// 	export interface ISerializeIdentity_Result {
// 		SerializedUser: string
// 	}

// 	export interface ISerializeIdentity_Inputs {
// 		UserId: string
// 		IdentityType: string
// 		Name: string
// 		Domain: string
// 		HasInheritedRights: string
// 		HasExplicitRights: string
// 		IdentityTypeAsString: string
// 		FQN: string
// 	}

// 	let SerializeIdentitySettings =
// 	{
// 		"method": "Serialize",
// 		"inputProperties": {
// 			"UserId": "",
// 			"IdentityType": "",
// 			"Name": "",
// 			"Domain": "",
// 			"HasInheritedRights": "",
// 			"HasExplicitRights": "",
// 			"IdentityTypeAsString": "",
// 			"FQN": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.User",
// 			"created": "2020-05-18T19:09:50",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "5d882caa-88ca-4d94-bdf4-c5853bb1f88e",
// 		"systemName": "Categories_Authorization_User"
// 	}
// 	export class SerializeIdentity extends SharedoExecutionBase.ExecutionBase<ISerializeIdentity_Result, ISerializeIdentity_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, SerializeIdentitySettings)
// 		}
// 	}
// 	//#endregion Method --- SerializeIdentity ---
// } //WorkItem_CategoriesAuthorizationUser
// //#endregion WorkItem --- Categories.Authorization.User - Categories_Authorization_User ---

// //#region WorkItem : DisplayName [Categories.Authorization.Object] - SystemName [Categories_Authorization_Object] - Methods [10]
// export namespace WorkItem_CategoriesAuthorizationObject {
// 	//#region Method --- DisablePermissionInheritance ---
// 	export interface IDisablePermissionInheritance_Result {
// 	}

// 	export interface IDisablePermissionInheritance_Inputs {
// 		InheritanceRightOption: string
// 		ObjectId: string
// 	}

// 	let DisablePermissionInheritanceSettings =
// 	{
// 		"method": "DisablePermissionInheritance",
// 		"inputProperties": {
// 			"InheritanceRightOption": "",
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class DisablePermissionInheritance extends SharedoExecutionBase.ExecutionBase<IDisablePermissionInheritance_Result, IDisablePermissionInheritance_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, DisablePermissionInheritanceSettings)
// 		}
// 	}
// 	//#endregion Method --- DisablePermissionInheritance ---
// 	//#region Method --- DoesObjectContainExplictUsers ---
// 	export interface IDoesObjectContainExplictUsers_Result {
// 		HasExplicitUsers: boolean
// 	}

// 	export interface IDoesObjectContainExplictUsers_Inputs {
// 		ObjectId: string
// 	}

// 	let DoesObjectContainExplictUsersSettings =
// 	{
// 		"method": "DoesObjectContainExplictUsers",
// 		"inputProperties": {
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class DoesObjectContainExplictUsers extends SharedoExecutionBase.ExecutionBase<IDoesObjectContainExplictUsers_Result, IDoesObjectContainExplictUsers_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, DoesObjectContainExplictUsersSettings)
// 		}
// 	}
// 	//#endregion Method --- DoesObjectContainExplictUsers ---
// 	//#region Method --- EnablePermissionInheritance ---
// 	export interface IEnablePermissionInheritance_Result {
// 	}

// 	export interface IEnablePermissionInheritance_Inputs {
// 		InheritanceRightOption: string
// 		ObjectId: string
// 	}

// 	let EnablePermissionInheritanceSettings =
// 	{
// 		"method": "EnablePermissionInheritance",
// 		"inputProperties": {
// 			"InheritanceRightOption": "",
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class EnablePermissionInheritance extends SharedoExecutionBase.ExecutionBase<IEnablePermissionInheritance_Result, IEnablePermissionInheritance_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, EnablePermissionInheritanceSettings)
// 		}
// 	}
// 	//#endregion Method --- EnablePermissionInheritance ---
// 	//#region Method --- GetCategoryObjectsInfo ---
// 	export interface IGetCategoryObjectsInfo_Result {
// 		ObjectId: string
// 		ObjectName: string
// 		ParentObjectId: string
// 		CategoryPath: string
// 	}

// 	export interface IGetCategoryObjectsInfo_Inputs {
// 		ParentObjectId: string
// 	}

// 	let GetCategoryObjectsInfoSettings =
// 	{
// 		"method": "GetCategoryObjectsInfo",
// 		"inputProperties": {
// 			"ParentObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class GetCategoryObjectsInfo extends SharedoExecutionBase.ExecutionBase<IGetCategoryObjectsInfo_Result, IGetCategoryObjectsInfo_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetCategoryObjectsInfoSettings)
// 		}
// 	}
// 	//#endregion Method --- GetCategoryObjectsInfo ---
// 	//#region Method --- GetCategoryPath ---
// 	export interface IGetCategoryPath_Result {
// 		CategoryPath: string
// 	}

// 	export interface IGetCategoryPath_Inputs {
// 		ObjectId: string
// 	}

// 	let GetCategoryPathSettings =
// 	{
// 		"method": "GetCategoryPath",
// 		"inputProperties": {
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class GetCategoryPath extends SharedoExecutionBase.ExecutionBase<IGetCategoryPath_Result, IGetCategoryPath_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetCategoryPathSettings)
// 		}
// 	}
// 	//#endregion Method --- GetCategoryPath ---
// 	//#region Method --- GetObject ---
// 	export interface IGetObject_Result {
// 		ObjectId: string
// 		ObjectName: string
// 		IsPermissionsInherited: boolean
// 		ParentObjectId: string
// 		CategoryPath: string
// 		Owner: string
// 	}

// 	export interface IGetObject_Inputs {
// 		ObjectId: string
// 	}

// 	let GetObjectSettings =
// 	{
// 		"method": "GetObject",
// 		"inputProperties": {
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class GetObject extends SharedoExecutionBase.ExecutionBase<IGetObject_Result, IGetObject_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetObjectSettings)
// 		}
// 	}
// 	//#endregion Method --- GetObject ---
// 	//#region Method --- GetObjectActions ---
// 	export interface IGetObjectActions_Result {
// 		ObjectActions: string
// 	}

// 	export interface IGetObjectActions_Inputs {
// 		ObjectId: string
// 	}

// 	let GetObjectActionsSettings =
// 	{
// 		"method": "GetObjectActions",
// 		"inputProperties": {
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class GetObjectActions extends SharedoExecutionBase.ExecutionBase<IGetObjectActions_Result, IGetObjectActions_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetObjectActionsSettings)
// 		}
// 	}
// 	//#endregion Method --- GetObjectActions ---
// 	//#region Method --- GetObjectClasses ---
// 	export interface IGetObjectClasses_Result {
// 		ObjectClasses: string
// 	}

// 	export interface IGetObjectClasses_Inputs {
// 		ObjectId: string
// 	}

// 	let GetObjectClassesSettings =
// 	{
// 		"method": "GetObjectClasses",
// 		"inputProperties": {
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class GetObjectClasses extends SharedoExecutionBase.ExecutionBase<IGetObjectClasses_Result, IGetObjectClasses_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, GetObjectClassesSettings)
// 		}
// 	}
// 	//#endregion Method --- GetObjectClasses ---
// 	//#region Method --- RemoveExplicitUsers ---
// 	export interface IRemoveExplicitUsers_Result {
// 	}

// 	export interface IRemoveExplicitUsers_Inputs {
// 		ObjectId: string
// 	}

// 	let RemoveExplicitUsersSettings =
// 	{
// 		"method": "RemoveExplicitUsers",
// 		"inputProperties": {
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class RemoveExplicitUsers extends SharedoExecutionBase.ExecutionBase<IRemoveExplicitUsers_Result, IRemoveExplicitUsers_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, RemoveExplicitUsersSettings)
// 		}
// 	}
// 	//#endregion Method --- RemoveExplicitUsers ---
// 	//#region Method --- SetObjectOwner ---
// 	export interface ISetObjectOwner_Result {
// 	}

// 	export interface ISetObjectOwner_Inputs {
// 		OwnerName_1: string
// 		IdentityType: string
// 		ObjectId: string
// 	}

// 	let SetObjectOwnerSettings =
// 	{
// 		"method": "SetObjectOwner",
// 		"inputProperties": {
// 			"OwnerName_1": "",
// 			"IdentityType": "",
// 			"ObjectId": ""
// 		},
// 		"information": {
// 			"displayName": "Categories.Authorization.Object",
// 			"created": "2020-05-18T19:09:54",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "15953487-7cc9-4f0b-b674-1bdbbc9b21c8",
// 		"systemName": "Categories_Authorization_Object"
// 	}
// 	export class SetObjectOwner extends SharedoExecutionBase.ExecutionBase<ISetObjectOwner_Result, ISetObjectOwner_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, SetObjectOwnerSettings)
// 		}
// 	}
// 	//#endregion Method --- SetObjectOwner ---
// } //WorkItem_CategoriesAuthorizationObject
// //#endregion WorkItem --- Categories.Authorization.Object - Categories_Authorization_Object ---

// //#region WorkItem : DisplayName [Category Item Counts] - SystemName [com_K2_System_Management_WorkItem_GetCategoryItemCounts] - Methods [1]
// export namespace WorkItem_CategoryItemCounts {
// 	//#region Method --- List ---
// 	export interface IList_Result {
// 		Name: string
// 		Type: string
// 		Count: number
// 	}

// 	export interface IList_Inputs {
// 		Category_Id: number
// 	}

// 	let ListSettings =
// 	{
// 		"method": "List",
// 		"inputProperties": {
// 			"Category_Id": ""
// 		},
// 		"information": {
// 			"displayName": "Category Item Counts",
// 			"created": "2020-05-18T19:12:14",
// 			"categories": "System\Management\Categories\WorkItems"
// 		},
// 		"serverUrl": "https://prototyping.onk2.com",
// 		"guid": "39947fda-2d37-41dc-a53e-566cc3a4dbcc",
// 		"systemName": "com_K2_System_Management_WorkItem_GetCategoryItemCounts"
// 	}
// 	export class List extends SharedoExecutionBase.ExecutionBase<IList_Result, IList_Inputs> {
// 		constructor(k2ServerConfiguration: SharedoClient) {
// 			super(k2ServerConfiguration, ListSettings)
// 		}
// 	}
// 	//#endregion Method --- List ---
// } //WorkItem_CategoryItemCounts
// 	//#endregion WorkItem --- Category Item Counts - com_K2_System_Management_WorkItem_GetCategoryItemCounts ---//Generating content...

export {};