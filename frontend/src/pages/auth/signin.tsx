import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { Moon, Sun, ArrowRight, Zap } from 'lucide-react';

export default function SignIn() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      // Redirect is handled by _app.tsx based on user.role (or to role-selection if no role)
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
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
        {/* Left Side - Sign In Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full lg:w-2/5 flex items-center justify-center px-6 py-12"
        >
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="mb-12">
              <h1 className="text-3xl font-bold tracking-tight mb-2">SAGE</h1>
              <p className="text-sm text-muted-foreground">
                Strategic Advisor for Growth and Engagement
              </p>
            </div>

            {/* Sign In Card */}
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border/50">
              <h2 className="text-2xl font-semibold mb-8">Welcome back</h2>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border/30 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border/50"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link href="/auth/forgot-password" className="text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  type="submit"
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {isLoading ? 'Signing in...' : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-muted-foreground mt-8">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Animated Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex w-3/5 bg-gradient-to-br from-primary/5 via-background to-primary/10 items-center justify-center relative overflow-hidden p-12"
        >
          <div className="relative w-full h-full max-w-2xl">
            {/* Animated Background Elements */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute bottom-20 right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
            />

            {/* Content Card */}
            <motion.div
              whileHover={{ y: -10 }}
              className="relative bg-card/60 backdrop-blur-md rounded-2xl border border-border/30 p-8 shadow-2xl"
            >
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Workforce Analytics</h3>
                    <p className="text-xs text-muted-foreground">AI-Powered Insights</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="origin-left"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span>Team Engagement</span>
                      <span className="font-semibold">79%</span>
                    </div>
                    <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '79%' }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="origin-left"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span>Retention Rate</span>
                      <span className="font-semibold">92%</span>
                    </div>
                    <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '92%' }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="origin-left"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span>Burnout Risk</span>
                      <span className="font-semibold">14%</span>
                    </div>
                    <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '14%' }}
                        transition={{ delay: 0.7, duration: 1 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Footer */}
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="pt-4 border-t border-border/30 text-center text-xs text-muted-foreground"
                >
                  Real-time workforce insights powered by AI
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
