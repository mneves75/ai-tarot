# Landing Page & Settings - Design Document

> **Review Standard**: John Carmack-level code quality. No workarounds. Full implementations only.
>
> **Created**: 2025-11-25
>
> **Status**: Approved for implementation

---

## Executive Summary

This document specifies the implementation of:

1. **Bilingual Landing Page** - Mercury/Vercel aesthetic with full-page scroll animations
2. **Culturally-optimized Copy** - Hormozi (en-US) / Ladeira (pt-BR) persuasion styles
3. **Settings Page with BYOK** - User-managed API keys with 50% credit discount
4. **Language Toggle** - Seamless locale switching with localStorage persistence

---

## Design Decisions (Validated)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Full-page scroll container | Coordinated Apple-style animations, premium feel |
| **Copy Strategy** | Hormozi (en-US) + Ladeira (pt-BR) | Culturally optimized for each market |
| **BYOK Credit Model** | 50% discount when using own key | Maintains monetization while rewarding BYOK users |
| **Animation Library** | Framer Motion | Best React animation lib, scroll-based APIs |
| **Design System** | Mercury + Vercel + Glass Morphism | Dark-first, generous whitespace, premium polish |

---

## Technical Architecture

### File Structure

```
src/
├── app/
│   ├── page.tsx                    # MODIFY: Replace with LandingPage
│   ├── settings/
│   │   └── page.tsx                # CREATE: Settings page
│   └── layout.tsx                  # MODIFY: Add browser locale detection
├── components/
│   ├── landing/
│   │   ├── index.ts                # CREATE: Barrel export
│   │   ├── scroll-container.tsx    # CREATE: Main scroll orchestrator
│   │   ├── nav-bar.tsx             # CREATE: Sticky nav with locale toggle
│   │   ├── hero-section.tsx        # CREATE: Animated hero with floating cards
│   │   ├── problem-section.tsx     # CREATE: Pain points narrative
│   │   ├── solution-section.tsx    # CREATE: Product reveal
│   │   ├── features-section.tsx    # CREATE: 3 animated feature cards
│   │   ├── social-section.tsx      # CREATE: Trust signals
│   │   └── cta-section.tsx         # CREATE: Final conversion
│   ├── settings/
│   │   ├── index.ts                # CREATE: Barrel export
│   │   ├── settings-form.tsx       # CREATE: Main form wrapper
│   │   ├── api-key-input.tsx       # CREATE: Secure input with mask/reveal
│   │   └── key-validator.tsx       # CREATE: Connection test logic
│   └── ui/
│       └── language-toggle.tsx     # CREATE: Visual toggle component
├── lib/
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── en-US.ts            # MODIFY: Add landing namespace (Hormozi)
│   │   │   └── pt-BR.ts            # MODIFY: Add landing namespace (Ladeira)
│   │   └── context.tsx             # MODIFY: Add browser detection
│   └── services/
│       └── byok.ts                 # CREATE: BYOK key management service
```

### Dependencies

```bash
# Single new dependency
pnpm add framer-motion
```

---

## Design System Tokens

### Color Palette (Dark Mode First)

```css
/* Mercury-inspired dark palette with purple tarot accent */
--background: hsl(240 10% 4%);           /* Near black */
--foreground: hsl(0 0% 98%);             /* Off-white */
--muted: hsl(240 5% 15%);                /* Dark gray */
--muted-foreground: hsl(240 5% 65%);     /* Muted text */
--accent: hsl(270 95% 65%);              /* Electric purple */
--accent-foreground: hsl(0 0% 100%);     /* White on accent */

/* Glass morphism */
--glass-bg: rgba(255, 255, 255, 0.03);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-hover: rgba(255, 255, 255, 0.06);
```

### Animation Tokens (Framer Motion)

```typescript
// Consistent animation config across all components
export const animations = {
  // Durations (match DESIGN-UI-UX-GUIDELINES.md)
  duration: {
    instant: 0.15,   // 150ms - micro-interactions
    quick: 0.2,      // 200ms - hover states
    normal: 0.3,     // 300ms - standard transitions
    slow: 0.5,       // 500ms - complex animations
    hero: 0.8,       // 800ms - hero entrance
  },

  // Easing curves
  ease: {
    out: [0.16, 1, 0.3, 1],        // Smooth deceleration
    inOut: [0.65, 0, 0.35, 1],     // Balanced
    spring: { type: "spring", stiffness: 300, damping: 30 },
  },

  // Stagger timing for lists
  stagger: {
    fast: 0.05,
    normal: 0.1,
    slow: 0.15,
  },
} as const;
```

