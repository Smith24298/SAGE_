import React, { useEffect, useState } from 'react';

import { Card } from '../components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Plus,
  X,
  Mic,
  Smile,
  Presentation,
  CheckCircle2,
} from 'lucide-react';
import {
  createCalendarEvent,
  getCalendarEvents,
  getCurrentSessionId,
  type CalendarEventRecord,
} from '@/lib/api';

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

function formatEventTime(time: string): string {
  const parsed = new Date(`1970-01-01T${time.length === 5 ? `${time}:00` : time}`);
  if (Number.isNaN(parsed.getTime())) {
    return time;
  }
  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toFriendlyGoogleSyncError(errorText: string): string {
  const text = String(errorText || '').trim();
  const lower = text.toLowerCase();

  if (!text) {
    return 'Google Calendar sync failed due to an unknown error.';
  }

  if (lower.includes('calendar api has not been used') || lower.includes('accessnotconfigured')) {
    return 'Google Calendar API is disabled for your Google Cloud project. Enable calendar-json.googleapis.com, wait a few minutes, then retry.';
  }

  if (lower.includes('service account file not found')) {
    return 'Service account key file is missing or path is incorrect. Update backend env GOOGLE_SERVICE_ACCOUNT_FILE or FIREBASE_ADMIN_SDK_PATH.';
  }

  if (lower.includes('forbidden') || lower.includes('insufficient permissions')) {
    return 'Service account does not have permission to create events. Share the target calendar with the service-account email and grant edit rights.';
  }

  return text;
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
    status: computeStatus(record.date, record.time),
  };
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    type: 'Fun' as EventType,
    description: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSessionEvents() {
      const activeSessionId = getCurrentSessionId();
      setSessionId(activeSessionId);
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const activeSessionId = sessionId || getCurrentSessionId();
      if (!sessionId) {
        setSessionId(activeSessionId);
      }

      const created = await createCalendarEvent({
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time,
        location: formData.location.trim(),
        description: formData.description.trim(),
        type: formData.type,
        attendees: 0,
        session_id: activeSessionId,
        sync_to_google: syncToGoogle,
      });

      const createdEvent = toEvent(created);
      setEvents((prev) => [createdEvent, ...prev.filter((event) => event.id !== createdEvent.id)]);

      setIsModalOpen(false);
      setFormData({
        title: '',
        date: '',
        time: '',
        location: '',
        type: 'Fun',
        description: '',
      });

      if (syncToGoogle && created.event_link) {
        window.open(created.event_link, '_blank', 'noopener,noreferrer');
      } else if (syncToGoogle && created.google_sync_error) {
        alert(`Event saved to dashboard and MongoDB, but Google Calendar sync failed: ${toFriendlyGoogleSyncError(created.google_sync_error)}`);
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to schedule event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingEvents = events
    .filter((event) => event.status === 'upcoming')
    .sort(
      (a, b) =>
        parseEventDateTime(a.date, a.time).getTime() -
        parseEventDateTime(b.date, b.time).getTime(),
    );
  const pastEvents = events
    .filter((event) => event.status === 'past')
    .sort(
      (a, b) =>
        parseEventDateTime(b.date, b.time).getTime() -
        parseEventDateTime(a.date, a.time).getTime(),
    );

  const getEventIcon = (type: EventType) => {
    switch(type) {
      case 'Pitch': return <Presentation className="w-5 h-5" />;
      case 'Townhall': return <Mic className="w-5 h-5" />;
      case 'Fun': return <Smile className="w-5 h-5" />;
      default: return <CalendarIcon className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: EventType) => {
    switch(type) {
      case 'Pitch': return 'text-primary bg-primary/10 border-primary/20';
      case 'Townhall': return 'text-chart-2 bg-chart-2/10 border-chart-2/20';
      case 'Fun': return 'text-chart-4 bg-chart-4/10 border-chart-4/20';
      default: return 'text-muted-foreground bg-accent border-border';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Engagement Events</h1>
          <p className="text-muted-foreground mt-1">Manage and track company gatherings, townhalls, and activities</p>
          <p className="text-xs text-muted-foreground mt-2">
            Session: {sessionId || 'loading...'}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upcoming Events Section */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
            <CalendarIcon className="w-5 h-5 text-chart-2" />
            <h2 className="text-2xl font-semibold text-foreground">Upcoming Events</h2>
          </div>
          
          <div className="space-y-4">
            {isLoadingEvents ? (
              <div className="text-muted-foreground text-center py-8 bg-card border border-border rounded-xl">Loading events...</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-muted-foreground text-center py-8 bg-card border border-border rounded-xl">No upcoming events scheduled.</div>
            ) : (
              upcomingEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`p-5 flex flex-col gap-4 shadow-sm border ${getEventColor(event.type).split(' ')[2]}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className={`p-3 rounded-xl flex-shrink-0 ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getEventColor(event.type)}`}>
                            {event.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm pt-4 border-t border-border/50">
                       <div className="flex items-center gap-2 text-muted-foreground">
                         <CalendarIcon className="w-4 h-4 shrink-0" />
                         <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {formatEventTime(event.time)}</span>
                       </div>
                       <div className="flex items-center gap-2 text-muted-foreground justify-end">
                         <Users className="w-4 h-4 shrink-0" />
                         <span>{event.attendees} Registered</span>
                       </div>
                       <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                         <MapPin className="w-4 h-4 shrink-0" />
                         <span>{event.location}</span>
                       </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Past Events Section */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold text-foreground">Past Events</h2>
          </div>
          
          <div className="space-y-4 opacity-80">
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

      {/* Create Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                <h3 className="text-xl font-bold text-foreground">Schedule New Event</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Event Title</label>
                  <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Q3 Townhall"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                    <input 
                      required
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Time</label>
                    <input 
                      required
                      type="time" 
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Location / Join Link</label>
                  <input 
                    required
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Physical room or Meeting URL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Event Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as EventType})}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="Townhall">Townhall</option>
                    <option value="Pitch">Presentation / Pitch</option>
                    <option value="Fun">Fun / Team Building</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                  <textarea 
                    required
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                    placeholder="What is this event about?"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-border mt-6">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={syncToGoogle} 
                      onChange={e => setSyncToGoogle(e.target.checked)} 
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
                    />
                    Add to my Google Calendar
                  </label>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-foreground bg-accent hover:bg-accent/80 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? 'Scheduling...' : 'Schedule Event'}
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
