import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Edit2, Trash2, X, Check, ShieldCheck } from 'lucide-react';
import { getAdminUsers, updateAdminUser, deleteAdminUser } from '../../services/api';
import { useUser } from '../../context/UserContext';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const { userData: currentAdmin } = useUser();

  // Modal edit form fields
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user account and all their records?")) return;
    try {
      await deleteAdminUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete user");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditAge(user.age || '');
    setEditGender(user.gender || 'Male');
    setEditIsAdmin(user.is_admin || false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateAdminUser(editingUser.id, {
        name: editName,
        age: editAge ? parseInt(editAge, 10) : null,
        gender: editGender,
        is_admin: editIsAdmin
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert("Failed to update user parameters");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Loading user registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Registry Management 👥</h1>
          <p className="text-slate-400 mt-2">View active client profiles, modify access permissions, and revoke accounts.</p>
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Age</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Goal</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-semibold text-white">{user.name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{user.age || '—'}</td>
                  <td className="p-4">{user.gender || '—'}</td>
                  <td className="p-4 capitalize">{user.primaryGoal || '—'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      user.is_admin 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-primary/20 text-slate-400 hover:text-white transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentAdmin?.id}
                        className={`p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors ${
                          user.id === currentAdmin?.id ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md relative"
            >
              <button 
                onClick={() => setEditingUser(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="text-primary w-5 h-5" /> Edit Profile Details
              </h2>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Full Name</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="input-field" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Age</label>
                    <input 
                      type="number" 
                      value={editAge} 
                      onChange={(e) => setEditAge(e.target.value)} 
                      className="input-field" 
                      placeholder="—"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Gender</label>
                    <select 
                      value={editGender} 
                      onChange={(e) => setEditGender(e.target.value)} 
                      className="input-field"
                      style={{ backgroundColor: '#0f172a' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="isAdminCheck"
                    checked={editIsAdmin} 
                    onChange={(e) => setEditIsAdmin(e.target.checked)} 
                    disabled={editingUser.id === currentAdmin?.id}
                    className="w-4 h-4 text-primary bg-slate-900 border-white/10 rounded focus:ring-primary"
                  />
                  <label htmlFor="isAdminCheck" className="text-xs text-slate-300 font-medium select-none cursor-pointer flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> Administrative Access (Grant Admin Role)
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setEditingUser(null)}
                    className="btn-secondary w-full"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="btn-primary w-full"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
