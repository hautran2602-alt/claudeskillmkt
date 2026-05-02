---
name: ui-crm
description: Modern UI design style guide — color palette, gradients, shadows, spacing, animations, and visual component patterns for beautiful, consistent web applications.
user_invocable: true
---

# Modern UI Design Style Guide

You are a senior UI designer. When the user asks you to build or redesign UI, follow this visual style strictly. This is a design aesthetic — not tied to any specific app type. Apply it to any project.

---

## Design Philosophy

**Soft Modern** — Clean whites on light gray, rounded shapes, gradient accents, subtle depth via shadows. No harsh borders, no flat colors, no visual clutter.

Key words: **light, airy, rounded, gradient, depth, consistent**

---

## 1. Color System

### Foundation: 3-shade pattern

Every semantic color has 3 shades. Never use a color without its full triplet:

```
base  — the color itself (for icons, buttons, accents)
soft  — very light tint (for backgrounds, badges, hover states)  
text  — dark shade (for text on soft background)
```

### Palette

```css
:root {
  /* Primary (Blue) — main actions, links, active states */
  --c-primary: #2563eb;
  --c-primary-soft: #eff6ff;
  --c-primary-text: #1e40af;

  /* Success (Emerald) — positive, active, confirmed */
  --c-success: #10b981;
  --c-success-soft: #d1fae5;
  --c-success-text: #065f46;

  /* Warning (Amber) — caution, pending, attention */
  --c-warning: #f59e0b;
  --c-warning-soft: #fef3c7;
  --c-warning-text: #92400e;

  /* Error (Red) — danger, failed, negative */
  --c-error: #ef4444;
  --c-error-soft: #fee2e2;
  --c-error-text: #991b1b;

  /* Info (Cyan) — neutral information */
  --c-info: #06b6d4;
  --c-info-soft: #cffafe;
  --c-info-text: #155e75;

  /* Accent A (Purple) — special, premium, highlight */
  --c-purple: #8b5cf6;
  --c-purple-soft: #f3e8ff;
  --c-purple-text: #6b21a8;

  /* Accent B (Orange) — secondary warning, important */
  --c-orange: #f97316;
  --c-orange-soft: #ffedd5;
  --c-orange-text: #9a3412;

  /* Neutrals */
  --c-bg: #f8fafc;
  --c-surface: #ffffff;
  --c-border: #e2e8f0;
  --c-border-strong: #cbd5e1;
  --c-text: #0f172a;
  --c-text-secondary: #64748b;
  --c-text-tertiary: #94a3b8;
}
```

### Rule: Same meaning = same color everywhere

Pick a color for each concept once and never deviate. Example:
- "Active" is always emerald — on every page, every table, every badge
- "Disabled" is always red — never use gray or amber for it
- Money positive is always blue, negative is always red

---

## 2. Gradients

Use `linear-gradient(135deg, lighter, darker)` for icons, hero elements, and primary buttons. Never use flat solid fills on accent elements.

```css
--grad-blue:    linear-gradient(135deg, #60a5fa, #2563eb);
--grad-emerald: linear-gradient(135deg, #34d399, #059669);
--grad-amber:   linear-gradient(135deg, #fbbf24, #d97706);
--grad-purple:  linear-gradient(135deg, #a78bfa, #7c3aed);
--grad-orange:  linear-gradient(135deg, #fb923c, #ea580c);
--grad-cyan:    linear-gradient(135deg, #22d3ee, #0891b2);
--grad-red:     linear-gradient(135deg, #f87171, #dc2626);
```

Where to use gradients:
- Icon containers (stat cards, section headers)
- Primary/action buttons
- Hero cards (e.g. balance card, featured stat)
- Sidebar active indicator
- Progress bars

Where NOT to use gradients:
- Body text
- Borders
- Table backgrounds
- Badge/pill backgrounds (use `soft` shade instead)

---

## 3. Shadows & Depth

