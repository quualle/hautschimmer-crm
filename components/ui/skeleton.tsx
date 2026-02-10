import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

const base = 'animate-pulse rounded-lg bg-secondary/60';

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn(base, className)} />
);

export const SkeletonText = ({ className }: SkeletonProps) => (
  <div className={cn(base, 'h-4 w-3/4', className)} />
);

export const SkeletonAvatar = ({ className }: SkeletonProps) => (
  <div className={cn(base, 'h-10 w-10 rounded-full', className)} />
);

export const SkeletonCard = ({ className }: SkeletonProps) => (
  <div
    className={cn(
      'rounded-xl border border-border bg-white p-5 space-y-3',
      className
    )}
  >
    <div className={cn(base, 'h-4 w-1/3')} />
    <div className={cn(base, 'h-8 w-1/2')} />
    <div className={cn(base, 'h-3 w-2/3')} />
  </div>
);

export const SkeletonTableRow = ({ className }: SkeletonProps) => (
  <div className={cn('flex gap-4 py-3', className)}>
    <div className={cn(base, 'h-4 w-1/4')} />
    <div className={cn(base, 'h-4 w-1/3')} />
    <div className={cn(base, 'h-4 w-1/6')} />
    <div className={cn(base, 'h-4 w-1/5')} />
  </div>
);
