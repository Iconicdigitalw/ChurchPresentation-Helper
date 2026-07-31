# WorshiPal — Delivery Plan

Working branch: `claude/app-load-preview-6302xp`

This plan covers what remains before launch, in the order I'd tackle it. Items
marked **⚠️ mine** are regressions introduced during recent refactoring rather
than pre-existing issues.

---

## Status

### Landed and verified

| Area | Detail |
|---|---|
| Schedule autosave | Debounced to localStorage with a restore prompt; degrades gracefully when storage is full |
| API hardening | 30 req/min per IP, per-field length caps, 1MB body limit, 400s on invalid input |
| Honest AI fallbacks | Server tags canned responses `isFallback`; modals warn rather than presenting sample content as real |
| Three UI themes | Broadcast / Clean / Pro, each in light and dark, as Tailwind v4 token swaps — no structural change |
| WYSIWYG slides | Single `SlideCanvas` at 1920×1080, `transform: scale()`d; thumbnail geometry matches live output within 0.94% |
| Scripture auto-fit | Measurement-based binary search, replacing a character-count heuristic |
| Verse-split | A range can become one slide or one slide per verse; choice remembered |
| Region-scoped arrows | Arrows drive exactly one panel, tracked from real interaction rather than focus |
| Layout persistence | Panel widths, dock height, view toggles survive reload, clamped to viewport |
| JSX type-checking | `@types/react` added, which surfaced six live prop bugs |
| Vercel readiness | `vercel.json` + `api/index.ts`; serverless entry verified without binding a port |
| Accounts foundation | Church → teams → members, roles, capabilities, swappable provider, local demo adapter |

### Fixed from the audit

- **⚠️ mine** Enter/Space swallowed activation on every focused control, leaving
  the console keyboard-inoperable and moving the projector instead.
- **⚠️ mine** `addItem` always pushed to the projector, so queuing the next song
  replaced what the congregation was seeing.
- **⚠️ mine** Navbar overlays were missing from the modal check: keystrokes aimed
  at an open dialog drove the projector behind it, and Escape did nothing.

---

## Phase 1 — Critical, before any further feature work

A console that fails at these points is worse than one without accounts. All
four were reproduced with measurements, not inferred.

### 1.1 Layout collapses below 1024px
`src/App.tsx` — `<main>` is `flex-col` under `lg` with `overflow: hidden`, and
children carry `h-full`. Measured at 1023×800: slide grid height **0**, live
preview positioned at `top: 800` (entirely below the viewport), `scrollHeight`
1364px against a 682px container with no scrollbar. Resizers are `hidden lg:flex`,
so nothing can be recovered.

**Impact:** a 1024-wide booth laptop loses the slide grid and the live preview
outright.
**Fix:** in the column path give the rails `h-auto shrink-0` with a bounded
max-height and let `main` scroll, or force the row layout with horizontal scroll
below `lg`.

### 1.2 Projector shows a placeholder when opened
`src/App.tsx` broadcasts only from an effect keyed on live state; the popout has
no handshake. Opening the projector mid-service displays
*"Waiting for Live Slide…"* until something changes.

**Fix:** have the popout post `REQUEST_STATE` on load and answer with current
state, or replay the last payload after `openLiveProjectorWindow` returns.

### 1.3 Blackout does not clear an alert banner
`src/utils/liveDisplayManager.ts` — the `black` and `logo` branches return before
the alert block, and `.blackout` does not hide `.alert-banner`. F4 is the panic
button; it currently leaves the alert on screen, and the alert cannot be
dismissed while blacked out.

**Fix:** hide `.alert-banner` under `.blackout` / `.logo-screen` and handle
alerts above the early returns.

### 1.4 Blocked popup reports success
`openLiveProjectorWindow` returns `null` when blocked; the caller ignores it,
sets live output on, and closes the dialog. The console claims LIVE with no
projector.

**Fix:** check the return value and surface a persistent, actionable error.

---

## Phase 2 — High priority

