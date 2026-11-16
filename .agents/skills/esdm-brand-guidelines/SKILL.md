---
name: esdm-brand-guidelines
description: Apply the official Kementerian Energi dan Sumber Daya Mineral (ESDM) visual identity and brand guidelines. Use whenever the user builds, styles, or reviews UI/UX designs, web apps (React, Tailwind CSS, CSS/HTML), Geomap interfaces, presentations, documents, icons, or graphics for Kementerian ESDM, or mentions ESDM brand guidelines, colors, or typography.
---

# ESDM Brand Guidelines

Apply the official visual identity guidelines of Kementerian Energi dan Sumber Daya Mineral (ESDM) consistently across web interfaces, UI/UX components, documents, presentations, and graphic assets.

## When to Use

* Creating or updating web applications, dashboards, or Geomap UI components for Kementerian ESDM
* Generating Tailwind CSS configs, CSS variables, or design tokens for ESDM projects
* Designing presentations, reports, or graphic assets following ESDM visual identity
* Reviewing UI layouts, color contrast, typography hierarchy, or iconography against ESDM standards

## Steps

### 1. Apply the Color Palette

Use the Primary Palette as the foundation for high-contrast, recognizable layouts, and the Secondary Palette as supporting accents. Never allow secondary colors to overpower primary colors.

#### Primary Palette
* **Kuning Energi**: HEX `#FFF500` | RGB `255, 245, 0` | CMYK `5, 0, 92, 0` (Represents energy source and spirit)
* **Hitam Mineral**: HEX `#000000` | RGB `0, 0, 0` | CMYK `0, 0, 0, 100` (Represents resources and strong commitment)

#### Secondary Palette
* **Emas Nusantara**: HEX `#D5B600` | RGB `215, 180, 0` (Print) / `213, 182, 0` (Web) | CMYK `20, 25, 100, 0`
* **Hijau Keberlanjutan**: HEX `#00B473` | RGB `0, 180, 115` | CMYK `80, 0, 75, 0`
* **Abu Tua Semesta**: HEX `#233C5A` | RGB `35, 60, 90` | CMYK `92, 75, 40, 30`
* **Abu Muda Inovasi**: HEX `#E1E6EB` | RGB `225, 230, 235` | CMYK `10, 6, 4, 0`

#### Web Extended Palette (Tints / Opacity Scales)
For web and UI applications only, each of the 6 core colors can be used at **100%**, **80%**, **60%**, and **40%** opacity/tint steps to support hover states, borders, backgrounds, and data visualizations. Do not use these extended tints in print media.

### 2. Enforce Approved Text and Background Combinations

Maintain harmony and legibility by strictly pairing text and background colors according to these approved combinations:

* **On Hitam Mineral (`#000000`) background**: Use Kuning Energi (`#FFF500`), Hijau Keberlanjutan (`#00B473`), or White (`#FFFFFF`) text.
* **On Kuning Energi (`#FFF500`) background**: Use Hitam Mineral (`#000000`) or Abu Tua Semesta (`#233C5A`) text.
* **On Emas Nusantara (`#D5B600`) background**: Use Hitam Mineral (`#000000`) or White (`#FFFFFF`) text.
* **On Hijau Keberlanjutan (`#00B473`) background**: Use Hitam Mineral (`#000000`) or White (`#FFFFFF`) text.
* **On Abu Tua Semesta (`#233C5A`) background**: Use Kuning Energi (`#FFF500`), Hijau Keberlanjutan (`#00B473`), or White (`#FFFFFF`) text.
* **On Abu Muda Inovasi (`#E1E6EB`) background**: Use Hitam Mineral (`#000000`) or Abu Tua Semesta (`#233C5A`) text.

### 3. Configure Typography (`ESDM Sans`)

Use **ESDM Sans** (developed with TokoType) across all platforms. Available weights: Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800). In web environments where local font files are not yet loaded, declare `'ESDM Sans', sans-serif` and provide a clean geometric sans-serif fallback such as `'Plus Jakarta Sans'` or `'Inter'`.

#### Typographic Hierarchy
* **Judul Utama (Main Title)**: SemiBold or Regular, Title Case, 1:1 line-height ratio (e.g., 81pt / 81pt leading, tracking 0).
* **Judul Sekunder (Secondary Title)**: Regular, Title Case, ~1.33 line-height ratio (e.g., 36pt / 48pt leading, tracking 0).
* **Sub Judul (Subtitle)**: Light, Sentence case, ~1.18 line-height ratio (e.g., 27pt / 32pt leading, tracking 0).
* **Teks Isi (Body Copy)**: Regular, Sentence case, ~1.55 line-height ratio (e.g., 18pt / 28pt leading, tracking 0).

### 4. Ready-to-Use CSS & Tailwind Tokens

When scaffolding web projects (e.g., in Antigravity, React, or Tailwind CSS), inject these tokens:

```css
:root {
  /* Primary */
  --esdm-yellow: #FFF500;
  --esdm-black: #000000;
  /* Secondary */
  --esdm-gold: #D5B600;
  --esdm-green: #00B473;
  --esdm-slate-dark: #233C5A;
  --esdm-slate-light: #E1E6EB;
  /* Font */
  --font-esdm: 'ESDM Sans', 'Plus Jakarta Sans', Inter, sans-serif;
}
```

### 5. Apply Iconography and Photography Rules

* **Iconography**: Construct icons using simple geometric shapes, bold uniform stroke weights, sharp clean corners, and high visual clarity. Standard domain motifs include directional arrows, mining pickaxes, oil & gas flames, solar panels, lightning bolts (electricity), hydro droplets, and wind turbines.
* **Photography**: Select high-sharpness photographs with balanced contrast and natural lighting that showcase energy innovation, field professionals in safety gear, renewable infrastructure, and Indonesia's natural resources.

## Gotchas

* **Never use fonts other than ESDM Sans** as the primary typeface.
* **Never use more than 2 font styles/weights** within a single title composition.
* **Never use the Light weight for Main or Secondary Titles** (Light is reserved for Subtitles).
* **Never place more than 2 titles** in a single layout view.
* **Never use justified alignment (`text-align: justify`)** for body text; always use left-aligned text (`text-align: left`) to prevent uneven word spacing.
* **Never apply visual effects** (drop shadows, outlines, gradients, or 3D extrusions) to typography, and avoid overly tight or overly loose line heights.
