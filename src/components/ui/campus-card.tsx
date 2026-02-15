import { MapPin, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAMPUS_INFO, CampusType } from '@/lib/constants';

interface CampusCardProps {
  campus: CampusType;
  onClick: () => void;
  selected?: boolean;
}

export const CampusCard = ({ campus, onClick, selected }: CampusCardProps) => {
  const info = CAMPUS_INFO[campus];

  return (
    <button
      onClick={onClick}
      className={cn(
        'campus-card group w-full text-left',
        'bg-card border-2 transition-all duration-300',
        selected 
          ? 'border-accent ring-4 ring-accent/20' 
          : 'border-border hover:border-primary/50'
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon */}
      <div className="relative mb-4">
        <span className="text-5xl">{info.icon}</span>
        {selected && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative">
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
          {info.shortName}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {info.description}
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          <span>{info.location}</span>
        </div>

        <div className={cn(
          'flex items-center gap-2 font-medium transition-colors',
          selected ? 'text-accent' : 'text-primary group-hover:text-accent'
        )}>
          <span>Select Campus</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
};


