import { Card } from '../components/ui/card';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';

const upcomingMeetings = [
  { date: 'March 15, 2026', time: '2:00 PM', title: '1:1 with Sarah Johnson', sentiment: 'Prepare for workload discussion', color: 'bg-yellow-500' },
  { date: 'March 16, 2026', time: '10:00 AM', title: 'Engineering Team Sync', sentiment: 'Team morale is positive', color: 'bg-green-500' },
  { date: 'March 17, 2026', time: '3:00 PM', title: 'Performance Review - David Kim', sentiment: 'Positive trajectory', color: 'bg-green-500' },
  { date: 'March 18, 2026', time: '11:00 AM', title: 'HR Strategy Meeting', sentiment: 'New initiatives planning', color: 'bg-blue-500' },
];

const recentMeetings = [
  { date: 'March 12, 2026', attendees: 8, avgSentiment: 78, topics: ['Q1 Goals', 'Team Building'] },
  { date: 'March 10, 2026', attendees: 5, avgSentiment: 82, topics: ['Project Review', 'Timeline'] },
  { date: 'March 8, 2026', attendees: 12, avgSentiment: 71, topics: ['Workload', 'Resources'] },
  { date: 'March 5, 2026', attendees: 6, avgSentiment: 85, topics: ['Career Development', 'Training'] },
];

export function MeetingIntelligence() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Meeting Intelligence</h1>
        <p className="text-muted-foreground mt-1">AI-powered insights from your conversations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg" style={{ fontWeight: 600 }}>Upcoming Meetings</h3>
          </div>
          <div className="space-y-4">
            {upcomingMeetings.map((meeting, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-accent rounded-lg hover:bg-accent/70 transition-colors">
                <div className={`w-2 h-2 rounded-full ${meeting.color} mt-2 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm" style={{ fontWeight: 600 }}>{meeting.title}</span>
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
                  <p className="text-xs text-muted-foreground mt-2 italic">{meeting.sentiment}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg" style={{ fontWeight: 600 }}>Recent Meeting Insights</h3>
          </div>
          <div className="space-y-4">
            {recentMeetings.map((meeting, index) => (
              <div key={index} className="p-4 bg-accent rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm" style={{ fontWeight: 600 }}>{meeting.date}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Sentiment: {meeting.avgSentiment}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {meeting.attendees} attendees
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {meeting.topics.map((topic, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-background rounded">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-md bg-gradient-to-br from-primary/5 to-accent">
        <h3 className="text-lg mb-3" style={{ fontWeight: 600 }}>AI Recommendations</h3>
        <ul className="space-y-2 text-sm">
          <li>• Schedule follow-up with Sarah Johnson to address workload concerns raised in last meeting</li>
          <li>• Engineering team sentiment is trending positive - good time for new initiatives</li>
          <li>• Career development discussions showing high engagement - consider formalizing mentorship program</li>
          <li>• Resource concerns mentioned in March 8th meeting - review team capacity allocation</li>
        </ul>
      </Card>
    </div>
  );
}
