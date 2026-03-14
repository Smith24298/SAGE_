import { useState } from 'react';
import { Card } from '../components/ui/card';
import { FileText, Download, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';

const documents = [
  { name: 'Q1 2026 Performance Reviews', category: 'Performance', date: 'March 10, 2026', size: '2.4 MB' },
  { name: 'Employee Handbook 2026', category: 'Policy', date: 'January 1, 2026', size: '1.8 MB' },
  { name: 'Compensation Guidelines', category: 'HR', date: 'February 15, 2026', size: '850 KB' },
  { name: 'Engineering Team OKRs', category: 'Goals', date: 'January 5, 2026', size: '420 KB' },
  { name: 'Benefits Package Overview', category: 'HR', date: 'January 1, 2026', size: '1.2 MB' },
  { name: 'Remote Work Policy', category: 'Policy', date: 'December 1, 2025', size: '650 KB' },
  { name: 'Training Materials - Leadership', category: 'Training', date: 'February 20, 2026', size: '3.1 MB' },
  { name: 'Diversity & Inclusion Report', category: 'Reports', date: 'March 1, 2026', size: '980 KB' },
];

export function Documents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ fontWeight: 600 }}>Documents</h1>
        <p className="text-muted-foreground mt-1">Access and manage HR documents</p>
      </div>

      <div className="flex gap-4">
        <Card className="flex-1 p-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-input-background rounded-lg">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
          </div>
        </Card>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {documents.map((doc, index) => (
          <DocumentRow key={index} doc={doc} />
        ))}
      </div>
    </div>
  );
}

function DocumentRow({ doc }: { doc: { name: string; category: string; date: string; size: string } }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');

      const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const W = pdfDoc.internal.pageSize.getWidth();
      const H = pdfDoc.internal.pageSize.getHeight();
      const PRI = '#e1634a';

      const fill = (hex: string) => pdfDoc.setFillColor(hex);
      const txt = (hex: string) => pdfDoc.setTextColor(hex);
      const draw = (hex: string) => pdfDoc.setDrawColor(hex);
      const white = () => pdfDoc.setTextColor(255, 255, 255);

      // Header Banner
      fill(PRI);
      pdfDoc.rect(0, 0, W, 110, 'F');
      
      white();
      pdfDoc.setFontSize(10);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.text('SAGE - ORGANIZATIONAL DOCUMENT', 40, 45);

      pdfDoc.setFontSize(22);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text(doc.name, 40, 75);

      // Body
      const docDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      txt('#1a1a1a');
      pdfDoc.setFontSize(14);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text(`Document Reference: ${doc.name}`, 40, 160);

      pdfDoc.setFontSize(11);
      pdfDoc.setFont('helvetica', 'normal');
      txt('#555555');
      pdfDoc.text(`Category: ${doc.category}  |  Published: ${doc.date}  |  Size: ${doc.size}`, 40, 184);

      pdfDoc.setFontSize(12);
      pdfDoc.setFont('helvetica', 'normal');
      txt('#333333');
      
      const contentText = `This document ("${doc.name}") serves as a placeholder record for SAGE Services. ` +
        `This section will routinely embed officially verified organizational files retrieved from ` +
        `the secured database cluster. Since another organizational division is currently ` +
        `structuring the backend database APIs, this downloadable file validates the functional downloading integration.\n\n` +
        `Verification Date: ${docDate}\n` +
        `System Ref: SAGE_sys_doc_${Date.now().toString().slice(-6)}`;
        
      const lines = pdfDoc.splitTextToSize(contentText, W - 80);
      pdfDoc.text(lines, 40, 240);

      // Footer
      draw('#eeeeee');
      pdfDoc.setLineWidth(1);
      pdfDoc.line(40, H - 70, W - 40, H - 70);

      txt(PRI);
      pdfDoc.setFontSize(11);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('SAGE', 40, H - 45);

      txt('#aaaaaa');
      pdfDoc.setFontSize(8);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.text('Strategic Advisor for Growth and Engagement', 40, H - 30);
      
      const fileName = `${doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pdf`;
      pdfDoc.save(fileName);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm truncate" style={{ fontWeight: 600 }}>{doc.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 bg-accent rounded">{doc.category}</span>
              <span>{doc.date}</span>
              <span>{doc.size}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isDownloading}>View</Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
