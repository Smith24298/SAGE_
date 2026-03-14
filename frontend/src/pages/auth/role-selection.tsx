import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { Moon, Sun, Crown, Users, Briefcase, Heart, CheckCircle } from 'lucide-react';
import type { UserRole } from '@/context/AuthContext';

const roles = [
  {
    id: 'chro' as UserRole,
    title: 'Chief Human Resources Officer',
    icon: Crown,
    description: 'Strategic executive overseeing HR operations and workforce planning',
    features: ['Executive dashboards', 'Attrition alerts', 'Department insights'],
  },
  {
    id: 'hr_partner' as UserRole,
    title: 'HR Business Partner',
    icon: Users,
    description: 'Supporting strategic HR initiatives across departments',
    features: ['Employee profiles', 'Meeting assistant', 'Interaction history'],
  },
  {
    id: 'talent_ops' as UserRole,
    title: 'Talent Operations Manager',
    icon: Briefcase,
    description: 'Managing recruitment, hiring, and talent development',
    features: ['Skill analysis', 'Mobility insights', 'Hiring recommendations'],
  },
  {
    id: 'engagement_manager' as UserRole,
    title: 'Employee Engagement Manager',
    icon: Heart,
    description: 'Ensuring employee satisfaction, wellness, and retention',
    features: ['Sentiment tracking', 'Burnout detection', 'Feedback analysis'],
  },
];

export default function RoleSelection() {
  const router = useRouter();
  const { user, setRole, isLoading } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  React.useEffect(() => {
    if (!user) {
      router.push('/auth/signup');
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark-theme');
    }
  }, [user, router]);

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

  const handleContinue = async () => {
    if (!selectedRole) return;
    try {
      await setRole(selectedRole);
      const roleRoutes: Record<string, string> = {
        chro: '/',
        hr_partner: '/employees',
        talent_ops: '/workforce-insights',
        engagement_manager: '/engagement-analytics',
      };
      router.push(roleRoutes[selectedRole] ?? '/');
    } catch (err) {
      console.error('Failed to set role', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Theme Toggle */}
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 right-6 p-2 rounded-lg hover:bg-accent transition-colors z-50"
      >
        {isDarkTheme ? (
          <Sun className="w-5 h-5 text-primary" />
        ) : (
          <Moon className="w-5 h-5 text-primary" />
        )}
      </motion.button>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold mb-4">Select Your Role</h1>
          <p className="text-lg text-muted-foreground">
            Choose your platform role to get started with personalized insights
          </p>
          {user && (
            <p className="text-sm text-muted-foreground mt-2">
              Welcome, {user.name}!
            </p>
          )}
        </motion.div>

        {/* Role Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {roles.map((role, index) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                onClick={() => setSelectedRole(role.id)}
                whileHover={{ y: -8 }}
                className={`relative cursor-pointer p-8 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-lg'
                    : 'bg-card border-border/30 hover:border-border/60'
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="selectedRole"
                    className="absolute top-4 right-4"
                  >
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </motion.div>
                )}

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-2">{role.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-6">
                  {role.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {role.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isSelected ? { opacity: 1, x: 0 } : { opacity: 0.7, x: -10 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Click indicator */}
                {!isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="mt-6 text-xs text-muted-foreground"
                  >
                    Click to select
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <motion.button
            whileHover={{ scale: selectedRole ? 1.02 : 1 }}
            whileTap={{ scale: selectedRole ? 0.98 : 1 }}
            disabled={!selectedRole || isLoading}
            onClick={handleContinue}
            className={`px-12 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              selectedRole
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            {isLoading ? 'Continuing...' : 'Continue to Dashboard'}
            {selectedRole && <ArrowRightIcon className="w-5 h-5" />}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

function ArrowRightIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}
