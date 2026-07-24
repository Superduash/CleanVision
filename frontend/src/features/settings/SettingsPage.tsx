import React from 'react';
import { ThemeSwitch } from '@/components/ui/switch';
import { useStaffNameStore } from '@/lib/stores/staffNameStore';
import { Input } from '@/components/ui/input';
import { User, Palette, Info, HelpCircle } from 'lucide-react';

export default function SettingsPage() {
  const { staffName, setStaffName } = useStaffNameStore();

  return (
    <div className="flex flex-col gap-10 w-full pb-24 md:pb-12">
      <header>
        <h1 className="text-display-lg font-bold text-text-primary tracking-tight">Settings</h1>
        <p className="text-body text-text-secondary mt-1">
          Manage your app preferences and profile.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-surface-raised border border-border-elevated rounded-xl shadow-sm flex flex-col transition-all duration-base hover:shadow-md">
          <div className="px-6 py-5 border-b border-border-subtle flex items-center gap-3 text-brand-teal">
            <User size={20} />
            <h2 className="text-h3 font-semibold text-text-primary">Profile</h2>
          </div>
          <div className="p-6 flex flex-col gap-2">
            <Input 
              label="Your Name" 
              value={staffName} 
              onChange={(e) => setStaffName(e.target.value)} 
              placeholder="Enter your name"
              maxLength={30}
              className="h-12 text-body"
            />
            <p className="text-sm text-text-tertiary">
              This name is stored locally on this device and is used to personalize your dashboard.
            </p>
          </div>
        </section>

        <section className="bg-surface-raised border border-border-elevated rounded-xl shadow-sm flex flex-col transition-all duration-base hover:shadow-md">
          <div className="px-6 py-5 border-b border-border-subtle flex items-center gap-3 text-brand-teal">
            <Palette size={20} />
            <h2 className="text-h3 font-semibold text-text-primary">Appearance</h2>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary text-body">Theme</p>
              <p className="text-sm text-text-secondary">Toggle between light and dark mode</p>
            </div>
            <ThemeSwitch />
          </div>
        </section>

        <section className="bg-surface-raised border border-border-elevated rounded-xl shadow-sm flex flex-col md:col-span-2 transition-all duration-base hover:shadow-md">
          <div className="px-6 py-5 border-b border-border-subtle flex items-center gap-3 text-brand-teal">
            <Info size={20} />
            <h2 className="text-h3 font-semibold text-text-primary">About</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-border-subtle">
              <span className="text-text-secondary font-medium">App Version</span>
              <span className="font-bold text-mono text-text-primary bg-[var(--canvas)] px-2 py-1 rounded-sm text-sm">2.0.0</span>
            </div>
            <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-border-subtle">
              <span className="text-text-secondary font-medium">AI Model</span>
              <span className="font-bold text-text-primary bg-[var(--canvas)] px-2 py-1 rounded-sm text-sm">ResNet-18 (Mock Mode)</span>
            </div>
            <div className="sm:col-span-2 mt-2">
              <button className="flex items-center justify-center w-full gap-2 text-sm font-medium text-brand-teal hover:text-brand-teal-hover transition-colors p-4 rounded-lg border border-brand-teal-tint bg-brand-teal-tint/30 hover:bg-brand-teal-tint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal">
                <HelpCircle size={18} />
                Help & Documentation
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
