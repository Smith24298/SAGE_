import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CheckCircle2,
  Mic,
  Smile,
  Presentation,
} from 'lucide-react';
import { getCalendarEvents, getCurrentSessionId, type CalendarEventRecord } from '@/lib/api';

type EventType = 'Pitch' | 'Townhall' | 'Fun';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: EventType;
  description: string;
  status: 'upcoming' | 'past';
}

function toEventType(value: string): EventType {
  if (value === 'Pitch' || value === 'Townhall' || value === 'Fun') {
    return value;
  }
  return 'Fun';
}

function parseEventDateTime(date: string, time: string): Date {
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
  const parsed = new Date(`${date}T${normalizedTime}`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return new Date(date);
}

function computeStatus(date: string, time: string): 'upcoming' | 'past' {
  const eventDateTime = parseEventDateTime(date, time);
  return eventDateTime.getTime() >= Date.now() ? 'upcoming' : 'past';
}

function toEvent(record: CalendarEventRecord): Event {
  return {
    id: record.id,
    title: record.title,
    date: record.date,
    time: record.time,
    location: record.location,
    attendees: record.attendees,
    type: toEventType(record.type),
    description: record.description,
    // Always trust the backend status — if manually completed, it will be 'past'
    // even if the event's date/time hasn't passed yet.
    status: record.status === 'past' ? 'past' : computeStatus(record.date, record.time),
  };
}

const getEventIcon = (type: string) => {
  switch (type) {
    case 'Pitch': return <Presentation className="w-6 h-6 text-blue-500" />;
    case 'Fun': return <Smile className="w-6 h-6 text-green-500" />;
    case 'Townhall': return <Mic className="w-6 h-6 text-purple-500" />;
    default: return <CalendarIcon className="w-6 h-6" />;
  }
};

export function PastEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSessionEvents() {
      const activeSessionId = getCurrentSessionId();
      const apiEvents = await getCalendarEvents(activeSessionId, 200);

      if (!isMounted) {
        return;
      }

      setEvents(apiEvents.map(toEvent));
      setIsLoadingEvents(false);
    }

    loadSessionEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const pastEvents = events
    .filter((event) => event.status === 'past')
    .sort(
      (a, b) =>
        parseEventDateTime(b.date, b.time).getTime() -
        parseEventDateTime(a.date, a.time).getTime(),
    );

  return (
    <div className="py-2.5 px-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Past Events & History</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Review the history of previous engagements, townhalls, and corporate events.
        </p>
      </div>

      <section>
        <div className="space-y-4">
          {isLoadingEvents ? (
            <div className="text-muted-foreground text-center py-8 bg-card border border-border rounded-xl">Loading events...</div>
          ) : pastEvents.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 bg-card border border-border rounded-xl">No past events recorded.</div>
          ) : (
            pastEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-5 flex flex-col gap-4 shadow-sm border border-border/50 bg-background/50">
                  <div className="flex justify-between items-start gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 bg-muted text-muted-foreground`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-muted text-muted-foreground">
                          {event.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{event.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-3 text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.attendees} Attended</span>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
