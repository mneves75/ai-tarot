# Engineering Spec: Premium UI Redesign - All Screens

**Version**: 1.0
**Date**: 2025-11-25
**Author**: Claude (Opus 4.5)
**Reviewer**: John Carmack Standards

---

## 1. Executive Summary

Apply the premium Mercury/Vercel-inspired glass morphism design with Framer Motion animations consistently across ALL application screens. Currently, only the landing page (`/`) and settings page (`/settings`) use the new design system. All other screens use an older, inconsistent design.

### Current State

| Page | Design System | Animations | i18n | Glass Effects |
|------|---------------|------------|------|---------------|
| `/` (Landing) | ✅ Premium | ✅ Framer Motion | ✅ Full | ✅ Yes |
| `/settings` | ✅ Modern | ❌ None | ✅ Full | ⚠️ Partial |
| `/demo` | ❌ Old slate gradient | ❌ None | ❌ Hardcoded PT | ❌ No |
| `/login` | ❌ Old gray/purple | ❌ None | ❌ Hardcoded PT | ❌ No |
| `/signup` | ❌ Old gray/purple | ❌ None | ❌ Hardcoded PT | ❌ No |
| `/credits` | ❌ Old gray/purple | ❌ None | ❌ Hardcoded PT | ❌ No |
| `/buy-credits` | ❌ Old gray/purple | ❌ None | ❌ Hardcoded PT | ❌ No |
| `/profile` | ❌ Old gray/purple | ❌ None | ❌ Hardcoded PT | ❌ No |
| `/history` | ❌ Old gray/purple | ❌ None | ❌ Hardcoded PT | ❌ No |
| `/history/[id]` | ❌ Old gray/purple | ❌ None | ❌ Hardcoded PT | ❌ No |
| `/payment/success` | ❌ Old gray/purple | ❌ None | ❌ Hardcoded PT | ❌ No |

---

## 2. Fresh Eyes Code Review - Critical Issues

### 2.1. Design Token Inconsistency (CRITICAL)

**Location**: `src/app/globals.css`

**Issues**:
1. No purple/violet brand colors in CSS variables
2. No glass morphism utility classes
3. No animation timing tokens
4. Components hardcode colors like `bg-gray-800/50`, `from-purple-950/30`

**Impact**: Every component reimplements the same colors, making global changes impossible.

**Fix**: Add comprehensive design tokens for glass morphism, brand colors, and animation timings.

### 2.2. Hardcoded Portuguese Text (CRITICAL)

**Locations**:
- `src/app/demo/page.tsx:98-103` - "Bem-vindo ao AI Tarot"
- `src/app/demo/page.tsx:110-117` - Disclaimer text
- `src/components/reading/reading-form.tsx:36-52` - Spread options
- `src/components/reading/reading-form.tsx:74-76` - Error messages
- `src/components/reading/reading-results.tsx:26-33` - Section titles
- `src/app/(auth)/login/page.tsx:31-32` - Login text
- `src/app/credits/page.tsx:29-33` - Credits text

**Impact**: App cannot be properly localized. Violates i18n architecture.

**Fix**: Extract ALL text to translation files, use `useTranslation` hook.

### 2.3. Missing Glass Morphism Components (HIGH)

**Issue**: Landing page creates glass effects inline. No reusable `GlassCard` component.

**Affected Files**:
- Every page that uses `Card` component
- All skeleton loaders use `bg-gray-800/50` instead of glass

**Fix**: Create shared `GlassCard` component with `intensity` variants.

### 2.4. Inconsistent Animation Patterns (HIGH)

**Issue**: `animations.ts` has excellent patterns but only used in landing.

**Affected Files**:
- `src/app/demo/page.tsx` - No entrance animations
- `src/components/reading/reading-form.tsx` - No animations
- `src/components/reading/reading-results.tsx` - No stagger animations on cards
- All auth pages - No transitions

**Fix**: Apply consistent animations to all interactive components.

### 2.5. Missing Reduced Motion Support (MEDIUM)

**Issue**: `prefersReducedMotion()` exists but not used consistently.

**Affected Components**:
- Landing page gradient orbs animate regardless
- No motion wrapper component

**Fix**: Create `MotionProvider` that respects user preferences.

### 2.6. Accessibility Issues (MEDIUM)

**Locations**:
- `src/app/demo/page.tsx:66-72` - Error alert lacks `role="alert"` and `aria-live`
- `src/components/reading/reading-form.tsx:178-187` - Loading button lacks `aria-busy`
- Multiple pages missing skip links

**Fix**: Add ARIA attributes, live regions, and skip navigation.

### 2.7. No Shared Layout Component (MEDIUM)

**Issue**: Each page reimplements header/footer separately.

**Pattern Violations**:
- Demo has its own header
- Credits has inline header
- Settings has separate header implementation
- No consistent nav across authenticated pages

**Fix**: Create `AppLayout` component with consistent glass header.

### 2.8. Skeleton Loaders Inconsistency (LOW)

**Issue**: Each page defines its own skeleton with different styles.

**Affected**:
- `LoginFormSkeleton` in login page
- `BalanceSkeleton`, `HistorySkeleton` in credits page
- Different pulse styles

