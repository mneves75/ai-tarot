"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlassCard Component
 *
 * A versatile glass morphism card component with multiple intensity variants.
 * Follows DESIGN-UI-UX-GUIDELINES.md specifications for glass effects.
 *
 * @module components/ui/glass-card
 */

// ============================================================
// TYPES
// ============================================================

export type GlassIntensity = "light" | "medium" | "heavy";

interface GlassCardBaseProps {
  /** Glass blur intensity level */
  intensity?: GlassIntensity;
  /** Enable hover animation */
  hoverable?: boolean;
  /** Add accent border glow */
  accentBorder?: boolean;
  /** Card padding preset */
  padding?: "none" | "sm" | "md" | "lg";
  /** Children content */
  children?: ReactNode;
  /** Additional className */
  className?: string;
}

// For non-animated version
type GlassCardStaticProps = GlassCardBaseProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof GlassCardBaseProps>;

// For animated version
type GlassCardAnimatedProps = GlassCardBaseProps &
  Omit<HTMLMotionProps<"div">, keyof GlassCardBaseProps> & {
    /** Enable Framer Motion animation */
    animated?: true;
  };

type GlassCardProps =
  | (GlassCardStaticProps & { animated?: false })
  | GlassCardAnimatedProps;

// ============================================================
// STYLE MAPPINGS
// ============================================================

const intensityStyles: Record<GlassIntensity, string> = {
  light: "glass-light",
  medium: "glass-medium",
  heavy: "glass-heavy",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
};

// ============================================================
// ANIMATION VARIANTS
// ============================================================

const hoverVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.01,
    y: -2,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================================
// COMPONENT
// ============================================================

/**
 * GlassCard - Premium glass morphism card component.
 *
 * @example
 * // Basic usage
 * <GlassCard intensity="medium" padding="md">
 *   <p>Content here</p>
 * </GlassCard>
 *
 * @example
 * // With hover animation
 * <GlassCard animated hoverable intensity="light">
 *   <p>Interactive card</p>
 * </GlassCard>
 *
 * @example
 * // With accent border
 * <GlassCard accentBorder intensity="heavy">
 *   <p>Highlighted card</p>
 * </GlassCard>
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (props, ref) => {
    const {
      intensity = "medium",
      hoverable = false,
      accentBorder = false,
      padding = "md",
      className,
      children,
      animated,
      ...rest
    } = props;

    const baseClasses = cn(
      "rounded-xl overflow-hidden",
      intensityStyles[intensity],
      paddingStyles[padding],
      accentBorder && "ring-1 ring-brand-primary/20",
      hoverable && !animated && "transition-transform hover:scale-[1.01] hover:-translate-y-0.5",
      className
    );

    // Animated version using Framer Motion
    if (animated) {
      const motionProps = rest as Omit<HTMLMotionProps<"div">, keyof GlassCardBaseProps>;

      // Build hover props conditionally to avoid passing undefined values
      // (TypeScript's exactOptionalPropertyTypes requires this)
      const hoverProps = hoverable
        ? { variants: hoverVariants, initial: "rest" as const, whileHover: "hover" as const }
        : {};

      return (
        <motion.div
          ref={ref}
          className={baseClasses}
          {...hoverProps}
          {...motionProps}
        >
          {children}
        </motion.div>
      );
    }

    // Static version without Framer Motion
    const divProps = rest as Omit<HTMLAttributes<HTMLDivElement>, keyof GlassCardBaseProps>;
    return (
      <div ref={ref} className={baseClasses} {...divProps}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface GlassCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * GlassCard header section with consistent styling.
 */
export function GlassCardHeader({
  className,
  children,
  ...props
}: GlassCardHeaderProps) {
  return (
    <div
      className={cn("pb-4 border-b border-white/10", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface GlassCardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
}

/**
 * GlassCard title with proper heading semantics.
 */
export function GlassCardTitle({
  className,
  children,
  as: Component = "h3",
  ...props
}: GlassCardTitleProps) {
  return (
    <Component
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </Component>
  );
}

interface GlassCardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

/**
 * GlassCard description with muted styling.
 */
export function GlassCardDescription({
  className,
  children,
  ...props
}: GlassCardDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground mt-1", className)}
      {...props}
    >
      {children}
    </p>
  );
}

interface GlassCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * GlassCard content area.
 */
export function GlassCardContent({
  className,
  children,
  ...props
}: GlassCardContentProps) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

interface GlassCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * GlassCard footer section with top border.
 */
export function GlassCardFooter({
  className,
  children,
  ...props
}: GlassCardFooterProps) {
  return (
    <div
      className={cn("pt-4 mt-4 border-t border-white/10", className)}
      {...props}
    >
      {children}
    </div>
  );
}
