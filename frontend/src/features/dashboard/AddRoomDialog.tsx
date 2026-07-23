import React, { useState } from 'react';
import { ResponsiveModal } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateRoom } from '@/lib/api/hooks';
import { useToast } from '@/components/ui/toast';

const COMMON_BLOCKS = [
  'A', 'B', 'C', 'D', 'E', 'ICU', 'Emergency', 'Surgery', 'Outpatient'
];

interface AddRoomDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddRoomDialog({ open, onClose }: AddRoomDialogProps) {
  const [name, setName] = useState('');
  const [block, setBlock] = useState('');
  const createRoom = useCreateRoom();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !block) return;

    createRoom.mutate(
      { name: name.trim(), block },
      {
        onSuccess: () => {
          toast(`Room ${name.trim()} added to Block ${block}`);
          onClose();
          setName('');
          setBlock('');
        },
        onError: (error) => {
          toast(error.message, 'error');
        }
      }
    );
  };

  return (
    <ResponsiveModal open={open} onClose={onClose} title="Add New Room">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
        <Input
          label="Room Name or Number"
          placeholder="e.g. 101, Operating Theater 3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        
        <Select
          label="Block / Wing"
          value={block}
          onChange={(e) => setBlock(e.target.value)}
          options={COMMON_BLOCKS.map(b => ({ label: `Block ${b}`, value: b }))}
          placeholder="Select a block..."
          required
        />

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!name.trim() || !block || createRoom.isPending}
            loading={createRoom.isPending}
          >
            Add Room
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
