# Design System Specification: Prestige Sovereign Recruit (iPrince Recruiting)

> **Agent Context & Implementation Guide**  
> This specification documents the complete visual language, token architecture, typography hierarchy, component patterns, interaction states, and accessibility standards for **iPrince Recruiting (iPrince Personalvermittlung)**. Use this document as the single source of truth when generating or modifying any UI screens, components, or application shells across the platform.

---

## 1. Brand Identity & Design Principles

### Brand Positioning
- **Name:** iPrince Recruiting / iPrince Personalvermittlung
- **Domain:** Ethical international healthcare & specialist recruitment connecting global nursing talents with German hospitals, university clinics, and care institutions.
- **Tone & Mood:** Authoritative, institutional, legally compliant (FEG § 81a / WHO Code), trustworthy, premium German medical standards, modern sovereign prestige.
- **Core Archetype:** "The Sovereign Bridge" — eliminating risk for German clinic boards while empowering international healthcare professionals with transparent, zero-fee career placement.

### Core Principles
1. **Sovereign Trust & German Precision:** Navy and gold convey institutional weight, stability, and governmental compliance without feeling bureaucratic.
2. **Dual-Door Clarity:** Immediate visual disambiguation between the two core audiences:
   - **Job Seekers / International Nurses (`Pflegekräfte`):** Warm, supportive, zero-fee reassurance, step-by-step guidance.
   - **Employers (`Kliniken, Träger & Pflegeheime`):** Fast-track legal guarantee, audit-ready qualification vetting, executive concierge feel.
3. **Information Density with Breathable Rhythm:** Clean 8px spacing grid, elevated container surfaces, structured metadata chips, and clear hierarchy for complex multi-step forms and vacancy listings.
4. **GDPR & Legal Prominence:** Prominent visual reassurance (256-bit SSL, Frankfurt server hosting, § 299 SGB III certification, § 81a fast-track workflow badges).

---

## 2. Color System & Design Tokens

### 2.1 Palette Overview

| Token Name | Hex Value | Role & Usage | Contrast Ratio |
|---|---|---|---|
| `navy-primary` | `#0B192C` | Brand anchor, main headers, hero backgrounds, primary text, buttons | 14.8:1 on light |
| `navy-dark` | `#060E18` | Deep header bar, high-contrast footers, dark cards | 18.2:1 on light |
| `navy-subtle` | `#1E293B` | Secondary headers, muted dark badges, subheadings | 10.5:1 on light |
| `gold-primary` | `#D4AF37` | Primary accent, primary CTAs, active highlights, key metrics | 3.5:1 on dark (large text/buttons) |
| `gold-hover` | `#C59B27` | Hover & active state for gold CTAs and icons | Interactive state |
| `gold-light` | `#FBF5E6` | Subtle gold tint for banner highlights, warning notes, notice boxes | Neutral surface |
| `gold-border` | `#E8D595` | Border highlight on featured cards or premium badges | 1px stroke |
| `surface-ground` | `#F8FAFC` | Global page background, outer padding areas | Base canvas |
| `surface-card` | `#FFFFFF` | Form cards, job cards, white elevation containers | High elevation |
| `surface-inset` | `#F1F5F9` | Input field background, nested metric cards, code/table blocks | 0dp elevation |
| `text-primary` | `#0F172A` | Core body text, table data, form labels | AAA contrast |
| `text-muted` | `#64748B` | Helper text, secondary descriptions, metadata tags | AA contrast |
| `border-subtle` | `#E2E8F0` | Default card borders, divider lines, form field borders | 1px solid |
| `success-green` | `#10B981` | WhatsApp integrations, verified checkmarks, status pill (Active) | High visibility |
| `success-light` | `#ECFDF5` | Green badge background (e.g., "100% Kostenlos", "Visa 100%") | Badge surface |
| `error-red` | `#EF4444` | Form validation errors, required indicator asterisks (`*`) | High alert |

### 2.2 CSS Variables / Tailwind Token Mapping

