import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Mic, 
  BarChart3, 
  ArrowRight,
  Code,
  LayoutDashboard,
  CheckSquare,
  Timer
} from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group"
  >
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-white overflow-x-hidden">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">MindSync <span className="text-primary">AI</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About FYP</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/signup" className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-slate-200 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative pt-44 pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-bold tracking-widest uppercase mb-6 inline-block">
              Next-Gen Productivity Agent
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
              Synchronize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-indigo-500">Mind</span><br />
              With Intelligent Action.
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              MindSync AI leverages Google Gemini to observe your behavior, automate your schedule, and predict burnout before it happens.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="w-full sm:w-auto px-10 py-4 rounded-full bg-primary text-white font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                Start for Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                View Live Demo
              </Link>
            </div>
          </motion.div>

          {/* Beautiful Live CSS Dashboard Preview (No static image or SYNAPSE labels) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-24 relative"
            id="demo"
          >
            <div className="relative z-10 rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-primary/10 overflow-hidden text-left backdrop-blur-xl">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 p-1.5 rounded-lg">
                    <BrainCircuit className="text-primary w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold tracking-wide text-white">
                    MindSync <span className="text-slate-400 font-normal">| Wellness Dashboard</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">Alex R.</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-primary/20">
                    AR
                  </div>
                </div>
              </div>

              {/* Mockup Layout Body */}
              <div className="flex gap-5 h-[230px]">
                {/* Mockup Mini Sidebar */}
                <div className="w-10 bg-slate-900/30 border border-white/5 rounded-2xl p-1.5 flex flex-col items-center gap-4 hidden sm:flex">
                  <div className="p-1.5 bg-primary/20 text-primary rounded-xl"><LayoutDashboard className="w-3.5 h-3.5" /></div>
                  <div className="p-1.5 text-slate-600"><CheckSquare className="w-3.5 h-3.5" /></div>
                  <div className="p-1.5 text-slate-600"><Timer className="w-3.5 h-3.5 animate-pulse" /></div>
                  <div className="p-1.5 text-slate-600"><BarChart3 className="w-3.5 h-3.5" /></div>
                </div>

                {/* Mockup Grid Area */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Progress Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Weekly Focus Rate</span>
                      <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-bold">AI Calibrated</span>
                    </div>
                    {/* Inline custom SVG wave */}
                    <div className="h-28 w-full flex items-end">
                      <svg className="w-full h-full" viewBox="0 0 200 80">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        <path d="M 0 60 Q 30 15 60 45 T 120 20 T 180 50 T 200 25 L 200 80 L 0 80 Z" fill="url(#chartGrad)" />
                        <path d="M 0 60 Q 30 15 60 45 T 120 20 T 180 50 T 200 25" fill="none" stroke="#6366f1" strokeWidth="2.5" />
                        <circle cx="60" cy="45" r="3" fill="#6366f1" />
                        <circle cx="120" cy="20" r="3" fill="#06b6d4" />
                      </svg>
                    </div>
                  </div>

                  {/* Recovery Tasks Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-3">AI Autopilot Logs</span>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-white/5">
                          <input type="checkbox" checked readOnly className="rounded text-primary focus:ring-0 bg-transparent border-white/20 w-3 h-3 pointer-events-none" />
                          <span className="text-[10px] text-slate-400 line-through">Healed schedule overlaps (48h postpone)</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-xl border border-primary/20">
                          <input type="checkbox" checked={false} readOnly className="rounded text-primary focus:ring-0 bg-transparent border-primary/30 w-3 h-3 pointer-events-none" />
                          <span className="text-[10px] text-primary-light font-medium">Calming binaural wellness session scheduled</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 italic block mt-1">AI agent completed 2 recovery actions automatically.</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
            </div>
            
            {/* Ambient blur effects */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 blur-3xl -z-10 animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/20 blur-3xl -z-10 animate-pulse" />
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────────────────── */}
      <section id="features" className="py-32 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for High Performance.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Our multi-agent system integrates behavioral science with advanced LLMs to optimize every second of your day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Sparkles}
              title="Gemini Intelligence"
              description="Powered by Google's most capable models to understand complex contexts and provide human-like assistance."
              delay={0.1}
            />
            <FeatureCard 
              icon={Mic}
              title="Voice Assistant"
              description="Hands-free interaction. Log moods, create tasks, and get focus tips just by talking to MindSync."
              delay={0.2}
            />
            <FeatureCard 
              icon={BarChart3}
              title="Predictive Analytics"
              description="LSTM-driven models predict your future productivity levels and detect early burnout indicators."
              delay={0.3}
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Neural Privacy"
              description="Your behavioral data is encrypted and used only to train your local personalized mind model."
              delay={0.4}
            />
            <FeatureCard 
              icon={Zap}
              title="Auto-Optimization"
              description="Automatically reschedules low-priority tasks when stress levels are detected to be too high."
              delay={0.5}
            />
            <FeatureCard 
              icon={BrainCircuit}
              title="Focus Flow"
              description="Integrated Pomodoro and deep-work modes that adapt based on your hydration and sleep data."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* ── FYP Context ──────────────────────────────────────────────────────── */}
      <section id="about" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="p-12 rounded-3xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center gap-12 border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BrainCircuit className="w-64 h-64" />
            </div>
            
            <div className="flex-1 relative z-10">
              <span className="text-primary font-bold text-sm tracking-widest uppercase">The Research</span>
              <h2 className="text-4xl font-bold mt-4 mb-6">Final Year Project 2026</h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                MindSync AI is the culmination of research into Multi-Tasking Learning Agents. 
                By combining LSTM neural networks for performance prediction and Gemini LLMs for cognitive assistance, 
                we've built a system that doesn't just track work—it understands the worker.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0A0A0A] bg-slate-800" />
                  ))}
                </div>
                <span className="text-sm text-slate-500 font-medium italic">Collaboratively developed by the FYP Team</span>
              </div>
            </div>
            <div className="flex-1 w-full flex justify-center relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <Code className="w-32 h-32 text-white relative z-10 opacity-20 hover:opacity-50 transition-opacity cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-primary w-5 h-5" />
            <span className="font-bold">MindSync AI</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 MindSync Agent Framework. Built for academic research.</p>
          <div className="flex gap-6 text-slate-500 hover:text-white text-sm transition-colors">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
