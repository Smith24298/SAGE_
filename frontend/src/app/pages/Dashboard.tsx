import { Card } from "../components/ui/card";
import {
  AreaChart,
  Area,
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
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Users,
  Heart,
  Zap,
  Calendar,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";
import {
  getCalendarEvents,
  getDashboardOverview,
  getMeetingSummaries,
  type CalendarEventRecord,
  type DashboardAttritionSlice,
  type DashboardDepartmentPoint,
  type DashboardOverview,
  type DashboardSentimentPoint,
} from "@/lib/api";

/** Triggers Recharts' built-in bar rise animation when it scrolls into view */
function useScrollAnimationKey() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    if (isInView) setAnimKey((k) => k + 1);
  }, [isInView]);
  return { ref, animKey };
}

const DEFAULT_SENTIMENT_DATA: DashboardSentimentPoint[] = [
  { month: "Oct", score: 72 },
  { month: "Nov", score: 68 },
  { month: "Dec", score: 75 },
  { month: "Jan", score: 71 },
  { month: "Feb", score: 78 },
  { month: "Mar", score: 74 },
];

const DEFAULT_DEPARTMENT_DATA: DashboardDepartmentPoint[] = [
  { department: "Engineering", stress: 65, engagement: 82 },
  { department: "Sales", stress: 58, engagement: 75 },
  { department: "Marketing", stress: 52, engagement: 88 },
  { department: "HR", stress: 45, engagement: 90 },
  { department: "Finance", stress: 60, engagement: 78 },
];

const DEFAULT_ATTRITION_PREDICTION: DashboardAttritionSlice[] = [
  { name: "Low Risk", value: 65 },
  { name: "Medium Risk", value: 23 },
  { name: "High Risk", value: 12 },
];

const COLORS = ["#e1634a", "#6b9080", "#a4b8c4", "#f4a261"];

const scrollVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

