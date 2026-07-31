import {
  AuthCredentials,
  Church,
  ScheduleShare,
  SessionUser,
  SignUpDetails,
  StoredSchedule,
  Team,
  TeamMembership,
  TeamRole,
  UserAccount
} from './types';
import { AccountsError, AccountsProvider } from './provider';

/**
 * Development / demo adapter.
 *
 * Everything lives in this browser. It exists so the accounts, roles and
 * sharing flows can be built and reviewed before a backend is chosen, and so
 * the console still runs offline.
 *
 * IT IS NOT SECURE AND IS NOT MULTI-USER. Anyone with devtools can read or
 * rewrite this data, "sharing" only reaches other profiles in the same browser,
 * and password hashing here is a single unsalted-KDF-free SHA-256 - enough to
 * avoid storing plaintext at rest, nowhere near enough for real credentials.
 * Real authentication must come from the hosted provider, which also has to
 * enforce every permission server-side.
 */

const STORE_KEY = 'WORSHIPAL_ACCOUNTS_LOCAL_V1';
const SESSION_KEY = 'WORSHIPAL_ACCOUNTS_SESSION_V1';

interface LocalStore {
  churches: Church[];
  teams: Team[];
  users: Array<UserAccount & { passwordHash: string }>;
  memberships: TeamMembership[];
  schedules: StoredSchedule[];
  shares: ScheduleShare[];
}

const EMPTY_STORE: LocalStore = {
  churches: [],
  teams: [],
  users: [],
  memberships: [],
  schedules: [],
  shares: []
};

function readStore(): LocalStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY_STORE };
    return { ...EMPTY_STORE, ...(JSON.parse(raw) as Partial<LocalStore>) };
  } catch {
    return { ...EMPTY_STORE };
  }
}

function writeStore(store: LocalStore) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    throw new AccountsError('Browser storage is full or unavailable.', 'unavailable');
  }
}

function id(prefix: string): string {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}_${random[0].toString(36)}${random[1].toString(36)}`;
}

/** Not a real KDF - see the file header. Keeps plaintext out of storage only. */
async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`worshipal-local:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildSession(store: LocalStore, userId: string): SessionUser {
  const account = store.users.find(u => u.id === userId);
  if (!account) throw new AccountsError('Account no longer exists.', 'not_found');

  const church = store.churches.find(c => c.id === account.churchId);
  if (!church) throw new AccountsError('Church no longer exists.', 'not_found');

  const memberships = store.memberships
    .filter(m => m.userId === userId)
    .map(m => {
      const team = store.teams.find(t => t.id === m.teamId);
      return team ? { team, teamRole: m.teamRole } : null;
    })
    .filter((m): m is { team: Team; teamRole: TeamRole } => m !== null);

  const { passwordHash, ...safeAccount } = account;
  return { account: safeAccount, church, memberships };
}

export class LocalAccountsAdapter implements AccountsProvider {
  readonly name = 'local';

