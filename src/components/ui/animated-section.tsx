"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * AnimatedSection Component
 *
 * A wrapper that animates content when it enters the viewport.
 * Automatically respects user's reduced motion preferences.
 *
 * @module components/ui/animated-section
 */

// ============================================================
// ANIMATION VARIANTS
// ============================================================

/**
 * Fade up with blur effect - ideal for headings and hero content.
 */
export const fadeUpBlur: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
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
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * Slide up from below.
 */
export const slideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * Scale in with spring effect.
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

/**
 * Container for staggered children animations.
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Item for staggered lists.
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
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ============================================================
// REDUCED MOTION DETECTION
// ============================================================

/**
 * Hook to detect if user prefers reduced motion.
 * Returns true on SSR to prevent hydration mismatch.
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Get accessible variants that respect reduced motion preference.
 */
function getAccessibleVariants(
  variants: Variants,
  prefersReducedMotion: boolean
): Variants {
  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
    };
  }
  return variants;
}

// ============================================================
// TYPES
// ============================================================

type AnimationVariant =
  | "fadeUpBlur"
  | "fadeIn"
  | "slideUp"
  | "scaleIn"
  | "staggerContainer"
  | "staggerItem"
  | "custom";

interface AnimatedSectionProps {
  /** Content to animate */
  children: ReactNode;
  /** Animation variant to use */
  variant?: AnimationVariant;
  /** Custom variants (when variant="custom") */
  customVariants?: Variants;
  /** Additional className */
  className?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Trigger animation once or every time element enters viewport */
  once?: boolean;
  /** Viewport margin for triggering animation */
  margin?: string;
  /** Amount of element that must be visible to trigger */
  amount?: number | "some" | "all";
  /** HTML element to render */
  as?: "div" | "section" | "article" | "main" | "header" | "footer" | "aside" | "span";
}

// ============================================================
// VARIANT MAP
// ============================================================

const variantMap: Record<Exclude<AnimationVariant, "custom">, Variants> = {
  fadeUpBlur,
  fadeIn,
  slideUp,
  scaleIn,
  staggerContainer,
  staggerItem,
};

// ============================================================
// COMPONENT
// ============================================================

/**
 * AnimatedSection - Viewport-triggered animation wrapper.
 *
 * @example
 * // Basic usage with default fade up
 * <AnimatedSection>
 *   <h2>Section Title</h2>
 * </AnimatedSection>
 *
 * @example
 * // With scale animation
 * <AnimatedSection variant="scaleIn">
 *   <Card>Content</Card>
 * </AnimatedSection>
 *
 * @example
 * // Staggered list items
 * <AnimatedSection variant="staggerContainer">
 *   {items.map(item => (
 *     <AnimatedSection key={item.id} variant="staggerItem">
 *       <Item {...item} />
 *     </AnimatedSection>
 *   ))}
 * </AnimatedSection>
 *
 * @example
 * // With custom delay
 * <AnimatedSection variant="fadeIn" delay={0.3}>
 *   <p>Delayed content</p>
 * </AnimatedSection>
 */
export function AnimatedSection({
  children,
  variant = "slideUp",
  customVariants,
  className,
  delay = 0,
  once = true,
  margin = "-50px",
  amount = 0.2,
  as = "div",
}: AnimatedSectionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Get base variants
  const baseVariants = variant === "custom" ? customVariants : variantMap[variant];

  // Apply accessibility fallback
  const variants = baseVariants
    ? getAccessibleVariants(baseVariants, prefersReducedMotion)
    : fadeIn;

  // Add delay to visible transition if specified
  // Use bracket notation for index signature access
  const visibleVariant = variants["visible"];
  const delayedVariants: Variants = delay > 0
    ? {
        ...variants,
        visible: {
          ...(typeof visibleVariant === "object" ? visibleVariant : {}),
          transition: {
            ...(typeof visibleVariant === "object" && visibleVariant !== null && "transition" in visibleVariant
              ? (visibleVariant as { transition?: object }).transition
              : {}),
            delay,
          },
        },
      }
    : variants;

  // Create motion component for the specified element
  const MotionComponent = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionComponent
      className={cn(className)}
      variants={delayedVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin, amount }}
    >
      {children}
    </MotionComponent>
  );
}

// ============================================================
// ANIMATED LIST COMPONENT
// ============================================================

interface AnimatedListProps {
  /** List items to render */
  children: ReactNode;
  /** Additional className for container */
  className?: string;
  /** Stagger delay between items */
  staggerDelay?: number;
}

/**
 * AnimatedList - Container for staggered list animations.
 *
 * @example
 * <AnimatedList>
 *   {items.map(item => (
 *     <AnimatedListItem key={item.id}>
 *       <Card>{item.name}</Card>
 *     </AnimatedListItem>
 *   ))}
 * </AnimatedList>
 */
export function AnimatedList({
  children,
  className,
  staggerDelay = 0.1,
}: AnimatedListProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const containerVariants: Variants = prefersReducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      };

  return (
    <motion.div
      className={cn(className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  /** Item content */
  children: ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * AnimatedListItem - Individual item in an AnimatedList.
 */
export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const itemVariants: Variants = prefersReducedMotion
    ? { hidden: {}, visible: {} }
    : staggerItem;

  return (
    <motion.div className={cn(className)} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

// ============================================================
// ANIMATED PRESENCE WRAPPER
// ============================================================

interface AnimatedPresenceWrapperProps {
  /** Whether the content should be shown */
  show: boolean;
  /** Content to animate */
  children: ReactNode;
  /** Exit animation mode */
  mode?: "sync" | "wait" | "popLayout";
}

/**
 * AnimatedPresenceWrapper - Wrapper for AnimatePresence with common patterns.
 *
 * @example
 * <AnimatedPresenceWrapper show={isVisible}>
 *   <Modal onClose={() => setIsVisible(false)} />
 * </AnimatedPresenceWrapper>
 */
export function AnimatedPresenceWrapper({
  show,
  children,
  mode = "wait",
}: AnimatedPresenceWrapperProps) {
  return (
    <AnimatePresence mode={mode}>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
