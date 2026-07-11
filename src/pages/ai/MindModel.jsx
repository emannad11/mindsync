import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BrainCircuit, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Lightbulb,
  Zap,
  Target
} from 'lucide-react';
import { getAIInsights } from '../../services/api';

const MindModel = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await getAIInsights();
      setInsights(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
      setError('Unable to load AI recommendations. Please check if your backend is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Map icons for advice list cards to make it visually engaging
  const adviceIcons = [
    <Zap className="w-5 h-5 text-indigo-400" />,
    <Lightbulb className="w-5 h-5 text-amber-400" />,
    <Target className="w-5 h-5 text-cyan-400" />
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="text-primary w-8 h-8 animate-pulse" />
            AI Recommendations
          </h1>
          <p className="text-slate-400 mt-2">Personalized behavioral recommendations and daily guidance based on your self-assessment metrics.</p>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-primary/50 text-sm rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Recommendations
        </button>
      </header>

      {error && (
        <div className="glass-card p-6 border-l-4 border-rose-500 flex items-center gap-4">
          <AlertCircle className="w-10 h-10 text-rose-500 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-rose-400">Analysis Error</h3>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
          <RefreshCw className="w-10 h-10 text-primary animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Generating personalized behavior recommendations...</p>
        </div>
      ) : insights ? (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Main Forecast Panel */}
          <div className="glass-card p-8 bg-gradient-to-br from-primary/10 via-[#0B0C1E] to-secondary/5 border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BrainCircuit className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                <BrainCircuit className="w-5 h-5 animate-pulse" />
                <span>Today's Cognitive Forecast</span>
              </div>
              <p className="text-xl md:text-2xl font-semibold text-slate-100 leading-relaxed italic">
                "{insights.forecast || 'Maintain steady pacing and take regular intervals of rest.'}"
              </p>
            </div>
          </div>

          {/* Actionable Advice Cards list */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 px-1">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Actionable Daily Insights
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {insights.insights && insights.insights.length > 0 ? (
                insights.insights.map((insight, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="glass-card p-6 flex items-start gap-4 hover:border-primary/30 hover:bg-surface/75 transition-all"
                  >
                    <div className="p-3 bg-white/5 rounded-2xl flex-shrink-0">
                      {adviceIcons[idx % adviceIcons.length]}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-slate-200 text-sm">
                        Insight Recommendation #{idx + 1}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {insight}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="glass-card p-8 text-center text-slate-500 italic text-sm">
                  No specific recommendations generated yet. Submit your self-assessment to populate today's checklist.
                </div>
              )}
            </div>
          </div>

          {/* Tips Info Note footer */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs text-slate-400/80 leading-relaxed flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span>
              <strong>Note:</strong> Recommendations are calculated dynamically using Gemini NLP engines based on your sleep deficits, mood levels, and task workloads. Recalibrate daily for high accuracy.
            </span>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 italic">
          No insights loaded. Submit a daily self-assessment to generate predictions.
        </div>
      )}
    </div>
  );
};

export default MindModel;
