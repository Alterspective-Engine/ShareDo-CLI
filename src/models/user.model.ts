export interface IUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  roles?: string[];
  permissions?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  metadata?: Record<string, any>;
}

export interface IUserProfile extends IUser {
  phoneNumber?: string;
  department?: string;
  jobTitle?: string;
  location?: string;
  timezone?: string;
  language?: string;
  preferences?: IUserPreferences;
}

export interface IUserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: {
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  defaultWorkspace?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
}