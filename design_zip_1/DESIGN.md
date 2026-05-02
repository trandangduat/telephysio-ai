---
name: Clinical Vitality
colors:
  surface: '#f5faff'
  surface-dim: '#d1dbe4'
  surface-bright: '#f5faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ebf5fd'
  surface-container: '#e5eff8'
  surface-container-high: '#dfeaf2'
  surface-container-highest: '#dae4ec'
  on-surface: '#131d23'
  on-surface-variant: '#424752'
  inverse-surface: '#283238'
  inverse-on-surface: '#e8f2fb'
  outline: '#727783'
  outline-variant: '#c2c6d4'
  surface-tint: '#005db6'
  primary: '#00478d'
  on-primary: '#ffffff'
  primary-container: '#005eb8'
  on-primary-container: '#c8daff'
  inverse-primary: '#a9c7ff'
  secondary: '#566067'
  on-secondary: '#ffffff'
  secondary-container: '#dae4ed'
  on-secondary-container: '#5c666d'
  tertiary: '#00541e'
  on-tertiary: '#ffffff'
  tertiary-container: '#006f2b'
  on-tertiary-container: '#7df38e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#00468c'
  secondary-fixed: '#dae4ed'
  secondary-fixed-dim: '#bec8d0'
  on-secondary-fixed: '#131d23'
  on-secondary-fixed-variant: '#3e484f'
  tertiary-fixed: '#85fb96'
  tertiary-fixed-dim: '#69de7c'
  on-tertiary-fixed: '#002108'
  on-tertiary-fixed-variant: '#00531e'
  background: '#f5faff'
  on-background: '#131d23'
  surface-variant: '#dae4ec'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-tablet: 32px
---

## Brand & Style

The brand identity centers on the intersection of professional medical expertise and cutting-edge artificial intelligence. It is designed to evoke a sense of calm, precision, and reliable guidance. The target audience includes patients recovering from injury and healthcare providers who require data-driven insights.

This design system utilizes a **Corporate / Modern** style with a focus on high-utility minimalism. By stripping away unnecessary decorative elements, the UI prioritizes the patient's physical therapy data and AI-guided feedback. The aesthetic is "clinical yet warm," achieved through the use of soft rounded corners and a balanced palette that avoids the harshness of traditional medical software.

## Colors

The palette is anchored by "Medical Blue," a professional and deep hue that signals authority and trust. This is supported by a "Secondary Tint" used for large surface areas and subtle backgrounds to reduce visual fatigue.

"Success Green" is reserved strictly for positive reinforcement, such as completed sets, reaching range-of-motion goals, and overall progress indicators. Grays are neutral and cool-toned to maintain the clinical atmosphere without appearing cold. 

- **Primary:** Deep medical blue for key actions and branding.
- **Secondary:** Soft wash blue for headers and container backgrounds.
- **Success:** Vibrant green for health metrics and achievements.
- **Neutral:** A range of slate grays for text hierarchy and borders.

## Typography

This design system employs a dual-font strategy to balance character with utility. **Manrope** is used for headlines to provide a modern, refined, and approachable personality. Its geometric but open structure ensures that even large titles feel friendly rather than imposing.

**Inter** is utilized for all body copy, labels, and data points. As a highly functional sans-serif, it excels in legibility, especially for medical instructions and numerical exercise data. High x-heights and distinct character shapes ensure that patients can read instructions easily during physical activity.

## Layout & Spacing

The layout follows a **Fluid Grid** model, allowing the interface to adapt seamlessly from mobile devices to tablets used in clinics. A 4px baseline shift ensures a consistent vertical rhythm. 

In mobile views, a 4-column grid is used with 16px margins. On larger tablet views, this expands to an 8 or 12-column grid. Spacing is intentionally generous around interactive elements to prevent accidental taps during motion-heavy physical therapy sessions.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** supplemented by **Ambient Shadows**. Surfaces do not rely on heavy drop shadows; instead, they use a subtle 10-15% opacity blur to indicate interactivity. 

- **Level 0 (Base):** Background color (`#F8FAFC`).
- **Level 1 (Cards):** Surface color (`#FFFFFF`) with a 1px neutral-light border.
- **Level 2 (Active/Floating):** Surface color with a soft, diffused shadow (0px 4px 12px rgba(0, 94, 184, 0.08)) to suggest it can be moved or pressed.

This approach maintains a "flat-plus" clinical look that feels organized and lightweight.

## Shapes

The shape language is defined by **Rounded** corners. This softens the "clinical" feel, making the app appear more accessible and less intimidating. 

Standard components (buttons, input fields) use a 0.5rem (8px) radius. Larger containers, such as feedback cards and exercise video windows, use the `rounded-xl` (1.5rem / 24px) setting to create distinct visual sections. This consistent rounding reinforces a friendly, human-centric approach to healthcare.

## Components

### Buttons
Primary buttons use the Medical Blue background with white text. They should feature a subtle hover state that deepens the blue. Secondary buttons use the wash blue tint with primary blue text.

### Cards
Cards are the primary container for exercise data. They should have a white background, soft rounded corners, and a very light gray border. Titles within cards use Manrope Semi-Bold.

### Input Fields
Inputs should be clearly outlined with a 1px border. When focused, the border color shifts to the primary blue with a soft outer glow. Labels always sit above the field in `label-md` Inter.

### Progress Bars
Progress bars utilize a light gray track and a Success Green fill. For AI-specific feedback (like "Form Accuracy"), use a gradient from Primary Blue to Success Green to show the transition from "active" to "correct."

### Navigation
The bottom navigation bar uses clear, stroke-based icons with `label-sm` text. Active states are indicated by the Primary Blue color and a slight weight increase in the icon stroke.

### Logo Guidelines
The logo "TelePhysioAI" should use Manrope Bold. "TelePhysio" should be in the Primary Blue, while "AI" should be emphasized using a slightly thinner weight or a subtle tech-inspired accent, such as a small spark or node icon integrated into the 'A'.