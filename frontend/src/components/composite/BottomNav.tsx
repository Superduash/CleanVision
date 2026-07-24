import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/history', label: 'History', icon: History },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-surface border-t border-border-subtle pb-safe md:hidden z-40">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1',
                  'transition-colors duration-200 touch-manipulation',
                  isActive
                    ? 'text-brand-teal'
                    : 'text-text-tertiary hover:text-text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
