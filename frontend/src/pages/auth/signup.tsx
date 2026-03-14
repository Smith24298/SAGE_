import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { Moon, Sun, ArrowRight } from 'lucide-react';

export default function SignUp() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'chro', // default role
  });
  const [error, setError] = useState('');

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark-theme');
    }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.role) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await signup(formData.name, formData.email, formData.password, formData.role as any);
      // Redirect is handled by _app.tsx based on user.role
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
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

      <div className="flex h-screen">
        {/* Left Side - Sign Up Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full lg:w-2/5 flex items-center justify-center px-6 py-12 overflow-y-auto"
        >
          <div className="w-full max-w-md py-12">
            {/* Logo */}
            <div className="mb-12">
              <h1 className="text-3xl font-bold tracking-tight mb-2">SAGE</h1>
              <p className="text-sm text-muted-foreground">
                Strategic Advisor for Growth and Engagement
              </p>
            </div>

            {/* Sign Up Card */}
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border/50">
              <h2 className="text-2xl font-semibold mb-8">Create account</h2>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border/30 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border/30 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border/30 focus:border-primary focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum 8 characters
                  </p>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border/30 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                {/* Role Selection Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Platform Role
                  </label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-border/30 focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="chro">Chief Human Resources Officer (CHRO)</option>
                      <option value="hr_partner">HR Business Partner</option>
                      <option value="talent_ops">Talent Operations Manager</option>
                      <option value="engagement_manager">Employee Engagement Manager</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Sign Up Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  type="submit"
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {isLoading ? 'Creating account...' : (
                    <>
                      Sign Up
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Sign In Link */}
              <p className="text-center text-sm text-muted-foreground mt-8">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Features */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex w-3/5 bg-gradient-to-br from-primary/5 via-background to-primary/10 items-center justify-center p-12"
        >
          <div className="space-y-8 max-w-md">
            <div>
              <h3 className="text-3xl font-bold mb-4">Join SAGE</h3>
              <p className="text-muted-foreground mb-8">
                Transform your HR strategy with AI-powered workforce insights
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4">
              {[
                { title: 'Real-time Analytics', desc: 'Monitor workforce metrics in real-time' },
                { title: 'AI Insights', desc: 'Get actionable recommendations' },
                { title: 'Employee Engagement', desc: 'Track sentiment and well-being' },
                { title: 'Strategic Planning', desc: 'Make data-driven HR decisions' },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-5 h-5 rounded bg-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
