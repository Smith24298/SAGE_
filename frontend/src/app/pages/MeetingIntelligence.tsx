import { Card } from "../components/ui/card";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  FileText,
  Zap,
  CheckCircle2,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getMeetingSummaries, getMeetingSummary } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";

const upcomingMeetings = [
  {
    date: "March 15, 2026",
    time: "2:00 PM",
    title: "1:1 with Sarah Johnson",
    sentiment: "Prepare for workload discussion",
    color: "bg-yellow-500",
  },
  {
    date: "March 16, 2026",
    time: "10:00 AM",
    title: "Engineering Team Sync",
    sentiment: "Team morale is positive",
    color: "bg-green-500",
  },
  {
    date: "March 17, 2026",
    time: "3:00 PM",
    title: "Performance Review - David Kim",
    sentiment: "Positive trajectory",
    color: "bg-green-500",
  },
  {
    date: "March 18, 2026",
    time: "11:00 AM",
    title: "HR Strategy Meeting",
    sentiment: "New initiatives planning",
    color: "bg-blue-500",
  },
];

export function MeetingIntelligence() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    async function fetchSummaries() {
      const data = await getMeetingSummaries(10);
      setSummaries(data);
      setIsLoading(false);
    }
    fetchSummaries();
  }, []);

  useEffect(() => {
    async function fetchMeetingDetail() {
      if (!selectedMeetingId) {
        setSelectedMeeting(null);
        return;
      }

      // Check if it's a static meeting ID
      if (selectedMeetingId.startsWith("static-")) {
        const staticMeeting = staticRecentMeetings.find(
          (m) => m._id === selectedMeetingId,
        );
        setSelectedMeeting(staticMeeting || null);
        return;
      }

      setIsDetailLoading(true);
      try {
        const data = await getMeetingSummary(selectedMeetingId);
        setSelectedMeeting(data);
      } catch (error) {
        console.error("Failed to fetch meeting detail:", error);
        setSelectedMeeting(null);
      } finally {
        setIsDetailLoading(false);
      }
    }
    fetchMeetingDetail();
  }, [selectedMeetingId]);

  const staticRecentMeetings = [
    {
      _id: "static-1",
      date: "March 12, 2026",
      attendees: 8,
      avgSentiment: 78,
      topics: ["Q1 Goals", "Team Building"],
      summary:
        "The team discussed the upcoming Q1 goals and participated in a series of team-building exercises. Overall morale is high.",
      key_insights: [
        "Strong alignment on Q1 objectives",
        "Team members are enthusiastic about new collaborative tools",
      ],
      action_items: [
        "Finalize the Q1 roadmap by next Friday",
        "Schedule the next team-building session for April",
      ],
      overall_sentiment: "positive",
      transcript: "Static transcript for demo...",
    },
  ];

  const displayRecentMeetings =
    summaries.length > 0 ? summaries : staticRecentMeetings;

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>
          Meeting Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered insights from your conversations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-md h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg" style={{ fontWeight: 600 }}>
              Upcoming Meetings
            </h3>
          </div>
          <div className="space-y-4">
            {upcomingMeetings.map((meeting, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-accent rounded-lg hover:bg-accent/70 transition-colors cursor-pointer"
              >
                <div
                  className={`w-2 h-2 rounded-full ${meeting.color} mt-2 flex-shrink-0`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm" style={{ fontWeight: 600 }}>
                      {meeting.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {meeting.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {meeting.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {meeting.sentiment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg" style={{ fontWeight: 600 }}>
              Recent Meeting Insights
            </h3>
          </div>
          <div className="space-y-4">
            {displayRecentMeetings.map((meeting, index) => (
              <div
                key={index}
                onClick={() => setSelectedMeetingId(meeting._id)}
                className={`p-4 bg-accent rounded-lg hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer border border-transparent ${selectedMeetingId === meeting._id ? "ring-2 ring-primary border-primary/20 shadow-lg" : ""}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm" style={{ fontWeight: 600 }}>
                    {meeting.date}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Sentiment: {meeting.avgSentiment}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {meeting.attendees} attendees
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {meeting.topics.map((topic: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-background rounded border border-border/50"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {selectedMeetingId && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="mt-6"
          >
            <Card className="p-0 shadow-xl overflow-hidden border-2 border-primary/20">
              <div className="bg-primary/5 p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <Zap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      Meeting Intelligence Report
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Generated by SAGE AI • {selectedMeeting?.date}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMeetingId(null)}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {isDetailLoading ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">
                      Analyzing transcript...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Left Column: Summary & Insights */}
                    <div className="lg:col-span-2 space-y-8">
                      <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Executive Summary
                        </h4>
                        <p className="text-lg leading-relaxed text-foreground/90">
                          {selectedMeeting?.summary}
                        </p>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-accent/50 p-5 rounded-xl border border-border">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Key Insights
                          </h4>
                          <ul className="space-y-3">
                            {selectedMeeting?.key_insights?.map(
                              (insight: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-sm flex items-start gap-2"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                  {insight}
                                </li>
                              ),
                            )}
                          </ul>
                        </section>

                        <section className="bg-green-500/5 p-5 rounded-xl border border-green-500/10">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-green-600 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Action Items
                          </h4>
                          <ul className="space-y-3">
                            {selectedMeeting?.action_items?.map(
                              (item: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-sm flex items-start gap-2"
                                >
                                  <div className="w-4 h-4 border border-green-500/30 rounded mt-0.5 shrink-0" />
                                  {item}
                                </li>
                              ),
                            )}
                          </ul>
                        </section>
                      </div>

                      <section>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Original Transcript
                        </h4>
                        <div className="bg-accent/30 p-6 rounded-xl border border-border max-h-[300px] overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedMeeting?.transcript}
                        </div>
                      </section>
                    </div>

                    {/* Right Column: Sentiment & Participants */}
                    <div className="space-y-6">
                      <section className="bg-card p-5 rounded-xl border-2 border-primary/10 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                          Meeting Atmosphere
                        </h4>
                        <div className="flex flex-col items-center py-4">
                          <div className="text-4xl font-black text-primary mb-1">
                            {selectedMeeting?.avgSentiment}%
                          </div>
                          <div className="text-xs uppercase font-bold text-muted-foreground tracking-widest">
                            Overall Sentiment
                          </div>
                          <div className="mt-4 px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                            {selectedMeeting?.overall_sentiment}
                          </div>
                        </div>
                      </section>

                      <section className="bg-card p-5 rounded-xl border border-border shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                          Meeting Participants
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-2 bg-accent px-3 py-2 rounded-lg w-full">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">
                              {selectedMeeting?.attendees} Participants
                            </span>
                          </div>
                        </div>
                      </section>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-6 shadow-md bg-gradient-to-br from-primary/5 to-accent">
        <h3 className="text-lg mb-3" style={{ fontWeight: 600 }}>
          AI Recommendations
        </h3>
        <ul className="space-y-2 text-sm">
          <li>
            • Schedule follow-up with Sarah Johnson to address workload concerns
            raised in last meeting
          </li>
          <li>
            • Engineering team sentiment is trending positive - good time for
            new initiatives
          </li>
          <li>
            • Career development discussions showing high engagement - consider
            formalizing mentorship program
          </li>
          <li>
            • Resource concerns mentioned in March 8th meeting - review team
            capacity allocation
          </li>
        </ul>
      </Card>
    </div>
  );
}
