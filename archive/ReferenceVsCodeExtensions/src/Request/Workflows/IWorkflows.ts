export interface ISharedoWorkflowsRequestResult {
    resultCount: number;
    rows:        SharedoWorkflowRow[];
}

export interface SharedoWorkflowRow {
    id:              string;
    colour:          string | null;
    icon:            string | null;
    title:           string | null;
    subTitle:        string | null;
    reference:       string | null;
    openCommand:     Command;
    viewCommand:     string | null;
    menu:            Menu[];
    cardViewActions: string | null;
    enableDragDrop:  boolean;
    dragDropBlade:   string | null;
    data:            Data;
}

export interface Data {
    systemName:    string;
    name:          string;
    description:   null | string;
    errored:       boolean;
    modifiedBy:    string | null;
    modifiedDate:  Date;
    instanceCount: number;
    triggers:      boolean;
    planType:      PlanType;
}



export interface PlanType {
    icon:    PlanTypeIcon;
    colour:  string | null;
    text:    string | null;
    tooltip: Tooltip;
}

export enum PlanTypeIcon {
    faFileTextO = "fa-file-text-o",
    faLinode = "fa-linode",
}

export enum Tooltip {
    script = "Script",
    visualWorkflow = "Visual Workflow",
}

export interface Menu {
    command:                       Command | null;
    children:                      Menu[] | null;
    title:                         Title | null;
    icon:                          MenuIcon;
    commandForceNavigateNewWindow: boolean;
}

export interface Command {
    invokeType: InvokeType;
    invoke:     string;
    config:     string;
}

export enum InvokeType {
    panel = "panel",
}

export enum MenuIcon {
    faBars = "fa-bars",
    faClone = "fa-clone",
    faPencil = "fa-pencil",
    faTrashTextDanger = "fa-trash text-danger",
}

export enum Title {
    clonePlan = "Clone Plan",
    deletePlan = "Delete Plan",
    editPlan = "Edit Plan",
}
