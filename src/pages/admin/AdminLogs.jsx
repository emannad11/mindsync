import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Clock, FileText } from 'lucide-react';
import { getAdminLogs, getAdminAuthLogs } from '../../services/api';

const AdminLogs = () => {
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'auth'
  const [systemLogs, setSystemLogs] = useState([]);
  const [authLogs, setAuthLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'system') {
        const data = await getAdminLogs();
        setSystemLogs(data);
      } else {
        const data = await getAdminAuthLogs();
        setAuthLogs(data);
      }
    } catch (err) {
      console.error("Failed to load logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeTab]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">System Audits & Session Logs 📑</h1>
        <p className="text-slate-400 mt-2">Track real-time security alerts, admin operations, and user login/logout schedules.</p>
      </header>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-white/5 pb-px">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'system' 
              ? 'border-primary text-white bg-slate-900/20' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" /> System Logs (SYSTEM_LOG)
        </button>
        <button
          onClick={() => setActiveTab('auth')}
          className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'auth' 
              ? 'border-primary text-white bg-slate-900/20' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" /> Session Audits (AUTHENTICATION)
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Retrieving log history...</p>
        </div>
      ) : (
        <div className="glass-card p-6 overflow-hidden flex flex-col">
          {activeTab === 'system' ? (
            <div className="overflow-x-auto">
              {systemLogs.length === 0 ? (
                <p className="text-slate-500 italic text-center py-8">No system actions registered in the logs.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-xs uppercase font-semibold">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Account</th>
                      <th className="pb-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {systemLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 font-mono text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            log.action.includes('failed') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            log.action.includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-slate-200">{log.email || 'System Operation'}</td>
                        <td className="py-3 text-slate-300">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {authLogs.length === 0 ? (
                <p className="text-slate-500 italic text-center py-8">No authentication history registered.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-xs uppercase font-semibold">
                      <th className="pb-3">Account Email</th>
                      <th className="pb-3">Login Time</th>
                      <th className="pb-3">Logout Time</th>
                      <th className="pb-3">Session Date</th>
                      <th className="pb-3">State Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                    {authLogs.map((auth) => (
                      <tr key={auth.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-semibold text-slate-200">{auth.email}</td>
                        <td className="py-4 font-mono text-xs text-slate-400">
                          {auth.login_time ? new Date(auth.login_time).toLocaleString() : '—'}
                        </td>
                        <td className="py-4 font-mono text-xs text-slate-400">
                          {auth.logout_time ? new Date(auth.logout_time).toLocaleString() : '—'}
                        </td>
                        <td className="py-4 text-slate-400">{auth.record_date}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                            auth.status === 'success' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            auth.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            auth.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-white/5'
                          }`}>
                            {auth.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