### Typography Scale

```css
/* Fluid type scale (clamp for responsiveness) */
--text-display: clamp(3rem, 6vw + 1rem, 5rem);      /* Hero headline */
--text-h1: clamp(2.25rem, 4vw + 0.5rem, 3.5rem);   /* Section titles */
--text-h2: clamp(1.5rem, 3vw + 0.25rem, 2rem);     /* Subsection */
--text-body-lg: clamp(1.125rem, 1.5vw, 1.25rem);   /* Lead paragraph */
--text-body: 1rem;                                  /* Body text */
--text-sm: 0.875rem;                               /* Small text */
```

---

## Component Specifications

### 1. ScrollContainer (scroll-container.tsx)

**Purpose**: Orchestrates scroll-based animations across all landing sections.

```typescript
'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

interface ScrollContainerProps {
  children: ReactNode;
}

export function ScrollContainer({ children }: ScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  // Smooth spring-based progress indicator
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto scroll-smooth snap-y snap-mandatory"
    >
      {/* Progress indicator bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent z-50 origin-left"
        style={{ scaleX }}
      />
      {children}
    </div>
  );
}
```

**Key Features**:
- Uses CSS `scroll-snap` for section snapping
- Spring-animated progress indicator
- Passes scroll context to children via React Context (if needed)

### 2. NavBar (nav-bar.tsx)

**Purpose**: Sticky navigation with logo, links, locale toggle, and CTA.

```typescript
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/context';
import { LanguageToggle } from '@/components/ui/language-toggle';
import Link from 'next/link';

export function NavBar() {
  const { t } = useTranslation();
  const { scrollY } = useScroll();

  // Fade in background as user scrolls
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)']
  );

  const backdropBlur = useTransform(
    scrollY,
    [0, 100],
    ['blur(0px)', 'blur(12px)']
  );

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 px-6 py-4"
      style={{ backgroundColor, backdropFilter: backdropBlur }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold">
          AI Tarot
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link
            href="/demo"
            className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            {t('landing.cta.tryFree')}
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
```

### 3. HeroSection (hero-section.tsx)

**Purpose**: Above-the-fold impact with animated headline and floating tarot cards.

**Animation Sequence**:
1. Background gradient fades in (0-0.3s)
2. Headline slides up with blur-to-clear (0.2-0.8s)
3. Subheadline fades in (0.4-0.8s)
4. CTA button scales in with spring (0.6-1.0s)
5. Floating cards parallax continuously

**Copy Structure** (per locale):

```typescript
// en-US (Hormozi - Direct Response)
landing: {
  hero: {
    headline: "Get Crystal-Clear Guidance in 60 Seconds",
    subheadline: "AI-powered tarot readings that actually make sense. No fluff. No confusion. Just actionable clarity when you need it most.",
    cta: "Try Free Reading",
    ctaSubtext: "No credit card required",
  },
}

// pt-BR (Ladeira - Storytelling)
landing: {
  hero: {
    headline: "Imagine ter clareza nos momentos que mais importam",
    subheadline: "Existe uma sabedoria milenar esperando para conversar com voce. Atraves da inteligencia artificial, o tarot finalmente fala a sua lingua.",
    cta: "Fazer Leitura Gratis",
    ctaSubtext: "Sem necessidade de cadastro",
  },
}
```

### 4. ProblemSection (problem-section.tsx)

**Purpose**: Agitate pain points to build desire for solution.

**en-US (Hormozi - Cost/Consequence)**:
```typescript
landing: {
  problem: {
    title: "Sound Familiar?",
    points: [
      {
        title: "Analysis Paralysis",
        description: "You've spent hours overthinking decisions that should take minutes. The mental energy drain is real.",
      },
      {
        title: "Generic Advice",
        description: "Every \"guidance\" app gives the same cookie-cutter responses. Nothing actually applies to YOUR situation.",
      },
      {
        title: "Spiritual Skepticism",
        description: "Traditional readings feel vague and mystical. You want insights, not riddles.",
      },
    ],
  },
}
```

**pt-BR (Ladeira - Emotional Narrative)**:
```typescript
landing: {
  problem: {
    title: "Voce ja se sentiu assim?",
    points: [
      {
        title: "Perdido em pensamentos",
        description: "Aquelas noites em que a mente nao para... repassando as mesmas duvidas, buscando respostas que parecem fugir.",
      },
      {
        title: "Desconectado de si mesmo",
        description: "O dia a dia corrido nos afasta do que realmente importa. A intuicao fica abafada pelo barulho.",
      },
      {
        title: "Buscando algo mais profundo",
        description: "Voce sabe que existe algo alem do obvio. Uma sabedoria que pode iluminar o caminho.",
      },
    ],
  },
}
```

