import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-foreground/70',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-50 text-blue-600',
};

export const Badge = ({
  className,
  variant = 'default',
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variantClasses[variant],
      className
    )}
    {...props}
  />
);
