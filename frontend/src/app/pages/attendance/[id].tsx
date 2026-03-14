import React, { useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowLeft, Clock, AlertCircle, TrendingUp, Coffee,
  Calendar, Briefcase, Download, CheckCircle2, Moon, Timer
} from 'lucide-react';
import { EmployeeAvatar } from '../../components/EmployeeAvatar';
import { useEmployeesList } from '@/hooks/useEmployeesList';

// ─── Seeded random ─────────────────────────────────────────────────────────
function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

function generateFullAttendance(id: string) {
  const rand = seedRandom(String(id ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const attendanceScore = Math.round(75 + rand() * 24);
  const lateDays        = Math.round(rand() * 8);
  const avgWorkHours    = parseFloat((7.5 + rand() * 1.5).toFixed(1));
  const overtimeHours   = parseFloat((rand() * 20).toFixed(1));
  const leaveDays       = Math.round(rand() * 12);
  const workmode        = rand() > 0.5 ? 'Hybrid' : rand() > 0.3 ? 'WFO' : 'WFH';
  const punchInHour     = 8 + Math.floor(rand() * 2);
  const punchInMin      = Math.floor(rand() * 60);
  const punchIn         = `${String(punchInHour).padStart(2,'0')}:${String(punchInMin).padStart(2,'0')}`;
  const isWorking       = rand() > 0.3;
  const punchOutHour    = 17 + Math.floor(rand() * 2);
  const punchOutMin     = Math.floor(rand() * 60);
  const punchOut        = isWorking ? null : `${String(punchOutHour).padStart(2,'0')}:${String(punchOutMin).padStart(2,'0')}`;
  const monthlyRates    = MONTHS.map(() => Math.round(70 + rand() * 30));

  // Today's working hours
  const nowHour = 17;
  const nowMin  = 8;
  let workingHours = 0;
  if (isWorking) {
    workingHours = parseFloat(((nowHour - punchInHour) + (nowMin - punchInMin) / 60).toFixed(1));
  } else {
    workingHours = parseFloat(((punchOutHour - punchInHour) + (punchOutMin - punchInMin) / 60).toFixed(1));
  }

  return { attendanceScore, lateDays, avgWorkHours, overtimeHours, leaveDays, workmode, punchIn, punchOut, monthlyRates, workingHours, isWorking };
}

function fmt12(time24: string | null): string {
  if (!time24) return '—';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2,'0')} ${ampm}`;
}

// ─── Slim Bar Chart ─────────────────────────────────────────────────────────
function AttendanceBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="space-y-3 mt-2">
      {data.map((v, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-7 text-right shrink-0">{MONTHS[i]}</span>
          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(v / max) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
            />
          </div>
          <span className="text-xs font-semibold text-foreground w-9 shrink-0">{v}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 90 ? '#6b9080' : score >= 75 ? '#e1634a' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
        <motion.circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-foreground">{score}%</span>
        <span className="text-[10px] text-muted-foreground leading-none">Score</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function AttendanceDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { employees, loading } = useEmployeesList();
  const printRef = useRef<HTMLDivElement>(null);

  const employee = useMemo(
    () => employees.find(e => String(e.id) === String(id) || e.employeeId === String(id)),
    [employees, id]
  );

  const att = useMemo(
    () => (id ? generateFullAttendance(String(id)) : null),
    [id]
  );

  const handleDownloadPDF = () => {
    if (!employee || !att) return;

    const initials = employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Status color based on score
    const scoreColor = att.attendanceScore >= 90 ? '#6b9080' : att.attendanceScore >= 75 ? '#e1634a' : '#e1634a';

    const printContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${employee.name} – Attendance Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #444; background: #fff; line-height: 1.4; font-size: 12px; }

    /* ── Header Design (Matching ReportModal) ── */
    .header {
      background: #e1634a;
      padding: 30px 45px;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .header::after {
      content: '';
      position: absolute;
      right: -20px;
      top: -20px;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
    }
    .header-left { display: flex; align-items: center; gap: 20px; position: relative; z-index: 2; }
    .initials-circle {
      width: 64px; height: 64px; border-radius: 50%; background: #d96b55;
      border: 2px solid rgba(255,255,255,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 800; color: #fff;
    }
    .header-meta-text .tag { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 2px; }
    .header-meta-text .name { font-size: 24px; font-weight: 800; line-height: 1.2; }
    .header-meta-text .role { font-size: 11px; opacity: 0.9; margin-top: 2px; }
    
    .header-right { text-align: right; position: relative; z-index: 2; }
    .header-right .gen-lbl { font-size: 9px; opacity: 0.8; }
    .header-right .gen-val { font-size: 12px; font-weight: 700; display: block; margin-top: 2px; }
    .header-right .id-val { font-size: 9px; opacity: 0.7; margin-top: 4px; display: block; font-family: monospace; }

    /* ── Content ── */
    .content { padding: 30px 45px; }

    /* ── Sections ── */
    .section { margin-bottom: 25px; }
    .section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .section-head::before { content: ''; width: 4px; height: 16px; background: #e1634a; display: block; }
    .section-title { font-size: 14px; font-weight: 800; color: #1a1a1a; flex: 1; }
    .section-head::after { content: ''; flex: 1; height: 1px; background: #eee; margin-left: 5px; }

    /* ── Details Table ── */
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .info-table td { width: 25%; padding: 8px 12px; border: 1px solid #f0f0f0; }
    .info-table .label { background: #f9f9f9; font-size: 9px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-table .value { font-size: 11px; font-weight: 600; color: #333; }

    /* ── Stats Grid ── */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 5px; }
    .stat-box { padding: 15px; border-radius: 8px; background: #fff; border: 1px solid #eee; position: relative; }
    .stat-box .lbl { font-size: 9px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-bottom: 5px; }
    .stat-box .val { font-size: 18px; font-weight: 800; color: #1a1a1a; display: flex; align-items: baseline; gap: 2px; }
    .stat-box .unit { font-size: 10px; font-weight: 500; color: #bbb; }
    .stat-box.highlight { border-color: #e1634a33; background: #fff8f6; }
    .stat-box.highlight .val { color: #e1634a; }

    /* ── Score Ring ── */
    .perf-row { display: flex; gap: 20px; align-items: flex-start; }
    .score-card { width: 180px; padding: 15px; border-radius: 12px; background: #fcfcfc; border: 1px solid #f0f0f0; display: flex; align-items: center; gap: 12px; }
    .score-circle {
      width: 50px; height: 50px; border-radius: 50%; border: 4px solid #eee;
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .score-circle .arc {
      position: absolute; inset: -4px; border-radius: 50%; border: 4px solid ${scoreColor};
      clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%);
    }
    .score-circle .num { font-size: 14px; font-weight: 800; color: #333; z-index: 2; }
    .score-meta .s-lbl { font-size: 9px; font-weight: 700; color: #999; text-transform: uppercase; }
    .score-meta .s-status { font-size: 11px; font-weight: 700; color: ${scoreColor}; }

    /* ── Engagement Rows ── */
    .breakdown { flex: 1; }
    .break-row { margin-bottom: 12px; }
    .break-meta { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; margin-bottom: 4px; }
    .break-meta .break-lbl { color: #666; text-transform: uppercase; }
    .break-meta .break-val { color: #e1634a; }
    .break-bar-bg { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
    .break-bar-fill { height: 100%; background: #e1634a; border-radius: 3px; }

    /* ── Observations ── */
    .obs-list { display: flex; flex-direction: column; gap: 8px; }
    .obs-item { padding: 10px 14px; border-radius: 8px; background: #f9f9f9; border: 1px solid #eeee; display: flex; align-items: center; gap: 10px; font-size: 11px; }
    .obs-dot { width: 6px; height: 6px; border-radius: 50%; background: #e1634a; shrink: 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="initials-circle">${initials}</div>
      <div class="header-meta-text">
        <p class="tag">SAGE - ATTENDANCE ANALYTICS REPORT</p>
        <h1 class="name">${employee.name}</h1>
        <p class="role">${employee.role}  -  ${employee.department}</p>
      </div>
    </div>
    <div class="header-right">
      <span class="gen-lbl">Report Generated</span>
      <span class="gen-val">${reportDate}</span>
      <span class="id-val">ID: ${employee.employeeId}</span>
    </div>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-head"><h3 class="section-title">Employee Information</h3></div>
      <table class="info-table">
        <tr>
          <td class="label">Employee ID</td><td class="value">${employee.employeeId}</td>
          <td class="label">Department</td><td class="value">${employee.department}</td>
        </tr>
        <tr>
          <td class="label">Date of Report</td><td class="value">${reportDate}</td>
          <td class="label">Work Mode</td><td class="value">${att.workmode}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <div class="section-head"><h3 class="section-title">Current Month Performance</h3></div>
      <div class="perf-row">
        <div class="score-card">
          <div class="score-circle">
            <div class="arc"></div>
            <span class="num">${att.attendanceScore}%</span>
          </div>
          <div class="score-meta">
            <p class="s-lbl">ATTENDANCE SCORE</p>
            <p class="s-status">${att.attendanceScore >= 90 ? 'Excellent' : att.attendanceScore >= 75 ? 'Standard' : 'Needs Review'}</p>
          </div>
        </div>
        <div class="breakdown">
          <div class="break-row">
            <div class="break-meta"><span class="break-lbl">Punctuality Score</span><span class="break-val">${100 - (att.lateDays * 5)}%</span></div>
            <div class="break-bar-bg"><div class="break-bar-fill" style="width: ${100 - (att.lateDays * 5)}%"></div></div>
          </div>
          <div class="break-row">
            <div class="break-meta"><span class="break-lbl">Compliance Rate</span><span class="break-val">${att.attendanceScore}%</span></div>
            <div class="break-bar-bg"><div class="break-bar-fill" style="width: ${att.attendanceScore}%"></div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h3 class="section-title">Operational Metrics</h3></div>
      <div class="stats-grid">
        <div class="stat-box highlight">
          <p class="lbl">Today's Hours</p>
          <p class="val">${att.workingHours}<span class="unit">HRS</span></p>
        </div>
        <div class="stat-box">
          <p class="lbl">Avg Daily Work</p>
          <p class="val">${att.avgWorkHours}<span class="unit">HRS</span></p>
        </div>
        <div class="stat-box">
          <p class="lbl">Late Days</p>
          <p class="val">${att.lateDays}<span class="unit">DAYS</span></p>
        </div>
        <div class="stat-box">
          <p class="lbl">Leave Record</p>
          <p class="val">${att.leaveDays}<span class="unit">DAYS</span></p>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h3 class="section-title">Attendance History (Past 5 Months)</h3></div>
      <div style="padding-top: 5px;">
        ${att.monthlyRates.map((r, i) => `
          <div class="break-row" style="margin-bottom: 8px;">
            <div class="break-meta" style="margin-bottom: 2px;">
              <span class="break-lbl" style="font-size: 8px;">${['Oct', 'Nov', 'Dec', 'Jan', 'Feb'][i]}</span>
              <span class="break-val" style="font-size: 8px;">${r}%</span>
            </div>
            <div class="break-bar-bg" style="height: 4px;"><div class="break-bar-fill" style="width: ${r}%;"></div></div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h3 class="section-title">Today's Punch Details</h3></div>
      <div class="obs-list">
        <div class="obs-item"><div class="obs-dot"></div><strong>Punch In:</strong> ${fmt12(att.punchIn)} — Recorded from Varanasi.</div>
        <div class="obs-item"><div class="obs-dot"></div><strong>Punch Out:</strong> ${att.punchOut ? fmt12(att.punchOut) : 'Session Active'} — ${att.isWorking ? 'Active' : 'Completed'}.</div>
        <div class="obs-item"><div class="obs-dot"></div><strong>Remarks:</strong> Session duration ${att.workingHours} hrs.</div>
      </div>
    </div>

    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; opacity: 0.5; font-size: 8px;">
      <p>CONFIDENTIAL PERSONNEL RECORD • SAGE SERVICES</p>
      <p>PAGE 1 OF 1</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([printContent], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) {
      win.onload = () => setTimeout(() => {
        win.document.title = `${employee.name.replace(/\s+/g, '_')}_Attendance.pdf`;
        win.print();
      }, 600);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (!employee || !att) {
    return (
      <div className="text-center py-20 space-y-2">
        <p className="text-muted-foreground">Employee not found.</p>
        <Link href="/attendance" className="text-primary underline text-sm">← Go back to Attendance</Link>
      </div>
    );
  }

  const isLate = parseInt(att.punchIn.split(':')[0], 10) > 9;

  return (
    <div className="space-y-5" ref={printRef}>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/attendance" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Attendance
        </Link>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>

      {/* Hero Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
          <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative shrink-0">
              <EmployeeAvatar name={employee.name} avatarIndex={employee.avatarIndex} size="lg" photoUrl={employee.photoUrl} />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${att.isWorking ? 'bg-chart-2' : 'bg-muted-foreground/40'}`} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{employee.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{employee.role}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {employee.department}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium border border-border font-mono">
                  {employee.employeeId}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  att.workmode === 'WFH' ? 'bg-chart-3/10 text-chart-3 border-chart-3/20' :
                  att.workmode === 'Hybrid' ? 'bg-chart-4/10 text-chart-4 border-chart-4/20' :
                  'bg-chart-2/10 text-chart-2 border-chart-2/20'
                }`}>
                  {att.workmode === 'WFH' ? <Moon className="w-3 h-3" /> : att.workmode === 'Hybrid' ? <TrendingUp className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                  {att.workmode}
                </span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1">
              <ScoreRing score={att.attendanceScore} />
              <p className="text-xs text-muted-foreground">Attendance Score</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats - 3-column */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="rounded-2xl border border-border bg-card p-4 h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-chart-2" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Punch In</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{fmt12(att.punchIn)}</p>
            {isLate
              ? <p className="text-xs text-chart-4 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Late arrival</p>
              : <p className="text-xs text-chart-2 mt-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> On time</p>
            }
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="rounded-2xl border border-border bg-card p-4 h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Punch Out</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{att.punchOut ? fmt12(att.punchOut) : '—'}</p>
            {att.isWorking
              ? <p className="text-xs text-chart-2 mt-1.5 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-2 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-chart-2" /></span>
                  Currently working
                </p>
              : <p className="text-xs text-muted-foreground mt-1.5">Shift complete</p>
            }
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Timer className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Working Hours</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-primary">{att.workingHours}<span className="text-base font-medium text-muted-foreground ml-1">hrs</span></p>
            <p className="text-xs text-muted-foreground mt-1.5">Today's total</p>
          </div>
        </motion.div>
      </div>

      {/* Metrics Grid */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Late Days', value: att.lateDays, unit: 'days', icon: AlertCircle, color: 'text-chart-4', bg: 'bg-chart-4/10', border: 'border-chart-4/20' },
            { label: 'Avg Work Hours', value: att.avgWorkHours, unit: 'hrs/day', icon: Clock, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
            { label: 'Overtime Hours', value: att.overtimeHours, unit: 'hrs', icon: TrendingUp, color: 'text-chart-3', bg: 'bg-chart-3/10', border: 'border-chart-3/20' },
            { label: 'Leave Days', value: att.leaveDays, unit: 'days', icon: Coffee, color: 'text-chart-2', bg: 'bg-chart-2/10', border: 'border-chart-2/20' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28 + i * 0.06 }}
            >
              <div className={`rounded-2xl border ${stat.border} bg-card p-4`}>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">{stat.unit}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Monthly Chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground text-sm">Monthly Attendance Rate</h2>
            </div>
            <span className="text-xs text-muted-foreground">Last 5 months</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Working days present vs scheduled</p>
          <AttendanceBarChart data={att.monthlyRates} />
        </div>
      </motion.div>
    </div>
  );
}
