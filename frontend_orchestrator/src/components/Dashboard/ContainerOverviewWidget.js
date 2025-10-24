import { FaDesktop, FaChartBar } from "react-icons/fa";

const ContainerOverviewWidget = ({ containerStats }) => {
  const deviceStatus = [
    { name: "Running", count: containerStats?.running || 0, color: "bg-green-500" },
    { name: "Stopped", count: containerStats?.stopped || 0, color: "bg-red-500" },
    { name: "Paused", count: containerStats?.paused || 0, color: "bg-yellow-500" },
    { name: "Total", count: containerStats?.total || 0, color: "bg-blue-500" }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Container Overview</h3>
      
      <div className="space-y-4">
        {/* Device Status */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <FaDesktop className="mr-2 text-blue-600" />
            Device Status
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {deviceStatus.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{device.name}</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${device.color}`}></div>
                  <span className="text-sm font-semibold text-gray-800">{device.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Port Usage Chart */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <FaChartBar className="mr-2 text-blue-600" />
            Port Usage
          </h4>
          <div className="space-y-2">
            {containerStats?.portUsage || [
              { port: "80", usage: 75, color: "bg-blue-500" },
              { port: "443", usage: 60, color: "bg-green-500" },
              { port: "3000", usage: 45, color: "bg-yellow-500" },
              { port: "5000", usage: 30, color: "bg-red-500" }
            ].map((port, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Port {port.port}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${port.color} transition-all duration-300`}
                      style={{ width: `${port.usage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-8">{port.usage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerOverviewWidget;

