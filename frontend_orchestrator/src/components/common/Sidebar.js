import { NavLink } from "react-router-dom";
import { 
  FaHome, 
  FaCog, 
  FaDesktop, 
  FaGlobe, 
  FaShieldAlt, 
  FaChartBar, 
  FaQuestionCircle, 
  FaUser, 
  FaRobot, 
  FaSignOutAlt,
  FaBars,
  FaDocker,
  FaImages,
  FaNetworkWired,
  FaHdd,
  FaUserPlus,
  FaPlus
} from "react-icons/fa";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  
  return (
    <aside className="bg-white dark:bg-gray-800 w-64 min-h-screen flex flex-col border-r border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100">Menu</span>
        </div>
        <FaBars className="text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200" />
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <NavLink 
          to="/home" 
          className={({ isActive }) => 
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive 
                ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            }`
          }
        >
          <FaHome className="mr-3 text-sm" />
          Home
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive 
                ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            }`
          }
        >
          <FaCog className="mr-3 text-sm" />
          Settings
        </NavLink>
        
        <NavLink 
          to="/containers" 
          className={({ isActive }) => 
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive 
                ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            }`
          }
        >
          <FaDesktop className="mr-3 text-sm" />
          Containers
        </NavLink>
        
        
        
        <NavLink 
          to="/security" 
          className={({ isActive }) => 
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive 
                ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            }`
          }
        >
          <FaShieldAlt className="mr-3 text-sm" />
          Security
        </NavLink>
        
        <NavLink 
          to="/monitoring" 
          className={({ isActive }) => 
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive 
                ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            }`
          }
        >
          <FaChartBar className="mr-3 text-sm" />
          Monitoring
        </NavLink>
        
        <NavLink 
          to="/images" 
          className={({ isActive }) => 
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive 
                ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            }`
          }
        >
          <FaImages className="mr-3 text-sm" />
          Images
        </NavLink>
        
        <button 
          onClick={() => alert("Network management coming soon!")}
          className="flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 w-full text-left"
        >
          <FaNetworkWired className="mr-3 text-sm" />
          Networks
        </button>
        
        <NavLink 
          to="/volumes" 
          className={({ isActive }) => 
            `flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
              isActive 
                ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
            }`
          }
        >
          <FaHdd className="mr-3 text-sm" />
          Volumes
        </NavLink>
        
        <button 
          onClick={logout}
          className="flex items-center px-4 py-3 rounded-lg transition-all duration-200 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 w-full text-left"
        >
          <FaSignOutAlt className="mr-3 text-sm" />
          Logout
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar; 