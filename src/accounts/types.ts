import { ScheduleItem } from '../types';

/**
 * Accounts, teams and sharing.
 *
 * The model is deliberately two-tier, matching how churches actually organise:
 * a church owns everything, and work happens inside teams (worship, media,
 * production). A church with a single team simply has one team, and its church
 * admin is effectively the only administrator.
 */

/** Church-wide authority. Owns billing, AI credentials and every team. */
export type ChurchRole = 'church_admin' | 'member';

/**
 * Support staff for the hosted service, above any church.
 *
 * This crosses tenant boundaries, so it must be granted by a server-verified
 * claim and never by a value the client can set. Every cross-church access
 * should be audit-logged, and these accounts should require MFA.
 */
export type PlatformRole = 'platform_admin' | 'none';

/** How a church pays for AI: its own key, or the hosted plan. */
export type BillingPlan = 'self_serve' | 'managed';

/** Authority inside one team. */
export type TeamRole = 'team_lead' | 'member';

export interface Church {
  id: string;
  name: string;
  createdAt: string;
  /**
   * `self_serve` churches supply their own AI key; `managed` churches are
   * billed monthly and use the platform's. The key itself is never part of this
   * record - it stays server-side and is never sent to the browser.
   */
  plan: BillingPlan;
  /** Whether a self-serve church has supplied a key yet, without exposing it. */
  hasOwnAiKey?: boolean;
}

export interface Team {
  id: string;
  churchId: string;
  name: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  churchId: string;
  email: string;
  displayName: string;
  churchRole: ChurchRole;
  /**
   * Absent for ordinary church users. Mirrored from a server-verified claim for
   * display only - it must never be the thing that grants access.
   */
  platformRole?: PlatformRole;
  createdAt: string;
}

export interface TeamMembership {
  userId: string;
  teamId: string;
  teamRole: TeamRole;
}

/**
 * The resolved identity the UI works with: who you are, plus every role you
 * hold. Capability checks read from here rather than re-querying memberships.
 */
export interface SessionUser {
  account: UserAccount;
  church: Church;
  memberships: Array<{ team: Team; teamRole: TeamRole }>;
}

/** A saved running order belonging to one user. */
export interface StoredSchedule {
  id: string;
  ownerId: string;
  churchId: string;
  title: string;
  items: ScheduleItem[];
  updatedAt: string;
}

export type ShareStatus = 'pending' | 'accepted' | 'declined';

/**
 * One user offering a schedule to a teammate. The payload is a snapshot rather
 * than a reference so accepting cannot be broken by the sender editing later,
 * and so "use once" needs no write at all.
 */
export interface ScheduleShare {
  id: string;
  scheduleId: string;
  title: string;
  items: ScheduleItem[];
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  teamId: string;
  message?: string;
  status: ShareStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpDetails extends AuthCredentials {
  displayName: string;
  /** Creating a new church makes the first user its church admin. */
  churchName?: string;
  /** Joining an existing church instead of creating one. */
  joinChurchId?: string;
}
