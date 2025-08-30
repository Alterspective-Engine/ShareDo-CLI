export interface IPlansExecutingRequestResult {
  planTitle: string;
  planDescription: string;
  subProcesses: ISubProcess[];
  lastErrored?: string;
  publishedVersionId?: any;
  sharedoTitle?: string;
  sharedoReference?: any;
  sharedoTypeSystemName?: string;
  id: string;
  planSystemName: string;
  sharedoId?: string;
  planType: string;
  state: string;
  startTime: string;
  endTime?: any;
  meta?: any;
  parentPlanExecutionId?: any;
}

export interface ISubProcess {
  systemName: string;
  name: string;
  description?: string | string;
  optimalPath: boolean;
  endState: boolean;
  debug: boolean;
  entryPoint: boolean;
}