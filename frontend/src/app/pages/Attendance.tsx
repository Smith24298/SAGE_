import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Search, Clock, CheckCircle2, AlertCircle, LogIn, LogOut, Users } from 'lucide-react';
import { EmployeeAvatar } from '../components/EmployeeAvatar';
import { useEmployeesList } from '@/hooks/useEmployeesList';

// ─── Seeded random ─────────────────────────────────────────────────────────
function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateAttendanceForEmployee(id: string) {
  const idStr = String(id ?? '');
  const rand = seedRandom(idStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const punchInHour = 8 + Math.floor(rand() * 2);
  const punchInMin  = Math.floor(rand() * 60);
  const punchOutHour = 17 + Math.floor(rand() * 2);
  const punchOutMin  = Math.floor(rand() * 60);
  const worksCurrently = rand() > 0.3;
  const punchIn = `${String(punchInHour).padStart(2,'0')}:${String(punchInMin).padStart(2,'0')}`;
  const punchOut = worksCurrently ? null : `${String(punchOutHour).padStart(2,'0')}:${String(punchOutMin).padStart(2,'0')}`;
  const isLate = punchInHour > 9 || (punchInHour === 9 && punchInMin > 0);
  return { punchIn, punchOut, isLate };
}

function fmt12(time24: string | null): string {
  if (!time24) return '—';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2,'0')} ${ampm}`;
}

export function Attendance() {
  const [query, setQuery] = useState('');
  const { employees, loading } = useEmployeesList();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const enriched = useMemo(() =>
    employees.map(emp => ({
      ...emp,
      attendance: generateAttendanceForEmployee(String(emp.id ?? ''))
    })),
  [employees]);

  const filtered = enriched.filter(
    e =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.department?.toLowerCase().includes(query.toLowerCase()) ||
      String(e.id ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const presentCount  = enriched.filter(e => e.attendance.punchIn).length;
  const lateCount     = enriched.filter(e => e.attendance.isLate).length;
  const workingCount  = enriched.filter(e => !e.attendance.punchOut).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employee Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: enriched.length, icon: Users, accent: 'border-primary/20 bg-primary/5', iconCls: 'bg-primary/10 text-primary' },
          { label: 'Present', value: presentCount, icon: CheckCircle2, accent: 'border-chart-2/20 bg-chart-2/5', iconCls: 'bg-chart-2/10 text-chart-2' },
          { label: 'Late', value: lateCount, icon: AlertCircle, accent: 'border-chart-4/20 bg-chart-4/5', iconCls: 'bg-chart-4/10 text-chart-4' },
          { label: 'Working Now', value: workingCount, icon: Clock, accent: 'border-chart-3/20 bg-chart-3/5', iconCls: 'bg-chart-3/10 text-chart-3' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <div className={`rounded-2xl border ${stat.accent} p-4 flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-xl ${stat.iconCls} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, department or ID..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground"
        />
      </div>

      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[1fr_120px_120px_100px_40px] gap-4 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <span>Employee</span>
        <span className="text-center">Punch In</span>
        <span className="text-center">Punch Out</span>
        <span className="text-center">Status</span>
        <span />
      </div>

      {/* Employee Rows */}
      <div className="space-y-2">
        {filtered.map((emp, i) => {
          const att = emp.attendance;
          const isWorking = att.punchIn && !att.punchOut;

          return (
            <motion.div
              key={String(emp.id)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/attendance/${String(emp.id)}`}>
                <div className="group rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer">
                  <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_120px_100px_40px] gap-4 items-center px-5 py-3.5">

                    {/* Employee info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        <EmployeeAvatar name={emp.name} avatarIndex={emp.avatarIndex} size="sm" photoUrl={emp.photoUrl} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {emp.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {emp.department} · <span className="font-mono">{String(emp.id)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Punch In */}
                    <div className="hidden sm:flex flex-col items-center gap-0.5">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <LogIn className="w-3 h-3" /> In
                      </p>
                      <p className={`text-sm font-semibold tabular-nums ${att.isLate ? 'text-chart-4' : 'text-chart-2'}`}>
                        {fmt12(att.punchIn)}
                      </p>
                    </div>

                    {/* Punch Out */}
                    <div className="hidden sm:flex flex-col items-center gap-0.5">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <LogOut className="w-3 h-3" /> Out
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {att.punchOut ? fmt12(att.punchOut) : '—'}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="hidden sm:flex justify-center">
                      {isWorking ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-chart-2/10 text-chart-2 border border-chart-2/20">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-2 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-chart-2" />
                          </span>
                          Active
                        </span>
                      ) : att.isLate ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-chart-4/10 text-chart-4 border border-chart-4/20">
                          <AlertCircle className="w-3 h-3" /> Late
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                          <CheckCircle2 className="w-3 h-3 text-chart-2" /> Done
                        </span>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center text-muted-foreground/40 group-hover:text-primary transition-colors text-lg leading-none">›</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {filtered.length === 0 && query.trim() !== '' && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No employees found matching &quot;{query}&quot;
          </div>
        )}
        {filtered.length === 0 && query.trim() === '' && !loading && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No employee data available. Make sure the backend is running.
          </div>
        )}
      </div>
    </div>
  );
}
