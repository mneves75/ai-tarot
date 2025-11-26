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

### Security
- **CRIT-1: Race Condition in Credit Deduction**: Implemented atomic credit reservation pattern
  - Credits are now reserved atomically BEFORE expensive LLM operations
  - Uses `FOR UPDATE` row-level locks to prevent concurrent overdraft
  - Automatic refund on failure with audit logging
  - Affected files: `reading.ts`, `credits.ts`

- **CRIT-2: Payment Webhook Transaction Integrity**: Fixed non-atomic payment processing
  - Payment record creation and credit addition now wrapped in transaction
  - Payment status updated to "failed" if credit addition fails
  - Added audit logging for credit addition failures

- **CRIT-3: SQL Injection in Credit Query**: Fixed unsafe SQL construction
  - Replaced raw SQL string concatenation with Drizzle query builder
  - `getTotalCreditsPurchased()` now uses parameterized queries
  - Uses `eq()` and `and()` operators for type-safe filtering

- **CRIT-4: Guest Session Cookie Hijacking**: Added HMAC signing for session cookies
  - Guest session IDs now signed with HMAC-SHA256
  - Timing-safe signature verification prevents timing attacks
  - Invalid signatures logged for security monitoring
  - Cookie format: `{sessionId}.{signature}`
  - Requires `GUEST_SESSION_SECRET` env var in production

- **CRIT-5: Open Redirect in Auth Callback**: Added strict path validation
  - Validates redirect paths with allowlist and denylist patterns
  - Blocks protocol-relative URLs (`//evil.com`)
  - Blocks encoded attacks (`%2f%2f`, `%5c`)
  - Sanitizes `x-forwarded-host` header
  - Logs blocked redirect attempts

- **HIGH-3: Missing Welcome Credits Audit Trail**: Added transaction record
  - Welcome credits now recorded in `credit_transactions` table
  - Ensures complete audit trail for all credit movements

- **HIGH-4: Journal Deletion Authorization**: Defense-in-depth verification
  - Journal deletion now verifies reading ownership via JOIN
  - Added audit logging for deletion attempts and successes
  - Prevents potential IDOR vulnerabilities

- **HIGH-7: Credit Balance Floor Constraint**: Prevents negative balances
  - Added `GREATEST(0, ...)` SQL constraint on credit deductions
  - Post-update verification ensures floor constraint
  - Refund operations can still go negative (legitimate business case)

### Changed
- **LLM Provider Order**: Swapped provider priority - OpenAI (gpt-4o-mini) is now the primary provider with Gemini as fallback
  - More reliable structured output generation
  - Better availability during high-traffic periods

### Fixed
- **Card Images Not Displaying**: ReadingResults now uses actual card images from `/public/cards/`
  - Added Next.js Image component for optimized loading
  - Proper fallback to symbols when image unavailable
  - Reversed card rotation support for images
- **Reading Results Legibility**: Complete redesign with dark backgrounds and high contrast
  - Replaced purple gradient glass with solid `bg-gray-900/90` backgrounds
  - Text contrast improved to WCAG AA standard (white/85-90%)
  - Semantic HTML with proper ARIA labels for accessibility
  - Clean visual hierarchy with icon-labeled sections
- **Open Redirect Validation**: Fixed `/.evil.com` bypass (OWASP test case)
  - Now blocks all dot-prefixed path segments, not just `.` and `..`
  - Prevents potential domain spoofing via `/.[domain]` patterns

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
