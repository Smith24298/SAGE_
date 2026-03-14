import { useRouter } from 'next/router';
import { Card } from '../../components/ui/card';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Heart } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { useRef, useEffect, useState } from 'react';
import { departments, getDepartmentById } from '../../data/departments';

function useScrollAnimationKey() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    if (isInView) setAnimKey(k => k + 1);
  }, [isInView]);
  return { ref, animKey };
}

// Mock mock department-specific analytics
const deptSentimentTrends = [
  { month: 'Oct', score: 85 },
  { month: 'Nov', score: 80 },
  { month: 'Dec', score: 78 },
  { month: 'Jan', score: 72 },
  { month: 'Feb', score: 68 },
  { month: 'Mar', score: 71 },
];

const teamData = [
  { team: 'Frontend', engagement: 65, stress: 80 },
  { team: 'Backend', engagement: 70, stress: 75 },
  { team: 'Platform', engagement: 85, stress: 60 },
  { team: 'QA', engagement: 72, stress: 65 },
];

const scrollVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

function MetricCard({ title, value, change, trend, icon: Icon, color, delay }: any) {
  return (
    <motion.div
      variants={scrollVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
    >
      <Card className="p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl mt-1" style={{ fontWeight: 600 }}>{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-chart-2" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-destructive" />}
              <span className={`text-xs ${trend === 'up' ? 'text-chart-2' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
                {change}
              </span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full bg-accent flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function DepartmentProfile() {
  const router = useRouter();
  const { id } = router.query;
  const dept = typeof id === 'string' ? getDepartmentById(id) : null;
  const { ref, animKey } = useScrollAnimationKey();

  if (!dept) {
    return <div className="p-6 text-muted-foreground">Loading department data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>{dept.name} Overview</h1>
        <p className="text-muted-foreground">Departmental Analytics & Health Metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Employees" value={dept.employeeCount} change="+5" trend="up" icon={Heart} color="text-primary" delay={0} />
        <MetricCard title="Engagement Score" value={`${dept.engagementScore}%`} change="-12%" trend="down" icon={Heart} color="text-destructive" delay={0.1} />
        <MetricCard title="Attrition Risk" value={dept.attritionRisk} change="Elevated" trend="up" icon={AlertCircle} color="text-destructive" delay={0.2} />
        <MetricCard title="Workforce Growth" value="18%" change="+2%" trend="up" icon={TrendingUp} color="text-chart-2" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Department Sentiment Trend */}
        <motion.div variants={scrollVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}>
          <Card className="p-6 shadow-md">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Department Sentiment Comparison</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={deptSentimentTrends}>
                <defs>
                  <linearGradient id="sentimentProfileGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e1634a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#e1634a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#414240" />
                <YAxis stroke="#414240" />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#e1634a" strokeWidth={3} fill="url(#sentimentProfileGrad)" dot={{ fill: '#e1634a', r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Team Sub-Engagement */}
        <motion.div ref={ref} variants={scrollVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="p-6 shadow-md">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Sub-team Engagement & Stress</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart key={animKey} data={teamData}>
                <defs>
                  <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6b9080" stopOpacity={1} /><stop offset="100%" stopColor="#6b9080" stopOpacity={0.6} /></linearGradient>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f4a261" stopOpacity={1} /><stop offset="100%" stopColor="#f4a261" stopOpacity={0.6} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="team" stroke="#414240" />
                <YAxis stroke="#414240" />
                <Tooltip cursor={false} />
                <Legend />
                <Bar dataKey="engagement" fill="url(#engGrad)" radius={[8, 8, 0, 0]} isAnimationActive={true} animationBegin={0} animationDuration={900} animationEasing="ease-out" />
                <Bar dataKey="stress" fill="url(#stressGrad)" radius={[8, 8, 0, 0]} isAnimationActive={true} animationBegin={150} animationDuration={900} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* AI Panel */}
      <motion.div variants={scrollVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <Card className="p-6 shadow-md bg-gradient-to-br from-card to-accent mt-6 border-l-4 border-l-primary">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <h3 className="text-xl mb-3 flex gap-2 items-center" style={{ fontWeight: 600 }}><AlertCircle className="w-5 h-5 text-primary" /> Strategic Workforce Insights</h3>
              <div className="space-y-4">
                <div className="bg-background/60 p-4 rounded-lg">
                  <span className="text-xs uppercase font-bold text-muted-foreground">AI Insight</span>
                  <p className="mt-1 text-sm">{dept.name} engagement has declined by 12% this quarter, primarily driven by the Frontend and Backend sub-teams.</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <span className="text-xs uppercase font-bold text-primary">Recommendation</span>
                  <p className="mt-1 text-sm font-medium">Increase hiring and leadership support. Prioritize immediate workload redistribution and 1:1 check-ins focused on career growth and capacity planning.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