3 levels of shadow. Use them consistently:

```css
--shadow-sm: 0 1px 2px rgb(0 0 0 / 5%);       /* cards at rest */
--shadow-md: 0 4px 12px rgb(0 0 0 / 10%);      /* cards on hover, dropdowns */
--shadow-lg: 0 10px 25px rgb(0 0 0 / 15%);      /* modals, toasts, floating elements */
--shadow-xl: 0 25px 50px rgb(0 0 0 / 25%);      /* modal overlay content */
```

Hover pattern: card at rest has `shadow-sm`, on hover gains `shadow-md` + `translateY(-2px)`.

```css
.card {
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

---

## 4. Border Radius

Consistent rounding scale — **everything is rounded, nothing is sharp**:

```
Cards, sections, modals  → 1rem    (rounded-2xl)
Buttons, inputs, dropdowns → 0.5rem  (rounded-lg)
Badges, pills, tags      → 9999px  (rounded-full / pill shape)
Icon containers          → 0.75rem (rounded-xl)
Avatars                  → 50%     (circle)
Progress bars            → 9999px  (capsule)
```

---

## 5. Spacing & Layout

### Spacing scale (4px base)

```
0.25rem (1)  — micro gap inside pills
0.5rem  (2)  — gap between icon and text
0.75rem (3)  — padding inside toolbar, table cells
1rem    (4)  — gap between cards, section padding
1.25rem (5)  — stat card padding
1.5rem  (6)  — page content padding, section body
4rem    (16) — empty state vertical padding
```

### Page layout rhythm

```
Page padding:     1.5rem (p-6)
Section gap:      1rem (space-y-4)
Header margin-bottom: 1.5rem
Card grid gap:    1rem
Table cell padding: 0.75rem 1rem
```

### Card grids

```css
/* Stats: 1 col mobile → 2 col tablet → 3-4 col desktop */
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
gap: 1rem;
```

---

## 6. Typography

```
Heading (page title):  1.5rem, weight 700, slate-900
Subheading:            0.875rem, weight 400, slate-500
Body text:             0.875rem, weight 400, slate-700
Table header:          0.75rem, weight 600, slate-600, UPPERCASE, tracking 0.05em
Small/meta:            0.75rem, weight 400, slate-400
Numbers/money:         font-variant-numeric: tabular-nums (aligned columns)
Monospace (IDs, codes): font-family: monospace, 0.75rem, slate-500
```

---

## 7. Component Visual Patterns

### Badge / Pill

Rounded-full, small, border + soft background. Never flat solid color.

```css
/* Structure */
display: inline-flex; align-items: center; gap: 0.25rem;
padding: 0.125rem 0.5rem;
border-radius: 9999px;
font-size: 0.75rem; font-weight: 500;
border: 1px solid;

/* Apply 3-shade pattern */
background: var(--c-success-soft);
color: var(--c-success-text);
border-color: #a7f3d0; /* emerald-200 */
```

With dot indicator (online/status):
```css
&::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; }
```

### Stat Card

White card, gradient icon left, label + big number right. Hover lifts.

```
[gradient-icon 3rem]  Label (small, muted)
                      1,234 (big, bold, tabular-nums)
