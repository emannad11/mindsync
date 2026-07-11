import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Activity, 
  Droplets, 
  Clock, 
  TrendingUp,
  Brain,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import { getAIInsights, getTasks, predictBurnout, logUserData, getUserDataHistory } from '../../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Mon', productivity: 65, health: 80 },
  { name: 'Tue', productivity: 75, health: 70 },
  { name: 'Wed', productivity: 85, health: 75 },
  { name: 'Thu', productivity: 60, health: 85 },
  { name: 'Fri', productivity: 90, health: 65 },
  { name: 'Sat', productivity: 70, health: 90 },
  { name: 'Sun', productivity: 80, health: 85 },
];

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 glass-card-hover"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-1">{value}</p>
  </motion.div>
);

const RadialGauge = ({ value }) => {
  const radius = 50;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  let color = 'stroke-primary';
  if (value > 70) color = 'stroke-rose-500';
  else if (value > 40) color = 'stroke-amber-500';
  else color = 'stroke-cyan-500';

  return (
    <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden mb-6">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-slate-800"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={normalizedRadius}
            cx={56}
            cy={56}
          />
          <motion.circle
            className={`${color} transition-all duration-1000 ease-out`}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={56}
            cy={56}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1 }}
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-xl font-black text-white">{Math.round(value)}%</p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Brain Load</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2 font-medium">
        {value > 70 ? '⚠️ High cognitive fatigue' : value > 40 ? '⚡ Moderate load' : '🟢 Relaxed mental state'}
      </p>
    </div>
  );
};