```css
:root {
  /* Brand Foundations */
  --color-primary-navy: #0B192C;
  --color-primary-navy-dark: #060E18;
  --color-primary-gold: #D4AF37;
  --color-primary-gold-hover: #C59B27;
  --color-gold-surface: #FBF5E6;
  --color-gold-border: #E8D595;

  /* Neutrals & Surfaces */
  --bg-app: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-surface-subtle: #F1F5F9;
  --bg-surface-elevated: #FFFFFF;

  /* Typography Colors */
  --text-main: #0F172A;
  --text-secondary: #475569;
  --text-muted: #64748B;
  --text-inverse: #FFFFFF;
  --text-gold: #D4AF37;

  /* Borders & Dividers */
  --border-light: #E2E8F0;
  --border-focus: #0B192C;
  --border-gold: #D4AF37;

  /* Feedback & Status */
  --status-success: #10B981;
  --status-success-bg: #ECFDF5;
  --status-error: #EF4444;
  --status-warning: #F59E0B;
}
```

---

## 3. Typography System

### 3.1 Font Family
- **Primary Font:** `'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Characteristics:** Clean, contemporary geometric sans with high x-height, open apertures, and crisp readability in technical medical terminology and dense German compound words.

### 3.2 Typographic Hierarchy Scale

| Level | Size (px/rem) | Weight | Line Height | Tracking | Application |
|---|---|---|---|---|---|
| **Display / H1** | `44px – 52px` (3.25rem) | Bold (700/800) | `1.15` | `-0.025em` | Hero titles, landing page main statements |
| **H2 Section** | `32px – 36px` (2.25rem) | Bold (700) | `1.25` | `-0.02em` | Major page section headings, portal titles |
| **H3 Card** | `20px – 24px` (1.5rem) | SemiBold (600) | `1.3` | `-0.01em` | Job titles, step cards, form section headers |
| **H4 Subsection**| `16px – 18px` (1.125rem)| SemiBold (600) | `1.4` | `0` | Form subsection headers, sidebar widget titles |
| **Body Large** | `16px` (1.0rem) | Regular (400) / Med (500) | `1.6` | `0` | Lead paragraphs, introductory hero copy |
| **Body Normal**| `14px` (0.875rem) | Regular (400) / Med (500) | `1.5` | `0` | Default body text, form field labels, bullet copy |
| **Body Small** | `12px – 13px` (0.8125rem)| Regular (400) / Med (500)| `1.4` | `+0.01em` | Metadata chips, helper text, badges, timestamps |
| **Micro / Legal**| `10px – 11px` (0.6875rem)| SemiBold (600) | `1.3` | `+0.05em` | Caps legal tags, § 81a markers, sub-labels |

---

## 4. Spacing, Elevation & Layout Grid

### 4.1 Spacing Scale (8px Grid)
- **4px (`p-1`, `gap-1`):** Micro offsets, inline badge padding.
- **8px (`p-2`, `gap-2`):** Pill paddings, compact metadata lists.
- **12px (`p-3`, `gap-3`):** Input field internal padding, dropdown items.
- **16px (`p-4`, `gap-4`):** Card inner padding (mobile), standard gaps.
- **24px (`p-6`, `gap-6`):** Standard desktop card containers, form sections.
- **32px (`p-8`, `gap-8`):** Section vertical spacing, split grid columns.
- **48px – 64px (`py-12` – `py-16`):** Major homepage section block padding.

### 4.2 Elevation & Shadows
- **Card Shadow (Subtle):** `0 1px 3px 0 rgba(11, 25, 44, 0.05), 0 1px 2px -1px rgba(11, 25, 44, 0.05)`
- **Hover / Interactive Elevation:** `0 10px 25px -5px rgba(11, 25, 44, 0.08), 0 8px 10px -6px rgba(11, 25, 44, 0.04)`
- **Floating Bar / WhatsApp / Modal:** `0 20px 25px -5px rgba(11, 25, 44, 0.15), 0 8px 10px -6px rgba(11, 25, 44, 0.1)`

### 4.3 Corner Radii (Roundness: `ROUND_EIGHT`)
- Standard Container: `rounded-xl` (`12px`) or `rounded-2xl` (`16px`)
- Input Fields & Buttons: `rounded-lg` (`8px`)
- Badges & Pills: `rounded-full` (`9999px`)
- Inner nested cards: `rounded-lg` (`8px`)

---

## 5. Component Library & Implementation Standards

### 5.1 Navigation Header (App Shell)
- **Top Utility Strip:** Dark navy `#060E18`, featuring compliance notes (*"§ 299 SGB III ZUGELASSEN"*, *"100% KOSTENLOS FÜR BEWERBER"*), phone hotline, and language toggle (`DE | EN`).
- **Main Navigation Bar:** Navy `#0B192C` or clean White `#FFFFFF` with sticky glass blur.
  - **Left:** Brand logo with gold crown emblem & dual-line wordmark.
  - **Center:** Navigation items:
    - *Für Fachkräfte* (Dropdown: Jobs, Anerkennung, Sprachförderung)
    - *Für Arbeitgeber* (Dropdown: Personal anfordern, Ablauf, Referenzen)
    - *Stellenangebote* (Direct link to `/jobs`)
    - *Über uns*, *FAQ*, *Kontakt*
  - **Right Actions:**
    - Language switcher pill (`DE` active / `EN` inactive).
    - Outline button: *"Erstberatung buchen"*
    - Solid Gold button: *"Jetzt bewerben"* (or *"Personal anfragen"*)