function parseDashboardEventDateTime(date: string, time: string): Date {
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  const parsed = new Date(`${date}T${normalizedTime}`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date(date);
}

function formatDashboardEventTime(time: string): string {
  const parsed = new Date(`1970-01-01T${time.length === 5 ? `${time}:00` : time}`);
  if (Number.isNaN(parsed.getTime())) {
    return time;
  }
  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDashboardEventStatus(event: CalendarEventRecord): "upcoming" | "past" {
  return parseDashboardEventDateTime(event.date, event.time).getTime() >= Date.now()
    ? "upcoming"
    : "past";
}

function getDashboardEventTimestamp(event: CalendarEventRecord): number {
  const eventTime = parseDashboardEventDateTime(event.date, event.time).getTime();
  if (!Number.isNaN(eventTime)) {
    return eventTime;
  }

  const createdAtTime = event.created_at ? new Date(event.created_at).getTime() : 0;
  return Number.isNaN(createdAtTime) ? 0 : createdAtTime;
}

function MeetingInsights() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      const [meetingData, eventData] = await Promise.all([
        getMeetingSummaries(3),
        getCalendarEvents(undefined, 200),
      ]);

      if (!isMounted) {
        return;
      }

      setSummaries(Array.isArray(meetingData) ? meetingData : []);
      setAllEvents(Array.isArray(eventData) ? eventData : []);
      setIsLoading(false);
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const staticMeetings = [
    {
      date: "March 12, 2026",
      attendees: 8,
      avgSentiment: 78,
      topics: ["Q1 Goals", "Team Building"],
    },
    {
      date: "March 10, 2026",
      attendees: 5,
      avgSentiment: 82,
      topics: ["Project Review", "Timeline"],
    },
  ];

  const displayMeetings = summaries.length > 0 ? summaries : staticMeetings;
  const displayRecentEvents = [...allEvents]
    .sort((a, b) => getDashboardEventTimestamp(b) - getDashboardEventTimestamp(a))
    .slice(0, 5);
  const displayOtherEvents = [...allEvents]
    .sort((a, b) => getDashboardEventTimestamp(b) - getDashboardEventTimestamp(a))
    .slice(5);

  return (
    <motion.div
      variants={scrollVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg" style={{ fontWeight: 600 }}>
            {displayRecentEvents.length > 0
              ? "Recent 5 Events"
              : "Recent Meeting Activity"}
          </h3>
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Loading activity...</p>
            </div>
          ) : displayRecentEvents.length > 0 ? (
            <>
              {displayRecentEvents.map((event, index) => (
                <div
                  key={`${event.id}-${index}`}
                  className="p-4 bg-accent rounded-lg border border-border/50"
                >
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <span className="text-sm font-semibold">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at {formatDashboardEventTime(event.time)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        getDashboardEventStatus(event) === "upcoming"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {event.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-3">{event.title}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.attendees} registered
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                  </div>
                </div>
              ))}

              {displayOtherEvents.length > 0 && (
                <div className="pt-3 border-t border-border/60">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Other Events ({displayOtherEvents.length})
                  </p>
                  <div className="space-y-2">
                    {displayOtherEvents.slice(0, 3).map((event, index) => (
                      <div
                        key={`other-${event.id}-${index}`}
                        className="flex items-center justify-between text-xs bg-background rounded-md px-3 py-2 border border-border/50"
                      >
                        <span className="font-medium truncate pr-3">{event.title}</span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {displayOtherEvents.length > 3 && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      + {displayOtherEvents.length - 3} more in Events page
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            displayMeetings.map((meeting, index) => (
              <div
                key={index}
                className="p-4 bg-accent rounded-lg border border-border/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold">{meeting.date}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      meeting.avgSentiment > 80
                        ? "bg-green-100 text-green-700"
                        : meeting.avgSentiment > 70
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {meeting.avgSentiment}% Sentiment
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {meeting.attendees} participants
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meeting.topics.map((topic: string, i: number) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-md"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
          {!isLoading && displayRecentEvents.length === 0 && displayMeetings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No recent meeting data</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function DeptStressBarChart({ departmentData }: { departmentData: DashboardDepartmentPoint[] }) {
  const { ref, animKey } = useScrollAnimationKey();
  return (
    <motion.div
      ref={ref}
      variants={scrollVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>
          Department Stress & Engagement
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart key={animKey} data={departmentData}>
            <defs>
              <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f4a261" stopOpacity={1} />
                <stop offset="100%" stopColor="#f4a261" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient
                id="engagementGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
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
              dataKey="stress"
              fill="url(#stressGradient)"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="engagement"
              fill="url(#engagementGradient)"
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

function StrategicInsights({
  latestInsight,
  recommendation,
}: {
  latestInsight: string;
  recommendation: string;
}) {

  return (
    <motion.div
      variants={scrollVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 shadow-md bg-gradient-to-br from-card to-accent">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg mb-2" style={{ fontWeight: 600 }}>
              Strategic Workforce Insights
            </h3>
            <div className="space-y-4">
              <div className="bg-background/60 p-4 rounded-lg">
                <span className="text-xs uppercase font-bold text-muted-foreground">
                  Latest AI Insight
                </span>
                <p className="mt-1 text-sm">{latestInsight}</p>
              </div>
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <span className="text-xs uppercase font-bold text-primary">
                  Recommendation
                </span>
                <p className="mt-1 text-sm font-medium">{recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function Dashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchOverview() {
      const data = await getDashboardOverview();
      if (!isMounted) {
        return;
      }
      setOverview(data);
    }

    fetchOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const sentimentData =
    overview?.sentimentTrend && overview.sentimentTrend.length > 0
      ? overview.sentimentTrend
      : DEFAULT_SENTIMENT_DATA;

  const departmentData =
    overview?.departmentStressEngagement && overview.departmentStressEngagement.length > 0
      ? overview.departmentStressEngagement
      : DEFAULT_DEPARTMENT_DATA;

  const attritionPrediction =
    overview?.attritionPrediction && overview.attritionPrediction.length > 0
      ? overview.attritionPrediction
      : DEFAULT_ATTRITION_PREDICTION;

  const totalEmployees = overview?.metrics.totalEmployees ?? 0;
  const companyEngagement = overview?.metrics.companyEngagement ?? 0;
  const attritionRisk = overview?.metrics.attritionRisk ?? 0;
  const workforceGrowth = overview?.metrics.workforceGrowth ?? 0;

  const strategicInsight =
    overview?.strategicInsight?.latestInsight ||
    "No recent strategic insight available yet. Upload meeting data to enrich this section.";
  const strategicRecommendation =
    overview?.strategicInsight?.recommendation ||
    "Continue collecting sentiment and engagement data for stronger recommendations.";

  const growthChange = `${workforceGrowth >= 0 ? "+" : ""}${workforceGrowth.toFixed(1)}%`;
  const workforceTrend: "up" | "down" = workforceGrowth >= 0 ? "up" : "down";
  const attritionTrend: "up" | "down" = attritionRisk > 20 ? "up" : "down";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Real-time insights into your organization's health
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Employees"
          value={String(totalEmployees)}
          change={growthChange}
          trend={workforceTrend}
          icon={Users}
          color="text-primary"
          delay={0}
        />
        <MetricCard
          title="Company Engagement"
          value={`${companyEngagement.toFixed(1)}%`}
          change={companyEngagement >= 70 ? "+healthy" : "needs attention"}
          trend="up"
          icon={Heart}
          color="text-chart-2"
          delay={0.05}
        />
        <MetricCard
          title="Attrition Risk"
          value={`${attritionRisk.toFixed(1)}%`}
          change={attritionRisk > 20 ? "high" : "stable"}
          trend={attritionTrend}
          icon={AlertCircle}
          color="text-destructive"
          delay={0.1}
        />
        <MetricCard
          title="Workforce Growth"
          value={`${workforceGrowth.toFixed(1)}%`}
          change={growthChange}
          trend={workforceTrend}
          icon={TrendingUp}
          color="text-chart-4"
          delay={0.15}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trend */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>
              Organization Sentiment Trend
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={sentimentData}>
                <defs>
                  <linearGradient
                    id="sentimentGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                  fill="url(#sentimentGradient)"
                  dot={{ fill: "#e1634a", r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Attrition Prediction Distribution */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>
              Attrition Prediction
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={attritionPrediction}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {attritionPrediction.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Department Engagement Comparison */}
        <DeptStressBarChart departmentData={departmentData} />

        {/* Meeting Activity Insights */}
        <MeetingInsights />

        {/* Department Sentiment Comparison */}
        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>
              Department Sentiment Comparison
            </h3>
            <div className="space-y-4">
              {departmentData.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between"
                  variants={scrollVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.department}</span>
                      {item.engagement < 70 ? (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-chart-2" />
                      )}
                    </div>
                    <div className="mt-1 h-2 bg-accent rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.engagement}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.8,
                          delay: index * 0.1 + 0.3,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-sm text-muted-foreground">
                    {item.engagement}%
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights */}
      <StrategicInsights
        latestInsight={strategicInsight}
        recommendation={strategicRecommendation}
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: any;
  color: string;
  delay: number;
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  delay,
}: MetricCardProps) {
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
            <p className="text-2xl mt-1" style={{ fontWeight: 600 }}>
              {value}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {trend === "up" && (
                <TrendingUp className="w-3 h-3 text-chart-2" />
              )}
              {trend === "down" && (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span
                className={`text-xs ${trend === "up" ? "text-chart-2" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}
              >
                {change}
              </span>
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-full bg-accent flex items-center justify-center ${color}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
