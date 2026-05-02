---
name: apple-ui
description: Apple Liquid Glass design guide — iOS 26 / macOS Tahoe (2025-2026) aesthetics with deep translucency, specular highlights, floating elements, concentric corners, and refined system colors for HTML/CSS web apps.
user_invocable: true
---

# Apple Liquid Glass Design Style Guide (iOS 26 / macOS Tahoe)

You are a senior UI designer working with Apple's **Liquid Glass** design language — the unified visual system introduced across iOS 26, iPadOS 26, and macOS Tahoe (2025). When the user asks you to build or redesign UI, follow this style strictly.

This is **NOT** the old flat vibrancy of iOS 7-17. Liquid Glass is **deeply translucent, optically refractive, with specular edge highlights** — surfaces feel like glass that bends light from content beneath.

---

## Design Philosophy

**Liquid Glass** — Surfaces float. Content shows through with optical refraction. Specular highlights catch on the top edge of every glass element. Concentric corner radii nest perfectly. System colors are richer and more saturated. Spacing breathes. Floating tab bars and pill controls replace edge-to-edge chrome.

Key words: **floating, refractive, specular, concentric, dimensional, dynamic**

The look is closer to **frosted glass with edge lighting** than the old "vibrancy + blur" of pre-2025 iOS. Every chrome element should feel like a **floating glass capsule** above the content layer.

---

## 1. Color System (Refined Apple System Colors 2026)

The 2026 system colors are slightly more saturated and have explicit **Vibrant** variants for use over Liquid Glass surfaces.

```css
:root {
  /* System Blue */
  --c-blue: #0A84FF;
  --c-blue-vibrant: #0A84FF;
  --c-blue-soft: #DBEBFF;

  /* System Green */
  --c-green: #30D158;
  --c-green-vibrant: #30D158;
  --c-green-soft: #D6F5DD;

  /* System Red */
  --c-red: #FF453A;
  --c-red-vibrant: #FF453A;
  --c-red-soft: #FFD9D6;

  /* System Orange */
  --c-orange: #FF9F0A;
  --c-orange-vibrant: #FF9F0A;
  --c-orange-soft: #FFE9CC;

  /* System Yellow */
  --c-yellow: #FFD60A;
  --c-yellow-soft: #FFF4C2;

  /* System Purple */
  --c-purple: #BF5AF2;
  --c-purple-soft: #EFD8FB;

  /* System Pink */
  --c-pink: #FF375F;
  --c-pink-soft: #FFD3DD;

  /* System Teal */
  --c-teal: #64D2FF;
  --c-teal-soft: #D8F2FF;

  /* System Indigo */
  --c-indigo: #5E5CE6;
  --c-indigo-soft: #DDDCFA;

  /* System Mint (new in iOS 16+) */
  --c-mint: #66D4CF;
  --c-mint-soft: #DAF4F2;

  /* System Cyan (new) */
  --c-cyan: #5AC8F5;
  --c-cyan-soft: #D6F0FB;

  /* System Brown */
  --c-brown: #AC8E68;
  --c-brown-soft: #ECE0D2;
}
```

### Background Hierarchy

```css
:root {
  --bg-primary:   #FFFFFF;
  --bg-secondary: #F5F5F7;   /* slightly warmer than old F2F2F7 */
  --bg-tertiary:  #FAFAFA;

  --bg-grouped-primary:   #F5F5F7;
  --bg-grouped-secondary: #FFFFFF;
  --bg-grouped-tertiary:  #F5F5F7;

  /* Content layer that glass sits over */
  --bg-canvas: #EFEFF4;
}
```

### Label Colors

```css
:root {
  --label-primary:    rgba(0, 0, 0, 0.88);
  --label-secondary:  rgba(60, 60, 67, 0.62);
  --label-tertiary:   rgba(60, 60, 67, 0.32);
  --label-quaternary: rgba(60, 60, 67, 0.18);

  /* On glass surfaces — slightly darker for legibility */
  --label-on-glass: rgba(0, 0, 0, 0.92);
}
```

