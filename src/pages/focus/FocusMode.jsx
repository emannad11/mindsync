import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Target,
  Wind,
  Volume2,
  Brain
} from 'lucide-react';
import { predictBurnout } from '../../services/api';

const SoundwaveVisualizer = ({ active, colorClass = 'bg-primary' }) => (
  <div className="flex items-center gap-0.5 h-3 justify-center">
    {[0, 1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className={`w-[2px] rounded-full ${colorClass}`}
        animate={{
          height: active ? [3, 12, 3] : 3
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.1,
          ease: 'easeInOut'
        }}
      />
    ))}
  </div>
);

const FocusMode = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [predictions, setPredictions] = useState(null);
  const [soundActive, setSoundActive] = useState(null); // null | 'lofi' | 'binaural' | 'relaxing'

  const audioCtxRef = useRef(null);
  const synthNodesRef = useRef([]);

  // Stop and cleanup Web Audio nodes
  const stopAllSynth = (closeContext = true) => {
    if (synthNodesRef.current) {
      synthNodesRef.current.forEach(node => {
        try { node.stop(); } catch(e) {}
        try { node.disconnect(); } catch(e) {}
      });
      synthNodesRef.current = [];
    }
    if (closeContext && audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => null);
      audioCtxRef.current = null;
    }
  };

  const playSynthesizedSound = (type) => {
    stopAllSynth(false); // Stop running nodes, but don't close context
    
    let ctx = audioCtxRef.current;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!ctx || ctx.state === 'closed') {
      ctx = new AudioContext();
      audioCtxRef.current = ctx;
    }
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => null);
    }
    
    if (type === 'binaural') {
      // Theta binaural beats: 150Hz in Left ear, 155Hz in Right ear (5Hz binaural wave)
      const oscLeft = ctx.createOscillator();
      const oscRight = ctx.createOscillator();
      const gainLeft = ctx.createGain();
      const gainRight = ctx.createGain();
      const merger = ctx.createChannelMerger(2);
      
      oscLeft.frequency.value = 150;
      oscRight.frequency.value = 155;
      
      gainLeft.gain.value = 0.15;
      gainRight.gain.value = 0.15;
      
      oscLeft.connect(gainLeft);
      oscRight.connect(gainRight);
      
      gainLeft.connect(merger, 0, 0); // Route oscLeft to left ear
      gainRight.connect(merger, 0, 1); // Route oscRight to right ear
      
      const mainGain = ctx.createGain();
      mainGain.gain.value = 0.35;
      merger.connect(mainGain);
      mainGain.connect(ctx.destination);
      
      oscLeft.start();
      oscRight.start();
      
      synthNodesRef.current = [oscLeft, oscRight, gainLeft, gainRight, mainGain, merger];
      
    } else if (type === 'relaxing') {
      // Calming Brown Noise modulated with LFO filter to simulate ocean waves
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 250;
      
      // LFO to slowly sweep the cut-off filter to create waves
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12; // slow breathing rate
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 140; // modulate range
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.15;
      
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start();
      lfo.start();
      
      synthNodesRef.current = [source, lfo, lfoGain, filter, gainNode];
      
    } else if (type === 'lofi') {
      // Synthesized warm ambient chord drone
      const frequencies = [130.81, 164.81, 196.00, 246.94]; // C3, E3, G3, B3 chord
      const oscillators = [];
      const gains = [];
      const merger = ctx.createChannelMerger(2);
      
      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.value = 0.04;
        
        osc.connect(gain);
        gain.connect(merger, 0, index % 2); // alternate panning left/right
        osc.start();
        
        oscillators.push(osc);
        gains.push(gain);
      });
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400; // filter out high frequencies for lo-fi warmth
      
      const mainGain = ctx.createGain();
      mainGain.gain.value = 0.45;
      
      merger.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(ctx.destination);
      
      synthNodesRef.current = [...oscillators, ...gains, merger, filter, mainGain];
    }
  };

  const handleSoundToggle = (soundType) => {
    if (soundActive === soundType) {
      setSoundActive(null);
    } else {
      // Initialize/resume AudioContext directly in the click handler callstack
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(e => console.warn('AudioContext resume failed:', e));
        }
      }
      setSoundActive(soundType);
    }
  };

  useEffect(() => {
    if (soundActive) {
      playSynthesizedSound(soundActive);
    } else {
      stopAllSynth(false); // only stop nodes, keep context
    }
  }, [soundActive]);

  useEffect(() => {
    const fetchCognitiveState = async () => {
      try {
        const data = await predictBurnout();
        setPredictions(data);
      } catch (err) {
        console.error('Could not sync focus stress parameters:', err);
      }
    };
    fetchCognitiveState();
  }, []);

  useEffect(() => {
    return () => {
      stopAllSynth(true); // Close audio context when page is unmounted
    };
  }, []);

  useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(timer);
      setIsActive(false);
      
      // Auto switch logic
      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, mode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const stressLevel = predictions?.metrics?.avg_stress || 2.5;
  const isHighStress = stressLevel > 3.0;

  // SVG progress countdown calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const totalDuration = mode === 'focus' ? 25 * 60 : 5 * 60;
  const strokeDashoffset = circumference - (timeLeft / totalDuration) * circumference;

  return (
    <div className="min-h-[82vh] w-full flex flex-col items-center justify-center space-y-6 py-6 select-none">
      <header className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          Focus Session
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Deep work in progress. Stay concentrated.</p>
      </header>

      {/* Dynamic Mode Switcher */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-full border border-white/5 gap-1">
        <button
          onClick={() => {
            setMode('focus');
            setTimeLeft(25 * 60);
            setIsActive(false);
          }}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
            mode === 'focus' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          🎯 Deep Work (25m)
        </button>
        <button
          onClick={() => {
            setMode('break');
            setTimeLeft(5 * 60);
            setIsActive(false);
          }}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
            mode === 'break' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          💆 Calming Break (5m)
        </button>
      </div>

      {/* Timer Display with Mode-Adaptive Background ripples & SVG Progress Ring */}
      <div className="relative group scale-90 md:scale-100">
        {/* Neon Glow base */}
        <div className={`absolute inset-0 rounded-full blur-[60px] animate-pulse transition-all ${
          mode === 'focus' ? 'bg-primary/20 group-hover:bg-primary/30' : 'bg-emerald-500/15 group-hover:bg-emerald-500/25'
        }`} />

        {/* Ambient active expanding ripples */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
              className={`absolute w-80 h-80 rounded-full border-2 ${
                mode === 'focus' ? 'border-primary/20 bg-primary/5' : 'border-emerald-500/20 bg-emerald-500/5'
              }`}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1.5 }}
              className={`absolute w-80 h-80 rounded-full border-2 ${
                mode === 'focus' ? 'border-primary/20 bg-primary/5' : 'border-emerald-500/20 bg-emerald-500/5'
              }`}
            />
          </div>
        )}

        {/* Core Timer circle with SVG Progress Ring */}
        <div className="relative w-72 h-72 rounded-full flex flex-col items-center justify-center bg-surface/40 backdrop-blur-2xl shadow-2xl">
          {/* SVG Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
            <circle
              cx="140"
              cy="140"
              r={radius}
              className="stroke-white/5 fill-transparent"
              strokeWidth="6"
            />
            <motion.circle
              cx="140"
              cy="140"
              r={radius}
              className={`fill-transparent ${
                mode === 'focus' ? 'stroke-primary' : 'stroke-emerald-400'
              }`}
              strokeWidth="6"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ ease: 'linear' }}
              strokeLinecap="round"
            />
          </svg>

          {/* Text Content */}
          <div className="relative z-10 flex flex-col items-center">
            <span className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-2 ${
              mode === 'focus' ? 'text-primary' : 'text-emerald-400'
            }`}>
              {mode === 'focus' ? 'Deep Work' : 'Break Time'}
            </span>
            <span className="text-6xl font-mono font-bold tracking-tighter text-slate-100">
              {formatTime(timeLeft)}
            </span>
            <div className="flex items-center gap-1.5 mt-3 text-slate-500 text-xs">
              <Target className={`w-4 h-4 ${mode === 'focus' ? 'text-primary' : 'text-emerald-400'}`} />
              <span>Goal: 4 sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button 
          onClick={resetTimer}
          className="p-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        <button 
          onClick={toggleTimer}
          className={`w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all active:scale-95 ${
            mode === 'focus' 
              ? 'bg-primary hover:bg-primary/95 shadow-primary/20' 
              : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
          }`}
        >
          {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>

        <button 
          onClick={() => {
            setMode(mode === 'focus' ? 'break' : 'focus');
            setTimeLeft(mode === 'focus' ? 5 * 60 : 25 * 60);
            setIsActive(false);
          }}
          className="p-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5"
          title="Toggle Focus/Break"
        >
          <Coffee className="w-5 h-5" />
        </button>
      </div>

      {/* Secondary Audio Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => handleSoundToggle('lofi')}
          className={`glass-card px-3.5 py-1.5 flex items-center gap-2.5 transition-all hover:bg-white/10 ${
            soundActive === 'lofi' 
              ? 'bg-primary/20 border-primary/40 text-white' 
              : 'text-slate-400 border border-white/5'
          }`}
        >
          <Volume2 className={`w-3.5 h-3.5 ${soundActive === 'lofi' ? 'text-primary' : 'text-slate-400'}`} />
          <span className="text-[11px] font-semibold">Lofi Beats</span>
          <SoundwaveVisualizer active={soundActive === 'lofi'} colorClass="bg-primary" />
        </button>
        
        <button
          onClick={() => handleSoundToggle('binaural')}
          className={`glass-card px-3.5 py-1.5 flex items-center gap-2.5 transition-all hover:bg-white/10 ${
            soundActive === 'binaural' 
              ? 'bg-primary/20 border-primary/40 text-white' 
              : 'text-slate-400 border border-white/5'
          }`}
        >
          <Wind className={`w-3.5 h-3.5 ${soundActive === 'binaural' ? 'text-primary' : 'text-slate-400'}`} />
          <span className="text-[11px] font-semibold">Binaural Waves</span>
          <SoundwaveVisualizer active={soundActive === 'binaural'} colorClass="bg-primary" />
        </button>

        <button
          onClick={() => handleSoundToggle('relaxing')}
          className={`glass-card px-3.5 py-1.5 flex items-center gap-2.5 transition-all hover:bg-white/10 ${
            soundActive === 'relaxing' 
              ? 'bg-primary/20 border-primary/40 text-white' 
              : 'text-slate-400 border border-white/5'
          }`}
        >
          <Volume2 className={`w-3.5 h-3.5 ${soundActive === 'relaxing' ? 'text-primary' : 'text-slate-400'}`} />
          <span className="text-[11px] font-semibold">Relaxing Sound</span>
          <SoundwaveVisualizer active={soundActive === 'relaxing'} colorClass="bg-primary" />
        </button>
      </div>

      {/* Dynamic AI Suggestion Status Box */}
      <div className="max-w-sm text-center bg-slate-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${isHighStress ? 'bg-rose-500/10 text-rose-400' : 'bg-primary/10 text-primary'}`}>
          <Brain className="w-5 h-5 animate-pulse" />
        </div>
        <div className="text-left">
          <span className="text-[9px] font-bold text-slate-500 uppercase block">MindSync Stress Coach</span>
          {isHighStress ? (
            <p className="text-[11px] text-rose-400 font-semibold leading-snug">
              Elevated stress detected ({stressLevel}/5). We highly suggest a calming break or listening to binaural waves to relax.
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 font-medium leading-snug">
              Average fatigue levels are optimal. Standard neon-purple high-concentration focus waves are active.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
