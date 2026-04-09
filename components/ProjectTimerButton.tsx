'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectTimerButtonProps {
  name: string;
  color: string;
  elapsedLabel?: string;
  isActive: boolean;
  onClick: () => void;
}

export function ProjectTimerButton({
  name,
  color,
  elapsedLabel,
  isActive,
  onClick,
}: ProjectTimerButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={cn(
        'h-24 w-full flex-col items-start justify-center gap-1 text-left text-white shadow-sm transition hover:opacity-95',
        isActive && 'ring-2 ring-white/70'
      )}
      style={{ backgroundColor: color }}
    >
      <span className="w-full truncate text-sm font-semibold text-white">{name}</span>
      <span
        className={cn(
          'w-full font-mono text-white',
          isActive ? 'text-3xl leading-none font-bold tracking-tight' : 'text-sm opacity-90'
        )}
      >
        {isActive ? elapsedLabel : 'Tap to start'}
      </span>
    </Button>
  );
}
