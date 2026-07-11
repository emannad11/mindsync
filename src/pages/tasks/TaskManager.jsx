import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Flag, 
  MoreVertical, 
  CheckCircle2, 
  Circle,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Sparkles,
  RefreshCw,
  Layers
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { getTasks, createTask, updateTask, deleteTask, decomposeTask } from '../../services/api';

const TaskManager = () => {
  const { addNotification } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [decomposingId, setDecomposingId] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      addNotification('error', 'Fetch Failed', 'Could not load tasks from server.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTaskStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      await updateTask(id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      addNotification('info', 'Task Updated', `Task marked as ${newStatus}.`);
    } catch (err) {
      addNotification('error', 'Update Failed', 'Could not update task status.');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      addNotification('alert', 'Task Deleted', 'The task has been permanently removed.');
    } catch (err) {
      addNotification('error', 'Delete Failed', 'Could not delete the task.');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const taskData = {
      title: formData.get('title'),
      priority: formData.get('priority'),
      category: formData.get('category'),
      status: 'Pending'
    };

    try {
      const newTask = await createTask(taskData);
      setTasks([newTask, ...tasks]);
      setIsModalOpen(false);
      addNotification('ai', 'Task Added', 'New task added to your AI queue.');
    } catch (err) {
      addNotification('error', 'Creation Failed', 'Could not create new task.');
    }
  };

  const handleDecompose = async (task) => {
    if (decomposingId) return;
    try {
      setDecomposingId(task.id);
      addNotification('ai', 'AI Working', `Breaking down "${task.title}"...`);
      const data = await decomposeTask(task.title);
      
      // Create subtasks in the backend
      for (const subTitle of data.subtasks) {
        const subTask = await createTask({
          title: subTitle,
          priority: task.priority,
          category: task.category,
          status: 'Pending'
        });
        setTasks(prev => [subTask, ...prev]);
      }
      
      addNotification('success', 'AI Decomposition Complete', `Generated ${data.subtasks.length} sub-tasks.`);
    } catch (err) {
      addNotification('error', 'AI Error', 'Could not decompose task.');
    } finally {
      setDecomposingId(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const filteredTasks = tasks.filter(t => 
    (filter === 'All' || t.category === filter) &&
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-slate-400 mt-1">Organize your workflow with AI-driven priorities.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          Add New Task
        </button>
      </header>

      {/* AI Suggestion Banner */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-indigo-500/5"
      >
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <AlertCircle className="text-indigo-400 w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-indigo-100">AI Priority Suggestion</p>
          <p className="text-xs text-slate-400">Based on your focus habits, "Implement AI Model Backend" should be tackled first.</p>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-11 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Work', 'Study', 'Personal'].map((cat) => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === cat ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-slate-500">Syncing with AI database...</p>
            </div>
          ) : filteredTasks.length > 0 ? filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`glass-card p-4 flex items-center gap-4 group hover:border-primary/30 transition-all ${task.status === 'Completed' ? 'opacity-60' : ''}`}
            >
              <button 
                onClick={() => toggleTaskStatus(task.id, task.status)}
                className="text-slate-500 hover:text-primary transition-colors flex-shrink-0"
              >
                {task.status === 'Completed' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium truncate ${task.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                    <Calendar className="w-3 h-3" />
                    {task.deadline}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                    <Clock className="w-3 h-3" />
                    {task.category}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDecompose(task)}
                  disabled={decomposingId === task.id || task.status === 'Completed'}
                  className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors disabled:opacity-40"
                  title="AI Decompose"
                >
                  {decomposingId === task.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-white/5">
              <p className="text-slate-500">No tasks found matching your criteria.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-md p-8 relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add New Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Task Title</label>
                  <input name="title" type="text" placeholder="e.g. Design System Review" className="input-field" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Priority</label>
                    <select name="priority" className="input-field bg-slate-900">
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Category</label>
                    <select name="category" className="input-field bg-slate-900">
                      <option value="Work">Work</option>
                      <option value="Study">Study</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full mt-6">Create Task</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskManager;
