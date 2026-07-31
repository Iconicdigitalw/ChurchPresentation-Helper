import { SessionUser } from './types';

/**
 * Capability checks.
 *
 * Components ask "can this person do X", never "is this person an admin", so
 * the role model can change without hunting down role checks scattered across
 * the UI. Every gate in the app should route through `can()`.
 */
export type Capability =
  /** Gemini/AI credentials and spend. Church admin only, by request. */
  | 'manage_ai_credentials'
  /** Church-wide settings: name, branding, defaults. */
  | 'manage_church_settings'
  /** Create/rename/remove teams. */
  | 'manage_teams'
  /** Invite, remove, or change the role of church members. */
  | 'manage_members'
  /** Change who leads a team, and that team's roster. */
  | 'manage_team_members'
  /** Create and edit one's own running orders. */
  | 'manage_own_schedules'
  /** Offer a schedule to a teammate. */
  | 'share_schedule'
  /** Operate the live output. */
  | 'operate_live';

/** True when the user leads at least one team. */
export function isTeamLead(user: SessionUser | null): boolean {
  return !!user?.memberships.some(m => m.teamRole === 'team_lead');
}

export function isChurchAdmin(user: SessionUser | null): boolean {
  return user?.account.churchRole === 'church_admin';
}

/** True when the user leads this specific team. */
export function leadsTeam(user: SessionUser | null, teamId: string): boolean {
  if (isChurchAdmin(user)) return true;
  return !!user?.memberships.some(m => m.team.id === teamId && m.teamRole === 'team_lead');
}

export function can(user: SessionUser | null, capability: Capability): boolean {
  if (!user) return false;

  const churchAdmin = isChurchAdmin(user);
  const teamLead = isTeamLead(user);

  switch (capability) {
    // Reserved to the church admin: these carry cost or affect everyone.
    case 'manage_ai_credentials':
    case 'manage_church_settings':
    case 'manage_teams':
    case 'manage_members':
      return churchAdmin;

    case 'manage_team_members':
      return churchAdmin || teamLead;

    // Every signed-in member runs services and owns their own material.
    case 'manage_own_schedules':
    case 'share_schedule':
    case 'operate_live':
      return true;

    default:
      return false;
  }
}

/** Human-readable role for the account menu and member lists. */
export function describeRole(user: SessionUser | null): string {
  if (!user) return 'Signed out';
  if (isChurchAdmin(user)) return 'Church Admin';
  if (isTeamLead(user)) return 'Team Lead';
  return 'Team Member';
}

/** Explains why a control is unavailable, for tooltips on disabled actions. */
export function explainDenial(capability: Capability): string {
  switch (capability) {
    case 'manage_ai_credentials':
      return 'Only a Church Admin can manage AI credentials.';
    case 'manage_church_settings':
      return 'Only a Church Admin can change church settings.';
    case 'manage_teams':
      return 'Only a Church Admin can manage teams.';
    case 'manage_members':
      return 'Only a Church Admin can manage members.';
    case 'manage_team_members':
      return 'Only a Team Lead or Church Admin can manage a team roster.';
    default:
      return 'You do not have permission for this action.';
  }
}
