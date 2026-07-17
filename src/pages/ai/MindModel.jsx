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

const zodiacSigns = [
  { name: 'Aries (Mesh)', value: 'aries', symbol: '♈' },
  { name: 'Taurus (Vrishabha)', value: 'taurus', symbol: '♉' },
  { name: 'Gemini (Mithuna)', value: 'gemini', symbol: '♊' },
  { name: 'Cancer (Karka)', value: 'cancer', symbol: '♋' },
  { name: 'Leo (Simha)', value: 'leo', symbol: '♌' },
  { name: 'Virgo (Kanya)', value: 'virgo', symbol: '♍' },
  { name: 'Libra (Tula)', value: 'libra', symbol: '♎' },
  { name: 'Scorpio (Vrishchika)', value: 'scorpio', symbol: '♏' },
  { name: 'Sagittarius (Dhanu)', value: 'sagittarius', symbol: '♐' },
  { name: 'Capricorn (Makara)', value: 'capricorn', symbol: '♑' },
  { name: 'Aquarius (Kumbha)', value: 'aquarius', symbol: '♒' },
  { name: 'Pisces (Meena)', value: 'pisces', symbol: '♓' }
];

const zodiacForecasts = {
  aries: [
    "Your high energy levels today will boost your focus. Channel your passionate fire into finishing your high-priority tasks, but remember to take screen breaks.",
    "Impulsive actions could lead to code bugs. Double-check your workflows today, Aries. Slow and steady wins the sprint.",
    "A burst of dynamic mental energy is predicted. Excellent day to tackle the hardest problems on your roadmap."
  ],
  taurus: [
    "Your stubborn determination is your greatest asset today. Sit down, put on your headphones, and dive into deep work mode.",
    "You might feel a bit sluggish, Taurus. A short walk or a cup of green tea will reboot your cognitive resources.",
    "Patience pays off. Today is a great day to systematically organize and plan your week's milestone targets."
  ],
  gemini: [
    "With your ruler Mercury active, communication is your superpower today. Great day for team syncs, pair programming, and brainstorming.",
    "Your mind might feel scattered across multiple tasks. Turn off notifications and practice single-tasking today.",
    "New ideas are flowing! Jot them down immediately, but focus on executing current tasks before starting new projects."
  ],
  cancer: [
    "Emotional clarity will bring high cognitive ease today. Work from a comfortable space to maximize your productivity.",
    "You might feel highly sensitive to feedback today. Take a deep breath—constructive feedback is just data for your personal growth.",
    "Intuition is sharp. Trust your gut feeling when debugging complex logic or making architectural choices."
  ],
  leo: [
    "Your natural leadership qualities are shining. Take the initiative in group projects, but don't forget to delegate tasks.",
    "A glowing confidence will guide your presentations today. Show off your work—your presentation skills are at their peak.",
    "High energy is predicted. Just ensure you don't burn out by trying to do everyone else's work alongside yours."
  ],
  virgo: [
    "Precision and detail-oriented work are highly favored today. Perfect time to refactor code, write documentation, or clear technical debt.",
    "Don't let perfectionism block your progress. Remember: 'Done is better than perfect.' Release the draft!",
    "Your analytical brain is running at 100% capacity. Great day for database design and optimizing performance."
  ],
  libra: [
    "Balance is key today. Ensure you balance your work hours with screen-free recreation to avoid cognitive fatigue.",
    "Decision fatigue might creep in. Break down big choices into smaller steps, or ask a peer to help you bounce ideas.",
    "A harmonious environment will boost your flow. Clean your desk and put on some calming lofi music before starting work."
  ],
  scorpio: [
    "Your intense focus allows you to dive deep into complex, hidden problems. Excellent day for cybersecurity audits and resolving hard bugs.",
    "Avoid working in isolation for too long. Check-in with your team or share your progress to maintain alignment.",
    "Transformative insights are heading your way. Trust the process when refactoring complex modules."
  ],
  sagittarius: [
    "Your optimistic outlook will help you overcome roadblocks today. Keep your eyes on the big picture goals.",
    "A desire for exploration might distract you. Stay focused on your sprint goals before exploring new tools or frameworks.",
    "Great day for learning something new. Spend some time reading documentation or tutorials to upgrade your skill set."
  ],
  capricorn: [
    "Your disciplined, structured nature is fully activated today. You are a productivity machine—tackle those long-postponed tasks.",
    "Don't overwork yourself, Capricorn. A high-achiever like you needs scheduled rest to avoid long-term burnout.",
    "Focus on long-term architecture rather than quick hacks. Build a solid foundation for your project."
  ],
  aquarius: [
    "Innovative, out-of-the-box thinking is your superpower today. Great day to design new features or solve creative problems.",
    "Collaborative work will yield excellent results today. Brainstorm with peers or join an open-source discussion.",
    "Your focus might drift to abstract ideas. Keep one foot grounded in practical task completion."
  ],
  pisces: [
    "Your creative intuition is flowing. Great day to work on UI/UX designs, landing pages, or copywriting.",
    "You might feel easily distracted or daydreamy. Use a Pomodoro timer to anchor your focus in 25-minute intervals.",
    "Your empathetic nature makes you a great collaborator today. Offer help to a teammate who is struggling with a bug."
  ]
};

const MindModel = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSign, setSelectedSign] = useState(() => {
    return localStorage.getItem('selectedZodiacSign') || '';
  });
  const [zodiacForecast, setZodiacForecast] = useState('');

  const getDailyForecastForSign = (sign) => {
    if (!sign || !zodiacForecasts[sign]) {
      return '';
    }
    const list = zodiacForecasts[sign];
    
    // Get stable daily seed
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let signHash = 0;
    for (let i = 0; i < sign.length; i++) {
      signHash = sign.charCodeAt(i) + ((signHash << 5) - signHash);
    }
    
    const index = Math.abs(hash + signHash) % list.length;
    return list[index];
  };

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await getAIInsights();
      setInsights(data);
      if (selectedSign) {
        setZodiacForecast(getDailyForecastForSign(selectedSign));
      }
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

  useEffect(() => {
    if (selectedSign) {
      setZodiacForecast(getDailyForecastForSign(selectedSign));
    } else {
      setZodiacForecast('');
    }
  }, [selectedSign]);

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
            
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <BrainCircuit className="w-5 h-5 animate-pulse" />
                  <span>Today's Cognitive Forecast</span>
                </div>
                
                {/* Zodiac Star Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Horoscope Star:</span>
                  <select
                    value={selectedSign}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSign(val);
                      localStorage.setItem('selectedZodiacSign', val);
                    }}
                    className="bg-slate-900 border border-white/10 text-xs text-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-primary/50 cursor-pointer"
                    style={{ backgroundColor: '#0f172a' }}
                  >
                    <option value="">Select Star...</option>
                    {zodiacSigns.map((z) => (
                      <option key={z.value} value={z.value}>
                        {z.symbol} {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-xl md:text-2xl font-semibold text-slate-100 leading-relaxed italic">
                  "{insights.forecast || 'Maintain steady pacing and take regular intervals of rest.'}"
                </p>
                
                {selectedSign && zodiacForecast && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 mt-4 space-y-2"
                  >
                    <div className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center justify-between gap-1.5">
                      <span>✨ Today's Zodiac Alignment: {zodiacSigns.find(z => z.value === selectedSign)?.name}</span>
                    </div>
                    <p className="text-sm md:text-base font-medium text-slate-200 italic leading-relaxed">
                      "{zodiacForecast}"
                    </p>
                  </motion.div>
                )}
              </div>
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
