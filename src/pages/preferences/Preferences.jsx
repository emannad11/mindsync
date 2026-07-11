import React from 'react';
import { motion } from 'framer-motion';
import { Save, BrainCircuit, Compass, UserCheck, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';

const Preferences = () => {
  const { addNotification } = useNotifications();
  const { userData, updateUserData } = useUser();

  // Parse environment and coach persona from primaryGoal combined string
  const goalStr = userData?.primaryGoal || 'Silent Sanctuary (Empathetic Coach)';
  const defaultEnv = goalStr.split(' (')[0];
  const defaultCoach = goalStr.includes('(') 
    ? goalStr.split(' (')[1].replace(' Coach)', '') 
    : 'Empathetic';

  const handlePreferencesSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const selectedEnv = formData.get('primaryGoal');
    const selectedCoach = formData.get('coachPersona');

    try {
      await updateUserData({
        primaryGoal: `${selectedEnv} (${selectedCoach} Coach)`,
        workStart: formData.get('workStart'),
        workEnd: formData.get('workEnd'),
        productivityStyle: formData.get('productivityStyle'),
        sleepGoal: userData?.sleepGoal || 8, // keep defaults
        waterGoal: userData?.waterGoal || 2.5, // keep defaults
        stressLevel: userData?.stressLevel || 2 // keep defaults
      });
      addNotification('info', 'Preferences Saved', 'Your personality profile and AI preferences have been updated successfully.');
    } catch (err) {
      console.error(err);
      addNotification('error', 'Update Failed', 'Could not save your preferences. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-4xl space-y-8 pb-12 mx-auto"
    >
      <header>
        <h1 className="text-3xl font-bold">AI Preferences</h1>
        <p className="text-slate-400 mt-1">Manage your cognitive focus style and AI coach settings.</p>
      </header>

      <div className="glass-card p-8 border-t-4 border-primary">
        <form onSubmit={handlePreferencesSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cognitive Focus Style */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                Cognitive Focus Style
              </label>
              <select 
                name="productivityStyle" 
                defaultValue={userData?.productivityStyle || 'Analyst'} 
                className="input-field bg-slate-900"
              >
                <option value="Analyst">Analyst (Logical, detailed, structured)</option>
                <option value="Creative">Creative (Intuitive, spontaneous, visual)</option>
                <option value="Organizer">Organizer (Task-oriented, planner, schedules)</option>
                <option value="Action-Taker">Action-Taker (Practical, experimental, fast-paced)</option>
              </select>
            </div>

            {/* Preferred Environment */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-secondary" />
                Preferred Environment
              </label>
              <select 
                name="primaryGoal" 
                defaultValue={defaultEnv} 
                className="input-field bg-slate-900"
              >
                <option value="Silent Sanctuary">Silent Sanctuary (Quiet workspace, library)</option>
                <option value="Ambient Cafe">Ambient Cafe (Soft music, active noise)</option>
                <option value="Collaborative Space">Collaborative Space (Teamwork, brainstorming)</option>
                <option value="High-Pressure Zone">High-Pressure Zone (Deadlines, sprints)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work Start */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Focus Window Start
              </label>
              <input 
                name="workStart" 
                type="time" 
                defaultValue={userData?.workStart || '09:00'} 
                className="input-field" 
              />
            </div>

            {/* Work End */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Focus Window End
              </label>
              <input 
                name="workEnd" 
                type="time" 
                defaultValue={userData?.workEnd || '17:00'} 
                className="input-field" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Coach Persona */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                AI Coach Companion Style
              </label>
              <select 
                name="coachPersona" 
                defaultValue={defaultCoach} 
                className="input-field bg-slate-900"
              >
                <option value="Empathetic">Empathetic Supporter (Gentle reminders & pacing)</option>
                <option value="Taskmaster">Disciplined Taskmaster (Focus on task completion)</option>
                <option value="Strategist">Analytical Strategist (Data & schedule optimizations)</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="btn-primary w-full md:w-auto px-8 flex items-center justify-center"
            >
              <Save className="w-4 h-4 mr-2" /> Save Preferences
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Preferences;
