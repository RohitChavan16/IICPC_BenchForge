import { useEffect, useRef, useState, useMemo } from 'react';
import type { LeaderboardEntry } from '@/types/api';

export type RankMovement = 'up' | 'down' | 'new' | 'none';

export interface LeaderboardLiveStateEntry extends LeaderboardEntry {
  previousRank?: number;
  rankDelta: number;
  movement: RankMovement;
}

export type ActivityEventType = 
  | 'Rank Improved' 
  | 'Rank Dropped' 
  | 'New Leaderboard Entry' 
  | 'Leaderboard Exit';

export interface ActivityEvent {
  id: string;
  timestamp: number;
  type: ActivityEventType;
  teamName: string;
  submissionName: string;
  details: string;
  isPositive: boolean;
}

export type VolatilityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export function useLeaderboardLiveState(currentEntries: LeaderboardEntry[]) {
  const previousEntriesRef = useRef<LeaderboardEntry[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [volatility, setVolatility] = useState<{ level: VolatilityLevel; changedCount: number }>({ level: 'LOW', changedCount: 0 });

  const liveEntries = useMemo(() => {
    const prevMap = new Map<string, LeaderboardEntry>();
    previousEntriesRef.current.forEach(entry => prevMap.set(entry.teamName, entry));

    return currentEntries.map(entry => {
      const prev = prevMap.get(entry.teamName);
      let movement: RankMovement = 'none';
      let rankDelta = 0;

      if (!prev) {
        movement = 'new';
      } else {
        rankDelta = prev.rank - entry.rank;
        if (rankDelta > 0) movement = 'up';
        else if (rankDelta < 0) movement = 'down';
      }

      return {
        ...entry,
        previousRank: prev?.rank,
        rankDelta,
        movement,
      } as LeaderboardLiveStateEntry;
    });
  }, [currentEntries]);

  useEffect(() => {
    const prev = previousEntriesRef.current;
    if (prev.length === 0 && currentEntries.length > 0) {
      // First load, don't generate activity
      previousEntriesRef.current = currentEntries;
      return;
    }

    if (currentEntries.length === 0) return;

    const prevMap = new Map<string, LeaderboardEntry>();
    prev.forEach(entry => prevMap.set(entry.teamName, entry));

    const newEvents: ActivityEvent[] = [];
    let rankChanges = 0;

    currentEntries.forEach(curr => {
      const p = prevMap.get(curr.teamName);
      
      if (!p) {
        newEvents.push({
          id: `${curr.teamName}-new-${Date.now()}`,
          timestamp: Date.now(),
          type: 'New Leaderboard Entry',
          teamName: curr.teamName,
          submissionName: curr.submissionName,
          details: `Entered at rank #${curr.rank} with score ${curr.finalScore.toFixed(0)}`,
          isPositive: true,
        });
        rankChanges++;
      } else if (p.rank !== curr.rank) {
        rankChanges++;
        const delta = p.rank - curr.rank;
        if (delta > 0) {
          newEvents.push({
            id: `${curr.teamName}-up-${Date.now()}`,
            timestamp: Date.now(),
            type: 'Rank Improved',
            teamName: curr.teamName,
            submissionName: curr.submissionName,
            details: `Climbed ${delta} position${delta > 1 ? 's' : ''} to #${curr.rank}`,
            isPositive: true,
          });
        } else if (delta < 0) {
          newEvents.push({
            id: `${curr.teamName}-down-${Date.now()}`,
            timestamp: Date.now(),
            type: 'Rank Dropped',
            teamName: curr.teamName,
            submissionName: curr.submissionName,
            details: `Dropped ${Math.abs(delta)} position${Math.abs(delta) > 1 ? 's' : ''} to #${curr.rank}`,
            isPositive: false,
          });
        }
      }
    });

    const currMap = new Map<string, LeaderboardEntry>();
    currentEntries.forEach(entry => currMap.set(entry.teamName, entry));
    
    prev.forEach(p => {
      if (!currMap.has(p.teamName)) {
        newEvents.push({
          id: `${p.teamName}-exit-${Date.now()}`,
          timestamp: Date.now(),
          type: 'Leaderboard Exit',
          teamName: p.teamName,
          submissionName: p.submissionName,
          details: `Dropped off the leaderboard (was #${p.rank})`,
          isPositive: false,
        });
        rankChanges++;
      }
    });

    if (newEvents.length > 0) {
      setActivityFeed(prevFeed => {
        // keep recent 30
        const combined = [...newEvents, ...prevFeed];
        return combined.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
      });
    }

    if (currentEntries !== prev) {
      // Calculate volatility
      let vol: VolatilityLevel = 'LOW';
      const pctChanged = currentEntries.length > 0 ? (rankChanges / currentEntries.length) : 0;
      if (pctChanged > 0.2 || rankChanges >= 10) vol = 'HIGH';
      else if (pctChanged > 0.05 || rankChanges >= 3) vol = 'MEDIUM';
      
      setVolatility({ level: vol, changedCount: rankChanges });
    }

    previousEntriesRef.current = currentEntries;
  }, [currentEntries]);

  return {
    liveEntries,
    activityFeed,
    volatility,
  };
}
