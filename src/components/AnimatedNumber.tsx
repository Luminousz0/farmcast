import { useEffect } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  /** seconds */
  duration?: number;
}

/** A number that smoothly counts up to `value` when it changes. */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.8,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    latest.toFixed(decimals),
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  return <motion.span className="tabular-nums">{rounded}</motion.span>;
}
