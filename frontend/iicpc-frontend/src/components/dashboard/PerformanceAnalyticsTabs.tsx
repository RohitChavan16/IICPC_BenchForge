import React, { useState } from 'react';
import { SectionWrapper } from './SectionWrapper';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockPerformanceAnalytics } from '@/data/mockDashboardData';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'tps' | 'latency' | 'success' | 'correctness';

const tabDetails = {
  tps: { label: 'TPS', color: '#3b82f6', desc: 'Throughput (Transactions Per Second)' },
  latency: { label: 'Latency (ms)', color: '#f59e0b', desc: 'p99 Response Time' },
  success: { label: 'Success %', color: '#10b981', desc: 'Successful API Calls' },
  correctness: { label: 'Correctness %', color: '#8b5cf6', desc: 'Payload Validation Pass Rate' }
};

export function PerformanceAnalyticsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('tps');

  const data = mockPerformanceAnalytics[activeTab];
  const details = tabDetails[activeTab];

  const actions = (
    <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
      {(Object.keys(tabDetails) as Tab[]).map((key) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === key 
              ? 'bg-background shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {tabDetails[key].label}
        </button>
      ))}
    </div>
  );

  return (
    <SectionWrapper 
      title="Performance Analytics" 
      description="Historical trend analysis over the last 24 hours."
      badgeLabel="Updated 2m ago"
      actions={actions}
      className="mb-8"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-lg">{details.label} Trend</h4>
            <p className="text-sm text-muted-foreground">{details.desc}</p>
          </div>
        </div>
        
        <div className="h-[300px] w-full mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10 dark:opacity-20" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="currentColor" 
                    className="text-muted-foreground text-xs" 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="currentColor" 
                    className="text-muted-foreground text-xs" 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: details.color, fontWeight: 'bold' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line 
                    type="monotone" 
                    name={details.label}
                    dataKey="value" 
                    stroke={details.color} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SectionWrapper>
  );
}
