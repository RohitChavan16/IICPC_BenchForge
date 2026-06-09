import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export interface MetadataPill {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export interface StatusPill {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'accent';
}

export interface QuickLink {
  label: string;
  targetId: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface PageHeroProps {
  theme: 'dashboard' | 'submission' | 'leaderboard' | 'benchmark' | 'team';
  backLink?: { label: string; to: string };
  statusPills?: StatusPill[];
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  metadata?: MetadataPill[];
  quickLinks?: QuickLink[];
}

const themeConfig = {
  dashboard: {
    gradient: 'bg-gradient-to-br from-fuchsia-600/30 via-indigo-600/20 to-background dark:from-fuchsia-900/40 dark:via-indigo-900/20 dark:to-background',
    orb: 'bg-fuchsia-500/40',
    border: 'border-fuchsia-500/30',
    accentText: 'text-fuchsia-700 dark:text-fuchsia-400',
    accentBg: 'bg-fuchsia-500/20',
    lightBg: 'bg-fuchsia-50/50 dark:bg-card/80',
    activeTab: 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]',
    inactiveTab: 'bg-background/80 text-muted-foreground border-border hover:bg-background hover:border-fuchsia-500/50 hover:text-foreground'
  },
  submission: {
    gradient: 'from-blue-500/20 via-cyan-500/5 to-background',
    orb: 'bg-green-500/60',
    border: 'border-blue-500/20',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    lightBg: 'bg-blue-50/50 dark:bg-card',
    activeTab: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  leaderboard: {
    gradient: 'from-amber-400/20 via-orange-500/5 to-background',
    orb: 'bg-amber-500/20',
    border: 'border-amber-500/20',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    lightBg: 'bg-amber-50/50 dark:bg-card',
    activeTab: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  benchmark: {
    gradient: 'from-emerald-500/20 via-teal-500/5 to-background',
    orb: 'bg-emerald-500/20',
    border: 'border-emerald-500/20',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    lightBg: 'bg-emerald-50/50 dark:bg-card',
    activeTab: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  history: {
    gradient: 'from-cyan-500/20 via-blue-500/5 to-background',
    orb: 'bg-cyan-500/20',
    border: 'border-cyan-500/20',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    lightBg: 'bg-cyan-50/50 dark:bg-card',
    activeTab: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  },
  team: {
    gradient: 'from-rose-500/20 via-purple-500/5 to-background',
    orb: 'bg-rose-500/20',
    border: 'border-rose-500/20',
    accentText: 'text-rose-400',
    accentBg: 'bg-rose-500/10',
    lightBg: 'bg-rose-50/50 dark:bg-card',
    activeTab: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  }
};

const statusVariantConfig = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accent: 'bg-primary/10 text-primary border-primary/20',
};

export function PageHero({ theme, backLink, statusPills, icon, title, subtitle, metadata, quickLinks }: PageHeroProps) {
  const t = themeConfig[theme];
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!quickLinks || quickLinks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    quickLinks.forEach((link) => {
      const el = document.getElementById(link.targetId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [quickLinks]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl border ${t.border} ${t.lightBg || 'bg-card'} ${t.gradient} p-6 xl:p-8 min-h-[160px] shadow-sm mb-6 group`}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[100px] ${t.orb} opacity-40 dark:opacity-60`} />
        <div className={`absolute top-1/2 -right-32 w-80 h-80 rounded-full blur-[80px] ${t.orb} opacity-30 dark:opacity-40`} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-50 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Layer 1: Navigation Row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {backLink && (
              <Link to={backLink.to} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${t.accentBg} hover:bg-background border ${t.border} text-sm font-medium ${t.accentText} transition-all shadow-sm hover:shadow-md`}>
                <ArrowLeft size={16} />
                {backLink.label}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {statusPills?.map((pill, i) => {
              const variantClass = statusVariantConfig[pill.variant || 'accent'];
              return (
                <div key={i} className={`px-3 py-1 rounded-full text-xs font-bold border ${variantClass} shadow-sm backdrop-blur-sm uppercase tracking-wider`}>
                  {pill.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Layer 2: Identity Section */}
        <div className="flex items-start gap-5 mb-4">
          <div className={`flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center border border-white/10 shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] backdrop-blur-md ${t.accentBg}`}>
            <div className={`${t.accentText} w-10 h-10`}>
              {icon}
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-1 drop-shadow-sm">
              {title}
            </h1>
            <p className={`text-xs md:text-sm font-medium text-foreground/80 dark:text-muted-foreground max-w-3xl mt-1 leading-relaxed`}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Layer 3: Metadata Strip */}
        {metadata && metadata.length > 0 && (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="flex flex-wrap items-center gap-3 mb-6"
          >
            {metadata.map((m, i) => (
              <motion.div key={i} variants={itemVariants} className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border backdrop-blur-sm text-sm ${['bg-blue-500/10 text-blue-700 dark:text-blue-300', 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', 'bg-violet-500/10 text-violet-700 dark:text-violet-300', 'bg-amber-500/10 text-amber-700 dark:text-amber-300'][i % 4]}`}>
                {m.icon && <span className="text-muted-foreground">{m.icon}</span>}
                <span className="text-muted-foreground">{m.label}:</span>
                <span className="font-bold text-foreground">{m.value}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Layer 4: Quick Navigation */}
        {quickLinks && quickLinks.length > 0 && (
          <div className="pt-4 mt-auto border-t border-border/30">
            <div className="flex flex-wrap items-center gap-3">
              {quickLinks.map((ql, i) => {
                const isActive = activeId === ql.targetId;
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (ql.onClick) {
                        ql.onClick();
                      }
                      scrollTo(ql.targetId);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                      isActive ? t.activeTab || 'bg-primary text-primary-foreground border-primary' : (t as any).inactiveTab || 'bg-background/80 text-muted-foreground border-border'
                    }`}
                  >
                    {ql.icon}
                    {ql.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
