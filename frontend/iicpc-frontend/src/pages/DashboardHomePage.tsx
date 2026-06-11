import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHero } from '@/components/layout/PageHero';
import { ExecutiveKPIStrip } from '@/components/dashboard/ExecutiveKPIStrip';
import { DashboardLiveCommandCenter } from '@/components/dashboard/DashboardLiveCommandCenter';
import { ReplayHighlightsSnapshot } from '@/components/dashboard/ReplayHighlightsSnapshot';
import { LeaderboardSnapshot } from '@/components/dashboard/LeaderboardSnapshot';
import { RecentSubmissionsTable } from '@/components/dashboard/RecentSubmissionsTable';
import { BenchmarkSessionsTimeline } from '@/components/dashboard/BenchmarkSessionsTimeline';
import { LayoutDashboard, Activity, Database, Server, Trophy } from 'lucide-react';
import { getSharedWebsocketClient } from '@/services/websocket/websocketClient';
import type { WebSocketStatus } from '@/services/websocket/websocketClient';
import { fetchBenchmarkSessions } from '@/services/api/benchmarkService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSubmissionStore } from '@/stores/useSubmissionStore';
import { fetchLeaderboardEntries, fetchLeaderboardForTeam } from '@/services/api/leaderboardService';

export function DashboardHomePage() {
  const { user } = useAuthStore();
  const { submissionsHistory, fetchSubmissions } = useSubmissionStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  const [benchmarksRun, setBenchmarksRun] = useState<number | '-'>('-');

  useEffect(() => {
    const ws = getSharedWebsocketClient(import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws');
    setWsStatus(ws.getStatus());

    const handleStatus = (status: WebSocketStatus) => setWsStatus(status);
    ws.addStatusHandler(handleStatus);
    ws.connect();

    const fetchAll = () => {
      fetchSubmissions();
      const teamName = user?.team || user?.name;
      if (teamName) {
        fetchLeaderboardForTeam(teamName).then(data => setLeaderboard(data.items || [])).catch(console.error);
      } else {
        fetchLeaderboardEntries().then(data => setLeaderboard(data.items || [])).catch(console.error);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 5000);

    fetchBenchmarkSessions()
      .then(res => setBenchmarksRun(res.total))
      .catch(err => console.error('Failed to fetch benchmark sessions', err));

    return () => {
      ws.removeStatusHandler(handleStatus);
      clearInterval(interval);
    };
  }, [fetchSubmissions, user]);

  const userLeaderboardEntries = leaderboard.filter(l => 
    submissionsHistory.some(s => s.id === l.submissionId)
  );

  const bestRankNum = userLeaderboardEntries.length > 0 ? Math.min(...userLeaderboardEntries.map(l => l.rank)) : null;
  const bestScoreNum = userLeaderboardEntries.length > 0 ? Math.max(...userLeaderboardEntries.map(l => l.finalScore)) : null;
  const correctnessScores = userLeaderboardEntries.filter(l => l.correctnessScore !== undefined).map(l => l.correctnessScore as number);
  const avgCorrectnessNum = correctnessScores.length > 0 ? correctnessScores.reduce((a, b) => a + b, 0) / correctnessScores.length : null;

  const statusPill = wsStatus === 'connected' 
    ? { label: 'System Online', variant: 'success' as const }
    : { label: 'System Offline', variant: 'error' as const };

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
          statusPills={[statusPill]}
          metadata={[
            { label: 'Current Season', value: 'Season 1' },
            { label: 'Current Rank', value: bestRankNum !== null ? `#${bestRankNum}` : '-' },
            { label: 'Best Score', value: bestScoreNum !== null ? bestScoreNum.toFixed(2) : '-' },
            { label: 'Deployments', value: submissionsHistory.length.toString() },
            { label: 'Benchmarks Run', value: benchmarksRun.toString() },
            { label: 'Active Region', value: 'Global' }
          ]}
          quickLinks={[
            { label: 'Overview', targetId: 'overview', icon: <Activity size={16} /> },
            { label: 'Live Operations', targetId: 'live', icon: <Server size={16} /> },
            { label: 'Historical Data', targetId: 'historical', icon: <Database size={16} /> }
          ]}
        />
      </motion.div>

      <motion.div variants={itemVariants} id="overview" className="scroll-mt-32">
        <ExecutiveKPIStrip 
          bestScore={bestScoreNum}
          globalRank={bestRankNum}
          correctness={avgCorrectnessNum}
        />
      </motion.div>

      <motion.div variants={itemVariants} id="live" className="scroll-mt-32">
        <DashboardLiveCommandCenter />
      </motion.div>

      <div className="flex flex-col gap-8">
        <motion.div variants={itemVariants} id="historical" className="scroll-mt-32">
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
      
    </motion.div>
  );
}
