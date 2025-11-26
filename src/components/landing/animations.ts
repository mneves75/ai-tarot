/**
 * Shared animation configurations for landing page components.
 * Follows DESIGN-UI-UX-GUIDELINES.md timing specifications.
 *
 * @module components/landing/animations
 */

import type { Variants, Transition } from "framer-motion";

// ============================================================
// DURATION TOKENS
// ============================================================

export const duration = {
  instant: 0.15, // 150ms - micro-interactions
  quick: 0.2, // 200ms - hover states
  normal: 0.3, // 300ms - standard transitions
  slow: 0.5, // 500ms - complex animations
  hero: 0.8, // 800ms - hero entrance
} as const;

// ============================================================
// EASING CURVES
// ============================================================

export const ease = {
  out: [0.16, 1, 0.3, 1] as const, // Smooth deceleration
  inOut: [0.65, 0, 0.35, 1] as const, // Balanced
  spring: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },
  springGentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
  },
} as const;

// ============================================================
// STAGGER DELAYS
// ============================================================

export const stagger = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.15,
} as const;

// ============================================================
// REUSABLE TRANSITIONS
// ============================================================

export const transitions: Record<string, Transition> = {
  fadeIn: {
    duration: duration.normal,
    ease: ease.out,
  },
  slideUp: {
    duration: duration.slow,
    ease: ease.out,
  },
  spring: ease.spring,
  springGentle: ease.springGentle,
} as const;

// ============================================================
// REUSABLE VARIANTS
// ============================================================

/**
 * Fade in from bottom with blur effect.
 * Perfect for hero text and section headings.
 */
export const fadeUpBlur: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: duration.hero,
      ease: ease.out,
    },
  },
};

/**
 * Simple fade in effect.
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.normal,
      ease: ease.out,
    },
  },
};

/**
 * Slide up from below.
 */
export const slideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.slow,
      ease: ease.out,
    },
  },
};

/**
 * Scale in with spring effect.
 * Great for buttons and cards.
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: ease.spring,
  },
};

/**
 * Container variant for staggered children.
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.normal,
      delayChildren: 0.1,
    },
  },
};

/**
 * Item variant for staggered lists.
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: ease.out,
    },
  },
};

// ============================================================
// SCROLL-TRIGGERED VARIANTS
// ============================================================

/**
 * Viewport animation settings.
 * Use with motion components' whileInView prop.
 */
export const viewportSettings = {
  once: true,
  margin: "-100px 0px",
  amount: 0.3,
} as const;

// ============================================================
// HOVER/TAP INTERACTIONS
// ============================================================

export const buttonHover = {
  scale: 1.02,
  transition: { duration: duration.instant },
};

export const buttonTap = {
  scale: 0.98,
};

export const cardHover = {
  y: -4,
  transition: { duration: duration.quick, ease: ease.out },
};

// ============================================================
// REDUCED MOTION FALLBACK
// ============================================================

/**
 * Check if user prefers reduced motion.
 * Use this to conditionally disable animations.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get animation variants with reduced motion fallback.
 * Returns static values if user prefers reduced motion.
 */
export function getAccessibleVariants(variants: Variants): Variants {
  if (prefersReducedMotion()) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
    };
  }
  return variants;
}
