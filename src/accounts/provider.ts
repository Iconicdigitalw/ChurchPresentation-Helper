import {
  AuthCredentials,
  Church,
  ScheduleShare,
  SessionUser,
  SignUpDetails,
  StoredSchedule,
  Team,
  TeamRole,
  UserAccount
} from './types';

/**
 * The seam between the console and whatever stores accounts.
 *
 * Everything the UI needs goes through this interface, so moving from the local
 * development adapter to a hosted backend (Neon, Firebase) touches one file
 * rather than the component tree. Adapters are responsible for enforcing
 * permissions server-side as well - the client-side `can()` checks are for
 * usability, never for security.
 */
export interface AccountsProvider {
  readonly name: string;

  // --- Session -------------------------------------------------------------
  getCurrentUser(): Promise<SessionUser | null>;
  signIn(credentials: AuthCredentials): Promise<SessionUser>;
  signUp(details: SignUpDetails): Promise<SessionUser>;
  signOut(): Promise<void>;

  // --- Church & teams ------------------------------------------------------
  listChurches(): Promise<Church[]>;
  listTeams(churchId: string): Promise<Team[]>;
  createTeam(churchId: string, name: string): Promise<Team>;
  listChurchMembers(churchId: string): Promise<UserAccount[]>;
  /** Teammates the current user may share with. */
  listShareableMembers(userId: string): Promise<UserAccount[]>;
  setTeamRole(userId: string, teamId: string, role: TeamRole): Promise<void>;

  // --- Schedules -----------------------------------------------------------
  listSchedules(userId: string): Promise<StoredSchedule[]>;
  saveSchedule(schedule: Omit<StoredSchedule, 'updatedAt'>): Promise<StoredSchedule>;
  deleteSchedule(scheduleId: string): Promise<void>;

  // --- Sharing -------------------------------------------------------------
  shareSchedule(input: {
    schedule: StoredSchedule;
    toUserId: string;
    teamId: string;
    message?: string;
  }): Promise<ScheduleShare>;
  /** Pending shares addressed to this user. */
  listIncomingShares(userId: string): Promise<ScheduleShare[]>;
  /**
   * Accept a share. `keep: true` copies it into the recipient's own schedules;
   * `keep: false` marks it handled for one-time use without storing a copy.
   */
  respondToShare(shareId: string, response: { accept: boolean; keep: boolean }): Promise<void>;

  /** Notifies on incoming shares. Returns an unsubscribe function. */
  subscribeToShares?(userId: string, onChange: () => void): () => void;
}

export class AccountsError extends Error {
  constructor(message: string, readonly code: 'invalid_credentials' | 'email_taken' | 'not_found' | 'forbidden' | 'unavailable' = 'unavailable') {
    super(message);
    this.name = 'AccountsError';
  }
}