**Fix**: Create shared `Skeleton` components using design tokens.

### 2.9. Reading Results Card Placeholder (LOW)

**Location**: `src/components/reading/reading-results.tsx:117-129`

**Issue**: Uses emoji as card placeholder. Not premium quality.

**Fix**: Create proper card visual with glass morphism design.

---

## 3. Target Design System

### 3.1. Design Principles

1. **Glass Morphism First**: All cards use backdrop-blur with translucent backgrounds
2. **Dark Mode Primary**: Black backgrounds with purple/violet accents
3. **Consistent Motion**: Framer Motion with reduced motion support
4. **WCAG AA Compliance**: 4.5:1 contrast, 44x44px touch targets
5. **Bilingual UX**: Full i18n with culturally-optimized copy

### 3.2. Color Tokens (oklch)

```css
/* Brand Colors */
--color-brand-primary: oklch(0.58 0.22 292); /* Purple-600 */
--color-brand-secondary: oklch(0.62 0.23 285); /* Violet-600 */
--color-brand-accent: oklch(0.72 0.20 45); /* Amber-500 */

/* Glass Backgrounds */
--glass-light: oklch(1 0 0 / 0.05);
--glass-medium: oklch(1 0 0 / 0.08);
--glass-heavy: oklch(1 0 0 / 0.12);

/* Glass Borders */
--glass-border: oklch(1 0 0 / 0.10);
--glass-border-hover: oklch(1 0 0 / 0.15);
```

### 3.3. Animation Tokens

