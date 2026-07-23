import React from 'react';
import { ThemeSwitch } from '@/components/ui/switch';
import { useStaffNameStore } from '@/lib/stores/staffNameStore';
import { Input } from '@/components/ui/input';
import { User, Palette, Info, HelpCircle } from 'lucide-react';

export default function SettingsPage() {
  const { staffName, setStaffName } = useStaffNameStore();

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-3xl mx-auto w-full pb-24 md:pb-8">
      <header>
        <h1 className="text-h1 font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Manage your app preferences and profile.
        </p>
      </header>

      <section className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)]">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2 text-[var(--brand-teal)]">
          <User size={18} />
          <h2 className="text-h3 font-semibold text-[var(--text-primary)]">Profile</h2>
        </div>
        <div className="p-5">
          <Input 
            label="Your Name" 
            value={staffName} 
            onChange={(e) => setStaffName(e.target.value)} 
            placeholder="Enter your name"
            maxLength={30}
          />
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            This name is stored locally on this device and is used to personalize your dashboard.
          </p>
        </div>
      </section>

      <section className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)]">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2 text-[var(--brand-teal)]">
          <Palette size={18} />
          <h2 className="text-h3 font-semibold text-[var(--text-primary)]">Appearance</h2>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Theme</p>
            <p className="text-sm text-[var(--text-secondary)]">Toggle between light and dark mode</p>
          </div>
          <ThemeSwitch />
        </div>
      </section>

      <section className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)]">
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2 text-[var(--brand-teal)]">
          <Info size={18} />
          <h2 className="text-h3 font-semibold text-[var(--text-primary)]">About</h2>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-secondary)]">App Version</span>
            <span className="font-medium text-mono">2.0.0</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-secondary)]">AI Model</span>
            <span className="font-medium">ResNet-18 (Mock Mode)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--brand-teal)] mt-2 cursor-pointer hover:underline">
            <HelpCircle size={16} />
            <span>Help & Documentation</span>
          </div>
        </div>
      </section>
    </div>
  );
}
