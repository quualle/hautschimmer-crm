import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-12 text-center',
      className
    )}
  >
    {icon && (
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground/40">
        {icon}
      </div>
    )}
    <h3 className="text-base font-medium text-foreground">{title}</h3>
    {description && (
      <p className="mt-1 max-w-sm text-sm text-foreground/50">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
