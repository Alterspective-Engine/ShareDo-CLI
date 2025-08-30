export type IListViewFilter = {
    listView: string
    contextId?:string
    sortColumn: string;
    rows?: number;
    page?: number;
    filters: IListViewFilterItem[];
    additionalParameters: {};
};
// Example List View Input
// {
//     "additionalParameters": {},
//     "filters": [
//         {
//             "fieldId": "name",
//             "filterId": "clv-filter-text",
//             "config": "{}",
//             "parameters": "{\"text\":\"igor\"}"
//         },
//         {
//             "fieldId": "modifiedDate",
//             "filterId": "clv-filter-date-range",
//             "config": "{}",
//             "parameters": "{\"from\":\"2025-06-30T14:00:00Z\",\"to\":\"2025-07-31T13:59:59Z\"}"
//         }
//     ]
// }

export interface IListViewInput {
    additionalParameters: Record<string, any>;
    filters: IListViewFilterItem[];
    listView: string;
    contextId?: string;
    sortColumn?: string;
    rows?: number;
    page?: number;
}

export interface IListViewFilterItem {
    fieldId: string;
    filterId: string;
    config: string; //{}
    parameters: string; //{\"text\":\"test_\"}
}

