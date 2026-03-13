import { Card } from '../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

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

export function EngagementAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Engagement Analytics</h1>
        <p className="text-muted-foreground mt-1">Track and analyze employee engagement metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 shadow-md">
          <div className="text-sm text-muted-foreground">Overall Engagement</div>
          <div className="text-3xl mt-2 text-primary" style={{ fontWeight: 600 }}>74%</div>
          <div className="text-xs text-chart-2 mt-1">+2.3% from last month</div>
        </Card>
        <Card className="p-5 shadow-md">
          <div className="text-sm text-muted-foreground">Highly Engaged</div>
          <div className="text-3xl mt-2 text-primary" style={{ fontWeight: 600 }}>42%</div>
          <div className="text-xs text-chart-2 mt-1">+5% from last quarter</div>
        </Card>
        <Card className="p-5 shadow-md">
          <div className="text-sm text-muted-foreground">At Risk</div>
          <div className="text-3xl mt-2 text-destructive" style={{ fontWeight: 600 }}>5%</div>
          <div className="text-xs text-destructive mt-1">Monitor closely</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-md">
          <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>Engagement Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementTrend}>
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
      </div>

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
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