```css
--duration-instant: 150ms;
--duration-quick: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-hero: 800ms;

--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### 3.4. Component Library Additions

| Component | Purpose |
|-----------|---------|
| `GlassCard` | Unified card with backdrop-blur and intensity variants |
| `GlassInput` | Input with glass styling |
| `PageHeader` | Consistent sticky glass header |
| `PageContainer` | Consistent page wrapper with gradient background |
| `AnimatedSection` | Wrapper for scroll-triggered animations |
| `Skeleton` | Standardized loading placeholders |
| `FormButton` | Button with loading state and animations |

---

## 4. Execution Plan - Phased Approach

### Phase 1: Foundation (Design Tokens & Shared Components)

**Priority**: CRITICAL
**Estimated Changes**: ~15 files

#### 1.1. Update globals.css with design tokens
- Add glass morphism CSS variables
- Add brand color tokens
- Add animation timing tokens
- Add glass utility classes

#### 1.2. Create shared GlassCard component
- Light/medium/heavy intensity variants
- Hover states with scale and glow
- Reduced motion support

#### 1.3. Create PageContainer component
- Gradient background
- Animated orbs (optional)
- Min-height screen

#### 1.4. Create PageHeader component
- Sticky glass header
- Back button support
- Title/subtitle slots
- Language toggle slot

#### 1.5. Add i18n translations for ALL pages
- demo namespace
- auth namespace (login, signup)
- credits namespace
- profile namespace
- history namespace
- payment namespace
- common namespace (shared strings)

#### 1.6. Create AnimatedSection wrapper
- Uses Framer Motion whileInView
- Respects reduced motion
- Configurable variants

### Phase 2: Demo Page Redesign (High Priority)

**Priority**: HIGH
**Estimated Changes**: ~8 files

#### 2.1. Redesign demo/page.tsx
- Use PageContainer and PageHeader
- Add entrance animations
- Add animated gradient background
- Implement full i18n

#### 2.2. Redesign ReadingForm component
- GlassCard styling
- Animated submit button
- Glass input styling
- Full i18n support
- Improved loading state

#### 2.3. Redesign ReadingResults component
- Animated card reveal (stagger)
- Glass card styling for sections
- Premium card display (no emoji)
- Full i18n support

#### 2.4. Add proper error states
- Glass card error display
- ARIA live regions
- Retry functionality

### Phase 3: Authentication Pages

**Priority**: HIGH
**Estimated Changes**: ~6 files

#### 3.1. Redesign login page
- Glass form card
- Animated entrance
- Full i18n
- Floating decorative elements

#### 3.2. Redesign signup page
- Glass form card
- Animated entrance
- Full i18n
- Welcome credits highlight

#### 3.3. Update auth form components
- GlassCard styling
- Form animations
- Loading states
- Error handling improvements

### Phase 4: Credits & Payment Pages

**Priority**: MEDIUM
**Estimated Changes**: ~8 files

#### 4.1. Redesign credits page
- Glass balance cards with AnimatedNumber
- Transaction history with stagger animation
- Full i18n support

#### 4.2. Redesign buy-credits page
- Glass package cards
- Hover animations
- Popular/best value badges with glow
- Full i18n

#### 4.3. Redesign payment success page
- Celebration animation
- Glass card with checkmark
- Credit display with animation

#### 4.4. Update credit components
- CreditsBalance with glass
- TransactionHistory with glass rows
- CreditPackageCard with hover effects

### Phase 5: Profile & History Pages

**Priority**: MEDIUM
**Estimated Changes**: ~8 files

#### 5.1. Redesign profile page
- Glass sections
- Animated form
- Full i18n

#### 5.2. Redesign history page
- Glass reading cards
- Stagger animation on list
- Empty state design
- Full i18n

#### 5.3. Redesign history/[id] page
- Premium reading display
- Glass card presentation
- Journal section with glass
- Full i18n

#### 5.4. Update profile/journal components
- GlassCard styling
- Form animations
- Loading states

### Phase 6: Polish & Testing

**Priority**: MEDIUM
**Estimated Changes**: ~5 files

#### 6.1. Add page transitions
- Route change animations
- Loading states between pages

#### 6.2. Update error pages
- error.tsx with glass design
- not-found.tsx with glass design

#### 6.3. Accessibility audit
- Add skip links
- Verify ARIA labels
- Test with screen reader
- Verify color contrast

#### 6.4. Performance optimization
- Lazy load Framer Motion
- Reduce blur elements
- Test Core Web Vitals

#### 6.5. Create comprehensive tests
- Component visual tests
- Animation tests
- i18n coverage tests

---

## 5. File Change Summary

### New Files to Create

```
src/components/ui/glass-card.tsx
src/components/ui/page-container.tsx
src/components/ui/page-header.tsx
src/components/ui/animated-section.tsx
src/components/ui/skeleton.tsx
src/components/ui/glass-input.tsx
src/components/ui/form-button.tsx
src/lib/i18n/locales/en-US.ts (extend)
src/lib/i18n/locales/pt-BR.ts (extend)
```

### Files to Modify

```
src/app/globals.css
src/app/demo/page.tsx
src/app/(auth)/login/page.tsx
src/app/(auth)/signup/page.tsx
src/app/credits/page.tsx
src/app/buy-credits/page.tsx
src/app/profile/page.tsx
src/app/history/page.tsx
src/app/history/[id]/page.tsx
src/app/payment/success/page.tsx
src/app/error.tsx
src/app/not-found.tsx
src/components/reading/reading-form.tsx
src/components/reading/reading-results.tsx
src/components/auth/login-form.tsx
src/components/auth/signup-form.tsx
src/components/credits/credits-balance.tsx
src/components/credits/transaction-history.tsx
src/components/payment/credit-package-card.tsx
src/components/profile/user-info.tsx
src/components/profile/profile-form.tsx
src/components/journal/reading-journal.tsx
```

---

## 6. Success Criteria

1. **Visual Consistency**: All pages use the same glass morphism design system
2. **Animation Consistency**: Framer Motion animations on all interactive elements
3. **Full i18n**: No hardcoded text, all strings from translation files
4. **Accessibility**: WCAG AA compliance, proper ARIA attributes
5. **Performance**: LCP < 2.5s, INP < 200ms, CLS < 0.1
6. **Reduced Motion**: All animations respect user preferences
7. **Tests Pass**: All existing tests pass, new tests for animations

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Medium | High | Run tests after each file change |
| Performance degradation from animations | Medium | Medium | Limit concurrent animations, use GPU-accelerated properties |
| Accessibility regression | Low | High | Test with screen reader, verify contrast |
| Bundle size increase | Medium | Low | Lazy load motion components |

---

## 8. Implementation Checklist

### Phase 1: Foundation
- [ ] 1.1. Update globals.css with design tokens
- [ ] 1.2. Create GlassCard component
- [ ] 1.3. Create PageContainer component
- [ ] 1.4. Create PageHeader component
- [ ] 1.5. Add i18n translations (all namespaces)
- [ ] 1.6. Create AnimatedSection wrapper
- [ ] 1.7. Create Skeleton components
- [ ] 1.8. Run tests, fix any failures

### Phase 2: Demo Page
- [ ] 2.1. Redesign demo/page.tsx
- [ ] 2.2. Redesign ReadingForm component
- [ ] 2.3. Redesign ReadingResults component
- [ ] 2.4. Add proper error states
- [ ] 2.5. Verify demo page works end-to-end
- [ ] 2.6. Run tests, fix any failures

### Phase 3: Authentication
- [ ] 3.1. Redesign login page
- [ ] 3.2. Redesign signup page
- [ ] 3.3. Update auth form components
- [ ] 3.4. Test auth flow end-to-end
- [ ] 3.5. Run tests, fix any failures

### Phase 4: Credits & Payment
- [ ] 4.1. Redesign credits page
- [ ] 4.2. Redesign buy-credits page
- [ ] 4.3. Redesign payment success page
- [ ] 4.4. Update credit components
- [ ] 4.5. Run tests, fix any failures

### Phase 5: Profile & History
- [ ] 5.1. Redesign profile page
- [ ] 5.2. Redesign history page
- [ ] 5.3. Redesign history/[id] page
- [ ] 5.4. Update profile/journal components
- [ ] 5.5. Run tests, fix any failures

### Phase 6: Polish
- [ ] 6.1. Update error pages
- [ ] 6.2. Accessibility audit
- [ ] 6.3. Performance optimization
- [ ] 6.4. Final test suite run
- [ ] 6.5. Visual review all screens

---

**Document Status**: READY FOR EXECUTION
**Next Step**: Begin Phase 1 - Foundation
