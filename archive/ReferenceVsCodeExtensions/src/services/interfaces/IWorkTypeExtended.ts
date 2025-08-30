import { IWorkType } from '../../Request/WorkTypes/IGetWorkTypesRequestResult';

/**
 * Extended WorkType interface with additional properties for HLD generation
 */
export interface IWorkTypeExtended extends IWorkType {
    iconClass?: string;
    category?: string;
    tags?: string[];
    shortName?: string;
    allowsTimeEntry?: boolean;
    canGenerateEmail?: boolean;
    parentSystemName?: string;
}