import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  Brain,
  AlertTriangle,
  UserPlus,
  Heart,
  ChevronRight,
  Sun,
  Moon,
  Activity,
  BarChart3,
  Users,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
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

  const THEME = {
    bg: 'bg-background',
    textPrimary: 'text-foreground',
    textSecondary: 'text-muted-foreground',
    accentPrimary: 'text-primary',
    accentSecondary: 'text-chart-2',
    glassCard: 'bg-card border border-border/50 shadow-md',
    glassCardHover: 'hover:border-primary/50 hover:shadow-xl transition-all duration-300'
  };

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.textPrimary} font-sans selection:bg-[#e1634a]/30 selection:text-white`}>
      <Head>
        <title>SAGE | AI Workforce Intelligence</title>
        <meta name="description" content="Turn Employee Signals Into Workforce Intelligence" />
      </Head>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-background/80 backdrop-blur-lg border-b border-border shadow-sm py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center p-0.5 shadow-md">
              <div className="w-full h-full bg-background rounded-md flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SAGE</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#platform" className="hover:text-foreground transition-colors">Platform</Link>
            <Link href="#insights" className="hover:text-foreground transition-colors">Insights</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <Link 
                href="/dashboard" 
                className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all shadow-md group"
              >
                Go to Dashboard <ChevronRight className="inline-block w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth/signin" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all shadow-md group"
                >
                  Get Started <ChevronRight className="inline-block w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-chart-3/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-primary text-sm font-medium mb-6 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Introducing SAGE Intelligence 2.0
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight text-foreground">
              Turn <span className="text-primary">Employee Signals</span> Into Intelligence.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              AI-powered insights that detect burnout, predict attrition risk, and help HR leaders build healthier organizations.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {user ? (
                <Link 
                  href="/dashboard" 
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold transition-all shadow-md text-center flex items-center justify-center gap-2 group"
                >
                  Go to Dashboard <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth/signup" 
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold transition-all shadow-md text-center"
                  >
                    Start for free
                  </Link>
                  <Link 
                    href="#platform" 
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-lg font-semibold transition-all text-center"
                  >
                    See Platform
                  </Link>
                </>
              )}
            </div>

            <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-chart-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Real-time analytics
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-chart-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                AI-driven insight
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-chart-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Enterprise ready
              </div>
            </div>
          </motion.div>

          {/* AI Visualization Hero */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-full lg:w-1/2 relative h-[500px] lg:h-[600px] flex items-center justify-center"
          >
            {/* Center Node */}
            <motion.div 
              animate={{ 
                boxShadow: ['0 0 40px rgba(var(--primary), 0.2)', '0 0 80px rgba(var(--primary), 0.4)', '0 0 40px rgba(var(--primary), 0.2)'] 
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute w-32 h-32 bg-primary rounded-full z-20 flex items-center justify-center p-2"
            >
              <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                <Brain className="w-12 h-12 text-primary" />
              </div>
            </motion.div>

            {/* Orbiting Elements */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20 + i * 5, ease: "linear", delay: i * -2 }}
                className="absolute w-full h-full flex items-center justify-center opacity-70"
                style={{ borderRadius: '50%', border: '1px dashed rgba(110, 110, 110, 0.7)', width: `${200 + i * 80}px`, height: `${200 + i * 80}px` }}
              >
                <div 
                  className="absolute w-4 h-4 rounded-full bg-foreground/60" 
                  style={{ top: '-2px' }} 
                />
              </motion.div>
            ))}

            {/* Floating Cards */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className={`absolute top-10 right-10 p-4 rounded-xl ${THEME.glassCard} z-30 shadow-2xl`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-chart-2/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Sentiment Score</div>
                  <div className="text-lg font-bold text-chart-2">+12% Higher</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [10, -10, 10] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              className={`absolute bottom-20 left-10 p-4 rounded-xl ${THEME.glassCard} z-30 shadow-2xl`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Burnout Alert</div>
                  <div className="text-lg font-bold text-destructive">Engineering</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Story Section */}
      <section className="py-24 relative overflow-hidden px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-5xl font-bold mb-8 text-foreground"
          >
            The Hidden Signals Inside Your Workforce
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 gap-8 text-left"
          >
            <div className={`p-8 rounded-2xl ${THEME.glassCard}`}>
              <div className="text-destructive mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">The Struggle</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2"><span>•</span> Burnout you cannot see</li>
                <li className="flex gap-2"><span>•</span> Employees silently disengaging</li>
                <li className="flex gap-2"><span>•</span> HR relying on outdated surveys</li>
                <li className="flex gap-2"><span>•</span> No real-time sentiment insight</li>
              </ul>
            </div>
            <div className={`p-8 rounded-2xl bg-primary/5 border border-primary/20`}>
              <div className="text-primary mb-4">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">The Solution</h3>
              <p className="text-muted-foreground leading-relaxed">
                SAGE aggregates millions of passive signals into clear actionable intelligence. Anticipate attrition before it happens, measure sentiment in real-time, and take proactive steps to foster a healthier workplace.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Intelligence at scale</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Four powerful modules designed to supercharge your HR operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                color: 'text-chart-2',
                bg: 'bg-chart-2/10',
                title: 'Workforce Sentiment',
                desc: 'Analyze company mood continuously without survey fatigue.'
              },
              {
                icon: AlertTriangle,
                color: 'text-destructive',
                bg: 'bg-destructive/10',
                title: 'Attrition Risk',
                desc: 'Predict flight risks accurately through anomalous digital behavior.'
              },
              {
                icon: UserPlus,
                color: 'text-chart-3',
                bg: 'bg-chart-3/10',
                title: 'Hiring Insights',
                desc: 'AI-assisted parsing and recommendation for strategic gap filling.'
              },
              {
                icon: Users,
                color: 'text-chart-4',
                bg: 'bg-chart-4/10',
                title: 'Engagement Dynamics',
                desc: 'Map organizational networks and identify isolated team members.'
              }
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}
                className={`p-6 rounded-2xl ${THEME.glassCard} ${THEME.glassCardHover} group relative overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center mb-6`}>
                  <feat.icon className={`w-6 h-6 ${feat.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Insights Visualization Section (Mock UI) */}
      <section id="platform" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">See exactly what's happening.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Beautiful dashboards that surface the most critical signals across your entire organization.
            </p>
          </div>

          {/* Abstract Dashboard Mock */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`w-full max-w-5xl rounded-2xl ${THEME.glassCard} p-4 sm:p-8 relative border-t-2 border-t-primary/50 shadow-2xl`}
          >
            {/* Window header */}
            <div className="flex items-center gap-2 mb-8 border-b border-border/50 pb-4">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="w-3 h-3 rounded-full bg-chart-4" />
              <div className="w-3 h-3 rounded-full bg-chart-2" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Main Chart Area */}
              <div className="md:col-span-2 space-y-6">
                <div className={`h-64 rounded-xl bg-card border border-border p-6 relative overflow-hidden shadow-sm`}>
                  <h4 className="text-sm font-semibold mb-6 flex items-center gap-2 text-foreground"><BarChart3 className="w-4 h-4 text-primary" /> Company Sentiment Trend</h4>
                  
                  {/* Decorative chart */}
                  <div className="absolute bottom-0 left-0 w-full h-32 flex items-end px-6 space-x-2">
                    {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 95].map((h, j) => (
                      <motion.div 
                        key={j} 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: j * 0.05 }}
                        className="flex-1 bg-gradient-to-t from-primary/20 to-primary rounded-t-sm opacity-80"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className={`h-32 rounded-xl bg-destructive/10 border border-destructive/20 p-6 flex flex-col justify-center`}>
                    <div className="text-sm font-medium text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> High Attrition Risk</div>
                    <div className="text-3xl font-bold mt-2 text-foreground">12 Employees</div>
                  </div>
                  <div className={`h-32 rounded-xl bg-chart-2/10 border border-chart-2/20 p-6 flex flex-col justify-center`}>
                    <div className="text-sm font-medium text-chart-2 flex items-center gap-2"><Activity className="w-4 h-4" /> Peak Flow State</div>
                    <div className="text-3xl font-bold mt-2 text-foreground">Engineering</div>
                  </div>
                </div>
              </div>

              {/* Sidebar Alerts */}
              <div className={`rounded-xl bg-card border border-border p-6 h-full flex flex-col shadow-sm`}>
                <h4 className="text-sm font-semibold mb-6 text-foreground">AI Anomalies Found</h4>
                <div className="space-y-4 flex-1">
                  {[
                    { label: 'Sales dept sentiment dropped 15% WoW', type: 'critical' },
                    { label: 'Meeting fatigue detected in Marketing', type: 'warning' },
                    { label: '3 key engineers showing burnout signals', type: 'critical' },
                    { label: 'Overall engagement up 5% post-townhall', type: 'positive' }
                  ].map((alert, j) => (
                     <motion.div 
                        key={j}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + j * 0.1 }}
                        className="flex gap-3 text-sm p-3 rounded-lg bg-background/50 border border-border/50"
                      >
                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                          alert.type === 'critical' ? 'bg-destructive' : 
                          alert.type === 'warning' ? 'bg-chart-4' : 'bg-chart-2'
                        }`} />
                        <span className="text-muted-foreground">{alert.label}</span>
                     </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role-Based Intelligence Section */}
      <section className="py-24 px-6 relative bg-card/30">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-foreground">Built for every HR leader</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empower your people leaders with role-specific insights tailored to their responsibilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Chief Human Resources Officer',
                subtitle: 'Executive vision',
                desc: 'Strategic oversight across the entire organization, aligning workforce planning with corporate goals.',
                icon: Briefcase
              },
              {
                title: 'HR Business Partner',
                subtitle: 'Department strategy',
                desc: 'Actionable alerts and team-level metrics to coach managers and support specific departmental changes.',
                icon: Users
              },
              {
                title: 'Talent Operations Manager',
                subtitle: 'Growth & acquisition',
                desc: 'AI-driven skill gap analysis and intelligent talent mapping to optimize hiring cadences.',
                icon: UserPlus
              },
              {
                title: 'Employee Engagement Manager',
                subtitle: 'Culture & wellbeing',
                desc: 'Deep dives into sentiment drivers, enabling proactive wellness and culture-building initiatives.',
                icon: Heart
              }
            ].map((role, i) => (
               <div key={i} className={`p-8 rounded-2xl ${THEME.glassCard} hover:bg-card/80 transition-colors border-l-2 border-l-transparent hover:border-l-primary group`}>
                  <role.icon className="w-8 h-8 text-primary mb-4" />
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{role.subtitle}</div>
                  <h3 className="text-lg font-bold mb-3 text-foreground">{role.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{role.desc}</p>
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
             transition={{ duration: 8, repeat: Infinity }}
             className="w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px]" 
           />
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl lg:text-6xl font-bold mb-8 tracking-tight text-foreground">
            Build a <span className="text-primary">Smarter Workforce</span> With AI
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Join forward-thinking companies that use SAGE to understand, engage, and retain top talent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link 
                href="/dashboard" 
                className="w-full sm:w-auto px-10 py-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-bold transition-all shadow-xl group"
              >
                Go to Dashboard <ChevronRight className="inline-block w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/auth/signup" 
                  className="w-full sm:w-auto px-10 py-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-bold transition-all shadow-xl group"
                >
                  Get Started Free <ChevronRight className="inline-block w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/auth/signin" 
                  className="w-full sm:w-auto px-10 py-5 rounded-xl bg-card hover:bg-accent text-foreground border border-border text-xl font-bold transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-20 pb-10 px-6 relative bg-card/50">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Brain className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SAGE</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Strategic Advisor for Growth and Engagement. The premier AI-powered workforce intelligence platform.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-foreground">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Integrations</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} SAGE Intelligence. All rights reserved.</div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link>
            <Link href="#" className="hover:text-foreground transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
