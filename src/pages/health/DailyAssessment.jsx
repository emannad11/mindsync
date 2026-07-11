import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  Moon, 
  BookOpen, 
  Sliders,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Smile
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import { logUserData, getUserDataHistory, predictBurnout, getAIInsights } from '../../services/api';

const DailyAssessment = () => {
  const { addNotification } = useNotifications();
  const { userData } = useUser();
  const [userDataHistory, setUserDataHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [sleepHours, setSleepHours] = useState('');
  const [studyHours, setStudyHours] = useState('');
  const [activityLevel, setActivityLevel] = useState('medium');
  const [workloadIntensity, setWorkloadIntensity] = useState('medium');
  const [moodScore, setMoodScore] = useState('3');
  const [stressLevel, setStressLevel] = useState('2');
  const [fatigueLevel, setFatigueLevel] = useState('2');
  const [pendingTasks, setPendingTasks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getUserDataHistory();
      setUserDataHistory(data);
    } catch (err) {
      console.error('Failed to load activity history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });
    try {
      await logUserData({
        sleep_hours: parseFloat(sleepHours),
        study_hours: parseFloat(studyHours),
        activity_level: activityLevel,
        workload_intensity: workloadIntensity,
        mood_score: parseFloat(moodScore),
        stress_level: parseFloat(stressLevel),
        fatigue_level: parseFloat(fatigueLevel),
        pending_tasks: parseFloat(pendingTasks || 0)
      });
      
      setSubmitMessage({ type: 'success', text: 'Daily assessment submitted successfully and AI model retrained!' });
      addNotification('health', 'Assessment Submitted', 'Your daily metrics have been synced with the neural model.');
      
      // Clear Form inputs
      setSleepHours('');
      setStudyHours('');
      setPendingTasks('');
      setMoodScore('3');
      setStressLevel('2');
      setFatigueLevel('2');
      
      // Refresh list
      fetchHistory();
      
      // Trigger a silent background predictions refresh
      await Promise.all([
        predictBurnout().catch(() => null),
        getAIInsights().catch(() => null)
      ]);
    } catch (err) {
      console.error('Failed to log daily metrics:', err);
      setSubmitMessage({ type: 'error', text: 'Failed to submit metrics. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Activity className="text-primary w-8 h-8" />
          Daily Assessment Center
        </h1>
        <p className="text-slate-400 mt-2">Log your daily activities and vitals to calibrate the AI model predictions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Logger Form */}
        <div className="lg:col-span-1 glass-card p-6 border-t-4 border-primary">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Sliders className="text-primary w-5 h-5" /> Submit Daily Metrics
          </h2>
          
          <form className="space-y-5" onSubmit={handleLogSubmit}>
            {submitMessage.text && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-xl border text-xs text-center flex items-center gap-2 justify-center ${
                  submitMessage.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                {submitMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{submitMessage.text}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Sleep Hours</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1" 
                    value={sleepHours} 
                    onChange={(e) => setSleepHours(e.target.value)} 
                    className="input-field w-full" 
                    placeholder="e.g. 7.5" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Study/Work Hours</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={studyHours} 
                  onChange={(e) => setStudyHours(e.target.value)} 
                  className="input-field w-full" 
                  placeholder="e.g. 6.0" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">Mood (1-5)</label>
                <select 
                  value={moodScore} 
                  onChange={(e) => setMoodScore(e.target.value)} 
                  className="input-field w-full text-xs"
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <option value="1">1 (Awful)</option>
                  <option value="2">2 (Bad)</option>
                  <option value="3">3 (Okay)</option>
                  <option value="4">4 (Good)</option>
                  <option value="5">5 (Great)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">Stress (1-5)</label>
                <select 
                  value={stressLevel} 
                  onChange={(e) => setStressLevel(e.target.value)} 
                  className="input-field w-full text-xs"
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <option value="1">1 (None)</option>
                  <option value="2">2 (Low)</option>
                  <option value="3">3 (Medium)</option>
                  <option value="4">4 (High)</option>
                  <option value="5">5 (Severe)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">Fatigue (1-5)</label>
                <select 
                  value={fatigueLevel} 
                  onChange={(e) => setFatigueLevel(e.target.value)} 
                  className="input-field w-full text-xs"
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <option value="1">1 (None)</option>
                  <option value="2">2 (Low)</option>
                  <option value="3">3 (Medium)</option>
                  <option value="4">4 (High)</option>
                  <option value="5">5 (Severe)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block">Pending Tasks Count</label>
              <input 
                type="number" 
                value={pendingTasks} 
                onChange={(e) => setPendingTasks(e.target.value)} 
                className="input-field w-full" 
                placeholder="e.g. 3" 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Activity Level</label>
                <select 
                  value={activityLevel} 
                  onChange={(e) => setActivityLevel(e.target.value)} 
                  className="input-field w-full text-xs" 
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Workload Intensity</label>
                <select 
                  value={workloadIntensity} 
                  onChange={(e) => setWorkloadIntensity(e.target.value)} 
                  className="input-field w-full text-xs" 
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="btn-primary w-full mt-4 h-11 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing models...</span>
                </>
              ) : (
                <span>Submit Assessment</span>
              )}
            </button>
          </form>
        </div>

        {/* Historic Reports Table */}
        <div className="lg:col-span-2 glass-card p-6 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="text-cyan-400 w-5 h-5" /> Historic Logs & Activity Reports
              </h2>
              <button 
                onClick={fetchHistory}
                className="p-2 bg-white/5 border border-white/10 hover:border-cyan-500/50 rounded-xl transition-all"
                title="Refresh History"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm text-slate-500">Loading your history logs...</p>
                </div>
              ) : userDataHistory.length === 0 ? (
                <p className="text-slate-500 italic text-sm py-16 text-center">No daily activity records logged yet. Use the logger on the left!</p>
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
      </div>
    </div>
  );
};

export default DailyAssessment;
