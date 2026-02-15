import { Bus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'default' | 'white';
}

export const Logo = ({ 
  className, 
  size = 'md', 
  showText = true,
  variant = 'default' 
}: LogoProps) => {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', container: 'gap-2' },
    md: { icon: 'w-8 h-8', text: 'text-xl', container: 'gap-2' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl', container: 'gap-3' },
  };

  const colors = {
    default: {
      icon: 'text-primary',
      text: 'text-foreground',
      highlight: 'text-accent',
    },
    white: {
      icon: 'text-accent',
      text: 'text-white',
      highlight: 'text-accent',
    },
  };

  return (
    <div className={cn('flex items-center', sizes[size].container, className)}>
      <div className={cn(
        'rounded-xl p-2 bg-primary/10',
        variant === 'white' && 'bg-white/10'
      )}>
        <Bus className={cn(sizes[size].icon, colors[variant].icon)} />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-display font-bold leading-tight',
            sizes[size].text,
            colors[variant].text
          )}>
            UDS <span className={colors[variant].highlight}>BusConnect</span>
          </span>
          {size === 'lg' && (
            <span className={cn(
              'text-xs font-medium opacity-70',
              colors[variant].text
            )}>
              Powered by AnyCo Technologies
            </span>
          )}
        </div>
      )}
    </div>
  );
};



