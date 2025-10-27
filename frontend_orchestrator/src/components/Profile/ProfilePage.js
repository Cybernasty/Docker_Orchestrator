import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaUser, FaSave, FaKey } from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState({
    email: user?.email || "",
    name: user?.name || "",
    role: user?.role || "viewer"
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    // TODO: Implement API call to update profile
    setMessage({ type: "success", text: "Profile updated successfully!" });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match!" });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters!" });
      return;
    }
    
    // TODO: Implement API call to change password
    setMessage({ type: "success", text: "Password changed successfully!" });
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>
            
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === "success" 
                  ? "bg-green-100 border border-green-400 text-green-700" 
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}>
                {message.text}
              </div>
            )}

            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FaUser className="mr-2 text-blue-600" />
                Profile Information
              </h2>
              
              <form onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <input
                      type="text"
                      value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Contact an administrator to change your role</p>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center transition-colors"
                >
                  <FaSave className="mr-2" />
                  Save Profile
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FaKey className="mr-2 text-blue-600" />
                Change Password
              </h2>
              
              <form onSubmit={handleChangePassword}>
                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      minLength="6"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      minLength="6"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 flex items-center transition-colors"
                >
                  <FaKey className="mr-2" />
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage; 