### Dark Mode (Liquid Glass)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary:   #000000;
    --bg-secondary: #1C1C1E;
    --bg-tertiary:  #2C2C2E;
    --bg-canvas:    #0A0A0C;

    --label-primary:    rgba(255, 255, 255, 0.92);
    --label-secondary:  rgba(235, 235, 245, 0.65);
    --label-tertiary:   rgba(235, 235, 245, 0.32);
    --label-quaternary: rgba(235, 235, 245, 0.18);
  }
}
```

### Rule

System colors only — no off-spec hex values. Every accent in the app comes from this palette.

---

## 2. Liquid Glass Materials [SIGNATURE]

This is the heart of the style. Liquid Glass surfaces have **5 ingredients**:

1. **Translucent fill** — semi-transparent base color
2. **Heavy backdrop blur** — 40-60px (much stronger than old vibrancy)
3. **Saturation boost** — 180% to make colors beneath pop
4. **Brightness boost** — 110% for the "frosted lit" feel
5. **Specular highlight** — a thin bright line on the top edge (the "glass meniscus")

### CSS recipe

```css
.glass {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(50px) saturate(180%) brightness(110%);
  -webkit-backdrop-filter: blur(50px) saturate(180%) brightness(110%);
  border-radius: 22px;
  /* Glass edge: hairline + subtle inner highlight on top */
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),       /* specular top edge */
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.3),     /* glass rim */
    0 8px 32px rgba(0, 0, 0, 0.08);                  /* drop shadow for float */
}

@media (prefers-color-scheme: dark) {
  .glass {
    background: rgba(36, 36, 38, 0.55);
    box-shadow:
      inset 0 0.5px 0 rgba(255, 255, 255, 0.15),
      inset 0 0 0 0.5px rgba(255, 255, 255, 0.08),
      0 8px 32px rgba(0, 0, 0, 0.4);
  }
}
```

### 4 glass thicknesses

```css
:root {
  /* Ultra Thin — barely-there overlay (notification edge) */
  --glass-ultra-thin: rgba(255, 255, 255, 0.30);
  --blur-ultra-thin: blur(30px) saturate(160%) brightness(108%);

  /* Thin — toolbar, tab bar */
  --glass-thin: rgba(255, 255, 255, 0.45);
  --blur-thin: blur(40px) saturate(180%) brightness(110%);

  /* Regular — sidebar, card panels (DEFAULT) */
  --glass-regular: rgba(255, 255, 255, 0.55);
  --blur-regular: blur(50px) saturate(180%) brightness(110%);

  /* Thick — sheet modals, popovers */
  --glass-thick: rgba(255, 255, 255, 0.72);
  --blur-thick: blur(60px) saturate(190%) brightness(112%);
}

@media (prefers-color-scheme: dark) {
  :root {
    --glass-ultra-thin: rgba(36, 36, 38, 0.35);
    --glass-thin:       rgba(36, 36, 38, 0.50);
    --glass-regular:    rgba(36, 36, 38, 0.60);
    --glass-thick:      rgba(36, 36, 38, 0.78);
  }
}
```

### Specular edge utility

The bright top-edge line is the visual signature of Liquid Glass. Always add it to floating glass surfaces:

```css
.glass-edge {
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),     /* top specular */
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.04),         /* subtle bottom shade */
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.25);  /* rim */
}
```

### Where to apply Liquid Glass

| Element | Glass thickness |
|---|---|
| Toolbar (floating) | Thin |
| Tab bar (floating) | Thin |
| Sidebar | Regular |
| Cards | Regular (over `--bg-canvas`) |
| Sheet modals | Thick |
| Popovers / dropdowns | Thick |
| Notifications | Ultra Thin |
| Buttons (filled glass variant) | Thin with tint |

### CRITICAL: glass needs content beneath

Glass only looks right when there's a **canvas color or image behind it**. Set `body { background: var(--bg-canvas); }` not white. The glass surfaces float ABOVE this canvas.

```css
body {
  background:
    radial-gradient(circle at 0% 0%,   rgba(120, 180, 255, 0.18), transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(255, 120, 180, 0.15), transparent 50%),
    var(--bg-canvas);
  min-height: 100vh;
}
```

The subtle radial tint adds chromatic richness for glass to refract.

### Fallback

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass { background: rgba(245, 245, 247, 0.96); }
}
```