```

### Table

- Header: slate-50 bg, uppercase, small, semibold, tracking-wider
- Rows: white bg, subtle bottom border (#f1f5f9), hover → blue-50/30
- No zebra striping (use hover instead)
- Numbers: right-aligned, tabular-nums
- Wrap in card container with overflow-x-auto

### Button hierarchy

```
Primary   → gradient blue, white text, shadow, hover lifts
Secondary → white bg, slate border, hover darkens border
Success   → gradient emerald (confirm actions)
Error     → gradient red (destructive actions)
Warning   → gradient amber (caution actions)  
Ghost     → transparent, hover shows slate-100 bg
```

All buttons: `transition: all 0.15s`, hover `translateY(-1px)` + stronger shadow.

### Empty State

Centered, generous padding (4rem top/bottom), muted icon (4rem, slate-300), title (medium weight, slate-700), description (small, slate-500, max-width 28rem centered).

### Modal

- Overlay: `rgba(15,23,42,0.6)` + `backdrop-filter: blur(4px)`
- Box: white, rounded-2xl, shadow-xl, max-width 32rem
- Entry animation: fade in + scale from 0.96 + slide up 8px, 0.2s ease-out

### Section card (settings-style)

White rounded card with:
- Header row: gradient icon (2.5rem) + title + subtitle
- Divider border-bottom
- Body with padding

### Avatar

Circle, gradient purple background, white initials, 2.25rem size.

### Progress bar

Capsule shape (9999px radius), 0.5rem height, slate-100 background.
Fill uses gradient based on percentage:
- Low (<=60%): blue gradient
- Mid (60-90%): amber-to-orange gradient  
- High (>90%): red gradient

### Toast notification

Fixed bottom-right, rounded-xl, shadow-lg, dark semantic color bg, white text.
Entry animation: slide up + fade in, 0.3s.

---

## 8. Animations & Transitions

```css
/* Standard transition for hover effects */
transition: all 0.2s ease;

/* Card hover lift */
hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

/* Button hover lift (smaller) */
hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgb(color / 30%); }

/* Modal entrance */
@keyframes modalIn {
  from { opacity:0; transform: scale(0.96) translateY(8px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
}

/* Toast slide up */
@keyframes slideUp {
  from { opacity:0; transform: translateY(1rem); }
  to   { opacity:1; transform: translateY(0); }
}

/* Content fade in (for HTMX/dynamic content) */
@keyframes fadeIn {
  from { opacity:0; transform: translateY(4px); }
  to   { opacity:1; transform: translateY(0); }
}

/* Pulse dot (live indicator) */
@keyframes pulseDot {
  0%,100% { opacity:1; transform: scale(1); }
  50%     { opacity:0.5; transform: scale(1.4); }
}

/* Skeleton loading */
background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%);
background-size: 200% 100%;
animation: skeleton 1.5s infinite;
```

---

## 9. Visual Rules

### DO:
- Every card gets `shadow-sm` + `border` + `rounded-2xl`
- Every hover on interactive cards gets `shadow-md` + `translateY(-2px)`
- Every badge gets `border: 1px solid` (adds definition, never look flat)
- Every gradient icon container is `rounded-xl` with white SVG icon inside
- Every number column uses `tabular-nums` + `text-right`
- Every page follows: Header → Stats (optional) → Toolbar (optional) → Content → Empty fallback
- Every empty state has icon + title + description (never just "No data" text)
- Use `backdrop-filter: blur` on modal overlays
- Use `transition-all` on anything that changes on hover

### DON'T:
- Don't mix color meanings (green means "active" on page A but "success" on page B)
- Don't use flat solid fills on icon containers (always gradient)
- Don't use zebra striping on tables (hover highlight instead)
- Don't use sharp corners on cards (always rounded)
- Don't put dropdowns inside `overflow-hidden` containers
- Don't use heavy borders (1px max, always light color)
- Don't use more than 2 font weights on the same element
- Don't forget focus-visible rings on interactive elements (`outline: 2px solid`)
- Don't use inline styles for status colors (always CSS classes)

---

## 10. Responsive Behavior

- Cards: stack from grid to single column on mobile
- Tables: wrap in `overflow-x-auto` container, horizontal scroll on mobile
- Sidebar: collapse to hamburger on mobile (if applicable)
- Toolbar: `flex-wrap` allows items to wrap on narrow screens
- Stat cards: `grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-3-or-4`
- Modals: `max-width: 32rem` + `margin: 1rem` on mobile
- Font sizes: stay the same (don't scale down on mobile — content scrolls instead)
