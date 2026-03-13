import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-full px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-xl tracking-wide" style={{ fontWeight: 600 }}>
            SAGE
          </div>
          <div className="text-xs text-muted-foreground">
            Strategic Advisor for Growth and Engagement
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FloatingParticles />
        </div>
      </div>
    </nav>
  );
}

function FloatingParticles() {
  return (
    <div className="relative w-32 h-12 overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          animate={{
            y: [-20, 20, -20],
            x: [0, 10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
          style={{
            left: `${20 + i * 30}%`,
            top: '50%',
          }}
        />
      ))}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 blur-md" />
      </motion.div>
    </div>
  );
}
