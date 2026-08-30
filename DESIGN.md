# Design System & Visual Foundations

## Design Direction
**Editorial Dark / Bold Minimal Tech**
Inspired by editorial craft and focused technical preparation. High typography hierarchy, deep space contrast, and minimal chrome.

## Palette
- **Background (Canvas)**: `#0F0F23` (Deep Indigo-Black)
- **Foreground (Text)**: `#F8FAFC` (Near-White)
- **Card / Surface**: `#151530`
- **Primary / Accent / CTA**: `#F97316` (Warm Coral-Orange)
- **Secondary**: `#1E1B4B` (Deep Midnight Indigo)
- **Muted**: `#8A8A9E` (Slate Gray)
- **Border**: `rgba(255, 255, 255, 0.06)`

## Typography
- **Heading Font**: `Space Grotesk` (Geometric, confident, technical)
- **Body Font**: `DM Sans` (Clean, legible at small sizes)
- **Code / Mono Font**: `JetBrains Mono` (Monaco code editor & technical metrics)

## Interaction & Anti-Pattern Standards
- **Cursor**: Explicit `cursor-pointer` on all interactive links, buttons, and selects.
- **Focus States**: Accessible `:focus-visible` ring outlines.
- **Transitions**: Smooth 150–200ms ease-out transitions on all hover states.
- **Reduced Motion**: Full support for `prefers-reduced-motion: reduce`.
- **Text Styling**: Solid, high-contrast text rather than decorative clipping.
