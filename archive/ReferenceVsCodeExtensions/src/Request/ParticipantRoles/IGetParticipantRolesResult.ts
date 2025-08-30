
export type IGetParticipantRolesResult = IParticipantRole;

export type IParticipantRole = {
  systemName: string;
  name: string;
  roleSource: string;
  isActive: boolean;
  permissions: Permission[];
};

export type Permission = {
  labelCss: string;
  iconCss: string;
  text: string;
};