UPDATE leaderboard_entries
SET final_score = ROUND(
    (
        (tps * (success_rate / 100.0)) * 
        (250.0 / (250.0 + COALESCE(p99, 0))) * 
        POWER(correctness_score / 100.0, 2) * 
        POWER(concurrency_score / 100.0, 2)
    )::numeric, 
    2
);

-- Recalculate ranks based on the new final_score
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY final_score DESC, success_rate DESC, p99 ASC, tps DESC, created_at ASC) AS rank_value
  FROM leaderboard_entries
)
UPDATE leaderboard_entries
SET rank = ranked.rank_value
FROM ranked
WHERE leaderboard_entries.id = ranked.id;
