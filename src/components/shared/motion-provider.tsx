"use client";

import type { ReactNode } from "react";

import { domAnimation, LazyMotion, MotionConfig } from "motion/react";

const defaultTransition = {
  duration: 0.18,
  ease: [0.2, 0, 0, 1] as const,
};

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={defaultTransition}>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