### 5. SolutionSection (solution-section.tsx)

**Purpose**: Reveal the product as the answer.

**Animation**: Cards flip/reveal effect, product screenshot fades in with scale.

### 6. FeaturesSection (features-section.tsx)

**Purpose**: Three key benefits with icons and descriptions.

**Features** (same structure, different copy per locale):
1. **Personalized Interpretations** - AI analyzes your specific question
2. **Symbolic Reflection** - Ancient wisdom meets modern clarity
3. **Privacy First** - Your readings are yours alone

### 7. SocialSection (social-section.tsx)

**Purpose**: Trust signals - user count, security badges.

### 8. CTASection (cta-section.tsx)

**Purpose**: Final conversion with strong call-to-action.

**en-US (Hormozi - Urgency + Risk Reversal)**:
```typescript
landing: {
  cta: {
    title: "Ready for Clarity?",
    subtitle: "Your first reading is completely free. No credit card. No commitment. Just answers.",
    button: "Get Your Free Reading Now",
    guarantee: "100% private. Your data never shared.",
  },
}
```

**pt-BR (Ladeira - Invitation + Belonging)**:
```typescript
landing: {
  cta: {
    title: "Pronto para sua jornada?",
    subtitle: "Milhares de pessoas ja descobriram um novo caminho de autoconhecimento. Sua primeira leitura e por nossa conta.",
    button: "Comecar Minha Jornada",
    guarantee: "Sua privacidade e sagrada. Nenhum dado compartilhado.",
  },
}
```

---

## Settings Page Specification

### Route: `/settings`

**Features**:
1. Language preference toggle
2. OpenAI API key input with validation
3. Gemini API key input with validation
4. Preferred provider selection
5. Help links to generate API keys

### BYOK Service (byok.ts)

```typescript
// src/lib/services/byok.ts

const STORAGE_PREFIX = 'ai-tarot:';

export interface ByokConfig {
  openaiKey: string | null;
  geminiKey: string | null;
  preferredProvider: 'openai' | 'gemini' | 'auto';
}

/**
 * Get BYOK configuration from localStorage.
 * Returns null values if not set or localStorage unavailable.
 */
export function getByokConfig(): ByokConfig {
  if (typeof window === 'undefined') {
    return { openaiKey: null, geminiKey: null, preferredProvider: 'auto' };
  }

  try {
    return {
      openaiKey: localStorage.getItem(`${STORAGE_PREFIX}openai-key`),
      geminiKey: localStorage.getItem(`${STORAGE_PREFIX}gemini-key`),
      preferredProvider: (localStorage.getItem(`${STORAGE_PREFIX}preferred-provider`) as ByokConfig['preferredProvider']) || 'auto',
    };
  } catch {
    // localStorage may fail in private mode
    return { openaiKey: null, geminiKey: null, preferredProvider: 'auto' };
  }
}

/**
 * Save BYOK API key to localStorage.
 */
export function saveByokKey(provider: 'openai' | 'gemini', key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${provider}-key`, key);
  } catch {
    // Silent fail - key won't persist
  }
}

/**
 * Remove BYOK API key from localStorage.
 */
export function removeByokKey(provider: 'openai' | 'gemini'): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${provider}-key`);
  } catch {
    // Silent fail
  }
}

/**
 * Check if user has any valid BYOK key configured.
 */
export function hasByokKey(): boolean {
  const config = getByokConfig();
  return !!(config.openaiKey || config.geminiKey);
}

/**
 * Validate an OpenAI API key by making a test request.
 */
export async function validateOpenAIKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Validate a Gemini API key by making a test request.
 */
export async function validateGeminiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${key}`
    );
    return response.ok;
  } catch {
    return false;
  }
}
```

### Credit Discount Integration

In the reading action, check for BYOK and apply discount:

```typescript
// In src/app/actions/reading.ts

import { hasByokKey } from '@/lib/services/byok';

// Credit costs by spread type
const BASE_COSTS = {
  1: 1,  // 1 card = 1 credit
  3: 2,  // 3 cards = 2 credits
  5: 3,  // 5 cards = 3 credits
};

const BYOK_DISCOUNT = 0.5; // 50% off with own key

