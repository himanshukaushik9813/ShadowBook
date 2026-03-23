import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorAura() {
  const rafRef = useRef(null);
  const latestRef = useRef({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { stiffness: 200, damping: 26, mass: 0.75 });
  const springY = useSpring(cursorY, { stiffness: 200, damping: 26, mass: 0.75 });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(pointer: fine)');
    const updateEnabled = () => setEnabled(media.matches);
    updateEnabled();
    media.addEventListener('change', updateEnabled);
    return () => media.removeEventListener('change', updateEnabled);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    function flush() {
      rafRef.current = null;
      cursorX.set(latestRef.current.x);
      cursorY.set(latestRef.current.y);
    }

    function handleMove(event) {
      latestRef.current = { x: event.clientX, y: event.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flush);
      }
    }

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, cursorX, cursorY]);

  if (!enabled) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[110] h-12 w-12 rounded-full mix-blend-screen"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
        background:
          'radial-gradient(circle, rgba(59,255,190,0.32) 0%, rgba(89,231,255,0.2) 32%, rgba(89,231,255,0.06) 56%, rgba(0,0,0,0) 78%)',
        filter: 'blur(10px)',
      }}
    />
  );
}
