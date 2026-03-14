import React, { useState } from 'react';

import { Card } from '../components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Clock, 
  Plus, 
  X,
  Mic,
  Smile,
  Presentation,
  CheckCircle2
} from 'lucide-react';

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

const INITIAL_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Q1 Product Pitch Presentations',
    date: '2026-03-25',
    time: '2:00 PM',
    location: 'Main Auditorium / Zoom',
    attendees: 120,
    type: 'Pitch',
    description: 'Quarterly pitch presentations from the product pods showcasing upcoming features.',
    status: 'upcoming'
  },
  {
    id: '2',
    title: 'Company Wide Townhall',
    date: '2026-04-02',
    time: '10:00 AM',
    location: 'Engineering Hall',
    attendees: 340,
    type: 'Townhall',
    description: 'Monthly all-hands meeting led by the CEO discussing company performance and roadmap.',
    status: 'upcoming'
  },
  {
    id: '3',
    title: 'Team Building: Escape Room',
    date: '2026-02-15',
    time: '4:00 PM',
    location: 'Downtown Escape Center',
    attendees: 15,
    type: 'Fun',
    description: 'Fun Friday event for the marketing team to boost engagement and morale.',
    status: 'past'
  },
  {
    id: '4',
    title: 'Annual Retreat Kickoff',
    date: '2025-12-10',
    time: '9:00 AM',
    location: 'Mountain Resort',
    attendees: 280,
    type: 'Fun',
    description: 'Kickoff presentation and team bonding for the end of year company retreat.',
    status: 'past'
  }
];

export function Events() {
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    type: 'Fun' as EventType,
    description: ''
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent: Event = {
      id: Date.now().toString(),
      ...formData,
      attendees: 0, // Starts with 0
      status: 'upcoming' // Assuming new events are in the future
    };

    if (syncToGoogle) {
      // Build the Google Calendar URL to redirect the user to
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour

      const formatGoogleDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
      };

      const googleCalUrl = new URL('https://calendar.google.com/calendar/render');
      googleCalUrl.searchParams.append('action', 'TEMPLATE');
      googleCalUrl.searchParams.append('text', formData.title);
      googleCalUrl.searchParams.append('dates', `${formatGoogleDate(startDateTime)}/${formatGoogleDate(endDateTime)}`);
      googleCalUrl.searchParams.append('details', formData.description);
      googleCalUrl.searchParams.append('location', formData.location);

      window.open(googleCalUrl.toString(), '_blank');
    }

    setEvents([newEvent, ...events]);
    setIsModalOpen(false);
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      type: 'Fun',
      description: ''
    });
  };

  const upcomingEvents = events.filter(e => e.status === 'upcoming').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastEvents = events.filter(e => e.status === 'past').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
            {upcomingEvents.length === 0 ? (
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
                         <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {event.time}</span>
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
            {pastEvents.length === 0 ? (
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
                      className="px-4 py-2 text-foreground bg-accent hover:bg-accent/80 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      Schedule Event
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