const Overview = () => {
  const { addNotification } = useNotifications();
  const { userData } = useUser();
  const [insights, setInsights] = React.useState(null);
  const [tasks, setTasks] = React.useState([]);
  const [predictions, setPredictions] = React.useState(null);
  const [loadingAI, setLoadingAI] = React.useState(true);
  
  // UserData Daily Logging State
  const [userDataHistory, setUserDataHistory] = React.useState([]);
  const [sleepHours, setSleepHours] = React.useState('');
  const [studyHours, setStudyHours] = React.useState('');
  const [activityLevel, setActivityLevel] = React.useState('medium');
  const [workloadIntensity, setWorkloadIntensity] = React.useState('medium');
  const [moodScore, setMoodScore] = React.useState('3');
  const [stressLevel, setStressLevel] = React.useState('2');
  const [fatigueLevel, setFatigueLevel] = React.useState('2');
  const [pendingTasks, setPendingTasks] = React.useState('');
  const [isSubmittingLog, setIsSubmittingLog] = React.useState(false);
  const [logSuccess, setLogSuccess] = React.useState('');

  const hasNotifiedRef = React.useRef(false);
  const hasTaskNotifiedRef = React.useRef(false);

  const showDesktopNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification("MindSync Daily Reminder", {
        body: "You haven't completed your self-assessment today. Click here to log it!",
        requireInteraction: true
      });
      notification.onclick = () => {
        window.focus();
        window.location.href = "/health";
      };
    }
  };

  const fetchLogs = async () => {
    try {
      const historyData = await getUserDataHistory();
      setUserDataHistory(historyData);
      
      // Check if user logged their assessment today
      const today = new Date().toDateString();
      const hasLoggedToday = historyData.some(
        log => new Date(log.created_at).toDateString() === today
      );
      
      if (!hasLoggedToday && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        addNotification(
          'alert',
          'Self-Assessment Missing',
          'Please submit your daily self-assessment to calibrate predictions!'
        );
        
        // Desktop notification permission & trigger
        if ('Notification' in window) {
          if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                showDesktopNotification();
              }
            });
          } else if (Notification.permission === 'granted') {
            showDesktopNotification();
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch user data logs:', err);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [insightsData, tasksData, predictionsData] = await Promise.all([
          getAIInsights(),
          getTasks(),
          predictBurnout().catch(err => {
            console.error('Predictions offline:', err);
            return null;
          })
        ]);
        setInsights(insightsData);
        setTasks(tasksData);
        if (predictionsData) setPredictions(predictionsData);

        // Check for pending High/Medium priority tasks
        const pendingPriorityTasks = (tasksData || []).filter(task => {
          const status = (task.status || '').toLowerCase();
          const priority = (task.priority || '').toLowerCase();
          return status !== 'completed' && (priority === 'high' || priority === 'medium');
        });

        if (pendingPriorityTasks.length > 0 && !hasTaskNotifiedRef.current) {
          hasTaskNotifiedRef.current = true;
          addNotification(
            'alert',
            'Pending Priority Tasks',
            `You have ${pendingPriorityTasks.length} pending High or Medium priority tasks left to finish!`
          );

          // Desktop alert trigger
          if ('Notification' in window && Notification.permission === 'granted') {
            const taskNotification = new Notification("MindSync Priority Tasks", {
              body: `You have ${pendingPriorityTasks.length} high/medium tasks waiting. Let's finish them!`,
              requireInteraction: false
            });
            taskNotification.onclick = () => {
              window.focus();
              window.location.href = "/tasks";
            };
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoadingAI(false);
      }
    };

    fetchData();
    fetchLogs();

    const timer = setTimeout(() => {
      addNotification(
        'ai', 
        'Peak Performance Detected', 
        'Your focus is currently higher than average. Perfect time for deep work!'
      );
    }, 3000);
    return () => clearTimeout(timer);
  }, [addNotification]);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingLog(true);
    setLogSuccess('');
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
      setLogSuccess('Daily assessment submitted successfully!');
      setSleepHours('');
      setStudyHours('');
      setPendingTasks('');
      setMoodScore('3');
      setStressLevel('2');
      setFatigueLevel('2');
      
      // Refresh dashboard metrics
      const [insightsData, predictionsData] = await Promise.all([
        getAIInsights(),
        predictBurnout().catch(err => null)
      ]);
      setInsights(insightsData);
      if (predictionsData) setPredictions(predictionsData);
      fetchLogs();
    } catch (err) {
      console.error('Failed to log daily metrics:', err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const todayString = new Date().toDateString();
  const todayLog = userDataHistory.find(
    log => new Date(log.created_at).toDateString() === todayString
  );

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Good evening, {userData?.name?.split(' ')[0] || 'User'}! 👋</h1>
        <p className="text-slate-400 mt-2">Here's what's happening with your {userData?.primaryGoal?.toLowerCase() || 'productivity'} and health today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Productivity Score" 
          value={predictions && userDataHistory.length > 0 ? `${Math.round(predictions.productivity_index)}/100` : "0/100"} 
          icon={Zap} 
          color="indigo" 
          trend={predictions && userDataHistory.length > 0 ? Math.round(100 - predictions.burnout_risk - 50) : 0} 
        />
        <StatCard 
          title={todayLog ? "Today's Sleep" : "Sleep Logged"} 
          value={todayLog ? `${todayLog.sleep_hours} hrs` : "0 hrs"} 
          icon={Activity} 
          color="cyan" 
          trend={todayLog ? Math.round(todayLog.sleep_hours - (userData?.sleepGoal || 8)) : undefined} 
        />
        <StatCard 
          title="Tasks Completed" 
          value={`${completedTasks}/${totalTasks}`} 
          icon={TrendingUp} 
          color="emerald" 
        />
        <StatCard 
          title="Daily Stress" 
          value={todayLog ? `${todayLog.stress_level}/5` : "0/5"} 
          icon={AlertCircle} 
          color="blue" 
          trend={todayLog ? Math.round(todayLog.stress_level - 2) : undefined} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Recommendations / Insights */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Brain className="text-primary w-6 h-6 animate-pulse" />
              <h2 className="text-xl font-semibold">AI Insights & Burnout Risk</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-1">
                <RadialGauge value={predictions && userDataHistory.length > 0 ? predictions.burnout_risk : 0} />
              </div>
              <div className="md:col-span-2 space-y-4">
                {loadingAI ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                    <p className="text-xs text-slate-500">Generating insights...</p>
                  </div>
                ) : insights?.insights ? (
                  insights.insights.map((insight, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <div className="flex gap-3">
                        {idx === 0 ? <Zap className="text-indigo-400 w-5 h-5 flex-shrink-0 mt-1" /> :
                         idx === 1 ? <AlertCircle className="text-rose-400 w-5 h-5 flex-shrink-0 mt-1" /> :
                         <Clock className="text-cyan-400 w-5 h-5 flex-shrink-0 mt-1" />}
                        <p className="text-sm text-slate-300">
                          {insight}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                    <p className="text-xs text-slate-500 italic">No AI insights available yet. Keep logging tasks and moods!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Active Tasks */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="text-cyan-400 w-6 h-6" />
              <h2 className="text-xl font-semibold">Recent Tasks</h2>
            </div>
            
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-500 italic py-8 text-center">No tasks found. Create some in the Tasks tab!</p>
              ) : (
                tasks.slice(0, 4).map((task) => (
                  <div key={task.id || task._id} className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className={`text-sm font-semibold ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Status: <span className={task.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}>{task.status}</span>
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      task.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <a href="/tasks" className="w-full mt-6 py-3 text-center text-sm font-medium text-slate-400 hover:text-white transition-colors border border-white/5 rounded-xl block">
            Go to Task Manager
          </a>
        </div>
      </div>
    </div>
  );
};

export default Overview;
