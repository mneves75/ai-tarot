"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

interface ScrollContainerProps {
  children: ReactNode;
}

/**
 * Main scroll container for the landing page.
 * Provides scroll progress indicator and smooth scrolling.
 *
 * Features:
 * - Smooth scroll behavior
 * - Progress bar indicator at top
 * - Spring-animated progress for fluid feel
 */
export function ScrollContainer({ children }: ScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  // Spring-animated progress for smoother feel
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto scroll-smooth"
      style={{
        // Enable smooth scrolling
        scrollBehavior: "smooth",
      }}
    >
      {/* Progress indicator bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 z-50 origin-left"
        style={{ scaleX }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
