import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Moon, Sun, LogOut, Shield } from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';

const roleLabels: Record<UserRole, string> = {
  chro: 'CHRO',
  hr_partner: 'HR Partner',
  talent_ops: 'Talent Ops',
  engagement_manager: 'Engagement Manager',
};

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { logout, user } = useAuth();

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark-theme');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

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

        <div className="flex items-center gap-4">
          <FloatingParticles />
          {mounted && (
            <div className="flex items-center gap-3">
              {/* Role Badge */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                >
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span
                    className="text-xs font-semibold tracking-wide text-primary"
                    style={{ letterSpacing: '0.04em' }}
                  >
                    {roleLabels[user.role] || user.role}
                  </span>
                </motion.div>
              )}

              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {isDarkTheme ? (
                  <Sun className="w-5 h-5 text-primary" />
                ) : (
                  <Moon className="w-5 h-5 text-primary" />
                )}
              </motion.button>
              
              {user && (
                <motion.button
                  onClick={logout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          )}
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
