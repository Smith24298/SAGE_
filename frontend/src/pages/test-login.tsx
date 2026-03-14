'use client';

import { useEffect } from 'react';
import { useAuth, type UserRole } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Crown, Users, Briefcase, Heart, LogOut } from 'lucide-react';

export default function TestLogin() {
  const { user, logout, setRole } = useAuth();
  const router = useRouter();

  const roles = [
    {
      id: 'chro',
      label: 'CHRO',
      description: 'Chief Human Resources Officer',
      icon: Crown,
      color: 'bg-purple-500',
      route: '/',
      subtitle: 'Executive Overview'
    },
    {
      id: 'hr_partner',
      label: 'HR Business Partner',
      description: 'Department-level HR Support',
      icon: Users,
      color: 'bg-blue-500',
      route: '/employees',
      subtitle: 'Employee Management'
    },
    {
      id: 'talent_ops',
      label: 'Talent Operations Manager',
      description: 'Workforce Development',
      icon: Briefcase,
      color: 'bg-green-500',
      route: '/workforce-insights',
      subtitle: 'Workforce Planning'
    },
    {
      id: 'engagement_manager',
      label: 'Engagement Manager',
      description: 'Employee Well-being Focus',
      icon: Heart,
      color: 'bg-red-500',
      route: '/engagement-analytics',
      subtitle: 'Sentiment & Wellness'
    }
  ];

  const handleRoleSelect = async (roleId: string) => {
    await setRole(roleId as UserRole);
    const selectedRole = roles.find(r => r.id === roleId);
    if (selectedRole) router.push(selectedRole.route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-white mb-2">SAGE HR Platform</h1>
          <p className="text-slate-400 text-lg">Select a Role to Test</p>
          {user && (
            <p className="text-sm text-emerald-400 mt-2">
              Logged in as: {user.name} ({user.role ?? 'No role'})
            </p>
          )}
        </motion.div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            const isSelected = user?.role === role.id;

            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => handleRoleSelect(role.id)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 group ${
                  isSelected
                    ? `border-emerald-500 bg-emerald-500/10`
                    : 'border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700'
                }`}
              >
                {/* Checkmark for selected */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-3 -right-3 bg-emerald-500 rounded-full p-2"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                )}

                {/* Icon */}
                <div
                  className={`${role.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white`}
                >
                  <Icon size={28} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-white text-left mb-1">
                  {role.label}
                </h3>
                <p className="text-xs text-emerald-400 text-left mb-2">
                  {role.subtitle}
                </p>
                <p className="text-sm text-slate-400 text-left">
                  {role.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:to-emerald-500/5 transition-all duration-300 pointer-events-none" />
              </motion.button>
            );
          })}
        </div>

        {/* Login/Signup Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <a
            href="/auth/signin"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
          >
            Go to Sign In
          </a>
          <a
            href="/auth/signup"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors"
          >
            Go to Sign Up
          </a>
          {user && (
            <button
              onClick={logout}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <LogOut size={20} />
              Logout
            </button>
          )}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 p-6 border border-slate-600 rounded-lg bg-slate-800/50"
        >
          <h3 className="text-white font-bold mb-3">🧪 Quick Test Guide</h3>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>✓ <strong>Click any role card</strong> to instantly test that user role</li>
            <li>✓ <strong>Go to Sign In</strong> to use the login form (/auth/signin)</li>
            <li>✓ <strong>Go to Sign Up</strong> to create a new user (/auth/signup)</li>
            <li>✓ <strong>Selected role</strong> shows a checkmark and routes to the role-specific dashboard</li>
            <li>✓ <strong>Logout</strong> button appears when you're logged in</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
