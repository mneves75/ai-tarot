"use client";

import {
  ScrollContainer,
  NavBar,
  HeroSection,
  ProblemSection,
  SolutionSection,
  FeaturesSection,
  CTASection,
} from "@/components/landing";

/**
 * Client component for the landing page.
 * Handles all interactive elements and animations.
 */
export function LandingPageClient() {
  return (
    <ScrollContainer>
      <NavBar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <CTASection />
    </ScrollContainer>
  );
}
