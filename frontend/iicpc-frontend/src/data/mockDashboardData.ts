export const mockExecutiveKPIs = {
  bestScore: { value: '84,291', trend: '+5.2%', description: 'Highest recorded benchmark score' },
  globalRank: { value: '12', trend: '+3', description: 'Current standing in Season 4' },
  benchmarksCompleted: { value: '142', trend: '+12', description: 'Total successful runs' },
  successRate: { value: '99.8%', trend: '+0.1%', description: 'Overall completion rate' },
  averageTPS: { value: '42,105', trend: '+2.4%', description: 'Mean throughput' },
  bestTPS: { value: '61,200', trend: '+8.1%', description: 'Peak throughput achieved' },
  bestP99: { value: '14ms', trend: '-2ms', description: 'Lowest tail latency' },
  correctness: { value: '100%', trend: '0%', description: 'Payload validation rate' }
};

export const mockPerformanceAnalytics = {
  tps: Array.from({ length: 24 }).map((_, i) => ({ time: `${i}:00`, value: Math.floor(Math.random() * 20000) + 40000 })),
  latency: Array.from({ length: 24 }).map((_, i) => ({ time: `${i}:00`, value: Math.floor(Math.random() * 5) + 12 })),
  success: Array.from({ length: 24 }).map((_, i) => ({ time: `${i}:00`, value: Math.floor(Math.random() * 2) + 98 })),
  correctness: Array.from({ length: 24 }).map((_, i) => ({ time: `${i}:00`, value: 100 }))
};

export const mockReplayHighlights = {
  status: 'Ready',
  peakTPS: '61,200',
  worstP99: '84ms',
  recoveryEvents: 3,
  anomaliesDetected: 1,
  worstPersona: 'Aggressive Trader',
  bestPersona: 'Casual Browser',
  availability: '7 Days',
  timeline: [
    { time: '0:00', type: 'start', label: 'Benchmark Started' },
    { time: '1:15', type: 'anomaly', label: 'Latency spike detected' },
    { time: '2:30', type: 'recovery', label: 'System recovered' },
    { time: '5:00', type: 'end', label: 'Benchmark Completed' }
  ]
};

export const mockLeaderboardSnapshot = {
  currentUser: {
    rank: 12,
    team: 'Team Alpha',
    score: '84,291',
    rankChange: '+3',
    gapToNext: '1,200',
    gapToTop10: '5,400'
  },
  topTeams: [
    { rank: 1, team: 'Code Ninjas', score: '112,040', tps: '75,000', correctness: '100%' },
    { rank: 2, team: 'Byte Me', score: '108,500', tps: '72,100', correctness: '100%' },
    { rank: 3, team: 'Runtime Terror', score: '105,200', tps: '70,500', correctness: '100%' },
    { rank: 4, team: 'Null Pointers', score: '101,100', tps: '68,200', correctness: '99.9%' },
    { rank: 5, team: 'Stack Overflowers', score: '98,400', tps: '65,400', correctness: '100%' }
  ]
};

export const mockRecentSubmissions = [
  { id: 'sub_123', name: 'v2.4 Optimized', language: 'Go', score: '84,291', tps: '61,200', p99: '14ms', status: 'Passed', created: '2 mins ago' },
  { id: 'sub_122', name: 'v2.3 Cache Fix', language: 'Go', score: '81,100', tps: '58,400', p99: '18ms', status: 'Passed', created: '1 hour ago' },
  { id: 'sub_121', name: 'v2.2 Async DB', language: 'Go', score: '0', tps: '0', p99: '0ms', status: 'Failed', created: '3 hours ago' },
  { id: 'sub_120', name: 'v2.1 Base', language: 'Go', score: '75,400', tps: '52,100', p99: '24ms', status: 'Passed', created: '1 day ago' }
];

export const mockBenchmarkSessions = [
  { id: 'bench_998', submission: 'v2.4 Optimized', duration: '5m 12s', workers: 4, replay: 'Available', status: 'Success', personaMix: 'Balanced' },
  { id: 'bench_997', submission: 'v2.3 Cache Fix', duration: '5m 05s', workers: 4, replay: 'Available', status: 'Success', personaMix: 'Heavy Write' },
  { id: 'bench_996', submission: 'v2.2 Async DB', duration: '1m 20s', workers: 4, replay: 'Unavailable', status: 'Failed', personaMix: 'Balanced' }
];

export const mockLiveActivityFeed = [
  { id: '1', type: 'System', message: 'Worker node spin-up completed.', time: 'Just now' },
  { id: '2', type: 'Submission', message: 'v2.4 Optimized passed correctness checks.', time: '2 mins ago' },
  { id: '3', type: 'Leaderboard', message: 'You moved up 3 ranks to #12!', time: '15 mins ago' },
  { id: '4', type: 'Replay', message: 'Replay bench_998 generated successfully.', time: '20 mins ago' },
  { id: '5', type: 'System', message: 'Season 4 Phase 2 started.', time: '1 hour ago' }
];

export const mockLearningCards = [
  { id: 'scoring', title: 'How Scoring Works', description: 'Understand the formula balancing TPS, latency, and correctness.', icon: 'Calculator' },
  { id: 'tps', title: 'Understanding TPS', description: 'Learn how throughput is measured across distributed workers.', icon: 'Zap' },
  { id: 'latency', title: 'Understanding Latency', description: 'Why p99 matters more than average response times.', icon: 'Clock' },
  { id: 'personas', title: 'Understanding Personas', description: 'Explore the different simulated user profiles in benchmarks.', icon: 'Users' }
];
