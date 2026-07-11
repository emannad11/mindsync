import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Brain, 
  Moon, 
  Smartphone,
  ChevronRight,
  Camera,
  X,
  Save,
  Mic
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';

const SettingSection = ({ title, description, children }) => (
  <div className="glass-card p-6 mb-6">
    <div className="mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">{description}</p>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const ToggleRow = ({ icon: Icon, label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked} 
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="glass-card w-full max-w-md p-8 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
          </div>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Settings = () => {
  const { addNotification } = useNotifications();
  const { userData, updateUserData } = useUser();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [appSettings, setAppSettings] = useState({
    learningMode: true,
    smartNotifications: true,
    darkMode: true,
    taskReminders: true,
    healthAlerts: false,
    focusEnd: true
  });

  const [permissions, setPermissions] = useState({
    camera: true,
    microphone: true,
    location: false
  });

  const toggleSetting = (key) => {
    setAppSettings(prev => ({ ...prev, [key]: !prev[key] }));
    addNotification('info', 'Setting Updated', `Preference for ${key} has been changed.`);
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    addNotification('info', 'Permission Updated', `${key.charAt(0).toUpperCase() + key.slice(1)} permission has been updated.`);
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    updateUserData({
      name: formData.get('name'),
      email: formData.get('email')
    });
    setIsEditModalOpen(false);
    addNotification('info', 'Profile Updated', 'Your profile information has been saved successfully.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account preferences and AI behavioral settings.</p>
      </header>

      {/* Profile Section */}
      <div className="glass-card p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary p-1 shadow-2xl shadow-primary/20">
            <img src={`https://ui-avatars.com/api/?name=${(userData?.name || 'User').replace(' ', '+')}&background=0f172a&color=fff&size=128`} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-background" />
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full border-4 border-background hover:scale-110 transition-transform"><Camera className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold">{userData?.name || 'User'}</h2>
          <p className="text-slate-400">{userData?.email || 'No email provided'}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <button onClick={() => setIsEditModalOpen(true)} className="btn-primary py-1.5 text-sm">Edit Profile</button>
            <button onClick={() => setIsPasswordModalOpen(true)} className="btn-secondary py-1.5 text-sm">Change Password</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SettingSection title="Personalization" description="Fine-tune how MindSync AI adapts to your routine.">
            <ToggleRow icon={Brain} label="Learning Mode" description="Continuously adapt to behavioral changes." checked={appSettings.learningMode} onChange={() => toggleSetting('learningMode')} />
            <ToggleRow icon={Smartphone} label="Smart Notifications" description="Alerts based on peak energy levels." checked={appSettings.smartNotifications} onChange={() => toggleSetting('smartNotifications')} />
          </SettingSection>

          <SettingSection title="App Permissions" description="Manage device feature permissions for the AI.">
            <ToggleRow icon={Camera} label="Camera Access" description="Allow camera to check facial expressions." checked={permissions.camera} onChange={() => togglePermission('camera')} />
            <ToggleRow icon={Mic} label="Microphone Access" description="Use mic for voice assistant interactions." checked={permissions.microphone} onChange={() => togglePermission('microphone')} />
            <ToggleRow icon={Smartphone} label="Location Tracking" description="Fetch sunset/sunrise for sleep patterns." checked={permissions.location} onChange={() => togglePermission('location')} />
          </SettingSection>
        </div>
        <div className="space-y-6">
          <SettingSection title="Notifications" description="Control when and how you stay updated.">
            <ToggleRow icon={Bell} label="Task Reminders" description="Get notified before deadlines." checked={appSettings.taskReminders} onChange={() => toggleSetting('taskReminders')} />
            <ToggleRow icon={Bell} label="Health Alerts" description="Stay hydrated and active reminders." checked={appSettings.healthAlerts} onChange={() => toggleSetting('healthAlerts')} />
          </SettingSection>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Full Name</label>
            <input name="name" type="text" defaultValue={userData.name} className="input-field" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <input name="email" type="email" defaultValue={userData.email} className="input-field" required />
          </div>
          <button type="submit" className="btn-primary w-full mt-4"><Save className="w-4 h-4" /> Save Changes</button>
        </form>
      </Modal>

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Password">
        <form onSubmit={(e) => { e.preventDefault(); setIsPasswordModalOpen(false); addNotification('info', 'Password Updated', 'Your security credentials have been changed.'); }} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium text-slate-300">New Password</label><input type="password" placeholder="••••••••" className="input-field" required /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Confirm New Password</label><input type="password" placeholder="••••••••" className="input-field" required /></div>
          <button type="submit" className="btn-primary w-full mt-4"><Shield className="w-4 h-4" /> Update Password</button>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Settings;
