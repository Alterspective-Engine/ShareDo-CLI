export interface IListViewResult<TListViewData> {
  resultCount: number;
  rows: IListViewRow<TListViewData>[];
}

export interface IListViewRow<TListViewData>{
  id: string;
  colour?: any;
  icon?: any;
  title?: any;
  subTitle?: any;
  reference?: any;
  openCommand: IListViewOpenCommand;
  viewCommand: IListViewOpenCommand;
  menu: Menu[];
  cardViewActions?: any;
  enableDragDrop: boolean;
  dragDropBlade?: any;
  data: TListViewData;
}

export interface Menu {
  command?: any;
  children: IListViewChild[];
  title?: string;
  icon: string;
  commandForceNavigateNewWindow: boolean;
}

export interface IListViewChild {
  command?: IListViewOpenCommand;
  children?: any;
  title: string;
  icon?: string;
  commandForceNavigateNewWindow: boolean;
}

export interface IListViewOpenCommand {
  invokeType: string;
  invoke: string;
  config: string;
}