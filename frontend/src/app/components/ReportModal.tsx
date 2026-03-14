import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileText } from 'lucide-react';
import { Employee } from '@/app/data/employees';

interface ReportModalProps {
  employee: Employee;
  onClose: () => void;
}

const riskColor: Record<string, string> = {
  Low: '#6b9080',
  Medium: '#f4a261',
  High: '#e1634a',
};

const engagementMetrics = [
  { label: 'Engagement', value: 75 },
  { label: 'Participation', value: 82 },
  { label: 'Responsiveness', value: 88 },
  { label: 'Initiative', value: 70 },
];

const salaryHistoryByEmployee: Record<number, { year: string; salary: number }[]> = {
  1: [{ year: '2022', salary: 75000 }, { year: '2023', salary: 82000 }, { year: '2024', salary: 90000 }, { year: '2025', salary: 98000 }, { year: '2026', salary: 105000 }],
  2: [{ year: '2020', salary: 115000 }, { year: '2021', salary: 122000 }, { year: '2022', salary: 130000 }, { year: '2025', salary: 138000 }, { year: '2026', salary: 145000 }],
  3: [{ year: '2021', salary: 78000 }, { year: '2022', salary: 84000 }, { year: '2023', salary: 90000 }, { year: '2024', salary: 95000 }, { year: '2026', salary: 98000 }],
  4: [{ year: '2019', salary: 100000 }, { year: '2021', salary: 112000 }, { year: '2022', salary: 120000 }, { year: '2024', salary: 128000 }, { year: '2026', salary: 135000 }],
  5: [{ year: '2021', salary: 88000 }, { year: '2022', salary: 95000 }, { year: '2023', salary: 100000 }, { year: '2024', salary: 106000 }, { year: '2026', salary: 110000 }],
  6: [{ year: '2023', salary: 78000 }, { year: '2024', salary: 83000 }, { year: '2025', salary: 86000 }, { year: '2026', salary: 88000 }],
  7: [{ year: '2020', salary: 72000 }, { year: '2021', salary: 80000 }, { year: '2022', salary: 86000 }, { year: '2024', salary: 91000 }, { year: '2026', salary: 95000 }],
  8: [{ year: '2022', salary: 76000 }, { year: '2023', salary: 82000 }, { year: '2024', salary: 87000 }, { year: '2025', salary: 90000 }, { year: '2026', salary: 92000 }],
};

