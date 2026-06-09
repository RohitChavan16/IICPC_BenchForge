import React from 'react';
import { motion } from 'framer-motion';
import { PageHero } from '@/components/layout/PageHero';
import { ExecutiveKPIStrip } from '@/components/dashboard/ExecutiveKPIStrip';
import { DashboardLiveCommandCenter } from '@/components/dashboard/DashboardLiveCommandCenter';
import { PerformanceAnalyticsTabs } from '@/components/dashboard/PerformanceAnalyticsTabs';
import { ReplayHighlightsSnapshot } from '@/components/dashboard/ReplayHighlightsSnapshot';
import { LeaderboardSnapshot } from '@/components/dashboard/LeaderboardSnapshot';
import { RecentSubmissionsTable } from '@/components/dashboard/RecentSubmissionsTable';
import { BenchmarkSessionsTimeline } from '@/components/dashboard/BenchmarkSessionsTimeline';
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed';
import { LearningGuidanceCenter } from '@/components/dashboard/LearningGuidanceCenter';
import { LayoutDashboard, Activity, Database, Server, Trophy } from 'lucide-react';

export function DashboardHomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="pb-10 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <PageHero 
          theme="dashboard"
          icon={<LayoutDashboard size={40} />}
          title="Command Center"
          subtitle="Gain unparalleled visibility into your global platform orchestration. Monitor real-time telemetry, track your competitive ranking, analyze throughput bottlenecks, and continuously optimize your execution strategies to dominate the global leaderboard."
          statusPills={[
            { label: 'System Online', variant: 'success' },
            { label: 'High Traffic', variant: 'warning' },
            { label: 'Auto-Scaling Active', variant: 'info' }
          ]}
          metadata={[
            { label: 'Current Season', value: 'Phase 4 - The Reckoning' },
            { label: 'Current Rank', value: '#12' },
            { label: 'Best Score', value: '84,291' },
            { label: 'Benchmarks Run', value: '142' },
            { label: 'Global Uptime', value: '99.99%' },
            { label: 'Active Region', value: 'US-East-1' }
          ]}
          quickLinks={[
            { label: 'Overview', targetId: 'overview', icon: <Activity size={16} /> },
            { label: 'Live Operations', targetId: 'live', icon: <Server size={16} /> },
            { label: 'Historical Data', targetId: 'historical', icon: <Database size={16} /> },
            { label: 'Learning & Guidance', targetId: 'guidance', icon: <Trophy size={16} /> }
          ]}
        />
      </motion.div>

      <motion.div variants={itemVariants} id="overview" className="scroll-mt-32">
        <ExecutiveKPIStrip />
      </motion.div>

      <motion.div variants={itemVariants} id="live" className="scroll-mt-32">
        <DashboardLiveCommandCenter />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col">
          <motion.div variants={itemVariants} id="historical" className="scroll-mt-32">
            <PerformanceAnalyticsTabs />
          </motion.div>

          <motion.div variants={itemVariants}>
            <ReplayHighlightsSnapshot />
          </motion.div>

          <motion.div variants={itemVariants}>
            <LeaderboardSnapshot />
          </motion.div>

          <motion.div variants={itemVariants}>
            <RecentSubmissionsTable />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <BenchmarkSessionsTimeline />
          </motion.div>
        </div>

        <div className="lg:col-span-1 flex flex-col">
          <motion.div variants={itemVariants} className="sticky top-24">
            <LiveActivityFeed />
            
            <div id="guidance" className="scroll-mt-32">
              <LearningGuidanceCenter />
            </div>
          </motion.div>
        </div>
      </div>
      
    </motion.div>
  );
}
