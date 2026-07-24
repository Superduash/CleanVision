import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useStaffNameStore } from '@/lib/stores/staffNameStore';
import { ResponsiveModal } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function StaffChip() {
  const { staffName, setStaffName } = useStaffNameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [tempName, setTempName] = useState(staffName);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffName(tempName.trim());
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => {
          setTempName(staffName);
          setIsOpen(true);
        }}
        className="staff-chip flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised border border-border-subtle text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors focus-visible:outline-none focus-visible:shadow-glow-focus"
        aria-label="Set staff name"
      >
        <User size={14} />
        <span className="truncate max-w-[100px]">
          {staffName || 'Set Name'}
        </span>
      </button>

      <ResponsiveModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Staff Name"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4 pt-2">
          <Input
            label="Your Name"
            placeholder="e.g. Alex"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <p className="text-xs text-text-tertiary -mt-2">
            Stored locally on your device only.
          </p>
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!tempName.trim()}>
              Save
            </Button>
          </div>
        </form>
      </ResponsiveModal>
    </>
  );
}
