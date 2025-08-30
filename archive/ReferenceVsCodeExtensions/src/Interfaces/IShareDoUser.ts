/**
 * ShareDo User Interface
 *
 * Defines the structure for a user object in the ShareDo system.
 * Used for user management, authentication, and user-related data operations.
 */

export interface IShareDoUser {
  id:string
  username: string;
  primaryContactDetails: string;
  organisation: string;
  personaName: string;
  active: boolean;
  locked: boolean;
  isInternal: boolean;
  deleted: boolean;
  wallsAssigned: boolean;
  userTypeName: string;
  lastLoginUtc?: any;
}