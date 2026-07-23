import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrintReportButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button 
      variant="secondary" 
      onClick={handlePrint}
      className="print-visible hidden sm:flex"
      aria-label="Print report"
    >
      <Printer size={18} />
      Print Report
    </Button>
  );
}
