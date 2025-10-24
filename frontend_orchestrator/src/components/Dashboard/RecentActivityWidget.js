import { FaCheckCircle, FaWrench, FaPlay, FaStop, FaTrash, FaPlus } from "react-icons/fa";
import { useState, useEffect } from "react";

const RecentActivityWidget = ({ activities = [] }) => {
  const [recentActivities, setRecentActivities] = useState([]);
  const defaultActivities = [
    {
      id: 1,
      action: "Container started",
      icon: FaPlay,
      iconColor: "text-green-500",
      time: "2 minutes ago",
      type: "success"
    },
    {
      id: 2,
      action: "New container created",
      icon: FaPlus,
      iconColor: "text-blue-500",
      time: "15 minutes ago",
      type: "info"
    },
    {
      id: 3,
      action: "Container stopped",
      icon: FaStop,
      iconColor: "text-yellow-500",
      time: "1 hour ago",
      type: "warning"
    },
    {
      id: 4,
      action: "Container removed",
      icon: FaTrash,
      iconColor: "text-red-500",
      time: "2 hours ago",
      type: "error"
    }
  ];

  useEffect(() => {
    // Initialize with default activities
    setRecentActivities(defaultActivities);
    
    // Simulate real-time activity updates
    const interval = setInterval(() => {
      const activityTypes = [
        { action: "Container started", icon: FaPlay, iconColor: "text-green-500", type: "success" },
        { action: "New container created", icon: FaPlus, iconColor: "text-blue-500", type: "info" },
        { action: "Container stopped", icon: FaStop, iconColor: "text-yellow-500", type: "warning" },
        { action: "Container removed", icon: FaTrash, iconColor: "text-red-500", type: "error" },
        { action: "System health check", icon: FaCheckCircle, iconColor: "text-green-500", type: "success" }
      ];
      
      const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const newActivity = {
        id: Date.now(),
        ...randomActivity,
        time: "Just now"
      };
      
      setRecentActivities(prev => [newActivity, ...prev.slice(0, 3)]);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const displayActivities = activities.length > 0 ? activities : recentActivities;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {displayActivities.slice(0, 4).map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`flex-shrink-0 ${activity.iconColor}`}>
              <activity.icon className="text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {activity.action}
              </p>
              <p className="text-xs text-gray-500">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityWidget;