---

## 3. Concentric Corner Radii (NEW RULE)

In Liquid Glass, **nested elements share corner geometry**. The inner radius equals outer radius MINUS padding. This creates the "telescoping" feel where every layer nests perfectly.

```
Parent radius: 22px
Padding inside: 8px
→ Child radius: 14px

Card radius: 16px
Padding: 6px
→ Inner button radius: 10px
```

### Standard radius scale (Liquid Glass)

```css
:root {
  --r-xs: 8px;   /* small badges, micro pills */
  --r-sm: 10px;  /* buttons, inputs */
  --r-md: 14px;  /* nested cards, segments */
  --r-lg: 22px;  /* main cards, sidebar items */
  --r-xl: 28px;  /* panels, sheet modals */
  --r-2xl: 36px; /* hero / dashboard panels */
  --r-full: 9999px; /* pills, capsules */
}
```

### Examples of nesting

```css
.panel { border-radius: 28px; padding: 14px; }
.panel .card { border-radius: 14px; }   /* 28 - 14 = 14 */

.toolbar { border-radius: 22px; padding: 8px; }
.toolbar .btn { border-radius: 14px; }  /* 22 - 8 = 14 */
```

Floating bars and modals are MORE rounded than before — typical card is now **22px** (was 14px in old iOS).

---

## 4. Floating Geometry

Liquid Glass UI is **floating, not edge-to-edge**. Bars, tabs, sidebars all have margin from the window edge.

```css
.tab-bar-floating {
  position: fixed;
  bottom: 16px; left: 16px; right: 16px;
  height: 64px;
  background: var(--glass-thin);
  backdrop-filter: var(--blur-thin);
  border-radius: 32px;          /* full pill */
  box-shadow: var(--glass-edge), 0 12px 40px rgba(0, 0, 0, 0.12);
  padding: 6px;
  display: flex; gap: 4px;
}

.toolbar-floating {
  position: sticky; top: 16px;
  margin: 0 16px;
  background: var(--glass-thin);
  backdrop-filter: var(--blur-thin);
  border-radius: 22px;
  padding: 8px 14px;
  box-shadow: var(--glass-edge), 0 8px 24px rgba(0, 0, 0, 0.08);
}
```

Old style: bars were full-width, edge-to-edge, with bottom border.
New style: bars float with margin, full pill or rounded rectangle, with shadow.

---

## 5. Typography

Apple's font stack is unchanged — SF Pro, with system fallbacks.

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
             "Inter", "Segoe UI", system-ui, sans-serif;
