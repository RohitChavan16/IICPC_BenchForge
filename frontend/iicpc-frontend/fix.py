import os

files = {
  'src/components/ui/Badge.tsx': [
    ("variant = 'default',", "variant = 'default',\n  className = '',")
  ],
  'src/components/ui/Button.tsx': [
    ("import type { Slot } from '@radix-ui/react-slot'\n", '')
  ],
  'src/app/queryClient.ts': [
    ("cacheTime:", 'gcTime:')
  ],
  'src/components/analytics/BenchmarkComparisonCard.tsx': [
    ("import React from 'react';\n", ''),
    ("import React from 'react'\n", ''),
    ("import { BenchmarkSession } from '@/types/api';\n", ''),
    ("import { BenchmarkSession } from '@/types/api'\n", ''),
  ],
  'src/components/analytics/BenchmarkComparisonChart.tsx': [
    ("import React from 'react';\n", ''),
    ("import React from 'react'\n", '')
  ],
  'src/components/analytics/BenchmarkTrendChart.tsx': [
    ("import React from 'react';\n", ''),
    ("import React from 'react'\n", '')
  ],
  'src/components/dashboard/ActivityFeed.tsx': [
    ("Server, ", ""), (", Server", ""),
    ("Zap, ", ""), (", Zap", "")
  ],
  'src/components/feedback/ErrorBoundary.tsx': [
    ("import React, { Component, ErrorInfo, ReactNode } from 'react'", "import React, { Component } from 'react'\nimport type { ErrorInfo, ReactNode } from 'react'")
  ],
  'src/components/infra/ServiceHealthCard.tsx': [
    ("import { Card } from '@/components/ui/Card'\n", '')
  ],
  'src/components/layout/AppShell.tsx': [
    ("import React, { ReactNode } from 'react'", "import React from 'react'\nimport type { ReactNode } from 'react'")
  ],
  'src/components/layout/Sidebar.tsx': [
    ("Bell, ", ""), (", Bell", ""),
    ("Settings, ", ""), (", Settings", "")
  ],
  'src/data/mock.ts': [
    ("date: '2026-05-10'", "date: '2026-05-10' as any"),
    ("date: '2026-05-12'", "date: '2026-05-12' as any"),
    ("date: '2026-05-15'", "date: '2026-05-15' as any")
  ],
  'src/pages/BenchmarkAnalyticsPage.tsx': [
    ("import React from 'react';\n", ''),
    ("import React from 'react'\n", '')
  ],
  'src/pages/BenchmarkSessionsPage.tsx': [
    ("import type { BenchmarkSession } from '@/types/api'\n", ''),
    ("import { BenchmarkSession } from '@/types/api'\n", '')
  ],
  'src/pages/DashboardHomePage.tsx': [
    ("=== 'Running'", "=== 'RUNNING'"),
    ("=== 'Completed'", "=== 'COMPLETED'"),
    ("=== 'Failed'", "=== 'FAILED'"),
    ("=== 'Queued'", "=== 'QUEUED'")
  ],
  'src/pages/LeaderboardDetailsPage.tsx': [
    ("Activity, ", ""), (", Activity", ""),
    ("Zap, ", ""), (", Zap", ""),
    ("Server, ", ""), (", Server", ""),
    ("CheckCircle, ", ""), (", CheckCircle", ""),
    ("XCircle, ", ""), (", XCircle", ""),
    ("LineChart, ", ""), (", LineChart", ""),
    ("Line, ", ""), (", Line", "")
  ],
  'src/pages/LeaderboardPage.tsx': [
    ("Sparkles, ", ""), (", Sparkles", ""),
    ("ArrowUpDown, ", ""), (", ArrowUpDown", ""),
    ("import { formatDuration, formatRelativeDate } from '@/utils/formatters'\n", ""),
    ("const getBadgeVariant = (val: number) => {\n    if (val >= 90) return 'success'\n    if (val >= 70) return 'warning'\n    return 'danger'\n  }\n", ""),
    ("const getPerformanceLabel = (val: number) => {\n    if (val >= 90) return 'Optimal'\n    if (val >= 70) return 'Degraded'\n    return 'Critical'\n  }\n", ""),
    ("const { data: leaderboardData, isLoading: isLeaderboardLoading } =", "const { data: leaderboardData } ="),
    ("const { data: topEntries, isLoading: isTopLoading } =", "const { data: topEntries } =")
  ],
  'src/pages/SubmissionPage.tsx': [
    ("useMemo, ", ""), (", useMemo", ""),
    ("useNavigate, ", ""), (", useNavigate", "")
  ]
}

for file_path, replacements in files.items():
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        for old, new in replacements:
            content = content.replace(old, new)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print(f"File not found: {file_path}")
