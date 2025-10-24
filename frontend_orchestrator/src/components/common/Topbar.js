import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaUser, FaHome } from "react-icons/fa";

const Topbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaHome className="text-blue-600 dark:text-blue-400 text-lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Welcome, {user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Docker Orchestrator's unified platform for container management, automation, and monitoring.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <FaUser className="text-blue-600 dark:text-blue-400 text-sm" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar; 