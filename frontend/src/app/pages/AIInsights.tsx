import { Card } from '../components/ui/card';
import { Sparkles, TrendingUp, AlertCircle, Users, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

const insights = [
  {
    category: 'Attrition Risk',
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    items: [
      'Sarah Johnson shows declining sentiment (70) and elevated stress. Recommend immediate 1:1 to discuss workload.',
      'James Wilson has low engagement (65) with high burnout risk. Consider project reassignment or time off.',
      '12% of employees at attrition risk - focus on career development and recognition programs.',
    ]
  },
  {
    category: 'Engagement Opportunities',
    icon: TrendingUp,
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
    items: [
      'Marketing team shows highest engagement (88%). Leverage their practices for other departments.',
      '42% highly engaged employees - create ambassador program to spread positive culture.',
      'Team culture scores well (82) - invest in team-building activities to maintain momentum.',
    ]
  },
  {
    category: 'Talent Development',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    items: [
      'Sarah Johnson interested in technical leadership - consider for upcoming Tech Lead role.',
      '68% career growth satisfaction - introduce structured career pathing framework.',
      'High mentorship interest detected - formalize mentorship program across departments.',
    ]
  },
  {
    category: 'Strategic Recommendations',
    icon: Lightbulb,
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
    items: [
      'Remote flexibility concerns trending up (15 mentions) - review hybrid work policy.',
      'Engineering stress at 65% - consider workload redistribution or additional hiring.',
      'Recognition scores at 75% - implement peer recognition platform to boost engagement.',
    ]
  },
];

export function AIInsights() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>AI Insights</h1>
        <p className="text-muted-foreground mt-1">Data-driven recommendations powered by SAGE</p>
      </div>

      <Card className="p-6 shadow-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl mb-2" style={{ fontWeight: 600 }}>Today's Priority Actions</h2>
            <ul className="space-y-2 text-sm opacity-95">
              <li>• <strong>Urgent:</strong> Schedule conversation with Sarah Johnson regarding workload concerns</li>
              <li>• <strong>This Week:</strong> Review Engineering team capacity and resource allocation</li>
              <li>• <strong>This Month:</strong> Launch career development framework for 68% seeking growth opportunities</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {insights.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${section.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${section.color}`} />
                  </div>
                  <h3 className="text-lg" style={{ fontWeight: 600 }}>{section.category}</h3>
                </div>
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="p-6 shadow-md border-2 border-primary/20">
        <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Predictive Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-accent rounded-lg text-center">
            <div className="text-2xl text-destructive mb-1" style={{ fontWeight: 600 }}>8.5%</div>
            <div className="text-sm text-muted-foreground">Predicted Turnover (Next Quarter)</div>
          </div>
          <div className="p-4 bg-accent rounded-lg text-center">
            <div className="text-2xl text-chart-2 mb-1" style={{ fontWeight: 600 }}>+12</div>
            <div className="text-sm text-muted-foreground">Recommended New Hires</div>
          </div>
          <div className="p-4 bg-accent rounded-lg text-center">
            <div className="text-2xl text-primary mb-1" style={{ fontWeight: 600 }}>78%</div>
            <div className="text-sm text-muted-foreground">Projected Engagement (Q2)</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
