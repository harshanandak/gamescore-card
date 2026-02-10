import { useState, useEffect, useCallback, useRef } from 'react';
import { loadHistory, clearHistory as clearHistoryStorage, getStats, getParticipantStats } from '../utils/universalStorage';

export function useGameHistory() {
  const [history, setHistory] = useState([]);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    const data = loadHistory();
    if (isMounted.current) {
      setHistory(data);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clearAll = useCallback(() => {
    clearHistoryStorage();
    setHistory([]);
  }, []);

  const stats = getStats();

  const getStatsForGame = useCallback((templateId) => {
    return getStats(templateId);
  }, []);

  const getPlayerStats = useCallback((name) => {
    return getParticipantStats(name);
  }, []);

  const filterByTemplate = useCallback((templateId) => {
    return history.filter(h => h.templateId === templateId);
  }, [history]);

  return {
    history,
    stats,
    refresh,
    clearAll,
    getStatsForGame,
    getPlayerStats,
    filterByTemplate,
  };
}
