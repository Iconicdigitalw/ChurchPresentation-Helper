// Generates the light/dark palette blocks in src/index.css.
//
// Usage: node scripts/generate-theme.js  (paste output into src/index.css)
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const P = {
  slate:   ['f8fafc','f1f5f9','e2e8f0','cbd5e1','94a3b8','64748b','475569','334155','1e293b','0f172a','020617'],
  zinc:    ['fafafa','f4f4f5','e4e4e7','d4d4d8','a1a1aa','71717a','52525b','3f3f46','27272a','18181b','09090b'],
  neutral: ['fafafa','f5f5f5','e5e5e5','d4d4d4','a3a3a3','737373','525252','404040','262626','171717','0a0a0a'],
  stone:   ['fafaf9','f5f5f4','e7e5e4','d6d3d1','a8a29e','78716c','57534e','44403c','292524','1c1917','0c0a09'],
  amber:   ['fffbeb','fef3c7','fde68a','fcd34d','fbbf24','f59e0b','d97706','b45309','92400e','78350f','451a03'],
  blue:    ['eff6ff','dbeafe','bfdbfe','93c5fd','60a5fa','3b82f6','2563eb','1d4ed8','1e40af','1e3a8a','172554'],
  cyan:    ['ecfeff','cffafe','a5f3fc','67e8f9','22d3ee','06b6d4','0891b2','0e7490','155e75','164e63','083344'],
  emerald: ['ecfdf5','d1fae5','a7f3d0','6ee7b7','34d399','10b981','059669','047857','065f46','064e3b','022c22'],
  fuchsia: ['fdf4ff','fae8ff','f5d0fe','f0abfc','e879f9','d946ef','c026d3','a21caf','86198f','701a75','4a044e'],
  indigo:  ['eef2ff','e0e7ff','c7d2fe','a5b4fc','818cf8','6366f1','4f46e5','4338ca','3730a3','312e81','1e1b4b'],
  purple:  ['faf5ff','f3e8ff','e9d5ff','d8b4fe','c084fc','a855f7','9333ea','7e22ce','6b21a8','581c87','3b0764'],
  rose:    ['fff1f2','ffe4e6','fecdd3','fda4af','fb7185','f43f5e','e11d48','be123c','9f1239','881337','4c0519'],
  sky:     ['f0f9ff','e0f2fe','bae6fd','7dd3fc','38bdf8','0ea5e9','0284c7','0369a1','075985','0c4a6e','082f49'],
  teal:    ['f0fdfa','ccfbf1','99f6e4','5eead4','2dd4bf','14b8a6','0d9488','0f766e','115e59','134e4a','042f2e'],
};

const NEUTRALS = new Set(['slate', 'zinc', 'neutral', 'stone']);

// Neutrals carry the app's surface/text hierarchy, so they invert cleanly.
const NEUTRAL_MAP = { 50: 950, 100: 900, 200: 800, 300: 700, 400: 600, 500: 500, 600: 400, 700: 300, 800: 200, 900: 100, 950: 50 };

// Accents are used two ways: 300-700 as foreground (text/icons/fills) on a dark
// surface, and 800-950 as dark tinted backgrounds. Inverting naively would leave
// pale foregrounds unreadable on white, so foreground shades darken instead.
const ACCENT_MAP = { 50: 950, 100: 900, 200: 800, 300: 800, 400: 700, 500: 700, 600: 800, 700: 800, 800: 200, 900: 100, 950: 50 };

// A crisp white page reads better than inverted slate-950 for the app chrome.
const OVERRIDES = { slate: { 950: 'ffffff', 900: 'f8fafc', 800: 'e9eef4' } };

function lightValue(family, shade) {
  const override = OVERRIDES[family]?.[shade];
  if (override) return `#${override}`;
  const map = NEUTRALS.has(family) ? NEUTRAL_MAP : ACCENT_MAP;
  return `#${P[family][SHADES.indexOf(map[shade])]}`;
}

const families = Object.keys(P);
const light = families
  .map((f) => SHADES.map((s) => `  --color-${f}-${s}: ${lightValue(f, s)};`).join('\n'))
  .join('\n\n');

const dark = families
  .map((f) => SHADES.map((s, i) => `  --color-${f}-${s}: #${P[f][i]};`).join('\n'))
  .join('\n\n');

process.stdout.write(
  `/* === LIGHT MODE PALETTE (generated - see scripts note in README) === */\n` +
  `:root.light {\n  color-scheme: light;\n\n${light}\n}\n\n` +
  `/* Slide surfaces mirror the projector, which is always dark. Re-declaring the\n` +
  `   original palette here keeps every slide preview dark in light mode. */\n` +
  `.theme-locked-dark {\n  color-scheme: dark;\n\n${dark}\n}\n`
);
