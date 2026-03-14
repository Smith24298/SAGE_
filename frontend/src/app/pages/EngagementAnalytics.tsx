import { useEffect, useState } from "react";

import { Card } from "../components/ui/card";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { motion } from "motion/react";
import {
  getEngagementAnalytics,
  type EngagementAnalyticsPayload,
} from "@/lib/api";

const scrollVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const STATIC_ENGAGEMENT_TREND = [
  { month: "Oct", score: 68, participation: 71, target: 75 },
  { month: "Nov", score: 70, participation: 73, target: 75 },
  { month: "Dec", score: 72, participation: 74, target: 75 },
  { month: "Jan", score: 74, participation: 76, target: 75 },
  { month: "Feb", score: 76, participation: 78, target: 75 },
  { month: "Mar", score: 79, participation: 81, target: 75 },
];

export function EngagementAnalytics() {
  const [analytics, setAnalytics] = useState<EngagementAnalyticsPayload | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      let data: EngagementAnalyticsPayload | null = null;
      try {
        data = await getEngagementAnalytics();
      } catch (error) {
        // Extra safety: getEngagementAnalytics already catches, but never let this bubble
        console.error("EngagementAnalytics load error:", error);
        data = null;
      }
      if (!isMounted) {
        return;
      }
      setAnalytics(data);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const overallEngagement = analytics?.kpis.overallEngagementPct ?? 0;
  const highlyEngaged = analytics?.kpis.highlyEngagedPct ?? 0;
  const atRisk = analytics?.kpis.atRiskPct ?? 0;

  const engagementTrend = STATIC_ENGAGEMENT_TREND;
  const sixMonthDelta =
    engagementTrend[engagementTrend.length - 1].score - engagementTrend[0].score;
  const engagementFactors = analytics?.engagementFactors ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>
          Engagement Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Track and analyze employee engagement metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Overall Engagement",
            value: `${Math.round(overallEngagement)}%`,
            sub: "Based on latest stored sentiment",
            color: "text-primary",
            subColor: "text-muted-foreground",
          },
          {
            label: "Highly Engaged",
            value: `${Math.round(highlyEngaged)}%`,
            sub: "Employees with sentiment ≥ 80",
            color: "text-primary",
            subColor: "text-muted-foreground",
          },
          {
            label: "At Risk",
            value: `${Math.round(atRisk)}%`,
            sub: "Employees marked high risk",
            color: "text-destructive",
            subColor: "text-destructive",
          },
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
              <div
                className={`text-3xl mt-2 ${item.color}`}
                style={{ fontWeight: 600 }}
              >
                {item.value}
              </div>
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
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                Engagement Trend (6 Months)
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  sixMonthDelta >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
                style={{ fontWeight: 600 }}
              >
                {sixMonthDelta >= 0 ? "+" : ""}
                {sixMonthDelta} pts
              </span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart
                data={engagementTrend}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="engagementTrendGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#e1634a" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#e1634a" stopOpacity={0.04} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="#d9d9d9"
                />
                <ReferenceArea y1={0} y2={69} fill="#d4183d" fillOpacity={0.06} />
                <ReferenceLine
                  y={75}
                  stroke="#6b9080"
                  strokeDasharray="6 6"
                  label="Target 75"
                />

                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis domain={[60, 85]} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(65,66,64,0.12)",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Engagement"
                  stroke="#e1634a"
                  strokeWidth={3}
                  fill="url(#engagementTrendGrad)"
                  dot={{ r: 4, fill: "#e1634a" }}
                  activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="participation"
                  name="Participation"
                  stroke="#6b9080"
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          variants={scrollVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 shadow-md">
            <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>
              Engagement Factors
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={engagementFactors}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#e1634a"
                  fill="#e1634a"
                  fillOpacity={0.6}
                />
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
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 shadow-md">
          <h3 className="text-lg mb-4" style={{ fontWeight: 600 }}>
            Engagement Drivers
          </h3>
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
                    transition={{
                      duration: 0.8,
                      delay: index * 0.08 + 0.2,
                      ease: "easeOut",
                    }}
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
