import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  BrainCircuit, 
  Zap,
  Coffee,
  Briefcase,
  Sparkles,
  Clock,
  Compass,
  Smile
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';

const StepWrapper = ({ children, title, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="text-slate-400 mt-2">{subtitle}</p>
    </div>
    {children}
  </motion.div>
);

const Onboarding = () => {
  const { userData, completeOnboarding } = useUser();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Onboarding Auto-Redirect
  React.useEffect(() => {
    if (userData?.hasCompletedOnboarding && !loading) {
      navigate('/', { replace: true });
    }
  }, [userData?.hasCompletedOnboarding, loading, navigate]);

  // Form state: Sleep, water, and stress goals are submitted as safe defaults in the background
  const [formData, setFormData] = useState({
    primaryGoal: 'Silent Sanctuary', // Saves environment preference
    workStart: '09:00',
    workEnd: '17:00',
    productivityStyle: 'Analyst', // Saves cognitive focus style
    sleepGoal: 8, // Background default
    waterGoal: 2.5, // Background default
    stressLevel: 2, // Background default
    coachPersona: 'Empathetic' // Local setting or custom profile metadata
  });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      // Submit the payload, including safe background defaults
      await completeOnboarding({
        ...formData,
        // Append coach persona to primaryGoal description or keep it implicitly
        primaryGoal: `${formData.primaryGoal} (${formData.coachPersona} Coach)`
      });
      addNotification('ai', 'Model Synchronized', 'Your personalized AI agent has been initialized successfully.');
    } catch (error) {
      console.error("Onboarding failed:", error);
      setLoading(false);
      addNotification('error', 'Initialization Failed', 'There was an error setting up your profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="relative p-6 bg-surface border border-white/10 rounded-full"
          >
            <BrainCircuit className="w-16 h-16 text-primary" />
          </motion.div>
        </div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold mt-12 text-center"
        >
          MindSync is analyzing your personality profile...
        </motion.h2>
        <p className="text-slate-400 mt-2 text-center max-w-sm">
          We're calibrating your cognitive focus metrics and customizing your personal AI coach.
        </p>
        <div className="mt-8 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 3 }}
            className="h-full bg-primary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[150px]" />

      <div className="w-full max-w-xl relative z-10">
        {/* Progress indicators */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-slate-800'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Cognitive Focus Style */}
          {step === 1 && (
            <StepWrapper key="step1" title="Cognitive Focus Style" subtitle="Select the profile that best represents your work personality.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'Analyst', icon: BrainCircuit, desc: 'Logical, detailed, highly structured, data-driven' },
                  { id: 'Creative', icon: Zap, desc: 'Intuitive, visual, conceptual, spontaneous' },
                  { id: 'Organizer', icon: Check, desc: 'Task-oriented, checklists, planner, deadline-focused' },
                  { id: 'Action-Taker', icon: Briefcase, desc: 'Practical, fast-paced, experimental, learn-by-doing' },
                ].map((item) => (
                  <button 
                    key={item.id} 
                    type="button"
                    onClick={() => updateForm('productivityStyle', item.id)}
                    className={`glass-card p-5 text-left transition-all group ${formData.productivityStyle === item.id ? 'border-primary bg-primary/10' : 'hover:border-primary/30'}`}
                  >
                    <item.icon className={`w-8 h-8 mb-4 group-hover:scale-110 transition-transform ${formData.productivityStyle === item.id ? 'text-primary' : 'text-slate-500'}`} />
                    <h3 className="font-bold text-sm">{item.id}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">{item.desc}</p>
                  </button>
                ))}
              </div>
            </StepWrapper>
          )}

          {/* Step 2: Preferred Focus Environment */}
          {step === 2 && (
            <StepWrapper key="step2" title="Preferred Focus Environment" subtitle="Where do you feel most productive and concentrated?">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'Silent Sanctuary', icon: Compass, desc: 'Quiet study rooms, library, absolute silence' },
                  { id: 'Ambient Cafe', icon: Coffee, desc: 'Soft music, background chatter, high energy' },
                  { id: 'Collaborative Space', icon: Smile, desc: 'Group project tables, team discussions, brainstorming' },
                  { id: 'High-Pressure Zone', icon: Zap, desc: 'Deadline sprints, time-boxing, pressure-driven speed' },
                ].map((item) => (
                  <button 
                    key={item.id} 
                    type="button"
                    onClick={() => updateForm('primaryGoal', item.id)}
                    className={`glass-card p-5 text-left transition-all group ${formData.primaryGoal === item.id ? 'border-primary bg-primary/10' : 'hover:border-primary/30'}`}
                  >
                    <item.icon className={`w-8 h-8 mb-4 group-hover:scale-110 transition-transform ${formData.primaryGoal === item.id ? 'text-primary' : 'text-slate-500'}`} />
                    <h3 className="font-bold text-sm">{item.id}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">{item.desc}</p>
                  </button>
                ))}
              </div>
            </StepWrapper>
          )}

          {/* Step 3: Work Schedule */}
          {step === 3 && (
            <StepWrapper key="step3" title="Your Core Schedule" subtitle="What are your standard work or study hours?">
              <div className="glass-card p-6">
                <label className="text-sm font-medium text-slate-300 block mb-4">Deep Work Focus Window</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Start Time</p>
                    <input 
                      type="time" 
                      value={formData.workStart} 
                      onChange={(e) => updateForm('workStart', e.target.value)} 
                      className="input-field text-sm" 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">End Time</p>
                    <input 
                      type="time" 
                      value={formData.workEnd} 
                      onChange={(e) => updateForm('workEnd', e.target.value)} 
                      className="input-field text-sm" 
                    />
                  </div>
                </div>
              </div>
            </StepWrapper>
          )}

          {/* Step 4: AI Coach Persona */}
          {step === 4 && (
            <StepWrapper key="step4" title="AI Companion Persona" subtitle="Select your preferred AI coach style for reminders.">
              <div className="space-y-4">
                {[
                  { id: 'Empathetic', label: 'Empathetic Supporter', desc: 'Encouraging, gentle, focuses on health goals & burnout pacing.' },
                  { id: 'Taskmaster', label: 'Disciplined Taskmaster', desc: 'Direct, focused on output, holds you accountable to your list.' },
                  { id: 'Strategist', label: 'Analytical Strategist', desc: 'Data-driven tips, schedules breakdown, optimizes focus slots.' }
                ].map((coach) => (
                  <button 
                    key={coach.id} 
                    type="button"
                    onClick={() => updateForm('coachPersona', coach.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-4 ${
                      formData.coachPersona === coach.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-white/5 bg-slate-900/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="mt-1">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.coachPersona === coach.id ? 'border-primary' : 'border-slate-600'}`}>
                        {formData.coachPersona === coach.id && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{coach.label}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{coach.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </StepWrapper>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-12">
          <button 
            type="button"
            onClick={() => step > 1 ? setStep(step - 1) : null} 
            className={`btn-secondary ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button 
            type="button"
            onClick={() => step < 4 ? setStep(step + 1) : handleFinish()} 
            className="btn-primary"
          >
            {step < 4 ? 'Continue' : 'Initialize AI Agent'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
