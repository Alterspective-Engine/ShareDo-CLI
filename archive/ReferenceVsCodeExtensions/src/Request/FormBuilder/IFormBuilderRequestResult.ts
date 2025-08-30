
export interface IFormBuilderRequestResult {
  id: string;
  systemName: string;
  title: string;
  description: string;
  layout: string;
  layoutParent: string;
  showTitle: boolean;
  readonly: boolean;
  fields: Field[] | null;
  sections: any[] | null;
  smartVariableSystemName: string | null;
}

interface Field {
  id: string;
  type: number;
  name: string;
  title: string;
  description: null;
  readonly: boolean;
  required: boolean;
  layoutLocation: string;
  displayOrder: number;
  attributes: Attributes;
}

interface Attributes {
  optionSetName: string;
  allowNoSelection: boolean;
  multiple: boolean;
  placeholderText: string;
  showSelectedColour: boolean;
  showSelectedIcon: boolean;
  chronologyCard: boolean;
}