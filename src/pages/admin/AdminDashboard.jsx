import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Terminal, ShieldAlert, Cpu, Activity, Clock } from 'lucide-react';
import { getAdminUsers, getAdminLogs, getAdminAuthLogs, getAdminAIModels } from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 glass-card-hover"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-1">{value}</p>
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLogs: 0,
    totalSessions: 0,
    trainedModels: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [users, logs, auths, models] = await Promise.all([
          getAdminUsers(),
          getAdminLogs(),
          getAdminAuthLogs(),
          getAdminAIModels()
        ]);

        setStats({
          totalUsers: users.length,
          totalLogs: logs.length,
          totalSessions: auths.length,
          trainedModels: models.filter(m => m.has_trained).length
        });

        setRecentLogs(logs.slice(0, 5));
      } catch (err) {
        console.error("Failed to load admin dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Loading system metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Admin Central Dashboard 🛡️</h1>
        <p className="text-slate-400 mt-2">Oversee registered users, scikit-learn models, and verify system audit trails.</p>
      </header>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="indigo" />
        <StatCard title="Total System Logs" value={stats.totalLogs} icon={Terminal} color="rose" />
        <StatCard title="Authentication Logs" value={stats.totalSessions} icon={ShieldAlert} color="amber" />
        <StatCard title="Trained AI Models" value={stats.trainedModels} icon={Cpu} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Logs */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="text-primary w-5 h-5" /> Recent System Actions
            </h2>
          </div>
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <p className="text-slate-500 italic text-sm py-4">No recent activities logged.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      log.action.includes('fail') ? 'bg-rose-500/10 text-rose-400' :
                      log.action.includes('success') ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {log.action.replace('_', ' ')}
                    </span>
                    <p className="text-sm text-slate-300 font-medium mt-1">{log.details}</p>
                    <p className="text-xs text-slate-500 font-medium">{log.email || 'System Operation'}</p>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Server Health Summary */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <ShieldAlert className="text-amber-500 w-5 h-5" /> System Overview
            </h2>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-semibold text-emerald-400">MongoDB Connected</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">ML Backend Host</span>
                <span className="font-semibold text-cyan-400">Active (uvicorn:8000)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Client Engine</span>
                <span className="font-semibold text-indigo-400">React + Vite (5173)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Active Admin Session</span>
                <span className="font-semibold text-amber-400">admin@mindsync.com</span>
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed">
            💡 <strong>Security Warning:</strong> All administrative activities on this dashboard are logged into the audit trails in accordance with the system log rules.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
