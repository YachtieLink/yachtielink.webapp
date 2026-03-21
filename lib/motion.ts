import type { Variants, Transition } from "framer-motion";

/* ─── Shared transition presets ─── */

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 20,
};

export const easeFast: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

/* ─── Page & section entrance ─── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

/* ─── Stagger container ─── */

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

/* ─── Card & interactive element variants ─── */

export const cardHover = {
  whileHover: { y: -2, transition: springSnappy },
  whileTap: { scale: 0.98, transition: springSnappy },
};

export const buttonTap = {
  whileTap: { scale: 0.97, transition: springSnappy },
};

/* ─── Scroll-triggered reveal ─── */

export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

/** Duration-based ease for accordion/expand animations where spring overshoot is undesirable */
export const easeGentle: Transition = {
  duration: 0.25,
  ease: "easeOut",
};

/** Viewport options for scroll-triggered reveals */
export const scrollRevealViewport = {
  once: true,
  margin: "-50px" as const,
};

/* ─── Scale pop (badges, counts, success) ─── */

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 15 },
  },
};
