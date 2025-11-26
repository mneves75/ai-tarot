import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton Component
 *
 * Loading placeholder components with shimmer effect.
 * Uses glass morphism styling consistent with the design system.
 *
 * @module components/ui/skeleton
 */

// ============================================================
// BASE SKELETON
// ============================================================

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional explicit width */
  width?: string | number;
  /** Optional explicit height */
  height?: string | number;
}

/**
 * Skeleton - Base loading placeholder with shimmer animation.
 *
 * @example
 * // Basic usage
 * <Skeleton className="h-4 w-32" />
 *
 * @example
 * // With explicit dimensions
 * <Skeleton width={200} height={40} />
 */
export function Skeleton({ className, width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md shimmer",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

// ============================================================
// SKELETON VARIANTS
// ============================================================

interface SkeletonTextProps {
  /** Number of lines to show */
  lines?: number;
  /** Additional className */
  className?: string;
  /** Last line width percentage */
  lastLineWidth?: string;
}

/**
 * SkeletonText - Text loading placeholder with multiple lines.
 *
 * @example
 * // Single line
 * <SkeletonText />
 *
 * @example
 * // Multiple lines with shorter last line
 * <SkeletonText lines={3} lastLineWidth="60%" />
 */
export function SkeletonText({
  lines = 1,
  className,
  lastLineWidth = "80%",
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={`skeleton-line-${index}`}
          className="h-4"
          style={{
            width: index === lines - 1 && lines > 1 ? lastLineWidth : "100%",
          }}
        />
      ))}
    </div>
  );
}

interface SkeletonTitleProps {
  /** Additional className */
  className?: string;
  /** Title size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * SkeletonTitle - Title loading placeholder.
 *
 * @example
 * <SkeletonTitle size="lg" />
 */
export function SkeletonTitle({ className, size = "md" }: SkeletonTitleProps) {
  const sizeClasses = {
    sm: "h-5 w-32",
    md: "h-6 w-48",
    lg: "h-8 w-64",
  };

  return <Skeleton className={cn(sizeClasses[size], className)} />;
}

interface SkeletonAvatarProps {
  /** Additional className */
  className?: string;
  /** Avatar size */
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * SkeletonAvatar - Circular avatar loading placeholder.
 *
 * @example
 * <SkeletonAvatar size="lg" />
 */
export function SkeletonAvatar({ className, size = "md" }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />
  );
}

interface SkeletonButtonProps {
  /** Additional className */
  className?: string;
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Full width */
  fullWidth?: boolean;
}

/**
 * SkeletonButton - Button loading placeholder.
 *
 * @example
 * <SkeletonButton size="lg" fullWidth />
 */
export function SkeletonButton({
  className,
  size = "md",
  fullWidth = false,
}: SkeletonButtonProps) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-28",
    lg: "h-12 w-36",
  };

  return (
    <Skeleton
      className={cn(
        "rounded-lg",
        fullWidth ? "w-full" : sizeClasses[size],
        className
      )}
    />
  );
}

// ============================================================
// COMPOUND SKELETONS
// ============================================================

interface SkeletonCardProps {
  /** Additional className */
  className?: string;
  /** Show header section */
  showHeader?: boolean;
  /** Number of content lines */
  contentLines?: number;
  /** Show footer section */
  showFooter?: boolean;
}

/**
 * SkeletonCard - Card loading placeholder with sections.
 *
 * @example
 * // Basic card skeleton
 * <SkeletonCard showHeader contentLines={3} showFooter />
 */
export function SkeletonCard({
  className,
  showHeader = true,
  contentLines = 3,
  showFooter = false,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6 glass-medium space-y-4",
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center gap-4">
          <SkeletonAvatar size="md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      )}

      <SkeletonText lines={contentLines} />

      {showFooter && (
        <div className="flex justify-end gap-2 pt-2">
          <SkeletonButton size="sm" />
          <SkeletonButton size="sm" />
        </div>
      )}
    </div>
  );
}

interface SkeletonListProps {
  /** Number of items */
  count?: number;
  /** Additional className for container */
  className?: string;
  /** Additional className for each item */
  itemClassName?: string;
}

/**
 * SkeletonList - List loading placeholder.
 *
 * @example
 * <SkeletonList count={5} />
 */
export function SkeletonList({
  count = 3,
  className,
  itemClassName,
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-list-item-${index}`}
          className={cn(
            "flex items-center gap-4 p-4 rounded-lg glass-light",
            itemClassName
          )}
        >
          <SkeletonAvatar size="sm" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SkeletonGridProps {
  /** Number of items */
  count?: number;
  /** Grid columns */
  columns?: 1 | 2 | 3 | 4;
  /** Additional className */
  className?: string;
}

/**
 * SkeletonGrid - Grid of card placeholders.
 *
 * @example
 * <SkeletonGrid count={6} columns={3} />
 */
export function SkeletonGrid({
  count = 6,
  columns = 3,
  className,
}: SkeletonGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridClasses[columns], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={`skeleton-grid-${index}`} showHeader={false} contentLines={2} />
      ))}
    </div>
  );
}

// ============================================================
// FORM SKELETON
// ============================================================

interface SkeletonFormProps {
  /** Number of form fields */
  fields?: number;
  /** Additional className */
  className?: string;
}

/**
 * SkeletonForm - Form loading placeholder.
 *
 * @example
 * <SkeletonForm fields={4} />
 */
export function SkeletonForm({ fields = 3, className }: SkeletonFormProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={`skeleton-form-field-${index}`} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <SkeletonButton size="lg" fullWidth />
    </div>
  );
}

// ============================================================
// GLASS CARD SKELETON
// ============================================================

interface GlassCardSkeletonProps {
  /** Additional className */
  className?: string;
}

/**
 * GlassCardSkeleton - Glass card loading placeholder with shimmer effect.
 * Matches the GlassCard design system with consistent styling.
 *
 * @example
 * <GlassCardSkeleton className="h-64" />
 */
export function GlassCardSkeleton({ className }: GlassCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl glass-medium animate-pulse",
        className
      )}
      aria-hidden="true"
    />
  );
}
