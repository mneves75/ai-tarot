"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * PageContainer Component
 *
 * A wrapper component that provides consistent page styling with:
 * - Dark gradient background
 * - Optional animated gradient orbs
 * - Proper min-height for full-screen layouts
 *
 * @module components/ui/page-container
 */

// ============================================================
// TYPES
// ============================================================

interface PageContainerProps {
  /** Page content */
  children: ReactNode;
  /** Additional className for the container */
  className?: string;
  /** Show animated gradient orbs in background */
  showOrbs?: boolean;
  /** Maximum width constraint */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "full";
  /** Padding preset */
  padding?: "none" | "sm" | "md" | "lg";
  /** Center content vertically */
  centered?: boolean;
}

// ============================================================
// STYLE MAPPINGS
// ============================================================

const maxWidthStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  full: "max-w-full",
};

const paddingStyles = {
  none: "",
  sm: "px-4 py-6",
  md: "px-4 sm:px-6 py-8",
  lg: "px-4 sm:px-6 lg:px-8 py-12",
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

/**
 * Animated gradient orbs for visual interest.
 * Performance-optimized with GPU-accelerated transforms.
 */
function GradientOrbs() {
  return (
    <>
      {/* Primary purple orb - top left quadrant */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"
        animate={{
          x: [0, 40, 0],
          y: [0, 25, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        // Reduce animations for reduced motion preference
        style={{ willChange: "transform" }}
      />
      {/* Secondary violet orb - bottom right quadrant */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[128px] pointer-events-none"
        animate={{
          x: [0, -30, 0],
          y: [0, -40, 0],
          scale: [1, 1.12, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ willChange: "transform" }}
      />
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * PageContainer - Consistent page wrapper with premium styling.
 *
 * @example
 * // Basic usage
 * <PageContainer>
 *   <h1>Page Title</h1>
 *   <p>Content here</p>
 * </PageContainer>
 *
 * @example
 * // With animated orbs and centered content
 * <PageContainer showOrbs centered maxWidth="2xl">
 *   <LoginForm />
 * </PageContainer>
 *
 * @example
 * // Full width with custom padding
 * <PageContainer maxWidth="full" padding="lg">
 *   <Dashboard />
 * </PageContainer>
 */
export function PageContainer({
  children,
  className,
  showOrbs = false,
  maxWidth = "4xl",
  padding = "md",
  centered = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen",
        // Dark gradient background with subtle purple tint
        "bg-gradient-to-b from-black via-purple-950/10 to-black",
        centered && "flex items-center justify-center",
        className
      )}
    >
      {/* Animated background orbs */}
      <AnimatePresence>
        {showOrbs && <GradientOrbs />}
      </AnimatePresence>

      {/* Content container */}
      <div
        className={cn(
          "relative z-10 mx-auto w-full",
          maxWidthStyles[maxWidth],
          paddingStyles[padding]
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================
// PAGE SECTION COMPONENT
// ============================================================

interface PageSectionProps {
  /** Section content */
  children: ReactNode;
  /** Additional className */
  className?: string;
  /** Section ID for anchor links */
  id?: string;
}

/**
 * PageSection - A semantic section wrapper for page content.
 */
export function PageSection({ children, className, id }: PageSectionProps) {
  return (
    <section id={id} className={cn("space-y-6", className)}>
      {children}
    </section>
  );
}

// ============================================================
// PAGE TITLE COMPONENT
// ============================================================

interface PageTitleProps {
  /** Main title text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Additional className */
  className?: string;
  /** Center text alignment */
  centered?: boolean;
}

/**
 * PageTitle - Consistent page title styling with optional subtitle.
 */
export function PageTitle({
  title,
  subtitle,
  className,
  centered = true,
}: PageTitleProps) {
  return (
    <div className={cn(centered && "text-center", className)}>
      <h1 className="text-3xl sm:text-4xl font-bold text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
