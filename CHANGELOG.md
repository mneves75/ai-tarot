# Changelog

All notable changes to AI Tarot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Premium UI Redesign**: Mercury/Vercel-inspired glass morphism design across all screens
  - Created premium logo component with animated SVG icon (crystal ball + tarot card motif)
  - Brand renamed from "AI Tarot" to "Mystic Tarot" with gradient text styling
  - PageHeader now auto-renders logo when title matches brand name
  - Comprehensive skeleton components including `GlassCardSkeleton`
- **Demo Page Enhancements**: Improved legibility and visual polish
  - Higher contrast glass morphism effects (10-15% opacity vs 5-10%)
  - Better text contrast with white/70 and white/60 opacity levels
  - Added box-shadows and inset highlights for depth
- **Premium Page Designs**: All app screens redesigned with glass morphism
  - Buy Credits (`/buy-credits`): Glass cards with credit info icons
  - Payment Success (`/payment/success`): Centered success card with gradient CTA
  - Profile (`/profile`): Clean glass card layout with premium spacing
  - History (`/history`): Reading list with animated stagger and glass cards
  - Reading Detail (`/history/[id]`): Card grid with glass effects and metadata
- **Premium Landing Page**: Mercury/Vercel-inspired design with Framer Motion animations
  - Full-page scroll container with progress indicator
  - Animated hero section with floating tarot cards
  - Problem, Solution, and Features sections
  - Culturally-optimized copy: Hormozi (en-US) / Ladeira (pt-BR)
  - Dark mode first design with glass morphism effects
- **Settings Page** (`/settings`): User configuration interface
  - Language preference toggle (EN/PT-BR)
  - BYOK (Bring Your Own Key) support for OpenAI and Gemini
  - API key validation with visual feedback
  - 50% credit discount when using personal API keys
- **BYOK Service**: Complete API key management system
  - Secure localStorage storage
  - Key validation against provider APIs
  - Automatic provider selection (Gemini priority)
  - Credit cost calculation with BYOK discount
- **Language Toggle Component**: Visual EN/PT toggle with animation
- **Browser Locale Detection**: Automatic language selection based on browser settings
- Comprehensive BYOK service test suite (30 new tests)
- Design document: `docs/plans/2025-11-25-landing-settings-design.md`

### Changed
- Updated i18n type system to support arrays in translations
- Replaced basic landing page with premium animated version
- Added `landing` and `settings` translation namespaces
- Improved glass morphism CSS with rgba() for better cross-browser opacity control
- Enhanced `PageTitle` component with better text contrast (white/70 subtitle)
- ReadingForm now uses dark bg-black/30 backgrounds for better input visibility
- All form fields updated with focus:border-purple-400 and ring effects

### Dependencies
- Added `framer-motion` for scroll-based animations

### Fixed
- **LLM Integration**: Resolved critical issues preventing tarot readings from completing
  - Downgraded Zod from v4.1.13 to v3.25.76 (AI SDK incompatibility with Zod v4)
  - Updated Gemini model from `gemini-1.5-flash` to `gemini-2.0-flash` (deprecated model)
  - Fixed cost tracking configuration for new model pricing

### Previous
- Comprehensive LLM service test suite (11 new tests)
- Engineering spec documenting the LLM fix (`DOCS/ENGINEERING-SPEC-LLM-FIX.md`)
- Updated cost per million tokens for `gemini-2.0-flash`: input $0.10, output $0.40

## [0.1.0] - 2025-11-25

### Added
- Initial release with core tarot reading functionality
- AI-powered card interpretations using Gemini (primary) and OpenAI (fallback)
- Support for 1, 3, and 5 card spreads
- Bilingual support (pt-BR, en-US)
- Guest reading quota system
- Credit-based reading system for authenticated users
- Demo page for unauthenticated users
- Supabase Auth integration with RLS
- Audit logging for all reading operations
- Rate limiting protection
