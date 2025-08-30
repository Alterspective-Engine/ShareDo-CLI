export type IWorkType =
{
    systemName: string;
    name: string;
    icon: string;
    description: string;
    isActive: boolean;
    isAbstract: boolean;
    isCoreType: boolean;
    tileColour?: string;
    systemNamePath: string;
    derivedTypes: IWorkType[];
    hasPortals: boolean;
};


export type IGetWorkTypesRequestResult = IWorkType[];
