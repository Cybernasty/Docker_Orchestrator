import { NavLink } from "react-router-dom";
import { FaHome, FaDocker, FaImages, FaNetworkWired, FaHdd, FaCog } from "react-icons/fa";

const Sidebar = () => {
  return (
    <aside className="bg-blue-900 text-white w-64 min-h-screen flex flex-col shadow-lg">
      <div className="text-2xl font-bold px-6 py-4 border-b border-blue-800 flex items-center">
        <FaDocker className="mr-2" /> Orchestrator
      </div>
      <nav className="flex-1 px-4 py-6 space-y-4">
        <div>
          <div className="uppercase text-xs text-blue-200 mb-2">Main</div>
          <NavLink to="/home" className={({ isActive }) => `flex items-center px-4 py-2 rounded transition font-medium ${isActive ? "bg-blue-700" : "hover:bg-blue-800"}`}><FaHome className="mr-3" /> Dashboard</NavLink>
          <NavLink to="/home#containers" className={({ isActive }) => `flex items-center px-4 py-2 rounded transition font-medium ${isActive ? "bg-blue-700" : "hover:bg-blue-800"}`}><FaDocker className="mr-3" /> Containers</NavLink>
        </div>
        <div>
          <div className="uppercase text-xs text-blue-200 mb-2">Resources</div>
          <NavLink to="#images" className="flex items-center px-4 py-2 rounded transition font-medium hover:bg-blue-800"><FaImages className="mr-3" /> Images</NavLink>
          <NavLink to="#networks" className="flex items-center px-4 py-2 rounded transition font-medium hover:bg-blue-800"><FaNetworkWired className="mr-3" /> Networks</NavLink>
          <NavLink to="#volumes" className="flex items-center px-4 py-2 rounded transition font-medium hover:bg-blue-800"><FaHdd className="mr-3" /> Volumes</NavLink>
        </div>
        <div>
          <div className="uppercase text-xs text-blue-200 mb-2">Settings</div>
          <NavLink to="#settings" className="flex items-center px-4 py-2 rounded transition font-medium hover:bg-blue-800"><FaCog className="mr-3" /> Settings</NavLink>
        </div>
      </nav>
      <div className="mt-auto px-6 py-4 text-xs text-blue-200">&copy; {new Date().getFullYear()} Orchestrator</div>
    </aside>
  );
};

export default Sidebar; 