export interface IGetUserResponse {
  tags: any[];
  tagNames: any[];
  aspectData: IAspectData;
  canEdit: boolean;
  teamList: ITeamList[];
  personaInherited: boolean;
  workingDayCalendarId: string;
  userTypeName: string;
  identityClaim: string;
  identityProvider: string;
  isLocked: boolean;
  personaSystemName: string;
  personaName: string;
  organisationName: string;
  availabilitySystemName: string;
  userType: string;
  id: string;
  sourceSystem?: any;
  presenceIdentity?: any;
  titleId: number;
  genderId?: any;
  firstName: string;
  surname: string;
  middleNameOrInitial?: any;
  dateOfBirth?: any;
  dateOfDeath?: any;
  nINumber?: any;
  nHSNumber?: any;
  isActive: boolean;
  organisationId: string;
  primaryTeamId: string;
  tradingName?: any;
  suffix?: any;
  jobTitle?: any;
  preferredLanguageCode?: any;
  signatureImageId: string;
  passportNo?: any;
  drivingLicenceNo?: any;
  externalReference?: any;
  profileImageId: string;
  shortName: string;
  shortNameIsGenerated: boolean;
  reference: string;
  timeZone: string;
}

export interface ITeamList {
  teamId: string;
  role?: string;
  roleName?: string;
  organisationId: string;
  isDefaultOrg: boolean;
  isDefaultTeam: boolean;
  teamName: string;
  reference?: any;
  organisationName: string;
  emails: IEmail[];
}

export interface IEmail {
  id: string;
  email: string;
  isPrimary: boolean;
}

export interface IAspectData {
  contactPreferences: IContactPreferences;
  odsEntityInformationWalls: IOdsEntityInformationWalls;
  contactDetails: IContactDetail[];
  userAutoTaskDelegationSettings: IUserAutoTaskDelegationSettings;
}

export interface IUserAutoTaskDelegationSettings {
  id: string;
  enabled: boolean;
  delegateeOdsId: string;
}

export interface IContactDetail {
  id: string;
  organisationId?: any;
  personId: string;
  teamId?: any;
  isPrimary: boolean;
  contactTypeSystemName: string;
  contactValue: string;
  isActive: boolean;
  externalReference?: any;
}

export interface IOdsEntityInformationWalls {
  selectedWalls: any[];
}

export interface IContactPreferences {
  odsId: string;
  primaryContactDetailId: string;
  sendFromEmailContactId: string;
  contactHoursFrom: IContactHoursFrom;
  contactHoursTo: IContactHoursFrom;
}

export interface IContactHoursFrom {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}