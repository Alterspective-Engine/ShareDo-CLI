export type IListViewManagerResponse = IListViewManagerItem[];

export interface IListViewManagerItem {
  systemName: string;
  title: string;
  description: string;
  icon: string;
  configurationWidgets?: string[];
}