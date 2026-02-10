import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: StatCardProps) => (
  <div
    className={cn(
      'rounded-xl border border-border bg-white p-5 shadow-sm',
      className
    )}
  >
    <div className="flex items-start justify-between">
      <p className="text-sm text-foreground/50">{title}</p>
      {icon && <div className="text-primary">{icon}</div>}
    </div>
    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    <div className="mt-1 flex items-center gap-2">
      {trend && (
        <span
          className={cn(
            'text-xs font-medium',
            trend.positive ? 'text-success' : 'text-danger'
          )}
        >
          {trend.positive ? '+' : ''}
          {trend.value}
        </span>
      )}
      {subtitle && (
        <span className="text-xs text-foreground/40">{subtitle}</span>
      )}
    </div>
  </div>
);
