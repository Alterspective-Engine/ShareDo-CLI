export interface SharedoWorkflowRequestResult {
    systemName:                          string;
    name:                                string;
    description:                         string;
    overrideNotifications:               boolean;
    exceptionNotifications:              boolean;
    exceptionNotificationEmailAddresses: null;
    variables:                           SharedoWFVariable[];
    steps:                               SharedoWFStep[];
}

export interface SharedoWFStep {
    ideData:     SharedoWFIDEData;
    actions:     SharedoWFAction[];
    systemName:  string;
    name:        string;
    description: null | string;
    isStart:     boolean;
    isEnd:       boolean;
    isOptimal:   boolean;
}

export interface SharedoWFAction {
    config:           SharedoWFConfig;
    connections:      SharedoWFConnections;
    actionSystemName: string;
    name:             string;
}

export interface SharedoWFConfig {
    parentWorkItemIdVariable?:  string;
    keyDateType?:               string;
    dueOnVariable?:             null;
    dueInDays?:                 number | string;
    markComplete?:              boolean;
    outputVariable?:            null;
    phaseOutlets?:              SharedoWFPhaseOutlet[];
    workItemIdVariable?:        string;
    expectedTypeSystemName?:    string;
    phaseSystemName?:           string;
    now?:                       boolean;
    startOnDateTimeVariable?:   null;
    startIn?:                   number;
    startInType?:               string;
    description?:               string;
    taskType?:                  string;
    taskTitle?:                 string;
    taskDescription?:           null | string;
    tag?:                       string;
    priorityId?:                number;
    actionPlanItems?:           SharedoWFActionPlanItem[];
    actionPlanTitle?:           string;
    parentWorkItemId?:          string;
    taskOwnerOdsId?:            null | string;
    onCompleteOutlet?:          boolean;
    onOverdueOutlet?:           boolean;
    assignments?:               any[];
    workItemId?:                string;
    workItemType?:              string;
    variableMappings?:          SharedoWFVariableMapping[];
    collectionMappings?:        any[];
    script?:                    string;
    mode?:                      string;
    newValueVariable?:          null | string;
    newValue?:                  null | string;
    attributeSystemName?:       string;
    formId?:                    string;
    addActionPlan?:             boolean;
    actionPlanItemsList?:       null;
    fromParticipantRole?:       string;
    toParticipantRole?:         string;
    ccParticipantRole?:         null;
    regarding?:                 null;
    emailTemplate?:             string;
    useDynamicTemplateName?:    boolean;
    dynamicTemplateSystemName?: null;
    onReminderOutlet?:          boolean;
    runForId?:                  string;
    ruleToRun?:                 string;
    assignToId?:                string;
    templateSystemName?:        string;
    recipientOdsId?:            null;
    regardingOdsId?:            null;
}

export interface SharedoWFActionPlanItem {
    type:                 string;
    description:          string;
    mandatory:            boolean;
    order:                number;
    withCta:              boolean;
    outputVariable:       null;
    choices:              any[];
    ctaTitle:             null | string;
    ctaIcon:              null | string;
    ctaCss:               null | string;
    ctaStyles:            null;
    ctaCommand:           null | string;
    ctaCommandConfig:     string;
    ctaContextType:       null | string;
    ctaContextIdVariable: null | string;
}

export interface SharedoWFPhaseOutlet {
    systemName: string;
    name:       string;
}

export interface SharedoWFVariableMapping {
    variableSystemName: string;
    composerPath:       string;
}

export interface SharedoWFConnections {
    execute?:                                SharedoWFExecute;
    onComplete?:                             SharedoWFExecute;
    onOverdue?:                              SharedoWFExecute;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "task-gateway-no"?:                      SharedoWFExecute;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "task-gateway-yes"?:                     SharedoWFExecute;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "task-activity-send-email-phases-sent"?: SharedoWFExecute;
}

export interface SharedoWFExecute {
    step:   string;
    port:   string;
    points: any[];
}

export interface SharedoWFIDEData {
    x: number;
    y: number;
}

export interface SharedoWFVariable {
    systemName:      string;
    name:            string;
    defaultValue:    null | string;
    type:            string;
    isCollection:    boolean;
    isInputVariable: boolean;
    isMandatory:     boolean;
}