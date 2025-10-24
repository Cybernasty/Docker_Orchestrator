import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { FaCog, FaBell, FaPalette, FaDatabase, FaSave, FaUserPlus, FaEdit, FaTrash, FaUser } from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import { API_ENDPOINTS } from "../../config/api";

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("notifications");
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      containerAlerts: true,
      systemAlerts: true,
      securityAlerts: true
    },
    appearance: {
      theme: theme || "light",
      language: "en",
      timezone: "UTC"
    },
    docker: {
      registry: "localhost:6500",
      autoSync: true,
      logRetention: 30
    }
  });

  // Sync theme with global theme context
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, theme }
    }));
  }, [theme]);

  // Add User form state
  const [userForm, setUserForm] = useState({ email: "", password: "", role: "viewer" });
  const [userMessage, setUserMessage] = useState(null);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleSave = (section) => {
    console.log(`Saving ${section} settings:`, settings[section]);
    // Here you would typically send the settings to the backend
    alert(`${section} settings saved successfully!`);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_ENDPOINTS.GET_USERS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserMessage(null);
    try {
      await axios.post(
        API_ENDPOINTS.ADD_USER,
        userForm,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setUserMessage({ type: "success", text: "User created successfully!" });
      setUserForm({ email: "", password: "", role: "viewer" });
      fetchUsers(); // Refresh user list
    } catch (err) {
      setUserMessage({ type: "error", text: err.response?.data?.error?.message || "Error creating user" });
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setUserMessage(null);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        API_ENDPOINTS.UPDATE_USER(editingUser._id),
        {
          email: editingUser.email,
          ...(editingUser.password && { password: editingUser.password }),
          role: editingUser.role
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserMessage({ type: "success", text: "User updated successfully!" });
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers(); // Refresh user list
    } catch (err) {
      setUserMessage({ type: "error", text: err.response?.data?.error?.message || "Error updating user" });
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }
    
    setUserMessage(null);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        API_ENDPOINTS.DELETE_USER(userId),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserMessage({ type: "success", text: "User deleted successfully!" });
      fetchUsers(); // Refresh user list
    } catch (err) {
      setUserMessage({ type: "error", text: err.response?.data?.error?.message || "Error deleting user" });
    }
  };

  // Fetch users when User Management tab is active
  useEffect(() => {
    if (activeTab === "users" && user?.role === "admin") {
      fetchUsers();
    }
  }, [activeTab, user]);

  const tabs = [
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "appearance", label: "Appearance", icon: FaPalette },
    { id: "docker", label: "Docker", icon: FaDatabase },
    ...(user?.role === "admin" ? [{ id: "users", label: "User Management", icon: FaUserPlus }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Settings</h1>
            
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <tab.icon className="mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Settings</h2>
                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {key === "emailNotifications" && "Receive notifications via email"}
                            {key === "containerAlerts" && "Get alerts when containers start/stop"}
                            {key === "systemAlerts" && "Receive system health alerts"}
                            {key === "securityAlerts" && "Get security-related notifications"}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, [key]: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSave("notifications")}
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <FaSave className="mr-2" />
                    Save Notifications
                  </button>
                </div>
              )}

              {activeTab === "appearance" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Appearance Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                      <select
                        value={settings.appearance.theme}
                        onChange={(e) => {
                          const newTheme = e.target.value;
                          setTheme(newTheme);
                          setSettings(prev => ({
                            ...prev,
                            appearance: { ...prev.appearance, theme: newTheme }
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Current: {theme === "auto" ? "Following system preference" : theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                      <select
                        value={settings.appearance.language}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, language: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                      <select
                        value={settings.appearance.timezone}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, timezone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="CET">Central European Time</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave("appearance")}
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center transition-colors"
                  >
                    <FaSave className="mr-2" />
                    Save Appearance
                  </button>
                </div>
              )}

              {activeTab === "docker" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Docker Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Registry URL</label>
                      <input
                        type="text"
                        value={settings.docker.registry}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          docker: { ...prev.docker, registry: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="localhost:6500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Log Retention (days)</label>
                      <input
                        type="number"
                        value={settings.docker.logRetention}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          docker: { ...prev.docker, logRetention: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="365"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.docker.autoSync}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            docker: { ...prev.docker, autoSync: e.target.checked }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Auto-sync containers with database</span>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave("docker")}
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <FaSave className="mr-2" />
                    Save Docker Settings
                  </button>
                </div>
              )}

              {activeTab === "users" && user?.role === "admin" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">User Management</h2>
                  
                  {userMessage && (
                    <div className={`mb-6 p-4 rounded-lg font-medium text-base ${userMessage.type === "success" ? "bg-green-100 border-2 border-green-400 text-green-800" : "bg-red-100 border-2 border-red-400 text-red-800"}`}>
                      {userMessage.text}
                    </div>
                  )}

                  {/* Add New User Form */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-xl border-2 border-gray-200 mb-8 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center tracking-tight">
                      <FaUserPlus className="mr-3 text-blue-600 text-2xl" />
                      Add New User
                    </h3>
                    
                    <form onSubmit={handleAddUser} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">Email Address</label>
                          <input
                            type="email"
                            placeholder="user@example.com"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">Password</label>
                          <input
                            type="password"
                            placeholder="Min 6 characters"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            required
                            minLength="6"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">Role</label>
                          <select
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-semibold bg-white"
                            value={userForm.role}
                            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      
                      <button 
                        type="submit" 
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 flex items-center transition-colors font-bold text-base shadow-md hover:shadow-lg"
                      >
                        <FaUserPlus className="mr-2 text-lg" />
                        Add User
                      </button>
                    </form>
                  </div>

                  {/* Existing Users List */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Existing Users ({users.length})</h3>
                    
                    {users.length > 0 ? (
                      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Role</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Created</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                              <tr key={u._id} className="hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                      <FaUser className="text-white text-base" />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-base font-bold text-gray-900">{u.email}</div>
                                      {u._id === user?.id && (
                                        <div className="text-sm font-semibold text-blue-600 mt-0.5">(Current User)</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <span className={`px-4 py-2 inline-flex text-sm leading-5 font-bold rounded-full shadow-sm ${
                                    u.role === 'admin' ? 'bg-purple-100 text-purple-900 border-2 border-purple-300' :
                                    u.role === 'operator' ? 'bg-blue-100 text-blue-900 border-2 border-blue-300' :
                                    'bg-gray-100 text-gray-900 border-2 border-gray-300'
                                  }`}>
                                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-base font-semibold text-gray-700">
                                  {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-3">
                                    <button
                                      onClick={() => {
                                        setEditingUser({ ...u, password: "" });
                                        setShowEditModal(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-900 p-2.5 hover:bg-blue-100 rounded-lg transition-colors border-2 border-transparent hover:border-blue-300"
                                      title="Edit user"
                                    >
                                      <FaEdit className="text-lg" />
                                    </button>
                                    {u._id !== user?.id && (
                                      <button
                                        onClick={() => handleDeleteUser(u._id, u.email)}
                                        className="text-red-600 hover:text-red-900 p-2.5 hover:bg-red-100 rounded-lg transition-colors border-2 border-transparent hover:border-red-300"
                                        title="Delete user"
                                      >
                                        <FaTrash className="text-lg" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-600 font-medium text-lg bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        No users found. Add your first user above.
                      </div>
                    )}
                  </div>

                  {/* Edit User Modal */}
                  {showEditModal && editingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 border-2 border-gray-200">
                        <div className="p-8 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
                          <h3 className="text-2xl font-bold text-gray-900 flex items-center tracking-tight">
                            <FaEdit className="mr-3 text-blue-600 text-2xl" />
                            Edit User
                          </h3>
                        </div>
                        <form onSubmit={handleEditUser} className="p-8 space-y-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">Email Address</label>
                            <input
                              type="email"
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium"
                              value={editingUser.email}
                              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">New Password (optional)</label>
                            <input
                              type="password"
                              placeholder="Leave blank to keep current password"
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium"
                              value={editingUser.password}
                              onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                              minLength="6"
                            />
                            <p className="mt-2 text-sm text-gray-600 font-medium">Only fill this if you want to change the password</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">Role</label>
                            <select
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-semibold bg-white"
                              value={editingUser.role}
                              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            >
                              <option value="viewer" className="font-semibold">Viewer - Can view containers and logs</option>
                              <option value="operator" className="font-semibold">Operator - Can start/stop containers</option>
                              <option value="admin" className="font-semibold">Admin - Full access including user management</option>
                            </select>
                          </div>

                          <div className="flex justify-end space-x-4 pt-6 border-t-2 border-gray-100">
                            <button
                              type="button"
                              onClick={() => {
                                setShowEditModal(false);
                                setEditingUser(null);
                              }}
                              className="px-6 py-3 border-2 border-gray-300 text-gray-800 font-bold rounded-lg hover:bg-gray-100 transition-colors text-base"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center text-base shadow-md hover:shadow-lg"
                            >
                              <FaSave className="mr-2 text-lg" />
                              Save Changes
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage; 