### 5.2 Buttons & Call-to-Actions (CTAs)

#### Primary Gold Button
- **Default State:** Background `#D4AF37`, Text `#0B192C` (bold), Border none, `rounded-lg`, `px-6 py-3.5`, font-weight `600` / `700`.
- **Hover State:** Background `#C59B27`, subtle shadow lift, smooth `150ms ease-in-out`.
- **Icon Attachment:** Trailing right arrow `→` or leading SVG icon.

#### Secondary Navy Button
- **Default State:** Background `#0B192C`, Text `#FFFFFF`, `rounded-lg`, `px-6 py-3.5`.
- **Hover State:** Background `#1E293B`.

#### Ghost / Outline Button
- **Default State:** Transparent, Border `1.5px solid #0B192C` (or `#D4AF37` on dark), Text `#0B192C`.
- **Hover State:** Background `rgba(11, 25, 44, 0.05)`.

#### Direct WhatsApp Button (Floating & Embedded)
- **Styling:** Emerald green `#10B981`, white icon, white bold text (*"WhatsApp Express"* or *"WhatsApp-Sprechstunde"*).
- **Positioning:** Floating bottom-right (`fixed bottom-6 right-6 z-50`) with pulsing subtle shadow.

---

### 5.3 Form Architecture (Applicant & Employer Portals)

All forms adhere to structured, step-indexed group cards:

```html
<!-- Form Section Group Pattern -->
<div class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8">
  <div class="flex items-center gap-4 mb-6">
    <span class="w-9 h-9 rounded-lg bg-[#0B192C] text-[#D4AF37] font-bold flex items-center justify-center text-sm">
      01
    </span>
    <div>
      <h3 class="text-xl font-bold text-[#0B192C]">Section Title (e.g., Persönliche Angaben)</h3>
      <p class="text-xs text-slate-500">Brief subtitle or legal compliance note</p>
    </div>
  </div>
  <!-- Inputs Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <!-- Form Controls -->
  </div>
</div>
```

#### Form Controls Guidelines:
- **Input Fields:** Background `#F8FAFC`, Border `1px solid #CBD5E1`, Text `#0F172A`, placeholder `#94A3B8`, focus ring `2px solid #0B192C`.
- **Required Indicators:** Coral/Red asterisk `<span class="text-red-500">*</span>`.
- **Select Dropdowns:** Standardized caret icon, clear defaults (*"Bitte wählen..."*).
- **Multi-select Badges / Checkboxes:** Pill cards with active state highlight (Navy background or border highlight).
- **Document Dropzone:**
  - Dashed border `2px dashed #CBD5E1` on `#F8FAFC` background.
  - Centered upload cloud icon, file type limit badge (*PDF, DOCX max 25MB*), encrypted notice (*"256-Bit SSL Verschlüsselt"*).

---

### 5.4 Job Cards & Search Result Item Pattern
- **Top Bar:** Reference ID badge (e.g., `REF: IP-2024-GER-082`), posted timestamp, fast-track badge (*"Fast-Track Visum"* or *"Defizitausgleich im Haus"*).
- **Heading:** High-contrast medical title (e.g., *Pflegefachkraft (m/w/d) – Allgemeine Chirurgie & Orthopädie*).
- **Institution & Location:** Clinic name, federal state badge (e.g., *Köln, Nordrhein-Westfalen*).
- **Compensation Highlight:** Large Navy text (e.g., `3.800 € – 4.750 € / Monat`) with shift premium callout (*+ Zeitzuschläge*).
- **Metadata Pills:**
  - `B2 Pflege anerkannt` (Blue-tint pill)
  - `Klinikwohnung 6 Monate garantiert` (Gold-tint pill)
  - `2.500 € Relocation-Prämie` (Green-tint pill)
