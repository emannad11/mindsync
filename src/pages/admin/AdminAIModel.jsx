import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, RefreshCw, BarChart2, CheckCircle, AlertTriangle } from 'lucide-react';
import { getAdminAIModels, adminTrainModel } from '../../services/api';

const AdminAIModel = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainingId, setTrainingId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchModels = async () => {
    try {
      const data = await getAdminAIModels();
      setModels(data);
    } catch (err) {
      console.error("Failed to load models status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleRetrain = async (userId) => {
    setTrainingId(userId);
    setMessage('');
    try {
      const res = await adminTrainModel(userId);
      setMessage(`Successfully trained model! Accuracy: ${Math.round(res.metrics.burnout_accuracy * 100)}%, R2: ${Math.round(res.metrics.regression_r2 * 100)}%`);
      fetchModels();
    } catch (err) {
      console.error(err);
      setMessage("Training failed. Ensure user has enough mood/task data.");
    } finally {
      setTrainingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Loading AI model states...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">AI Model Operations 🤖</h1>
        <p className="text-slate-400 mt-2">Monitor model architectures, accuracy parameters, and trigger personalized retrains.</p>
      </header>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${
          message.includes('failed') ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }`}>
          {message}
        </div>
      )}

      {/* Model Tech Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 border-l-4 border-l-primary">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-white">
            <Cpu className="text-primary w-5 h-5" /> Multi-Task Learning MLP
          </h2>
          <p className="text-xs text-slate-400 mb-4">Unified neural network model executing classification and regression tasks concurrently.</p>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between border-b border-white/5 py-1">
              <span className="text-slate-400">Framework</span>
              <span>Keras / TensorFlow 2.x</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1">
              <span className="text-slate-400">Model Architecture</span>
              <span>Shared MLP (128 & 64 Hidden Nodes)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Input Features</span>
              <span>Stress, Fatigue, Screen Time, Sleep, Work Hours, Activity, etc.</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-cyan-500">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-white">
            <BarChart2 className="text-cyan-400 w-5 h-5" /> Model Outputs & Heads
          </h2>
          <p className="text-xs text-slate-400 mb-4">Double-headed network mapping user data to multiple target outputs.</p>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between border-b border-white/5 py-1">
              <span className="text-slate-400">Classification Head</span>
              <span>Burnout Risk (Low | Medium | High)</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1">
              <span className="text-slate-400">Regression Head</span>
              <span>Productivity Index (10% to 100%)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Loss Optimization Weight</span>
              <span>50% Softmax Cross-Entropy / 50% Linear MSE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Listing Table */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Client Personal Models</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 text-xs uppercase font-semibold">
                <th className="pb-3">Client Email</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Classifier Accuracy</th>
                <th className="pb-3">Regressor R²</th>
                <th className="pb-3">Last Trained</th>
                <th className="pb-3 text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {models.map((m) => (
                <tr key={m.user_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 font-semibold text-white">{m.user_email}</td>
                  <td className="py-4">{m.user_name}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-max ${
                      m.has_trained ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {m.has_trained ? (
                        <><CheckCircle className="w-3 h-3" /> Ready</>
                      ) : (
                        <><AlertTriangle className="w-3 h-3" /> Untrained</>
                      )}
                    </span>
                  </td>
                  <td className="py-4">
                    {m.has_trained ? `${Math.round(m.accuracy * 100)}%` : '—'}
                  </td>
                  <td className="py-4">
                    {m.has_trained ? `${Math.round(m.r2_score * 100)}%` : '—'}
                  </td>
                  <td className="py-4 text-slate-400">
                    {m.training_date ? new Date(m.training_date).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleRetrain(m.user_id)}
                      disabled={trainingId === m.user_id}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center gap-1.5 ml-auto disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${trainingId === m.user_id ? 'animate-spin' : ''}`} />
                      {trainingId === m.user_id ? 'Training...' : 'Retrain'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAIModel;