  private listeners = new Set<() => void>();

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  async getCurrentUser(): Promise<SessionUser | null> {
    const userId = localStorage.getItem(SESSION_KEY);
    if (!userId) return null;
    try {
      return buildSession(readStore(), userId);
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  async signIn({ email, password }: AuthCredentials): Promise<SessionUser> {
    const store = readStore();
    const target = normaliseEmail(email);
    const user = store.users.find(u => normaliseEmail(u.email) === target);
    const hash = await hashPassword(password);

    // Same message either way so the form cannot be used to enumerate accounts.
    if (!user || user.passwordHash !== hash) {
      throw new AccountsError('That email and password do not match.', 'invalid_credentials');
    }

    localStorage.setItem(SESSION_KEY, user.id);
    return buildSession(store, user.id);
  }

  async signUp(details: SignUpDetails): Promise<SessionUser> {
    const store = readStore();
    const email = normaliseEmail(details.email);

    if (store.users.some(u => normaliseEmail(u.email) === email)) {
      throw new AccountsError('An account already exists for that email.', 'email_taken');
    }

    let church = store.churches.find(c => c.id === details.joinChurchId);
    const isFoundingChurch = !church;

    if (!church) {
      church = {
        id: id('church'),
        name: details.churchName?.trim() || 'My Church',
        createdAt: new Date().toISOString()
      };
      store.churches.push(church);
      // Every church starts with one team; single-team churches never see more.
      store.teams.push({
        id: id('team'),
        churchId: church.id,
        name: 'Worship Team',
        createdAt: new Date().toISOString()
      });
    }

    const user: UserAccount & { passwordHash: string } = {
      id: id('user'),
      churchId: church.id,
      email: details.email.trim(),
      displayName: details.displayName.trim() || details.email.trim(),
      // Whoever creates the church administers it; later joiners are members.
      churchRole: isFoundingChurch ? 'church_admin' : 'member',
      createdAt: new Date().toISOString(),
      passwordHash: await hashPassword(details.password)
    };
    store.users.push(user);

    const firstTeam = store.teams.find(t => t.churchId === church.id);
    if (firstTeam) {
      store.memberships.push({
        userId: user.id,
        teamId: firstTeam.id,
        teamRole: isFoundingChurch ? 'team_lead' : 'member'
      });
    }

    writeStore(store);
    localStorage.setItem(SESSION_KEY, user.id);
    return buildSession(store, user.id);
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  }

  async listChurches(): Promise<Church[]> {
    return readStore().churches;
  }

  async listTeams(churchId: string): Promise<Team[]> {
    return readStore().teams.filter(t => t.churchId === churchId);
  }

  async createTeam(churchId: string, name: string): Promise<Team> {
    const store = readStore();
    const team: Team = {
      id: id('team'),
      churchId,
      name: name.trim() || 'New Team',
      createdAt: new Date().toISOString()
    };
    store.teams.push(team);
    writeStore(store);
    return team;
  }

  async listChurchMembers(churchId: string): Promise<UserAccount[]> {
    return readStore()
      .users.filter(u => u.churchId === churchId)
      .map(({ passwordHash, ...safe }) => safe);
  }

  async listShareableMembers(userId: string): Promise<UserAccount[]> {
    const store = readStore();
    const me = store.users.find(u => u.id === userId);
    if (!me) return [];
    return store.users
      .filter(u => u.churchId === me.churchId && u.id !== userId)
      .map(({ passwordHash, ...safe }) => safe);
  }

  async setTeamRole(userId: string, teamId: string, role: TeamRole): Promise<void> {
    const store = readStore();
    const membership = store.memberships.find(m => m.userId === userId && m.teamId === teamId);
    if (membership) membership.teamRole = role;
    else store.memberships.push({ userId, teamId, teamRole: role });
    writeStore(store);
  }

  async listSchedules(userId: string): Promise<StoredSchedule[]> {
    return readStore()
      .schedules.filter(s => s.ownerId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async saveSchedule(schedule: Omit<StoredSchedule, 'updatedAt'>): Promise<StoredSchedule> {
    const store = readStore();
    const saved: StoredSchedule = { ...schedule, updatedAt: new Date().toISOString() };
    const index = store.schedules.findIndex(s => s.id === schedule.id);
    if (index >= 0) store.schedules[index] = saved;
    else store.schedules.push(saved);
    writeStore(store);
    return saved;
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const store = readStore();
    store.schedules = store.schedules.filter(s => s.id !== scheduleId);
    writeStore(store);
  }

  async shareSchedule({
    schedule,
    toUserId,
    teamId,
    message
  }: {
    schedule: StoredSchedule;
    toUserId: string;
    teamId: string;
    message?: string;
  }): Promise<ScheduleShare> {
    const store = readStore();
    const from = store.users.find(u => u.id === schedule.ownerId);
    const to = store.users.find(u => u.id === toUserId);
    if (!to) throw new AccountsError('That teammate no longer exists.', 'not_found');
    if (from && to.churchId !== from.churchId) {
      throw new AccountsError('You can only share within your own church.', 'forbidden');
    }

    const share: ScheduleShare = {
      id: id('share'),
      scheduleId: schedule.id,
      title: schedule.title,
      // Snapshot, not a reference: accepting later must not be affected by the
      // sender editing or deleting their copy in the meantime.
      items: JSON.parse(JSON.stringify(schedule.items)),
      fromUserId: schedule.ownerId,
      fromDisplayName: from?.displayName || 'A teammate',
      toUserId,
      teamId,
      message: message?.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    store.shares.push(share);
    writeStore(store);
    this.notify();
    return share;
  }

  async listIncomingShares(userId: string): Promise<ScheduleShare[]> {
    return readStore()
      .shares.filter(s => s.toUserId === userId && s.status === 'pending')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async respondToShare(
    shareId: string,
    { accept, keep }: { accept: boolean; keep: boolean }
  ): Promise<void> {
    const store = readStore();
    const share = store.shares.find(s => s.id === shareId);
    if (!share) throw new AccountsError('That share no longer exists.', 'not_found');

    share.status = accept ? 'accepted' : 'declined';
    share.respondedAt = new Date().toISOString();

    // "Use once" accepts the share without adding it to the recipient's library.
    if (accept && keep) {
      store.schedules.push({
        id: id('schedule'),
        ownerId: share.toUserId,
        churchId: store.users.find(u => u.id === share.toUserId)?.churchId || '',
        title: share.title,
        items: JSON.parse(JSON.stringify(share.items)),
        updatedAt: new Date().toISOString()
      });
    }

    writeStore(store);
    this.notify();
  }

  subscribeToShares(_userId: string, onChange: () => void): () => void {
    this.listeners.add(onChange);

    // Another tab (a second operator profile in the same browser) writing the
    // store fires `storage` here, which is how demo sharing appears live.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORE_KEY) onChange();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      this.listeners.delete(onChange);
      window.removeEventListener('storage', onStorage);
    };
  }
}
