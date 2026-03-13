import { Card } from '../components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Users, Heart, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const sentimentData = [
  { month: 'Oct', score: 72 },
  { month: 'Nov', score: 68 },
  { month: 'Dec', score: 75 },
  { month: 'Jan', score: 71 },
  { month: 'Feb', score: 78 },
  { month: 'Mar', score: 74 },
];

const departmentData = [
  { department: 'Engineering', stress: 65, engagement: 82 },
  { department: 'Sales', stress: 58, engagement: 75 },
  { department: 'Marketing', stress: 52, engagement: 88 },
  { department: 'HR', stress: 45, engagement: 90 },
  { department: 'Finance', stress: 60, engagement: 78 },
];

const engagementDistribution = [
  { name: 'Highly Engaged', value: 42 },
  { name: 'Engaged', value: 35 },
  { name: 'Neutral', value: 18 },
  { name: 'Disengaged', value: 5 },
];

const COLORS = ['#e1634a', '#6b9080', '#a4b8c4', '#f4a261'];

const topConcerns = [
  { concern: 'Workload Balance', count: 23, trend: 'up' },
  { concern: 'Career Growth', count: 18, trend: 'down' },
  { concern: 'Remote Flexibility', count: 15, trend: 'up' },
  { concern: 'Team Collaboration', count: 12, trend: 'neutral' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time insights into your organization's health</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Engagement Score"
          value="74%"
          change="+3.2%"
          trend="up"
          icon={Heart}
          color="text-primary"
        />
        <MetricCard
          title="Sentiment Score"
          value="7.4/10"
          change="-0.5"
          trend="down"
          icon={TrendingUp}
          color="text-chart-2"
        />
        <MetricCard
          title="Attrition Risk"
          value="12%"
          change="+2.1%"
          trend="up"
          icon={AlertCircle}
          color="text-destructive"
        />
        <MetricCard
          title="Active Employees"
          value="342"
          change="+8"
          trend="up"
          icon={Users}
          color="text-chart-4"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Organization Sentiment Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#414240" />
                <YAxis stroke="#414240" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#e1634a" 
                  strokeWidth={3}
                  dot={{ fill: '#e1634a', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Engagement Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Employee Engagement Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={engagementDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {engagementDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Department Stress Levels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Department Stress & Engagement</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="department" stroke="#414240" />
                <YAxis stroke="#414240" />
                <Tooltip />
                <Legend />
                <Bar dataKey="stress" fill="#f4a261" radius={[8, 8, 0, 0]} />
                <Bar dataKey="engagement" fill="#6b9080" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Top Concerns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Top Employee Concerns</h3>
            <div className="space-y-4">
              {topConcerns.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.concern}</span>
                      {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-destructive" />}
                      {item.trend === 'down' && <TrendingDown className="w-4 h-4 text-chart-2" />}
                    </div>
                    <div className="mt-1 h-2 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${(item.count / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-sm text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 shadow-md bg-gradient-to-br from-card to-accent">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg mb-2" style={{ fontWeight: 600 }}>AI-Generated Insights</h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>• Engineering department shows elevated stress levels (65%). Consider workload redistribution.</li>
                <li>• Overall sentiment has improved by 5 points since December. Marketing initiatives are showing positive impact.</li>
                <li>• 12% of employees are at attrition risk. Focus on career development conversations in Q2.</li>
                <li>• Remote flexibility concerns are trending upward. Recommend policy review for hybrid work arrangements.</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

function MetricCard({ title, value, change, trend, icon: Icon, color }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
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