export function ReportModal({ employee, onClose }: ReportModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const fileName = `${employee.name.toLowerCase().replace(/\s+/g, '_')}_report.pdf`;
  // Used by both the JSX preview and the PDF generator
  const salaryHistory = salaryHistoryByEmployee[employee.id] ?? salaryHistoryByEmployee[1];
  const employeeInitials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);


  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();  // 595 pt
      const H = doc.internal.pageSize.getHeight(); // 842 pt
      const PRI = '#e1634a';
      let y = 0;

      // jsPDF supports hex strings natively — no rgb conversion needed
      const fill  = (hex: string) => { doc.setFillColor(hex);  };
      const txt   = (hex: string) => { doc.setTextColor(hex);  };
      const draw  = (hex: string) => { doc.setDrawColor(hex);  };
      const white = () => { doc.setTextColor(255, 255, 255);   };

      const checkPage = (needed = 60) => {
        if (y + needed > H - 40) { doc.addPage(); y = 40; }
      };

      // ── HEADER BANNER ────────────────────────────────────────────
      fill(PRI);
      doc.rect(0, 0, W, 130, 'F');
      fill('#c94830');
      doc.rect(W * 0.55, 0, W * 0.45, 130, 'F');
      fill('#b83d24');
      doc.circle(W - 30, -20, 80, 'F');
      doc.circle(W - 80, 110, 55, 'F');

      // Avatar circle
      fill('#d96b55'); // slightly lighter than primary for contrast
      doc.circle(60, 65, 36, 'F');
      draw('#ffffff'); doc.setLineWidth(2);
      doc.circle(60, 65, 36, 'S');
      doc.setFontSize(22); doc.setFont('helvetica', 'bold'); white();
      doc.text(employeeInitials, 60, 71, { align: 'center' });

      // Header text
      white();
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('SAGE - EMPLOYEE ANALYTICS REPORT', 110, 38);
      doc.setFontSize(22); doc.setFont('helvetica', 'bold');
      doc.text(employee.name, 110, 62);
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text(`${employee.role}  -  ${employee.department}`, 110, 80);

      // Right meta
      doc.setFontSize(8);
      doc.text('Report Generated', W - 30, 38, { align: 'right' });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(reportDate, W - 30, 52, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(`ID: ${employee.employeeId}`, W - 30, 65, { align: 'right' });

      y = 152;

      // ── Section header helper ────────────────────────────────────
      const sectionHead = (title: string) => {
        checkPage(50);
        fill(PRI); doc.rect(30, y, 4, 16, 'F');
        doc.setFontSize(12); doc.setFont('helvetica', 'bold'); txt('#1a1a1a');
        doc.text(title, 40, y + 12);
        draw(PRI); doc.setLineWidth(0.4);
        doc.line(30 + doc.getTextWidth(title) + 14, y + 8, W - 30, y + 8);
        y += 26;
      };

      // ── Table helpers ────────────────────────────────────────────
      const labelCell = (label: string, x: number, cy: number, w: number) => {
        fill('#f0f0f0'); doc.rect(x, cy - 11, w, 18, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); txt('#888888');
        doc.text(label.toUpperCase(), x + 6, cy);
      };
      const valueCell = (val: string, x: number, cy: number, w: number, hi = false) => {
        fill(hi ? '#fff5f3' : '#fafafa'); doc.rect(x, cy - 11, w, 18, 'F');
        doc.setFontSize(10); doc.setFont('helvetica', hi ? 'bold' : 'normal');
        txt(hi ? PRI : '#1a1a1a');
        doc.text(val, x + 6, cy);
      };

      // ── SECTION 1: Employee Info ──────────────────────────────────
      sectionHead('Employee Information');
      const infoRows: [string, string, string, string][] = [
        ['Employee ID', employee.employeeId, 'Department', employee.department],
        ['Manager', employee.manager, 'Location', employee.location],
        ['Date of Joining', employee.dateOfJoining, 'Employment Type', employee.employmentType],
      ];
      infoRows.forEach(([l1, v1, l2, v2]) => {
        labelCell(l1, 30, y, 110);  valueCell(v1, 144, y, 170);
        labelCell(l2, 318, y, 110); valueCell(v2, 432, y, 133);
        y += 22;
      });
      y += 10;

      // ── SECTION 2: Compensation ───────────────────────────────────
      sectionHead('Compensation & Salary');
      const compCols: [string, string, boolean][] = [
        ['Base Salary', employee.baseSalary, true],
        ['Annual Bonus', employee.bonus, false],
        ['Stock Options', employee.stockOptions, false],
        ['Total Package', employee.totalCompensation, true],
        ['Last Review', employee.lastRevision, false],
        ['Next Review', employee.nextReview, false],
      ];
      const cBoxW = (W - 60) / 6;
      compCols.forEach(([label, value, hl], i) => {
        const bx = 30 + i * cBoxW;
        fill(hl ? '#fff5f3' : '#fafafa'); doc.rect(bx, y, cBoxW - 4, 40, 'F');
        if (hl) { draw(PRI); doc.setLineWidth(0.8); doc.rect(bx, y, cBoxW - 4, 40, 'S'); }
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); txt('#999999');
        doc.text(label.toUpperCase(), bx + 6, y + 12);
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); txt(hl ? PRI : '#1a1a1a');
        doc.text(value, bx + 6, y + 28);
      });
      y += 52;

      // Salary progression
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); txt('#999999');
      doc.text('SALARY PROGRESSION', 30, y + 5);
      y += 14;
      const histW = (W - 60) / salaryHistory.length;
      salaryHistory.forEach(({ year, salary }, i) => {
        const bx = 30 + i * histW;
        fill(i % 2 === 0 ? '#fafafa' : '#f0f0f0'); doc.rect(bx, y, histW - 2, 30, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); txt('#888888');
        doc.text(year, bx + histW / 2, y + 10, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); txt(PRI);
        doc.text(`$${(salary / 1000).toFixed(0)}K`, bx + histW / 2, y + 24, { align: 'center' });
      });
      y += 44;

      // ── SECTION 3: Performance Analytics ─────────────────────────
      checkPage(130);
      sectionHead('Performance Analytics');

      // Sentiment score card
      const sc_x = 30, cw = 245, ch = 58;
      fill('#fafafa'); doc.rect(sc_x, y, cw, ch, 'F');
      fill('#f0c0b8'); doc.circle(sc_x + 28, y + ch / 2, 22, 'F');
      doc.setFontSize(16); doc.setFont('helvetica', 'bold'); txt(PRI);
      doc.text(String(employee.sentiment), sc_x + 28, y + ch / 2 + 6, { align: 'center' });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); txt('#999999');
      doc.text('SENTIMENT SCORE', sc_x + 58, y + 18);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); txt('#1a1a1a');
      doc.text(`${employee.sentiment}/100`, sc_x + 58, y + 34);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); txt('#888888');
      doc.text(employee.sentiment >= 80 ? 'Excellent' : employee.sentiment >= 70 ? 'Good' : 'Needs Attention', sc_x + 58, y + 50);

      // Risk card
      const riskHex: Record<string, string> = { Low: '#6b9080', Medium: '#f4a261', High: '#e1634a' };
      const riskLightHex: Record<string, string> = { Low: '#c5d9d3', Medium: '#fcd8b0', High: '#f0c0b8' };
      const rc_x = 310;
      const rcol = riskHex[employee.risk] ?? '#f4a261';
      fill('#fafafa'); doc.rect(rc_x, y, cw, ch, 'F');
      fill(riskLightHex[employee.risk] ?? '#fcd8b0'); doc.circle(rc_x + 28, y + ch / 2, 22, 'F');
      doc.setFontSize(16); doc.setFont('helvetica', 'bold'); txt(rcol);
      doc.text(employee.risk[0], rc_x + 28, y + ch / 2 + 6, { align: 'center' });
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); txt('#999999');
      doc.text('ATTRITION RISK', rc_x + 58, y + 18);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); txt(rcol);
      doc.text(employee.risk, rc_x + 58, y + 34);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); txt('#888888');
      doc.text(employee.risk === 'Low' ? 'Stable' : employee.risk === 'Medium' ? 'Monitor Closely' : 'Urgent Attention', rc_x + 58, y + 50);
      y += ch + 16;

      // Engagement bars
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); txt('#999999');
      doc.text('ENGAGEMENT BREAKDOWN', 30, y);
      y += 12;
      engagementMetrics.forEach(({ label, value }) => {
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); txt('#555555');
        doc.text(label, 30, y);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); txt(PRI);
        doc.text(`${value}%`, W - 30, y, { align: 'right' });
        fill('#e8e8e8'); doc.rect(30, y + 4, W - 60, 8, 'F');
        fill(PRI); doc.rect(30, y + 4, ((W - 60) * value) / 100, 8, 'F');
        y += 22;
      });
      y += 6;

      // ── SECTION 4: Risk Indicators ────────────────────────────────
      checkPage(80);
      sectionHead('Risk Indicators');
      const riskItems = [
        { label: 'Burnout Risk', level: employee.risk === 'High' ? 'High' : 'Medium' as string },
        { label: 'Attrition Risk', level: employee.risk as string },
        { label: 'Engagement Drop', level: employee.sentiment < 70 ? 'High' : 'Medium' as string },
        { label: 'Stress Signals', level: employee.sentiment < 72 ? 'High' : 'Medium' as string },
      ];
      const rBoxW = (W - 60) / 4;
      riskItems.forEach(({ label, level }, i) => {
        const bx = 30 + i * rBoxW;
        const lc = riskHex[level] ?? '#f4a261';
        const llight = riskLightHex[level] ?? '#fcd8b0';
        fill('#fafafa'); doc.rect(bx, y, rBoxW - 8, 48, 'F');
        fill(llight); doc.circle(bx + (rBoxW - 8) / 2, y + 14, 5, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); txt('#444444');
        doc.text(label, bx + (rBoxW - 8) / 2, y + 28, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); txt(lc);
        doc.text(level, bx + (rBoxW - 8) / 2, y + 42, { align: 'center' });
      });
      y += 62;

      // ── SECTION 5: AI Insights ────────────────────────────────────
      checkPage(120);
      sectionHead('AI-Generated Insights');
      const insightTexts = [
        `${employee.name} has a sentiment score of ${employee.sentiment}/100. ${employee.sentiment < 75 ? 'Sentiment has declined - immediate 1:1 check-in recommended.' : 'Sentiment remains healthy with positive momentum.'}`,
        `Attrition risk is classified as ${employee.risk}. ${employee.risk === 'High' ? 'Urgent intervention recommended - schedule retention conversation within the week.' : employee.risk === 'Medium' ? 'Monitor closely over the next quarter.' : 'Employee appears stable and satisfied.'}`,
        `Engagement metrics show strong participation (82%) and responsiveness (88%). Consider nominating ${employee.name.split(' ')[0]} for a mentorship or leadership fast-track program.`,
        `Next compensation review is scheduled for ${employee.nextReview}. Based on performance trajectory, a merit increase discussion is advisable.`,
      ];
      insightTexts.forEach((text, i) => {
        checkPage(52);
        fill(i % 2 === 0 ? '#fff8f6' : '#fafafa');
        doc.rect(30, y, W - 60, 40, 'F');
        fill(PRI); doc.rect(30, y, 3, 40, 'F');
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); txt('#444444');
        const lines = doc.splitTextToSize(text, W - 84);
        doc.text(lines, 42, y + 14);
        y += 48;
      });
      y += 8;

      // ── FOOTER ───────────────────────────────────────────────────
      checkPage(40);
      draw('#eeeeee'); doc.setLineWidth(0.5);
      doc.line(30, y, W - 30, y);
      y += 12;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); txt(PRI);
      doc.text('SAGE', 30, y);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); txt('#aaaaaa');
      doc.text('Strategic Advisor for Growth and Engagement', 30, y + 12);
      doc.text(`Confidential - For HR use only  |  Generated ${reportDate}`, W - 30, y, { align: 'right' });

      doc.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsDownloading(false);
    }

  };


  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Blur overlay */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal shell */}
        <motion.div
          className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--card)' }}
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        >
          {/* Sticky modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur flex-shrink-0">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Employee Report Preview</p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleDownload}
                disabled={isDownloading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                style={{
                  background: isDownloading ? '#aaa' : 'linear-gradient(135deg, #e1634a, #f4a261)',
                  boxShadow: isDownloading ? 'none' : '0 4px 14px #e1634a55',
                }}
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </motion.button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Scrollable report content */}
          <div className="overflow-y-auto flex-1">
            <div
              style={{
                background: '#ffffff',
                color: '#1a1a1a',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                width: '100%',
              }}
            >
              <div
                style={{
                  background: `linear-gradient(135deg, #e1634a 0%, #d4512e 60%, #f4a261 100%)`,
                  padding: '40px 48px 32px',
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: -50, right: 60, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    border: '3px solid rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 700, letterSpacing: '0.04em', color: '#fff',
                    flexShrink: 0,
                  }}>
                    {employeeInitials}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 4 }}>SAGE — Employee Analytics Report</p>
                    <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{employee.name}</h1>
                    <p style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{employee.role} · {employee.department}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right', opacity: 0.85 }}>
                    <p style={{ fontSize: 11, marginBottom: 2 }}>Report Generated</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{reportDate}</p>
                    <p style={{ fontSize: 11, marginTop: 4 }}>ID: {employee.employeeId}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '32px 48px', display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* ── Section 1: Employee Info ── */}
                <Section title="Employee Information" icon="👤">
                  <TwoColTable rows={[
                    ['Employee ID', employee.employeeId, 'Department', employee.department],
                    ['Manager', employee.manager, 'Location', employee.location],
                    ['Date of Joining', employee.dateOfJoining, 'Employment Type', employee.employmentType],
                  ]} />
                </Section>

                {/* ── Section 2: Compensation ── */}
                <Section title="Compensation & Salary" icon="💰">
                  <SixColTable rows={[[
                    ['Base Salary', employee.baseSalary, true],
                    ['Annual Bonus', employee.bonus, false],
                    ['Stock Options', employee.stockOptions, false],
                    ['Total Package', employee.totalCompensation, true],
                    ['Last Review', employee.lastRevision, false],
                    ['Next Review', employee.nextReview, false],
                  ]]} />
                  {/* Salary History mini table */}
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Salary Progression</p>
                    <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                      {salaryHistory.map((row, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{row.year}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#e1634a' }}>${(row.salary / 1000).toFixed(0)}K</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>

                {/* ── Section 3: Analytics ── */}
                <Section title="Performance Analytics" icon="📊">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Sentiment card */}
                    <StatCard label="Sentiment Score" value={String(employee.sentiment)} max={100} color="#e1634a" note={employee.sentiment >= 80 ? 'Excellent' : employee.sentiment >= 70 ? 'Good' : 'Needs Attention'} />
                    {/* Risk card */}
                    <StatCard label="Attrition Risk" value={employee.risk} max={null} color={riskColor[employee.risk]} note={employee.risk === 'Low' ? 'Stable' : employee.risk === 'Medium' ? 'Monitor Closely' : 'Urgent Attention'} />
                  </div>

                  {/* Engagement metrics bar chart */}
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 11, color: '#888', marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Engagement Breakdown</p>
                    {engagementMetrics.map((m, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                          <span style={{ color: '#555' }}>{m.label}</span>
                          <span style={{ fontWeight: 700, color: '#e1634a' }}>{m.value}%</span>
                        </div>
                        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${m.value}%`, background: `linear-gradient(90deg, #e1634a, #f4a261)`, borderRadius: 99 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* ── Section 4: Risk Indicators ── */}
                <Section title="Risk Indicators" icon="⚠️">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Burnout Risk', level: employee.risk === 'High' ? 'High' : 'Medium' },
                      { label: 'Attrition Risk', level: employee.risk },
                      { label: 'Engagement Drop', level: employee.sentiment < 70 ? 'High' : 'Medium' },
                      { label: 'Stress Signals', level: employee.sentiment < 72 ? 'High' : 'Medium' },
                    ].map((r, i) => (
                      <div key={i} style={{ padding: 14, background: '#fafafa', borderRadius: 10, textAlign: 'center', border: '1px solid #eee' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: riskColor[r.level] || '#f4a261', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 2 }}>{r.label}</div>
                        <div style={{ fontSize: 12, color: riskColor[r.level] || '#f4a261', fontWeight: 700 }}>{r.level}</div>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* ── Section 5: AI Insights ── */}
                <Section title="AI-Generated Insights" icon="🤖">
                  {[
                    `${employee.name} has a current sentiment score of ${employee.sentiment}/100. ${employee.sentiment < 75 ? 'Sentiment has declined in recent assessments — immediate 1:1 check-in recommended.' : 'Sentiment remains healthy with positive momentum.'}`,
                    `Attrition risk is classified as ${employee.risk}. ${employee.risk === 'High' ? 'Urgent intervention recommended — schedule retention conversation within the week.' : employee.risk === 'Medium' ? 'Monitor closely over the next quarter and ensure career development discussions are ongoing.' : 'Employee appears stable and satisfied.'}`,
                    `Engagement metrics show strong participation (82%) and responsiveness (88%). Consider nominating ${employee.name.split(' ')[0]} for a mentorship or leadership fast-track program.`,
                    `Next compensation review is scheduled for ${employee.nextReview}. Based on performance trajectory, a merit increase discussion is advisable.`,
                  ].map((insight, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: i % 2 === 0 ? '#fff8f6' : '#fafafa', borderRadius: 10, marginBottom: 8, borderLeft: '3px solid #e1634a' }}>
                      <span style={{ fontSize: 14 }}>{'💡'}</span>
                      <p style={{ fontSize: 12.5, color: '#444', margin: 0, lineHeight: 1.6 }}>{insight}</p>
                    </div>
                  ))}
                </Section>

                {/* Footer */}
                <div style={{ borderTop: '1px solid #eee', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#e1634a', margin: 0 }}>SAGE</p>
                    <p style={{ fontSize: 10, color: '#aaa', margin: '2px 0 0' }}>Strategic Advisor for Growth and Engagement</p>
                  </div>
                  <p style={{ fontSize: 10, color: '#bbb' }}>Confidential — For HR use only · Generated {reportDate}</p>
                </div>

              </div>
            </div>
            {/* End report doc */}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Sub-components for the report layout ── */

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h2>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #e1634a33, transparent)', marginLeft: 8 }} />
      </div>
      {children}
    </div>
  );
}

function TwoColTable({ rows }: { rows: [string, string, string, string][] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', fontSize: 13 }}>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td style={{ width: '18%', color: '#888', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 12px', background: '#fafafa', borderRadius: '8px 0 0 8px' }}>{row[0]}</td>
            <td style={{ width: '32%', color: '#1a1a1a', fontWeight: 500, padding: '6px 12px', background: '#fafafa' }}>{row[1]}</td>
            <td style={{ width: '18%', color: '#888', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 12px', background: '#f5f5f5', borderRadius: '0' }}>{row[2]}</td>
            <td style={{ width: '32%', color: '#1a1a1a', fontWeight: 500, padding: '6px 12px', background: '#f5f5f5', borderRadius: '0 8px 8px 0' }}>{row[3]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SixColTable({ rows }: { rows: [string, string, boolean][][] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
      {rows[0].map(([label, value, highlight], i) => (
        <div key={i} style={{ padding: '12px 14px', background: highlight ? '#fff5f3' : '#fafafa', borderRadius: 10, border: highlight ? '1px solid #e1634a33' : '1px solid #eee' }}>
          <div style={{ fontSize: 10, color: '#999', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: highlight ? '#e1634a' : '#1a1a1a' }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, max, color, note }: { label: string; value: string; max: number | null; color: string; note: string }) {
  return (
    <div style={{ padding: 16, background: '#fafafa', borderRadius: 12, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color }}>{max ? value : value[0]}</span>
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}{max ? `/${max}` : ''}</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{note}</div>
      </div>
    </div>
  );
}
