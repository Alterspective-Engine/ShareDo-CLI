
export type IGetWorkTypeCreatePermissionResult = ICreatePermission &
{
  subjectObject: Subject;
  subjectTypeObject: Subject;

};


//CREATE TYPE that a combination of ICreatePermission and ICreatePermissionListViewResult



export interface ICreatePermission {
  subjectType: string;
  subjectName: string;
  subjectId: string;
}


export interface ICreatePermissionListViewResult {
  subject: Subject;
  subjectType: Subject;
}

export interface Subject {
  icon: string;
  colour: string;
  text: string;
  tooltip?: any;
}