export async function createReading(input: CreateReadingInput) {
  // ... validation, auth checks ...

  const baseCost = BASE_COSTS[input.spreadType];
  const userHasByok = hasByokKey();
  const finalCost = userHasByok
    ? Math.ceil(baseCost * BYOK_DISCOUNT)
    : baseCost;

  // ... deduct credits, create reading ...
}
```

---

## i18n Updates

### New Translation Keys

Add `landing` namespace to both locale files with the full copy for each section as specified above.

### Browser Locale Detection

Update `I18nProvider` to detect browser language on initial load:

```typescript
// In context.tsx

function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  // Check localStorage first (user preference)
  const stored = localStorage.getItem('locale');
  if (stored && isValidLocale(stored)) return stored;

  // Fall back to browser language
  const browserLang = navigator.language;
  if (browserLang.startsWith('pt')) return 'pt-BR';
  if (browserLang.startsWith('en')) return 'en-US';

  return DEFAULT_LOCALE;
}
```

---

## Accessibility Requirements

Per VERCEL-DESIGN-GUIDELINES.md and WCAG 2.2 AA:

1. **Focus Management**
   - All interactive elements have visible `:focus-visible` rings
   - Tab order follows visual order
   - Skip-to-content link for keyboard users

2. **Motion Preferences**
   - Respect `prefers-reduced-motion`
   - Provide fallback static states for all animations

3. **Color Contrast**
   - Minimum 4.5:1 for text, 3:1 for UI elements
   - Test all text on glass backgrounds

4. **Touch Targets**
   - Minimum 44x44px on mobile
   - Generous padding on buttons

5. **Screen Readers**
   - Semantic HTML structure
   - `aria-live` for dynamic content
   - Proper heading hierarchy

---

## Performance Targets

Per WEB-NEXTJS-GUIDELINES.md:

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP** | < 2.5s | Preload hero image, font subsetting |
| **INP** | < 200ms | Framer Motion GPU-accelerated transforms |
| **CLS** | < 0.1 | Reserved space for dynamic content |
| **Bundle** | < 100kb JS | Code split landing components |

---

## Testing Strategy

### Unit Tests
- `byok.ts` service functions
- Translation key completeness (all sections exist in both locales)
- Animation config consistency

### Integration Tests
- Language toggle persists and updates UI
- BYOK key save/load cycle
- API key validation endpoints

### E2E Tests (Future)
- Full landing page scroll journey
- Settings page form submission
- Credit discount calculation with BYOK

---

## Implementation Order

Execute in this exact sequence for optimal dependency management:

### Phase 1: Foundation (Files 1-4)
1. `pnpm add framer-motion`
2. Create `src/lib/services/byok.ts`
3. Update `src/lib/i18n/locales/en-US.ts` with landing copy
4. Update `src/lib/i18n/locales/pt-BR.ts` with landing copy

### Phase 2: Components (Files 5-12)
5. Create `src/components/ui/language-toggle.tsx`
6. Create `src/components/landing/scroll-container.tsx`
7. Create `src/components/landing/nav-bar.tsx`
8. Create `src/components/landing/hero-section.tsx`
9. Create `src/components/landing/problem-section.tsx`
10. Create `src/components/landing/solution-section.tsx`
11. Create `src/components/landing/features-section.tsx`
12. Create `src/components/landing/cta-section.tsx`

### Phase 3: Settings (Files 13-16)
13. Create `src/components/settings/api-key-input.tsx`
14. Create `src/components/settings/key-validator.tsx`
15. Create `src/components/settings/settings-form.tsx`
16. Create `src/app/settings/page.tsx`

### Phase 4: Integration (Files 17-19)
17. Create `src/components/landing/index.ts` barrel export
18. Replace `src/app/page.tsx` with landing page
19. Update `src/lib/i18n/context.tsx` for browser detection

### Phase 5: Polish & Test (Files 20-22)
20. Add `prefers-reduced-motion` fallbacks
21. Add accessibility attributes
22. Write tests for byok.ts

---

## Success Criteria

- [ ] Landing page loads in < 2.5s LCP
- [ ] All animations respect prefers-reduced-motion
- [ ] Language toggle works without page reload
- [ ] Copy matches specified Hormozi/Ladeira styles
- [ ] BYOK keys persist in localStorage
- [ ] API key validation shows clear success/error states
- [ ] 50% credit discount applies when BYOK active
- [ ] All accessibility requirements met
- [ ] All linting passes (pnpm check)
- [ ] All type checks pass (pnpm typecheck)
- [ ] Tests pass (pnpm test:run)

---

## Approval

This design has been validated through iterative questioning:

1. Architecture: Full-page scroll container
2. Copy: Hormozi (en-US) + Ladeira (pt-BR)
3. BYOK: 50% credit discount model
4. Visual: Mercury/Vercel dark-first aesthetic

Ready for implementation.
