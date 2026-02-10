import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
};

export const Avatar = ({ name, src, size = 'md', className }: AvatarProps) => (
  <div
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-medium text-white',
      sizeClasses[size],
      className
    )}
  >
    {src ? (
      <img
        src={src}
        alt={name}
        className="h-full w-full rounded-full object-cover"
      />
    ) : (
      getInitials(name)
    )}
  </div>
);