```

### Type scale (HIG 2026 — slightly tighter)

```
Large Title  34px / 41 line / Bold      -0.4 tracking
Title 1      28px / 34 line / Bold      -0.3 tracking
Title 2      22px / 28 line / Bold      -0.2 tracking
Title 3      20px / 25 line / SemiBold  -0.2 tracking
Headline     17px / 22 line / SemiBold   0   tracking
Body         17px / 22 line / Regular    0   tracking
Callout      16px / 21 line / Regular    0   tracking
Subhead      15px / 20 line / Regular    0   tracking
Footnote     13px / 18 line / Regular    0   tracking
Caption 1    12px / 16 line / Regular    0   tracking
Caption 2    11px / 13 line / Medium     0.06 tracking  /* labels on glass */
```

### Body smoothing

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

### Numbers

```css
.numeric { font-variant-numeric: tabular-nums; }
```

### Text on glass — use slightly heavier weight

Body text on glass surfaces should bump to **Medium (500)** instead of Regular (400) for better legibility against blurred backgrounds.

```css
.glass .body-text { font-weight: 500; }
```

---

## 6. Shadows & Depth

In Liquid Glass, depth comes from:
1. The **specular top edge** (highlight)
2. **Soft drop shadow** (the float)
3. **Translucent fill** showing content beneath

```css
:root {
  /* Glass float — moderate drop, no harsh shadow */
  --sh-glass: 0 8px 32px rgba(0, 0, 0, 0.08);

  /* Modal float */
  --sh-modal: 0 24px 64px rgba(0, 0, 0, 0.18),
              inset 0 0.5px 0 rgba(255, 255, 255, 0.7);

  /* Popover */
  --sh-popover: 0 16px 40px rgba(0, 0, 0, 0.14),
                inset 0 0.5px 0 rgba(255, 255, 255, 0.6);

  /* Pressed/tap state — no shadow, just scale */
}
```

### Hairline pattern

Use box-shadow inset for true 0.5px borders:

```css
.hairline    { box-shadow: inset 0 0  0 0.5px rgba(0, 0, 0, 0.10); }
.hairline-b  { box-shadow: inset 0 -0.5px 0 0   rgba(0, 0, 0, 0.10); }
```

---

## 7. Spacing & Layout

8pt grid still applies, with floating chrome inset by 16px from window.

```
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
```

```css
:root {
  --inset: 16px;                /* margin from window edge */
  --toolbar-height: 56px;
  --tab-bar-height: 64px;
  --sidebar-width: 260px;
  --tap-target: 44px;           /* HIG min */
  --page-padding: 24px;
  --section-gap: 24px;
  --card-padding: 20px;
  --max-content: 1280px;
  --sheet-max: 580px;
}
```

---

## 8. Component Patterns

### 8.1 Sidebar (macOS Tahoe)

Floating glass panel, not full-height. Items have rounded **pill** selection state.

```css
.sidebar {
  position: fixed;
  top: var(--inset);
  bottom: var(--inset);
  left: var(--inset);
  width: var(--sidebar-width);
  background: var(--glass-regular);
  backdrop-filter: var(--blur-regular);
  border-radius: 22px;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.08);
  padding: 12px 8px;
  overflow-y: auto;
}

.sidebar-section {
  font-size: 11px;
  font-weight: 600;
  color: var(--label-secondary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 12px 12px 6px;
}

.sidebar-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px;
  margin: 1px 0;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--label-primary);
  cursor: pointer;
  transition: background 0.15s ease;
}
.sidebar-row:hover { background: rgba(0, 0, 0, 0.04); }
.sidebar-row.active {
  background: var(--c-blue);
  color: white;
  box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3);
}
.sidebar-icon { width: 20px; height: 20px; color: var(--c-blue); flex-shrink: 0; }
.sidebar-row.active .sidebar-icon { color: white; }
```

### 8.2 Floating Toolbar

```css
.toolbar {
  position: sticky;
  top: var(--inset);
  margin: 0 var(--inset);
  height: var(--toolbar-height);
  background: var(--glass-thin);
  backdrop-filter: var(--blur-thin);
  border-radius: 22px;
  padding: 8px 12px;
  display: flex; align-items: center; gap: 10px;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 50;
}
```

### 8.3 Floating Tab Bar (iOS 26 mobile)

```css
.tab-bar {
  position: fixed;
  bottom: calc(var(--inset) + env(safe-area-inset-bottom));
  left: var(--inset); right: var(--inset);
  height: var(--tab-bar-height);
  background: var(--glass-thin);
  backdrop-filter: var(--blur-thin);
  border-radius: 32px;          /* full pill */
  padding: 6px;
  display: flex; gap: 4px;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.3),
    0 12px 40px rgba(0, 0, 0, 0.12);
}
.tab-item {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px;
  border-radius: 26px;             /* concentric: 32 - 6 = 26 */
  padding: 6px;
  font-size: 10px;
  font-weight: 500;
  color: var(--label-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-item.active {
  background: var(--c-blue);
  color: white;
}
.tab-item svg { width: 22px; height: 22px; }
```

### 8.4 Buttons (Liquid Glass)

```css
/* Filled — solid system color, white text */
.btn-filled {
  background: var(--c-blue);
  color: white;
  padding: 10px 18px;
  border-radius: 14px;
  font-size: 15px; font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s var(--ease-apple);
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.4),
    0 4px 12px rgba(10, 132, 255, 0.3);
}
.btn-filled:hover { filter: brightness(1.08); }
.btn-filled:active { transform: scale(0.96); }

/* Glass — translucent with tint */
.btn-glass {
  background: var(--glass-thin);
  backdrop-filter: var(--blur-thin);
  color: var(--c-blue);
  padding: 10px 18px;
  border-radius: 14px;
  font-size: 15px; font-weight: 600;
  border: none;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.3);
}