| # | Issue | Location |
|---|---|---|
| 2.1 | Deleting a non-selected item that owns the live slide orphans it on the projector, with no LIVE badge anywhere | `state/scheduleReducer.ts` `deleteItem` |
| 2.2 | "Next Staged Slide" shows a preview override that Next→ won't actually play, and the override never clears | `state/scheduleReducer.ts` `getNextSlide` |
| 2.3 | The slide grid's whole editing toolbar is dead code — add/delete/duplicate/edit/theme all destructured and never called, so the "this slide is live" delete confirmation is unreachable | `components/SlideGridPanel.tsx` |
| 2.4 | Navbar receives nine live-control props it never renders; `LivePreviewPanel` never renders its `onPushLive` | `components/Navbar.tsx`, `components/LivePreviewPanel.tsx` |
| 2.5 | Escape closes none of the main modals (Bible, Song, Deck, Alert) | all overlays |
| 2.6 | Stage view is a keyboard dead end and leaks focus to the hidden navbar behind it | `components/StageDisplayView.tsx` |
| 2.7 | Focus escapes open modals onto controls behind the backdrop; no `role="dialog"`/`aria-modal` outside `ConfirmDialog` | all overlays |
| 2.8 | The context dock overrides the operator's tab choice on every slide change **and** overwrites the saved preference | `components/ContextWorkspacePanel.tsx` |
| 2.9 | Mic indicator latches on permanently when speech recognition is unsupported | `components/AILiveCompanionDrawer.tsx` |
| 2.10 | Stale closure fires unbounded concurrent API calls on speech results; recogniser never stopped on unmount | `components/AILiveCompanionDrawer.tsx` |
| 2.11 | A failed Bible search silently loads John 1 instead of reporting no match | `data/localBibleDatabase.ts` |

**Suggested grouping:** 2.5–2.7 share one fix — extract the `ConfirmDialog`
Escape/backdrop/focus-trap behaviour into a `useDismissable` hook and apply it to
all nine overlays.

---

## Phase 3 — Medium

Grouped by theme; full detail in the audit.

- **Projector fidelity.** The popout renders a hard black stage and never applies
  `bgImageUrl` or the theme gradient, so the WYSIWYG guarantee holds for text
  geometry but breaks on background. Logo state also shows different branding in
  preview vs projector, and neither uses the configured church name.
- **Contrast.** `text-slate-500` metadata fails in **all six** theme×mode
  combinations (3.66–4.48 against a 4.5 requirement). White-on-active-pill fails
  in broadcast-dark (4.10) and pro-dark (3.56) because those themes remap the
  primary accent. Several amber-on-tint cases fail in light modes.
- **Schedule rail legibility.** Titles truncate to as little as 41px on the LIVE
  row; the slide-count/key meta line wraps to two or three lines.
- **Thumbnail badges** sit on top of the slide text they describe, undercutting
  the projector-mirror intent.
- **Undo.** Deleting a schedule item is confirmed but unrecoverable; a
  sermon deck built over a week can be lost to one confirmed click.
- **Settings modal** mixes immediate-commit and save-on-confirm, silently
  discarding four fields when closed with X.
- **Non-JSON API responses** surface a raw parser error to the operator — likely
  on a misconfigured deploy, given the `/api/(.*)` rewrite.
- **Frozen clock** in the stage-preview panel; **unreachable** `countdown` alert
  type; **desync** when pushing a slide from another item via the dock.

---

## Phase 4 — Polish

Keyboard reachability for ~20 `div`-based interactive surfaces; `aria-label` on
12 icon-only buttons; `aria-live` on status regions; LIVE state signalled by more
than colour; uncleaned timers in five components; dead imports; terminology drift
(the bottom dock is variously "Deck Slides", "Service Deck Slides",
"presentation", "Decks", "Slideshow Deck") and branding drift (`PraiseFlow`,
`LOGOS CHURCH`, `LOGOS AI Live`, `WorshiPal.com` all ship today).

---

## Phase 5 — Accounts and multi-tenancy

### Product shape

