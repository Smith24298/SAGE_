import { Card } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

export function WorkforceInsights() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Workforce Insights</h1>
        <p className="text-muted-foreground mt-1">Comprehensive workforce analytics and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-md">
          <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Department Headcount & Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="department" stroke="#414240" />
              <YAxis stroke="#414240" />
              <Tooltip />
              <Legend />
              <Bar dataKey="headcount" fill="#e1634a" radius={[8, 8, 0, 0]} />
              <Bar dataKey="growth" fill="#6b9080" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

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
      </div>

      <Card className="p-6 shadow-md">
        <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Key Workforce Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <MetricItem label="Total Employees" value="342" />
          <MetricItem label="New Hires (Q1)" value="28" />
          <MetricItem label="Turnover Rate" value="8.5%" />
          <MetricItem label="Avg Tenure" value="3.2 years" />
        </div>
      </Card>
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
