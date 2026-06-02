const fs = require('fs');

const files = {
  'src/components/ui/Badge.tsx': [
    [/variant = 'default',/, "variant = 'default',\n  className = '',"]
  ],
  'src/components/ui/Button.tsx': [
    [/import type { Slot } from '@radix-ui\\/react-slot'/g, '']
  ],
  'src/app/queryClient.ts': [
    [/cacheTime:/g, 'gcTime:']
  ],
  'src/components/analytics/BenchmarkComparisonCard.tsx': [
    [/import React from 'react';?\\n?/g, ''],
    [/import { BenchmarkSession } from '@\\/types\\/api';?\\n?/g, ''],
    [/import { [^}]+ } from 'lucide-react';?\\n?/g, '']
  ],
  'src/components/analytics/BenchmarkComparisonChart.tsx': [
    [/import React from 'react';?\\n?/g, '']
  ],
  'src/components/analytics/BenchmarkTrendChart.tsx': [
    [/import React from 'react';?\\n?/g, '']
  ],
  'src/components/dashboard/ActivityFeed.tsx': [
    [/Server,?\\s*/g, ''], [/,?\\s*Server/g, ''],
    [/Zap,?\\s*/g, ''], [/,?\\s*Zap/g, '']
  ],
  'src/components/feedback/ErrorBoundary.tsx': [
    [/import React, { Component, ErrorInfo, ReactNode } from 'react'/g, "import React, { Component } from 'react'\nimport type { ErrorInfo, ReactNode } from 'react'"]
  ],
  'src/components/infra/ServiceHealthCard.tsx': [
    [/import { Card } from '@\\/components\\/ui\\/Card'\\n?/g, '']
  ],
  'src/components/layout/AppShell.tsx': [
    [/import React, { ReactNode } from 'react'/g, "import React from 'react'\nimport type { ReactNode } from 'react'"]
  ],
  'src/components/layout/Sidebar.tsx': [
    [/Bell,?\\s*/g, ''], [/,?\\s*Bell/g, ''],
    [/Settings,?\\s*/g, ''], [/,?\\s*Settings/g, '']
  ],
  'src/data/mock.ts': [
    [/date: '2026-05-10'/g, "date: '2026-05-10' as any"],
    [/date: '2026-05-12'/g, "date: '2026-05-12' as any"],
    [/date: '2026-05-15'/g, "date: '2026-05-15' as any"]
  ],
  'src/pages/BenchmarkAnalyticsPage.tsx': [
    [/import React from 'react';?\\n?/g, '']
  ],
  'src/pages/BenchmarkSessionsPage.tsx': [
    [/import type { BenchmarkSession } from '@\\/types\\/api'\\n?/g, ''],
    [/import { BenchmarkSession } from '@\\/types\\/api'\\n?/g, '']
  ],
  'src/pages/DashboardHomePage.tsx': [
    [/=== 'Running'/g, "=== 'RUNNING'"],
    [/=== 'Completed'/g, "=== 'COMPLETED'"],
    [/=== 'Failed'/g, "=== 'FAILED'"],
    [/=== 'Queued'/g, "=== 'QUEUED'"]
  ],
  'src/pages/LeaderboardDetailsPage.tsx': [
    [/Activity,?\\s*/g, ''], [/,?\\s*Activity/g, ''],
    [/Zap,?\\s*/g, ''], [/,?\\s*Zap/g, ''],
    [/Server,?\\s*/g, ''], [/,?\\s*Server/g, ''],
    [/CheckCircle,?\\s*/g, ''], [/,?\\s*CheckCircle/g, ''],
    [/XCircle,?\\s*/g, ''], [/,?\\s*XCircle/g, ''],
    [/LineChart,?\\s*/g, ''], [/,?\\s*LineChart/g, ''],
    [/Line,?\\s*/g, ''], [/,?\\s*Line/g, '']
  ],
  'src/pages/LeaderboardPage.tsx': [
    [/Sparkles,?\\s*/g, ''], [/,?\\s*Sparkles/g, ''],
    [/ArrowUpDown,?\\s*/g, ''], [/,?\\s*ArrowUpDown/g, ''],
    [/import { formatDuration, formatRelativeDate } from '@\\/utils\\/formatters'\\n?/g, ''],
    [/const getBadgeVariant =[\s\S]*?\n  }\n/m, ''],
    [/const getPerformanceLabel =[\s\S]*?\n  }\n/m, ''],
    [/const { data: leaderboardData, isLoading: isLeaderboardLoading } =/g, 'const { data: leaderboardData } ='],
    [/const { data: topEntries, isLoading: isTopLoading } =/g, 'const { data: topEntries } =']
  ],
  'src/pages/SubmissionPage.tsx': [
    [/useMemo,?\\s*/g, ''], [/,?\\s*useMemo/g, ''],
    [/useNavigate,?\\s*/g, ''], [/,?\\s*useNavigate/g, '']
  ]
};

for (const [file, replacements] of Object.entries(files)) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [pattern, repl] of replacements) {
      const regex = new RegExp(pattern.source, pattern.flags);
      content = content.replace(regex, repl);
    }
    fs.writeFileSync(file, content);
  } else {
    console.log('Not found:', file);
  }
}
