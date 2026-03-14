import React from 'react';
import { Card } from '../components/ui/card';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  UserMinus, 
  UserPlus, 
  Brain, 
  Briefcase,
  Activity,
  Zap,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

const stressData = [
  { department: 'Engineering', stress: 85, engagement: 78, attritionRisk: 12 },
  { department: 'Sales', stress: 65, engagement: 88, attritionRisk: 18 },
  { department: 'Marketing', stress: 45, engagement: 50, attritionRisk: 8 },
  { department: 'Finance', stress: 70, engagement: 65, attritionRisk: 5 },
  { department: 'Support', stress: 90, engagement: 45, attritionRisk: 35 },
];

const skillsData = [
  { skill: 'AI/ML Engineering', demand: 95, supply: 30, urgency: 'High' },
  { skill: 'Data Analytics', demand: 85, supply: 50, urgency: 'High' },
  { skill: 'Cloud Architecture', demand: 80, supply: 60, urgency: 'Medium' },
  { skill: 'Product Management', demand: 70, supply: 75, urgency: 'Low' },
  { skill: 'Digital Marketing', demand: 40, supply: 90, urgency: 'Oversupplied' },
];

export function EmployeeInsights() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Talent Operations Intelligence</h1>
        <p className="text-muted-foreground mt-1">Strategic hiring, optimization, and workforce health analytics</p>
      </div>

      {/* Top Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-sm border-l-4 border-l-primary flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Company Stress/Engagement Ratio</div>
            <div className="text-2xl font-bold text-foreground mt-1">1.24 <span className="text-sm text-destructive font-normal">(Needs Attention)</span></div>
            <p className="text-xs text-muted-foreground mt-2">Engagement is trailing behind stress levels in Support & Engineering.</p>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border-l-4 border-l-chart-2 flex items-start gap-4">
          <div className="p-3 bg-chart-2/10 rounded-lg text-chart-2">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Overall Attrition Risk</div>
            <div className="text-2xl font-bold text-foreground mt-1">15.6% <span className="text-sm text-chart-2 font-normal">(-2.1% YoY)</span></div>
            <p className="text-xs text-muted-foreground mt-2">Highest risk isolated to customer-facing roles due to burnout.</p>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border-l-4 border-l-chart-4 flex items-start gap-4">
          <div className="p-3 bg-chart-4/10 rounded-lg text-chart-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Salary Efficiency Index</div>
            <div className="text-2xl font-bold text-foreground mt-1">78% <span className="text-sm text-chart-4 font-normal">(Suboptimal)</span></div>
            <p className="text-xs text-muted-foreground mt-2">Detecting bloated capacity in Marketing and operations.</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth & Hiring Recommendations */}
        <Card className="p-6 shadow-md border border-border">
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <UserPlus className="w-5 h-5 text-chart-2" />
            <h3 className="text-xl font-semibold text-foreground">Hiring Recommendations for Growth</h3>
          </div>
          
          <div className="space-y-6">
            <div className="bg-chart-2/5 p-4 rounded-xl border border-chart-2/20">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-chart-2" /> 
                Target Profiles: AI & Data Specialists
              </h4>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Engineering product delivery is bottlenecked by a 60% deficit in AI/ML capabilities relative to project demands. Growth is highly contingent on expanding the Data team.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3 text-muted-foreground uppercase tracking-wider">Required Skills for New Hires</h4>
              <div className="space-y-4">
                {skillsData.slice(0, 3).map((skill, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{skill.skill}</span>
                    <div className="flex items-center gap-4 w-1/2">
                      <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-chart-2 rounded-full" 
                          style={{ width: `${skill.demand}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-chart-2">{skill.urgency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-accent/50 p-4 rounded-lg flex items-start gap-3 mt-4 text-sm">
               <TrendingUp className="w-5 h-5 text-chart-2 shrink-0" />
               <span className="text-muted-foreground">Action: Open 5 new requisitions in <strong>Engineering (AI Lab)</strong> to match upcoming Q3 product initiatives.</span>
            </div>
          </div>
        </Card>

        {/* Termination & Optimization Recommendations */}
        <Card className="p-6 shadow-md border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-bl-[100px] -z-10" />
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <UserMinus className="w-5 h-5 text-destructive" />
            <h3 className="text-xl font-semibold text-foreground">Workforce Optimization & Restructuring</h3>
          </div>
          
          <div className="space-y-6">
            <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/20">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" /> 
                Overhired Departments Identified
              </h4>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Marketing currently has <strong className="text-foreground">28 employees</strong> with an output engagement score of 50%. Task overlap is high (approx 35%), resulting in idle time and inefficient salary allocation.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground mb-3 text-muted-foreground uppercase tracking-wider">Optimization Actions</h4>
              
              <div className="flex items-start gap-3 text-sm p-3 bg-background border border-border rounded-lg shadow-sm">
                <Briefcase className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">Consolidate Redundant Roles</div>
                  <div className="text-muted-foreground mt-1">Review Digital Marketing coordination roles. Recommendation is to reassign up to 4 employees to direct Sales Outreach, or consider role termination to save approx $320k/yr in redundant salary.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm p-3 bg-background border border-border rounded-lg shadow-sm">
                <Briefcase className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">Automate Repetitive Admin</div>
                  <div className="text-muted-foreground mt-1">HR Admin team output shows 40% time spent on manual data entry. Suggesting deployment of AI tools over hiring replacements for upcoming departures.</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Charts */}
      <h2 className="text-2xl font-bold text-foreground mt-12 mb-6">Cross-Department Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-6">Stress vs Engagement Ratio</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stressData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend className="mt-4" />
                <Bar dataKey="stress" name="Stress Level" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagement" name="Engagement" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
           <h3 className="text-lg font-semibold text-foreground mb-6">Department vs Required Skills Match</h3>
           <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
                <PolarGrid stroke="rgba(128, 128, 128, 0.3)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Market Demand" dataKey="demand" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.3} />
                <Radar name="Current Supply" dataKey="supply" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)' }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

    </div>
  );
}
