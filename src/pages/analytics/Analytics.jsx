import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  AlertTriangle, 
  Brain, 
  RefreshCw, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  Smile 
} from 'lucide-react';
import { getUserDataHistory, predictBurnout } from '../../services/api';

const Analytics = () => {
  const [userDataHistory, setUserDataHistory] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await getUserDataHistory();
      setUserDataHistory(data);
    } catch (err) {
      console.error('Failed to load activity history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const data = await predictBurnout();
      setPredictions(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load performance predictions. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchPredictions();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="text-primary w-8 h-8" />
            Model Predictions Center
          </h1>
          <p className="text-slate-400 mt-2">Real-time behavior-based predictions and cognitive forecasts generated from your daily assessments.</p>
        </div>
        <button
          onClick={() => {
            fetchPredictions();
            fetchHistory();
          }}
          disabled={loading || historyLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-primary/50 text-sm rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Predictions
        </button>
      </header>

      {error && (
        <div className="glass-card p-6 border-l-4 border-rose-500 flex items-center gap-4">
          <ShieldAlert className="w-10 h-10 text-rose-500 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-rose-400">Diagnostic Model Offline</h3>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <RefreshCw className="w-10 h-10 text-primary animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Running cognitive calculations...</p>
        </div>
      ) : predictions ? (
        <div className="space-y-6">
          {/* Predictions Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Performance Card */}
            <div className="glass-card p-6 border-l-4 border-primary">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-semibold">Performance Index</h3>
              </div>
              <p className="text-3xl font-extrabold">{predictions.productivity_index}%</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${predictions.productivity_index}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Live cognitive capability estimate</p>
            </div>

            {/* Burnout Risk Card */}
            <div className={`glass-card p-6 border-l-4 ${
              predictions.burnout_risk > 70 ? 'border-rose-500' :
              predictions.burnout_risk > 40 ? 'border-amber-500' : 'border-emerald-500'
            }`}>
              <div className="flex items-center gap-2 mb-2 text-slate-300">
                <AlertTriangle className={`w-5 h-5 ${
                  predictions.burnout_risk > 70 ? 'text-rose-500' :
                  predictions.burnout_risk > 40 ? 'text-amber-500' : 'text-emerald-500'
                }`} />
                <h3 className="font-semibold text-slate-300">Burnout Risk</h3>
              </div>
              <p className="text-3xl font-extrabold">
                {predictions.burnout_risk}% 
                <span className="text-sm font-bold ml-2">
                  ({predictions.burnout_risk > 70 ? 'High' : predictions.burnout_risk > 40 ? 'Medium' : 'Low'})
                </span>
              </p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full ${
                    predictions.burnout_risk > 70 ? 'bg-rose-500' :
                    predictions.burnout_risk > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} 
                  style={{ width: `${predictions.burnout_risk}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Stress & fatigue threshold</p>
            </div>

            {/* Behavioral State Card */}
            <div className="glass-card p-6 border-l-4 border-cyan-500">
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <Activity className="w-5 h-5" />
                <h3 className="font-semibold">Behavioral State</h3>
              </div>
              <p className="text-3xl font-extrabold">
                {predictions.metrics.avg_stress > 3 ? 'Elevated Stress' : 'Balanced'}
              </p>
              <p className="text-xs text-slate-400 mt-3 font-medium">
                Stress: {predictions.metrics.avg_stress}/5 · Fatigue: {predictions.metrics.avg_fatigue}/5
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Focus Window */}
            <div className="glass-card p-6 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Optimal Focus Window</span>
              <div className="flex items-center gap-2 text-lg font-bold text-slate-200">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>{predictions.scheduling.optimal_focus_window}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Style Preference: <strong className="text-slate-300">{predictions.scheduling.style}</strong>
              </p>
            </div>

            {/* AI Narrative Forecast */}
            <div className="lg:col-span-2 glass-card p-6 bg-gradient-to-br from-surface to-indigo-950/20 border border-primary/20 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-primary animate-pulse" />
                AI Forecast & Recommendation Summary
              </h3>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                {predictions.recommendation}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 italic">
          No predictions available. Please submit your daily assessment first.
        </div>
      )}

      {/* Full Width Bottom: Historic Log Reports */}
      <div className="glass-card p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="text-primary w-5 h-5" /> Historic Logs & Activity Reports
          </h2>
          <button 
            onClick={fetchHistory}
            disabled={historyLoading}
            className="p-2 bg-white/5 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <p className="text-xs text-slate-500">Loading historical logs...</p>
            </div>
          ) : userDataHistory.length === 0 ? (
            <p className="text-slate-500 italic text-sm py-12 text-center">No daily activity records logged yet. Fill out the Daily Assessment page!</p>
          ) : (
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="pb-3 pl-2">Logged Date</th>
                  <th className="pb-3">Sleep</th>
                  <th className="pb-3">Study/Work</th>
                  <th className="pb-3">Mood Score</th>
                  <th className="pb-3">Stress</th>
                  <th className="pb-3">Fatigue</th>
                  <th className="pb-3">Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {userDataHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-2 font-medium">
                      {new Date(log.created_at).toLocaleDateString(undefined, { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4">
                      <span className="font-semibold text-slate-200">{log.sleep_hours}h</span>
                    </td>
                    <td className="py-4">
                      <span className="font-semibold text-slate-200">{log.study_hours}h</span>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1">
                        <Smile className="w-3.5 h-3.5 text-amber-400" />
                        {log.mood_score || 3}/5
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.stress_level >= 4 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        log.stress_level >= 3 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {log.stress_level || 2}/5
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.fatigue_level >= 4 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        log.fatigue_level >= 3 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {log.fatigue_level || 2}/5
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-slate-200">{log.pending_tasks || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
