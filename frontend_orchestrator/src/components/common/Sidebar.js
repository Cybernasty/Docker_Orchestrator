import { NavLink } from "react-router-dom";
import { FaHome, FaDocker, FaImages, FaNetworkWired, FaHdd, FaUserPlus } from "react-icons/fa";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  return (
    <aside className="bg-blue-900 text-white w-64 min-h-screen flex flex-col border-r border-blue-800">
      <div className="flex items-center px-6 py-4 border-b border-blue-800">
        {/* Logo SVG here */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#3498db" />
          <text x="16" y="22" textAnchor="middle" fontSize="16" fill="white" fontFamily="Arial">O</text>
        </svg>
        <span className="ml-2 text-xl font-bold tracking-tight">orchestrator.io</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="text-xs text-blue-200 uppercase mb-2">Local</div>
        <NavLink to="/home" className={({ isActive }) => `flex items-center px-4 py-2 rounded transition font-medium ${isActive ? "bg-blue-800" : "hover:bg-blue-800"}`}><FaHome className="mr-3" /> Dashboard</NavLink>
        <NavLink to="/containers" className={({ isActive }) => `flex items-center px-4 py-2 rounded transition font-medium ${isActive ? "bg-blue-800" : "hover:bg-blue-800"}`}><FaDocker className="mr-3" /> Containers</NavLink>
        <NavLink to="/images" className={({ isActive }) => `flex items-center px-4 py-2 rounded transition font-medium ${isActive ? "bg-blue-800" : "hover:bg-blue-800"}`}><FaImages className="mr-3" /> Images</NavLink>
        <NavLink to="#networks" className="flex items-center px-4 py-2 rounded transition font-medium hover:bg-blue-800"><FaNetworkWired className="mr-3" /> Networks</NavLink>
        <NavLink to="#volumes" className="flex items-center px-4 py-2 rounded transition font-medium hover:bg-blue-800"><FaHdd className="mr-3" /> Volumes</NavLink>
        {user?.role === "admin" && (
          <NavLink to="/admin/add-user" className={({ isActive }) => `flex items-center px-4 py-2 rounded transition font-medium ${isActive ? "bg-blue-800" : "hover:bg-blue-800"}`}><FaUserPlus className="mr-3" /> Add User</NavLink>
        )}
      </nav>
      <div className="mt-auto px-6 py-4 text-xs text-blue-200 border-t border-blue-800">orchestrator.io v1.0.0</div>
    </aside>
  );
};

export default Sidebar; 