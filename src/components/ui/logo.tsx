"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Logo Component
 *
 * Premium animated logo for AI Mystic Tarot with mystical design.
 * Features a stylized crystal ball with tarot cards motif.
 *
 * @module components/ui/logo
 */

// ============================================================
// TYPES
// ============================================================

interface LogoProps {
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show text alongside icon */
  showText?: boolean;
  /** Enable hover animation */
  animated?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// SIZE CONFIGURATIONS
// ============================================================

const sizeConfig = {
  sm: { icon: 24, text: "text-base", gap: "gap-1.5" },
  md: { icon: 32, text: "text-lg", gap: "gap-2" },
  lg: { icon: 40, text: "text-xl", gap: "gap-2.5" },
  xl: { icon: 56, text: "text-2xl", gap: "gap-3" },
} as const;

// ============================================================
// LOGO ICON SVG
// ============================================================

interface LogoIconProps {
  size: number;
  animated?: boolean;
}

/**
 * LogoIcon - The SVG icon component featuring a crystal ball with tarot card.
 * Uses a gradient purple/violet color scheme with glass-like effects.
 */
function LogoIcon({ size, animated = false }: LogoIconProps) {
  const iconContent = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Definitions for gradients and effects */}
      <defs>
        {/* Main gradient - purple to violet */}
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        {/* Glow effect gradient */}
        <radialGradient id="glowGradient" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </radialGradient>

        {/* Inner shine */}
        <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="50%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Star filter for sparkle effect */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Main crystal ball / orb */}
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="url(#logoGradient)"
      />

      {/* Glass shine effect */}
      <ellipse
        cx="20"
        cy="18"
        rx="8"
        ry="6"
        fill="url(#shineGradient)"
      />

      {/* Inner glow */}
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="url(#glowGradient)"
      />

      {/* Tarot card symbol - stylized */}
      <g filter="url(#glow)">
        {/* Card outline */}
        <rect
          x="18"
          y="16"
          width="12"
          height="16"
          rx="1.5"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Star/pentagram symbol in center */}
        <path
          d="M24 19 L25.5 23 L30 23.5 L26.5 26 L27.5 30 L24 27.5 L20.5 30 L21.5 26 L18 23.5 L22.5 23 Z"
          fill="white"
          opacity="0.95"
        />
      </g>

      {/* Sparkle decorations */}
      <circle cx="34" cy="14" r="1" fill="white" opacity="0.8" />
      <circle cx="38" cy="20" r="0.8" fill="white" opacity="0.6" />
      <circle cx="12" cy="32" r="0.8" fill="white" opacity="0.6" />
    </svg>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.05, rotate: 3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {iconContent}
      </motion.div>
    );
  }

  return iconContent;
}

// ============================================================
// MAIN LOGO COMPONENT
// ============================================================

/**
 * Logo - Complete logo with icon and optional text.
 *
 * @example
 * // Icon only, small size
 * <Logo size="sm" />
 *
 * @example
 * // Full logo with text
 * <Logo size="lg" showText animated />
 *
 * @example
 * // Large centered logo
 * <Logo size="xl" showText className="justify-center" />
 */
export function Logo({
  size = "md",
  showText = true,
  animated = false,
  className,
}: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex items-center",
        config.gap,
        className
      )}
    >
      <LogoIcon size={config.icon} animated={animated} />

      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-bold tracking-tight bg-gradient-to-r from-purple-400 via-violet-400 to-purple-300 bg-clip-text text-transparent",
              config.text
            )}
          >
            AI Mystic Tarot
          </span>
          {size === "xl" && (
            <span className="text-xs text-white/50 tracking-wide">
              AI-Powered Readings
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// LOGO MARK (ICON ONLY)
// ============================================================

interface LogoMarkProps {
  /** Size in pixels */
  size?: number;
  /** Enable hover animation */
  animated?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * LogoMark - Icon-only version of the logo.
 * Useful for favicons, compact headers, or loading states.
 *
 * @example
 * <LogoMark size={48} animated />
 */
export function LogoMark({ size = 32, animated = false, className }: LogoMarkProps) {
  return (
    <div className={className}>
      <LogoIcon size={size} animated={animated} />
    </div>
  );
}