- **Recruiter Avatar:** Recruiter headshot thumbnail, recruiter name, and direct dual CTA: *"Details anzeigen"* (Ghost) + *"Direkt bewerben"* (Solid Gold).

---

### 5.5 Two-Door Entry Split ("Who Are You?")
- **Container:** Two balanced adjacent cards in a `grid grid-cols-1 lg:grid-cols-2 gap-8`.
- **Door 1 (For Candidates):** Light surface `#FFFFFF`, medical cross icon in soft blue circle, benefit list with blue checkmarks, solid button: *"Explore Candidate Journey →"*.
- **Door 2 (For Employers):** Dark institutional navy `#060E18` or deep container, gold hospital icon, benefit list with gold checkmarks, gold button: *"Request Medical Staff →"*.

---

### 5.6 Footer Standard
- **Background:** High-authority dark navy `#060E18` with subtle top separator `#1E293B`.
- **Columns (4-Column Layout):**
  1. *Brand Column:* Logo, short positioning statement, company headquarters address (Königsallee 42, 40212 Düsseldorf), direct phone, email.
  2. *Für Fachkräfte:* Quick links to specialized tracks (ITS, OP, Geriatrie, B1/B2 Kurse, Schnellbewerbung).
  3. *Für Arbeitgeber:* Personalbedarf anfordern, Vollservice, Fachkräfteeinwanderungsgesetz, Klinik-Referenzen.
  4. *Rechtliches & Compliance:* Impressum (mandatory German notice), Datenschutz (GDPR), AGB, Cookie-Einstellungen, Beschwerdestelle.
- **Sub-footer:** Copyright, international office locations (*Düsseldorf • Manila • Timișoara • Tunis*).

---

## 6. Bilingual & Localization Pattern

- **Primary Languages:** German (`de-DE`, dominant for employer & regulatory content) and English (`en-US`, for international candidate attraction).
- **URL & Routing Standard:** `/de/...` and `/en/...` prefixes.
- **Language Switcher Component:** Header switch with active pill: `[ DE | EN ]`.
- **Microcopy Guidelines:**
  - When rendering German copy, use formal and respectful medical address (*"Sie" / "Ihre Einrichtung"* for employers; encouraging and transparent tone for nurses).
  - Include statutory German terms: *Defizitbescheid*, *Anerkennungsverfahren*, *Kenntnisprüfung*, *Anpassungslehrgang*, *§ 81a AufenthG*.

---

## 7. Compliance & Trust Badges

Always integrate authentic German legal and healthcare compliance indicators across hero strips and form footers:
1. **Zugelassene Personalvermittlung nach § 299 SGB III**
2. **Fachkräfteeinwanderungsgesetz (FEG) & Beschleunigtes Verfahren nach § 81a AufenthG**
3. **100% DSGVO-konforme Datenspeicherung in Frankfurt am Main (256-Bit SSL)**
4. **WHO-Kodex für die grenzüberschreitende Anwerbung & Gütezeichen "Faire Anwerbung Pflege Deutschland"**

---

## 8. Agent Code Checklist (When Generating Screens)

When generating screens or editing HTML for this design system, verify:
- [ ] Font `'Plus Jakarta Sans'` is linked and applied across all elements.
- [ ] Brand Primary Navy `#0B192C` is used for high-emphasis text and hero banners.
- [ ] Accent Gold `#D4AF37` is used for primary interactive buttons and key badges.
- [ ] No generic placeholder text (use authentic German healthcare terms e.g., *ITS-Pflege, B2 Telc, Defizitbescheid, Uniklinik*).
- [ ] Two-door pathways (*Job Seekers* vs. *Employers*) remain distinctly recognizable.
- [ ] Mandatory German legal links (*Impressum, Datenschutz, AGB*) exist in the footer.
- [ ] WhatsApp express advisor CTA is accessible.
- [ ] All forms include GDPR/DSGVO opt-in checkboxes before submission.
