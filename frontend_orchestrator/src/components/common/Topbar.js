import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaUserCircle, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Topbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow flex items-center justify-between px-6 py-3 border-b border-gray-200">
      <div className="text-xl font-bold text-blue-700 tracking-wide">Orchestrator</div>
      <div className="flex items-center space-x-4">
        <FaUserCircle className="text-2xl text-blue-700" />
        <span className="text-gray-700 font-medium">{user?.user?.email || "User"}</span>
        <button onClick={handleLogout} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold transition">Logout</button>
        <FaCog className="text-xl text-gray-400 hover:text-blue-700 cursor-pointer" title="Settings" />
      </div>
    </header>
  );
};

export default Topbar; 