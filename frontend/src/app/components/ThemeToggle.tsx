'use client';

import React, { useEffect, useState } from 'react';
import { useTheme, type Theme } from '@/context/ThemeContext';
import { motion } from 'motion/react';
import { Palette } from 'lucide-react';

const themes: { value: Theme; label: string; color: string }[] = [
  { value: 'light', label: 'Light', color: '#f5f5f5' },
  { value: 'dark', label: 'Dark', color: '#0f0f0f' },
  { value: 'coral', label: 'Coral', color: '#1a1a1a' },
  { value: 'deep', label: 'Deep', color: '#e1634a' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-2 rounded-lg" />;
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-lg hover:bg-accent transition-colors"
        title="Toggle theme"
      >
        <Palette className="w-5 h-5 text-primary" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={isOpen ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`absolute right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-2 z-50 ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t) => (
            <motion.button
              key={t.value}
              onClick={() => {
                setTheme(t.value);
                setIsOpen(false);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                theme === t.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full border border-foreground/30"
                style={{ backgroundColor: t.color }}
              />
              {t.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Close menu when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
