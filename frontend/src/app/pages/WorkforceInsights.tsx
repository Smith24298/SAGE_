import { Card } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion, useInView } from 'motion/react';
import { useRef, useEffect, useState } from 'react';

const departmentGrowth = [
  { department: 'Engineering', headcount: 85, growth: 12 },
  { department: 'Sales', headcount: 42, growth: 8 },
  { department: 'Marketing', headcount: 28, growth: 5 },
  { department: 'HR', headcount: 15, growth: 2 },
  { department: 'Finance', headcount: 22, growth: 3 },
];

const diversityData = [
  { category: 'Women', value: 45 },
  { category: 'Men', value: 52 },
  { category: 'Non-binary', value: 3 },
];

const COLORS = ['#e1634a', '#6b9080', '#a4b8c4'];

const scrollVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

/** Triggers Recharts' built-in bar rise animation when it scrolls into view */
function useScrollAnimationKey() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    if (isInView) setAnimKey(k => k + 1);
  }, [isInView]);
  return { ref, animKey };
}

function HeadcountBarChart() {
  const { ref, animKey } = useScrollAnimationKey();
  return (
    <motion.div
      ref={ref}
      variants={scrollVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="p-6 shadow-md">
        <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Department Headcount & Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart key={animKey} data={departmentGrowth}>
            <defs>
              <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e1634a" stopOpacity={1} />
                <stop offset="100%" stopColor="#e1634a" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6b9080" stopOpacity={1} />
                <stop offset="100%" stopColor="#6b9080" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="department" stroke="#414240" />
            <YAxis stroke="#414240" />
            <Tooltip cursor={false} />
            <Legend />
            <Bar
              dataKey="headcount"
              fill="url(#headcountGrad)"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="growth"
              fill="url(#growthGrad)"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
              animationBegin={150}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </motion.div>
  );
}

export function WorkforceInsights() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Workforce Insights</h1>
        <p className="text-muted-foreground mt-1">Comprehensive workforce analytics and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeadcountBarChart />

        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 shadow-md">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Diversity Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={diversityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label
                >
                  {diversityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 shadow-md">
          <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Key Workforce Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetricItem label="Total Employees" value="342" />
            <MetricItem label="New Hires (Q1)" value="28" />
            <MetricItem label="Turnover Rate" value="8.5%" />
            <MetricItem label="Avg Tenure" value="3.2 years" />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-4 bg-accent rounded-lg">
      <div className="text-2xl text-primary" style={{ fontWeight: 600 }}>{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