- **Free tier** — church signs up on the hosted app and supplies their own AI
  key. They monitor their own usage because it is their key.
- **Paid tier** — the platform supplies the key, models and hosting for a
  monthly fee.
- **Platform admin** — support staff who can reach any church.

### Recommendation: one hosted instance, on Firebase

A small church without a tech team should not create *any* backend project.
Running a single multi-tenant instance means signup is the entire onboarding.

Firebase over Neon for one concrete reason: **password resets need transactional
email.** Firebase includes auth, resets and sessions; Neon is only Postgres, so
that security-critical code would be hand-rolled and would need a separate email
provider. Firebase's realtime listeners also suit the share notifications.

Neon remains reasonable if SQL portability outweighs that.

### Landed

`src/accounts/` — domain types, capability checks, provider interface, and a
local demo adapter. Roles are `church_admin` / `team_lead` / `member` plus
`platform_admin`; a single-team church collapses to its church admin being the
only administrator, as intended.

Two deliberate calls: components ask `can(user, 'manage_teams')` rather than
checking roles directly, so the model can change in one file; and a share stores
a **snapshot**, so accepting later is unaffected by the sender editing or
deleting their copy, and "use once" needs no write.

> The local adapter is **not secure and not multi-user**. It is devtools-readable,
> sharing only reaches profiles in the same browser, and its hashing is bare
> SHA-256 with no KDF. It exists to review the flows offline. Real auth must come
> from the hosted provider, which must also enforce every permission server-side.

### Remaining

1. Firebase adapter implementing `AccountsProvider`.
2. Sign-in / sign-up / password reset screens and account menu.
3. Per-user storage scoping — schedules, layout and app settings currently sit on
   global localStorage keys, so two operators sharing a booth machine overwrite
   each other.
4. Share + notification UI (accept-and-keep vs use-once).
5. **Per-church AI keys**, encrypted at rest, server-side only, never sent to the
   browser.
6. **Per-church metering.** Rate limiting is currently per-IP, which does nothing
   to stop one church consuming the managed tier's budget. This must land before
   taking payment.
7. Platform-admin console.

### Platform-admin safeguards (non-negotiable)

Cross-tenant access must be granted by a **server-verified claim**, never a
client-readable flag. Every cross-church access should be **audit-logged**. Those
accounts need **MFA**. Churches must be **told** in your terms that support staff
can access their data — some will store member names and prayer requests.

---

## Phase 6 — Launch

1. Deploy from the GitHub repo via Vercel's Git integration (gives auto-deploy on
   push). `vercel.json` and `api/index.ts` are in place.
2. Set `GEMINI_API_KEY` in project environment variables.
3. Deploy `main` rather than the working branch once reviewed.

---

## Open decisions

| Decision | Needed from you |
|---|---|
| Backend | Firebase (recommended) or Neon. If Firebase: web config + a service account. If Neon: a connection string for the separate account you mentioned. Set them as environment variables and share the **names**, not the values. |
| Sequencing | Finish Phase 1 first, or keep momentum on accounts? My recommendation is Phase 1 first. |
| Demo content | `src/data/mockData.ts` seeds the demo set with lyrics from published worship songs, credited to their artists. Every preview I publish substitutes placeholders; the repo still carries the originals. Worth replacing with your own licensed content before a public deploy — churches generally need CCLI coverage to project those, and seed data does not convey it. |

---

## Known risks

- **Contrast and reachability regressions are easy to reintroduce.** The audit
  scripts (contrast across all six theme×mode combinations, keyboard traversal,
  responsive geometry) are worth keeping as a checked-in test suite rather than
  one-off scratch files.
- **`tsc` cannot see dead UI.** The slide grid's unused editing toolbar type-checks
  cleanly. Prop-level type checking only arrived with `@types/react`; anything
  older than that commit was never verified.
- **The 60-slide first render costs a single 149ms long task** (~9 dropped frames)
  while mounting 62 canvases. Not operator-facing yet; worth virtualising if decks
  grow.
