import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { mockLearningCards } from '@/data/mockDashboardData';
import { Calculator, Zap, Clock, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LearningGuidanceCenter() {
  const iconMap: Record<string, React.ReactNode> = {
    Calculator: <Calculator size={20} className="text-indigo-500" />,
    Zap: <Zap size={20} className="text-amber-500" />,
    Clock: <Clock size={20} className="text-rose-500" />,
    Users: <Users size={20} className="text-cyan-500" />
  };

  return (
    <SectionWrapper 
      title="Learning & Guidance Center" 
      description="Understand platform mechanics and scoring to improve your rank."
      expandable={true}
      defaultExpanded={false}
      className="mb-8 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockLearningCards.map(card => (
          <div key={card.id} className="p-5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col group">
            <div className="p-2.5 rounded-lg bg-background border border-border self-start mb-4 shadow-sm">
              {iconMap[card.icon]}
            </div>
            <h4 className="font-bold text-foreground mb-2">{card.title}</h4>
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              {card.description}
            </p>
            <Link to={`/docs/${card.id}`} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              Learn More <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
