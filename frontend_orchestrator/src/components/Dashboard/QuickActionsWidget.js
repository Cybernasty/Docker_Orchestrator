import { FaGlobe, FaFolderOpen, FaKey, FaShieldAlt, FaPlus, FaPlay, FaStop, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const QuickActionsWidget = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FaPlay,
      label: "Start All Containers",
      action: () => {
        // TODO: Implement start all containers functionality
        alert("Start all containers feature coming soon!");
      },
      color: "bg-gradient-to-r from-green-500 to-green-600"
    },
    {
      icon: FaStop,
      label: "Stop All Containers",
      action: () => {
        // TODO: Implement stop all containers functionality
        alert("Stop all containers feature coming soon!");
      },
      color: "bg-gradient-to-r from-red-500 to-red-600"
    },
    {
      icon: FaKey,
      label: "Configure Access",
      action: () => navigate("/settings"),
      color: "bg-gradient-to-r from-blue-500 to-blue-600"
    },
    {
      icon: FaShieldAlt,
      label: "Security Settings",
      action: () => navigate("/security"),
      color: "bg-gradient-to-r from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
      
      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`w-full ${action.color} text-white rounded-lg px-4 py-3 flex items-center justify-center space-x-2 hover:shadow-md transition-all duration-200 transform hover:scale-105`}
          >
            <action.icon className="text-sm" />
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsWidget;