/* Tinted — soft color bg */
.btn-tinted {
  background: var(--c-blue-soft);
  color: var(--c-blue);
  padding: 10px 18px;
  border-radius: 14px;
  font-size: 15px; font-weight: 600;
  border: none;
}

/* Plain — text only */
.btn-plain {
  background: transparent;
  color: var(--c-blue);
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 15px; font-weight: 500;
  border: none;
}
.btn-plain:hover { background: rgba(10, 132, 255, 0.08); }

/* Pill — full radius (Apple Music / Settings primary action) */
.btn-pill {
  border-radius: 9999px;
  padding: 10px 22px;
}
```

### 8.5 List Row

44px tap target, optional icon + chevron.

```css
.list-group {
  background: var(--bg-tertiary);
  border-radius: var(--r-lg);
  overflow: hidden;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.06);
}
.list-row {
  min-height: var(--tap-target);
  padding: 12px 16px;
  display: flex; align-items: center; gap: 12px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: background 0.15s;
}
.list-row:last-child { border-bottom: none; }
.list-row:hover { background: rgba(0, 0, 0, 0.025); }
.list-row-icon {
  width: 28px; height: 28px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
}
.list-row-label { flex: 1; font-size: 16px; }
.list-row-value { color: var(--label-secondary); font-size: 15px; }
.list-row-chevron { color: var(--label-tertiary); }
```

### 8.6 Toggle Switch (Refined 2026)

Slightly bouncier animation, better dark mode contrast.

```css
.toggle {
  appearance: none;
  width: 51px; height: 31px;
  background: rgba(120, 120, 128, 0.32);
  border-radius: 9999px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s var(--ease-apple);
}
.toggle:checked { background: var(--c-green); }
.toggle::before {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 27px; height: 27px;
  background: white;
  border-radius: 50%;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.15),
    0 0 0 0.5px rgba(0, 0, 0, 0.04);
  transition: transform 0.35s var(--ease-spring);
}
.toggle:checked::before { transform: translateX(20px); }
```

### 8.7 Segmented Control

```css
.segmented {
  display: inline-flex;
  background: rgba(120, 120, 128, 0.16);
  border-radius: 11px;
  padding: 2px;
}
.seg-item {
  padding: 6px 14px;
  font-size: 13px; font-weight: 500;
  color: var(--label-primary);
  background: transparent;
  border-radius: 9px;          /* 11 - 2 = 9, concentric */
  border: none; cursor: pointer;
  transition: all 0.2s ease;
}
.seg-item.active {
  background: white;
  box-shadow:
    0 3px 8px rgba(0, 0, 0, 0.12),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.9),
    inset 0 0 0 0.5px rgba(0, 0, 0, 0.04);
}
```

### 8.8 Search Field (Liquid Glass)

```css
.search {
  display: flex; align-items: center; gap: 8px;
  background: rgba(120, 120, 128, 0.16);
  border-radius: 9999px;
  padding: 8px 14px;
  width: 280px;
  transition: all 0.25s var(--ease-apple);
}
.search:focus-within {
  background: white;
  box-shadow:
    inset 0 0 0 0.5px rgba(0, 0, 0, 0.08),
    0 0 0 4px rgba(10, 132, 255, 0.2);
}
.search svg { width: 15px; height: 15px; color: var(--label-secondary); }
.search input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 14px;
  color: var(--label-primary);
}
```

### 8.9 Stat Card (Liquid Glass)

```css
.stat-card {
  background: var(--glass-regular);
  backdrop-filter: var(--blur-regular);
  border-radius: var(--r-lg);
  padding: var(--card-padding);
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.06);
  display: flex; flex-direction: column; gap: 10px;
  transition: transform 0.25s var(--ease-apple);
}
.stat-card:hover { transform: translateY(-2px); }
.stat-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--c-blue-soft);
  color: var(--c-blue);
  display: flex; align-items: center; justify-content: center;
}
.stat-label { font-size: 13px; color: var(--label-secondary); font-weight: 500; }
.stat-value {
  font-size: 30px; font-weight: 700;
  letter-spacing: -0.4px;
  font-variant-numeric: tabular-nums;
}
```

### 8.10 Badge

```css
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px; font-weight: 600;
  background: var(--c-blue-soft);
  color: var(--c-blue);
  letter-spacing: 0.05em;
}
.badge-success { background: var(--c-green-soft); color: var(--c-green); }
.badge-warning { background: var(--c-orange-soft); color: var(--c-orange); }
.badge-error   { background: var(--c-red-soft);    color: var(--c-red); }
.badge-purple  { background: var(--c-purple-soft); color: var(--c-purple); }
```

### 8.11 Sheet Modal (iOS 26)

Deeper blur, more rounded, with sheet-handle.

```css
.sheet-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex; align-items: flex-end; justify-content: center;
  animation: fadeIn 0.3s var(--ease-apple);
}
.sheet {
  background: var(--glass-thick);
  backdrop-filter: var(--blur-thick);
  border-radius: 28px 28px 0 0;
  width: 100%; max-width: var(--sheet-max);
  padding: 12px 20px 24px;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),
    0 -16px 48px rgba(0, 0, 0, 0.18);
  animation: slideUp 0.45s var(--ease-apple);
}
@media (min-width: 640px) {
  .sheet-overlay { align-items: center; padding: 16px; }
  .sheet { border-radius: 28px; }
}
.sheet-handle {
  width: 36px; height: 5px;
  background: var(--c-gray-3, rgba(120,120,128,0.4));
  border-radius: 9999px;
  margin: 0 auto 16px;
}
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0.5; }
  to   { transform: translateY(0); opacity: 1; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

### 8.12 Notification Banner

```css
.banner {
  position: fixed; top: var(--inset); left: 50%;
  transform: translateX(-50%);
  background: var(--glass-thick);
  backdrop-filter: var(--blur-thick);
  border-radius: 18px;
  padding: 12px 18px;
  display: flex; align-items: center; gap: 12px;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.3),
    0 16px 40px rgba(0, 0, 0, 0.14);
  font-size: 14px; font-weight: 500;
  animation: slideDown 0.5s var(--ease-apple);
}
@keyframes slideDown {
  from { transform: translate(-50%, -120%); opacity: 0; }
  to   { transform: translate(-50%, 0); opacity: 1; }
}
```

### 8.13 Avatar

```css
.avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-purple), var(--c-pink));
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600;
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.5);
}
```

### 8.14 Empty State

```css
.empty {
  text-align: center;
  padding: 64px 24px;
}
.empty svg { width: 64px; height: 64px; color: var(--label-tertiary); margin-bottom: 16px; }
.empty-title { font-size: 17px; font-weight: 600; margin-bottom: 6px; }
.empty-desc { font-size: 14px; color: var(--label-secondary); max-width: 320px; margin: 0 auto; }
```

---

## 9. Animations (Apple Spring Physics)

```css
:root {
  --ease-apple:  cubic-bezier(0.16, 1, 0.3, 1);     /* easeOutExpo — most common */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* slight bounce — toggles, sheets */
  --ease-emph:   cubic-bezier(0.32, 0.72, 0, 1);    /* emphasized motion */
}

/* Standard hover */
transition: all 0.2s var(--ease-apple);

/* Sheet, modal, popover entrance */
transition: transform 0.4s var(--ease-apple);

/* Tap feedback */
.btn:active, .card:active { transform: scale(0.96); transition: transform 0.1s ease; }

/* Pulse — live indicator */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(1.4); }
}

/* Shimmer skeleton */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite ease;
  border-radius: 8px;
}
```

---

## 10. Visual Rules

### DO

- **Use Liquid Glass materials** on every floating chrome element (sidebar, toolbar, tab bar, sheet, popover)
- **Add specular top-edge highlight** (`inset 0 0.5px 0 rgba(255,255,255,0.7)`) to every glass surface
- **Float chrome with margin** from window edge (16px inset)
- **Concentric corner radii** — child radius = parent radius − padding
- **Use system colors only** — Blue, Green, Red, Orange, Yellow, Purple, Pink, Teal, Indigo, Mint, Cyan, Brown
- **Set canvas background** with subtle radial gradient so glass has something to refract
- **Bump body text to weight 500** when it sits on glass
- **44px minimum tap target** for any clickable row/button
- **Tabular-nums** for every number column
- **Light + Dark mode parity** with `@media (prefers-color-scheme)`
- **Pill / full-radius capsules** for tab bars, search, primary CTAs

### DON'T

- **Don't use flat solid bars** edge-to-edge — bars float with margin
- **Don't use heavy borders** (>1px) — only hairline 0.5px or `inset 0 0 0 0.5px`
- **Don't use harsh box-shadows** for separation — use translucency + specular
- **Don't put glass on white background** — glass needs canvas with chromatic content
- **Don't skip the specular highlight** — without it, glass looks flat
- **Don't use small radii** (4-6px) anywhere — minimum is 10px, default 14-22px
- **Don't invent colors** off the system palette
- **Don't mix old vibrancy (pre-2025) with Liquid Glass** — pick one
- **Don't forget `-webkit-backdrop-filter`** for Safari support
- **Don't apply backdrop-filter without fallback** — older browsers will look broken

---

## 11. Responsive Behavior

```css
/* Desktop default — macOS Tahoe layout */
.app-shell {
  display: grid;
  grid-template-columns: calc(var(--sidebar-width) + var(--inset) * 2) 1fr;
  min-height: 100vh;
}

/* Tablet — sidebar collapses */
@media (max-width: 1024px) {
  .app-shell { grid-template-columns: 1fr; }
  .sidebar {
    transform: translateX(calc(-100% - var(--inset)));
    transition: transform 0.4s var(--ease-apple);
    z-index: 100;
  }
  .sidebar.open { transform: translateX(0); }
}

/* Mobile — iOS 26 layout with floating tab bar */
@media (max-width: 640px) {
  :root { --inset: 12px; }
  .sidebar { display: none; }
  .tab-bar { display: flex; }
  .toolbar-floating { margin: 12px; }
  .content {
    padding: 0 12px calc(var(--tab-bar-height) + 24px + env(safe-area-inset-bottom));
  }
  .sheet { max-width: 100%; }
}
```

---

## 12. Decision tree: macOS vs iOS

| Aspect | macOS Tahoe | iOS 26 |
|---|---|---|
| Primary nav | Floating sidebar (left) | Floating tab bar (bottom) |
| Modal | Centered sheet w/ glass | Bottom sheet w/ glass |
| Density | Compact, multi-column | Spacious, single-column |
| List | Multi-column table | Stacked rows w/ chevron |
| Toolbar | Floating top, controls | Floating top, minimal |
| Search | Inline pill in toolbar | Pull-down or pill in toolbar |
| Buttons | Pill or rounded rect | Pill (preferred) |

**Default for CRM/dashboard apps:** macOS Tahoe leaning, with iOS sheet modals on mobile breakpoint.

---

## 13. Quick start: minimal HTML scaffold

```html
<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  background:
    radial-gradient(circle at 0% 0%,   rgba(10,132,255,0.18), transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(255,55,95,0.15), transparent 50%),
    #EFEFF4;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
</style>
```

Always seed this body background before adding any glass surfaces.

---

## 14. Philosophy summary (one-liner per concept)

- **Glass floats over canvas** — never edge-to-edge
- **Specular edge** is the visual signature
- **Concentric corners** make nested geometry feel right
- **System colors only** — no off-palette hex
- **Heavy blur (40-60px)** with saturation 180% — not the old soft 20px
- **Hairline borders** (0.5px) instead of solid borders
- **Pill / capsule** is the default shape for chrome
- **Spring physics** for transitions, not linear
- **Tabular numerals** always
- **44px tap target** always
