import { Card } from '../components/ui/card';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Heart,
  MessageCircle,
  Calendar,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, useInView, animate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { EmployeeAvatar } from '../components/EmployeeAvatar';
import { Employee } from '../data/employees';
import { ReportModal } from '../components/ReportModal';
import { useEmployeeData } from '@/hooks/useEmployeeData';

interface EmployeeProfileProps {
  employeeId?: number;
}

const scrollVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

/** Animates a numeric count from 0 to target when it enters viewport */
function AnimatedCounter({ target, duration = 1.2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setCount(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

/** Animated circular progress that draws on scroll enter */
function CircularProgress({ score, fill, metric }: { score: number; fill: string; metric: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const circumference = 2 * Math.PI * 40;
  const targetDash = (score / 100) * circumference;

  return (
    <div ref={ref} className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-2">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" stroke="#e9eae2" strokeWidth="8" fill="none" />
          <motion.circle
            cx="48" cy="48" r="40"
            stroke={fill}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={isInView ? { strokeDashoffset: circumference - targetDash } : {}}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg" style={{ fontWeight: 600 }}>
          {isInView ? <AnimatedCounter target={score} /> : 0}%
        </div>
      </div>
      <div className="text-sm">{metric}</div>
    </div>
  );
}

export function EmployeeProfile({ employeeId = 1 }: EmployeeProfileProps) {
  const {
    employee,
    photoUrl,
    salaryHistory,
    sentimentTrend,
    engagementMetrics,
    meetings,
    behavioral,
    communication,
    riskIndicators,
    loading,
    error,
  } = useEmployeeData(employeeId);
  const [showReport, setShowReport] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
        <p className="font-medium">Failed to load profile</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const risks = riskIndicators ?? [
    { label: 'Burnout Risk', level: (employee.risk === 'High' ? 'High' : employee.risk === 'Medium' ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High', color: employee.risk === 'High' ? 'bg-red-500' : employee.risk === 'Medium' ? 'bg-orange-500' : 'bg-green-500' },
    { label: 'Attrition Risk', level: employee.risk, color: employee.risk === 'High' ? 'bg-red-500' : employee.risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500' },
    { label: 'Engagement Decline', level: (employee.sentiment < 70 ? 'High' : employee.sentiment < 80 ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High', color: employee.sentiment < 70 ? 'bg-red-500' : employee.sentiment < 80 ? 'bg-yellow-500' : 'bg-green-500' },
    { label: 'Stress Signals', level: (employee.sentiment < 72 ? 'High' : 'Medium') as 'Low' | 'Medium' | 'High', color: employee.sentiment < 72 ? 'bg-red-500' : 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl" style={{ fontWeight: 600 }}>{employee.name}</h1>
          <p className="text-muted-foreground mt-1">{employee.role} · {employee.department}</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => setShowReport(true)}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Report preview + download modal */}
      {showReport && (
        <ReportModal employee={employee} onClose={() => setShowReport(false)} />
      )}

      {/* Employee Overview */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 shadow-md">
          <div className="flex items-start gap-6">
            {/* Themed Avatar */}
            <EmployeeAvatar
              name={employee.name}
              avatarIndex={employee.avatarIndex}
              size="xl"
              photoUrl={photoUrl}
            />
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Employee ID" value={employee.employeeId} />
              <InfoField label="Name" value={employee.name} />
              <InfoField label="Department" value={employee.department} />
              <InfoField label="Role" value={employee.role} />
              <InfoField label="Manager" value={employee.manager} />
              <InfoField label="Date of Joining" value={employee.dateOfJoining} />
              <InfoField label="Employment Type" value={employee.employmentType} />
              <InfoField label="Location" value={employee.location} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Compensation Section */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>Compensation & Salary Structure</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <InfoField label="Base Salary" value={employee.baseSalary} highlight />
            <InfoField label="Bonus" value={employee.bonus} />
            <InfoField label="Stock Options" value={employee.stockOptions} />
            <InfoField label="Total Compensation" value={employee.totalCompensation} highlight />
            <InfoField label="Last Revision" value={employee.lastRevision} />
            <InfoField label="Next Review" value={employee.nextReview} />
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-muted-foreground mb-4">Salary History</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salaryHistory}>
                <defs>
                  <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e1634a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#e1634a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="year" stroke="#414240" />
                <YAxis stroke="#414240" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="salary"
                  stroke="#e1634a"
                  strokeWidth={3}
                  fill="url(#salaryGrad)"
                  dot={{ fill: '#e1634a', r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Documents */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>Documents and Records</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DocumentItem name="Offer Letter" employee={employee} />
            <DocumentItem name="Employment Contract" employee={employee} />
            <DocumentItem name={`Performance Review - ${new Date().getFullYear() - 1}`} employee={employee} />
            <DocumentItem name={`Salary Slip - March ${new Date().getFullYear()}`} employee={employee} />
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Behavioral Intelligence */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 shadow-md h-full">
            <h2 className="text-xl mb-4" style={{ fontWeight: 600 }}>Behavioral Intelligence</h2>
            <div className="space-y-4">
              <BehaviorItem label="Communication Style" value={behavioral.communicationStyle} color="bg-chart-1" />
              <BehaviorItem label="Personality Traits" value={behavioral.personalityTraits} color="bg-chart-2" />
              <BehaviorItem label="Motivation Drivers" value={behavioral.motivationDrivers} color="bg-chart-3" />
              <BehaviorItem label="Feedback Preference" value={behavioral.feedbackPreference} color="bg-chart-4" />
              <BehaviorItem label="Collaboration Style" value={behavioral.collaborationStyle} color="bg-chart-5" />
            </div>
          </Card>
        </motion.div>

        {/* Sentiment Analytics */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 shadow-md h-full">
            <h2 className="text-xl mb-4" style={{ fontWeight: 600 }}>Sentiment Analytics</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-accent rounded-lg">
                <div className="text-3xl" style={{ fontWeight: 600, color: '#e1634a' }}>{employee.sentiment}</div>
                <div className="text-sm text-muted-foreground">Current Score</div>
              </div>
              <div className="text-center p-4 bg-accent rounded-lg">
                <div className="text-3xl" style={{ fontWeight: 600, color: '#6b9080' }}>75/25</div>
                <div className="text-sm text-muted-foreground">Positive/Negative</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={sentimentTrend}>
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
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#e1634a"
                  strokeWidth={2}
                  fill="url(#sentimentProfileGrad)"
                  dot={{ fill: '#e1634a', r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Engagement Metrics */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>Engagement Metrics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {engagementMetrics.map((item, index) => (
              <CircularProgress key={index} score={item.score} fill={item.fill} metric={item.metric} />
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Communication Insights */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>Communication Insights</h2>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm text-muted-foreground mb-2">Top Topics</h3>
              <div className="flex flex-wrap gap-2">
                {communication.topTopics.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-accent rounded-full text-sm">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground mb-2">Concerns Raised</h3>
              <div className="flex flex-wrap gap-2">
                {communication.concernsRaised.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground mb-2">Career Interests</h3>
              <div className="flex flex-wrap gap-2">
                {communication.careerInterests.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground mb-2">Recent Topics</h3>
              <div className="flex flex-wrap gap-2">
                {communication.recentTopics.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-accent rounded-full text-sm">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Meeting Timeline */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>Meeting Timeline</h2>
          </div>
          <div className="space-y-4">
            {meetings.map((meeting, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full ${meeting.color} mt-1.5`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ fontWeight: 500 }}>{meeting.date}</span>
                    <span className="text-xs text-muted-foreground">Sentiment: {meeting.sentiment}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{meeting.topic}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Risk Indicators */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>Risk Indicators</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {risks.map((r, i) => (
              <RiskCard key={i} label={r.label} level={r.level} color={r.color} />
            ))}
          </div>
        </Card>
      </motion.div>

      {/* AI Insights */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 shadow-md bg-gradient-to-br from-primary/5 to-accent">
          <h2 className="text-xl mb-4" style={{ fontWeight: 600 }}>AI-Generated Insights</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <TrendingDown className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <span>{employee.name} has shown declining sentiment in the last two meetings (from 80 to {employee.sentiment}).</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
              <span>Strong interest in technical leadership roles. Consider for upcoming Tech Lead position.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <span>Workload pressure mentioned in recent discussions. Recommend workload assessment.</span>
            </li>
            <li className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>High engagement with mentoring activities. Potential candidate for formal mentorship program.</span>
            </li>
          </ul>
        </Card>
      </motion.div>

      {/* Conversation Preparation */}
      <motion.div
        variants={scrollVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 shadow-md border-2 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-primary" />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>Conversation Preparation</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm mb-2" style={{ fontWeight: 600 }}>Suggested Talking Points</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Acknowledge recent project achievements and technical contributions</li>
                <li>• Discuss workload concerns and explore redistribution options</li>
                <li>• Explore career aspirations in technical leadership</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm mb-2" style={{ fontWeight: 600 }}>Questions to Ask</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• How are you feeling about your current workload and project priorities?</li>
                <li>• What areas of technical leadership interest you most?</li>
                <li>• Is there any support you need from the team or management?</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm mb-2" style={{ fontWeight: 600 }}>Follow-ups from Previous Conversations</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• February: Discussed career growth timeline - check on progress toward Tech Lead role</li>
                <li>• January: Completed major project - acknowledge impact and learnings</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function InfoField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm mt-1 ${highlight ? 'text-primary' : ''}`} style={highlight ? { fontWeight: 600 } : {}}>
        {value}
      </div>
    </div>
  );
}

function DocumentItem({ name, employee }: { name: string; employee?: Employee }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const PRI = '#e1634a';

      const fill = (hex: string) => doc.setFillColor(hex);
      const txt = (hex: string) => doc.setTextColor(hex);
      const draw = (hex: string) => doc.setDrawColor(hex);
      const white = () => doc.setTextColor(255, 255, 255);

      // Header Banner
      fill(PRI);
      doc.rect(0, 0, W, 110, 'F');
      
      white();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('SAGE - CONFIDENTIAL DOCUMENT', 40, 45);

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(name, 40, 75);

      // Body
      const employeeName = employee?.name || 'Employee';
      const docDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      txt('#1a1a1a');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Employee: ${employeeName}`, 40, 160);

      if (employee) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        txt('#555555');
        doc.text(`ID: ${employee.employeeId}  |  Department: ${employee.department}`, 40, 184);
        doc.text(`Role: ${employee.role}  |  Location: ${employee.location}`, 40, 204);
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      txt('#333333');
      
      const contentText = `This document ("${name}") serves as a placeholder record for ${employeeName}. ` +
        `This section will routinely embed officially verified employee files retrieved from ` +
        `the secured organizational database cluster. Since another organizational division is currently ` +
        `structuring the backend database APIs, this downloadable file validates the functional downloading integration.\n\n` +
        `Verification Date: ${docDate}\n` +
        `System Ref: SAGE_doc_${employee?.id || 'XX'}_${Date.now().toString().slice(-6)}`;
        
      const lines = doc.splitTextToSize(contentText, W - 80);
      doc.text(lines, 40, 250);

      // Footer
      draw('#eeeeee');
      doc.setLineWidth(1);
      doc.line(40, H - 70, W - 40, H - 70);

      txt(PRI);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SAGE', 40, H - 45);

      txt('#aaaaaa');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Strategic Advisor for Growth and Engagement', 40, H - 30);
      
      const fileName = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${employeeName.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/70 transition-colors">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm">{name}</span>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleDownload} disabled={isDownloading}>View</Button>
        <Button variant="ghost" size="sm" className="h-8 pr-3 pl-3 text-xs" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

function BehaviorItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-1 h-12 ${color} rounded-full`} />
      <div>
        <div className="text-sm" style={{ fontWeight: 500 }}>{label}</div>
        <div className="text-sm text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}

function RiskCard({ label, level, color }: { label: string; level: string; color: string }) {
  return (
    <div className="p-4 bg-accent rounded-lg text-center">
      <div className={`w-3 h-3 ${color} rounded-full mx-auto mb-2`} />
      <div className="text-sm" style={{ fontWeight: 500 }}>{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{level}</div>
    </div>
  );
}
