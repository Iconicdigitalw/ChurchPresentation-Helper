// Generates the theme token blocks in src/index.css.
//
// Usage: node scripts/generate-theme.js > /tmp/theme.css
//
// The console ships three selectable UI themes, each available in light and
// dark. Rather than rewriting utilities across ~9k lines of components, every
// theme is expressed purely as Tailwind v4 design tokens:
//
//   --color-*   palette          (surfaces, text, accents)
//   --spacing   density          (every p-/m-/gap-/size- utility is calc(var(--spacing) * n))
//   --radius-*  corner treatment
//
// Slide surfaces are exempt: they mirror the projector output, so
// `.theme-locked-dark` restores the stock dark palette for that subtree in
// every theme and mode.

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// ---------------------------------------------------------------------------
// Stock Tailwind ramps - the baseline for accents and for slide surfaces.
// ---------------------------------------------------------------------------
const STOCK = {
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

const NEUTRAL_FAMILIES = new Set(['slate', 'zinc', 'neutral', 'stone']);

// Accents are used two ways: 300-700 as foreground on dark surfaces, and
// 800-950 as dark tinted backgrounds. A naive inversion leaves pale foregrounds
// unreadable on white, so foreground shades darken instead of lightening.
const ACCENT_MAP = { 50: 950, 100: 900, 200: 800, 300: 800, 400: 700, 500: 700, 600: 800, 700: 800, 800: 200, 900: 100, 950: 50 };

// Families the components already use for decorative accents. Each theme
// replaces these ramps with its own, which reskins every primary button, pill
// and active state without touching a single component.
//
// `amber`, `rose` and `emerald` are deliberately NOT themed: they carry state
// meaning (staged / live / ok) and must read the same in every theme.
const PRIMARY_ACCENT_FAMILY = 'indigo';
const SECONDARY_ACCENT_FAMILY = 'purple';

// ---------------------------------------------------------------------------
// Theme definitions
//
// Neutral ramps run 50 -> 950 and carry most of each theme's character:
// in dark mode 950 is the page and 800 the card/border; light mode is authored
// separately rather than inverted, so both grounds get deliberate values.
// ---------------------------------------------------------------------------
const THEMES = {
  // Dim media booth. Cool blue-black ground, broadcast cyan, calm and legible.
  broadcast: {
    label: 'Broadcast Console',
    spacing: '0.25rem',
    radius: { md: '.375rem', lg: '.5rem', xl: '.75rem', '2xl': '1rem', '3xl': '1.5rem' },
    neutralDark:  ['f8fafc','eef2f7','dde3ed','c2cbdb','94a3bd','6b7a99','4a5978','2c3850','1a2437','0d1424','070b14'],
    neutralLight: ['070b14','111a2c','1e2942','33415c','4a5978','6b7a99','93a1b8','cdd7e6','e6ecf5','f5f8fc','ffffff'],
    accent:       ['ecfeff','cffafe','a5f3fc','7dd3fc','38bdf8','0ea5e9','0284c7','0369a1','075985','0c4a6e','082f49'],
    secondary:    ['eff6ff','dbeafe','bfdbfe','93c5fd','60a5fa','3b82f6','2563eb','1d4ed8','1e40af','1e3a8a','172554'],
  },

  // Bright room, daytime planning. Airy density, soft corners, violet accent.
  clean: {
    label: 'Modern Clean',
    spacing: '0.285rem',
    radius: { md: '.5rem', lg: '.75rem', xl: '1rem', '2xl': '1.25rem', '3xl': '1.75rem' },
    neutralDark:  ['fbfcfe','f2f4f8','e4e7ee','cbd0dc','a3a9bb','7c8296','585d70','3a3e4d','262935','1a1c26','12131a'],
    neutralLight: ['0b0e14','161a23','262c38','3a4150','545c6b','78808f','a2abbb','d9dee7','eef1f5','f9fafb','ffffff'],
    accent:       ['f5f3ff','ede9fe','ddd6fe','c4b5fd','a78bfa','8b5cf6','7c3aed','6d28d9','5b21b6','4c1d95','2e1065'],
    secondary:    ['f0fdfa','ccfbf1','99f6e4','5eead4','2dd4bf','14b8a6','0d9488','0f766e','115e59','134e4a','042f2e'],
  },

  // Experienced operator. Near-black, compact, tight corners, orange accent.
  pro: {
    label: 'High-Density Pro',
    spacing: '0.2rem',
    radius: { md: '.25rem', lg: '.3125rem', xl: '.375rem', '2xl': '.5rem', '3xl': '.75rem' },
    neutralDark:  ['fafafa','f0f0f3','e2e2e7','c8c8d0','9a9aa5','6a6a75','45454e','2b2b31','1a1a1e','0d0d0f','050505'],
    neutralLight: ['050505','18181b','27272a','3f3f46','52525b','71717a','9c9ca6','d2d2d8','e9e9ec','f7f7f8','ffffff'],
    accent:       ['fff7ed','ffedd5','fed7aa','fdba74','fb923c','f97316','ea580c','c2410c','9a3412','7c2d12','431407'],
    secondary:    ['f0f9ff','e0f2fe','bae6fd','7dd3fc','38bdf8','0ea5e9','0284c7','0369a1','075985','0c4a6e','082f49'],
  },
};

function ramp(family, theme, mode) {
  if (NEUTRAL_FAMILIES.has(family)) {
    return mode === 'dark' ? theme.neutralDark : theme.neutralLight;
  }

  const base =
    family === PRIMARY_ACCENT_FAMILY
      ? theme.accent
      : family === SECONDARY_ACCENT_FAMILY
        ? theme.secondary
        : STOCK[family];
  if (mode === 'dark') return base;
  return SHADES.map((s) => base[SHADES.indexOf(ACCENT_MAP[s])]);
}

function colorBlock(theme, mode) {
  return Object.keys(STOCK)
    .map((family) => {
      const values = ramp(family, theme, mode);
      return SHADES.map((s, i) => `  --color-${family}-${s}: #${values[i]};`).join('\n');
    })
    .join('\n\n');
}

function shellBlock(theme) {
  const radius = Object.entries(theme.radius)
    .map(([k, v]) => `  --radius-${k}: ${v};`)
    .join('\n');
  return `  --spacing: ${theme.spacing};\n${radius}`;
}

const out = [];
out.push('/* === THEME TOKENS (generated by scripts/generate-theme.js) === */');
out.push('');

for (const [key, theme] of Object.entries(THEMES)) {
  out.push(`/* ${theme.label} - dark */`);
  out.push(`:root[data-ui-theme="${key}"] {`);
  out.push('  color-scheme: dark;');
  out.push('');
  out.push(shellBlock(theme));
  out.push('');
  out.push(colorBlock(theme, 'dark'));
  out.push('}');
  out.push('');

  out.push(`/* ${theme.label} - light */`);
  out.push(`:root[data-ui-theme="${key}"].light {`);
  out.push('  color-scheme: light;');
  out.push('');
  out.push(colorBlock(theme, 'light'));
  out.push('}');
  out.push('');
}

out.push('/* Slide surfaces mirror the projector output, which is always dark and');
out.push('   theme-independent. Re-declaring the stock tokens pins that subtree. */');
out.push('.theme-locked-dark {');
out.push('  color-scheme: dark;');
out.push('');
out.push('  --spacing: 0.25rem;');
out.push('  --radius-md: .375rem;');
out.push('  --radius-lg: .5rem;');
out.push('  --radius-xl: .75rem;');
out.push('  --radius-2xl: 1rem;');
out.push('  --radius-3xl: 1.5rem;');
out.push('');
out.push(
  Object.keys(STOCK)
    .map((family) => SHADES.map((s, i) => `  --color-${family}-${s}: #${STOCK[family][i]};`).join('\n'))
    .join('\n\n')
);
out.push('}');
out.push('');

process.stdout.write(out.join('\n'));
