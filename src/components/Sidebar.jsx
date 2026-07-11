import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  HeartPulse, 
  Timer, 
  BarChart3, 
  Settings, 
  LogOut,
  BrainCircuit,
  Sliders,
  Mic,
  Users,
  Cpu,
  Terminal
} from 'lucide-react';
import { useUser } from '../context/UserContext';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
      ${isActive 
        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}
    `}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { logout } = useAuth();
  const { userData } = useUser();
  const isAdmin = userData?.is_admin === true;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 bg-[#020617]/80 backdrop-blur-xl flex flex-col z-50">
      <div className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
            <BrainCircuit className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold gradient-text">{isAdmin ? 'MindSync Admin' : 'MindSync AI'}</span>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {isAdmin ? (
          <>
            <NavItem to="/admin" icon={LayoutDashboard} label="Admin Dashboard" />
            <NavItem to="/admin/users" icon={Users} label="Manage Users" />
            <NavItem to="/admin/ai-model" icon={Cpu} label="AI Models" />
            <NavItem to="/admin/logs" icon={Terminal} label="System Logs" />
          </>
        ) : (
          <>
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
            <NavItem to="/focus" icon={Timer} label="Focus Space" />
            <NavItem to="/health" icon={HeartPulse} label="Daily Assessment" />
            <NavItem to="/assistant" icon={Mic} label="Voice Assistant" />
            <NavItem to="/analytics" icon={BarChart3} label="Predictions" />
            <NavItem to="/ai" icon={BrainCircuit} label="AI Recommendations" />
            <NavItem to="/preferences" icon={Sliders} label="Preferences" />
          </>
        )}
        <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
          {!isAdmin && <NavItem to="/settings" icon={Settings} label="Settings" />}
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
