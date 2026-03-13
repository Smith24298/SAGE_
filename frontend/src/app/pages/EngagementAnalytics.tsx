import { Card } from '../components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { motion } from 'motion/react';

const engagementTrend = [
  { month: 'Sep', score: 76 },
  { month: 'Oct', score: 72 },
  { month: 'Nov', score: 74 },
  { month: 'Dec', score: 78 },
  { month: 'Jan', score: 75 },
  { month: 'Feb', score: 80 },
  { month: 'Mar', score: 74 },
];

const engagementFactors = [
  { factor: 'Work-Life Balance', score: 72 },
  { factor: 'Career Growth', score: 68 },
  { factor: 'Recognition', score: 75 },
  { factor: 'Team Culture', score: 82 },
  { factor: 'Management', score: 78 },
  { factor: 'Compensation', score: 70 },
];

const scrollVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export function EngagementAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Engagement Analytics</h1>
        <p className="text-muted-foreground mt-1">Track and analyze employee engagement metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Overall Engagement', value: '74%', sub: '+2.3% from last month', color: 'text-primary', subColor: 'text-chart-2' },
          { label: 'Highly Engaged', value: '42%', sub: '+5% from last quarter', color: 'text-primary', subColor: 'text-chart-2' },
          { label: 'At Risk', value: '5%', sub: 'Monitor closely', color: 'text-destructive', subColor: 'text-destructive' },
        ].map((item, i) => (
          <motion.div
            key={i}
            variants={scrollVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card className="p-5 shadow-md">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className={`text-3xl mt-2 ${item.color}`} style={{ fontWeight: 600 }}>{item.value}</div>
              <div className={`text-xs ${item.subColor} mt-1`}>{item.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 shadow-md">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Engagement Trend (6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={engagementTrend}>
                <defs>
                  <linearGradient id="engagementTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e1634a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#e1634a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#414240" />
                <YAxis stroke="#414240" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#e1634a"
                  strokeWidth={3}
                  fill="url(#engagementTrendGrad)"
                  dot={{ fill: '#e1634a', r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 shadow-md">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Engagement Factors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={engagementFactors}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#e1634a" fill="#e1634a" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 shadow-md">
          <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Engagement Drivers</h3>
          <div className="space-y-3">
            {engagementFactors.map((factor, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{factor.factor}</span>
                  <span style={{ fontWeight: 600 }}>{factor.score}%</span>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${factor.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
