import { AnimeStatus } from '@/types/anime';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AnimeStatus;
  className?: string;
}

const statusConfig: Record<AnimeStatus, { label: string; className: string }> = {
  'watching': { label: 'Watching', className: 'status-watching' },
  'completed': { label: 'Completed', className: 'status-completed' },
  'plan-to-watch': { label: 'Plan to Watch', className: 'status-plan' },
  'dropped': { label: 'Dropped', className: 'status-dropped' },
  'on-hold': { label: 'On Hold', className: 'status-on-hold' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
