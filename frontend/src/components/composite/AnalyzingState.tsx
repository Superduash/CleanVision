import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle } from 'lucide-react';

interface AnalyzingStateProps {
  imageFile: File | null;
  status: 'analyzing' | 'success';
}

export function AnalyzingState({ imageFile, status }: AnalyzingStateProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Rotating tips to show during analysis
  const tips = [
    'Analyzing floor cleanliness...',
    'Checking for spills...',
    'Detecting debris...',
    'Evaluating overall condition...'
  ];
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  useEffect(() => {
    if (status !== 'analyzing') return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [status, tips.length]);

  return (
    <div className="flex flex-col items-center justify-center p-6 h-full text-center">
      <div className="relative w-64 h-64 rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-lg)] bg-[var(--surface-raised)] border border-[var(--border-subtle)] mb-8">
        {previewUrl ? (
          <img src={previewUrl} alt="Analyzing" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-800" />
        )}
        
        {/* Scanning laser animation */}
        {status === 'analyzing' && (
          <div 
            className="absolute left-0 right-0 h-1 bg-[var(--brand-teal)] shadow-[0_0_8px_2px_var(--brand-teal)] z-10"
            style={{ animation: 'scan-sweep 2s linear infinite alternate' }}
          />
        )}

        {/* Overlay Icon */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <AnimatePresence mode="wait">
            {status === 'analyzing' ? (
              <motion.div
                key="analyzing"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
              >
                <Sparkles size={48} className="text-[var(--brand-teal)] drop-shadow-md" />
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-full p-2"
              >
                <CheckCircle size={48} className="text-[var(--status-clean)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={status === 'analyzing' ? tipIndex : 'done'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="h-16"
        >
          <h2 className="text-h2 text-[var(--text-primary)] mb-2">
            {status === 'analyzing' ? 'Analyzing Image' : 'Analysis Complete'}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            {status === 'analyzing' ? tips[tipIndex] : 'Generating report...'}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
