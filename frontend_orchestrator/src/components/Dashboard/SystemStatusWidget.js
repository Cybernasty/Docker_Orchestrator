import { FaMicrochip, FaMemory, FaNetworkWired, FaClock } from "react-icons/fa";

const SystemStatusWidget = ({ systemStats }) => {
  const getGaugeColor = (percentage) => {
    if (percentage < 50) return "text-green-500";
    if (percentage < 80) return "text-yellow-500";
    return "text-red-500";
  };

  const getGaugeBackground = (percentage) => {
    if (percentage < 50) return "bg-green-100";
    if (percentage < 80) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">System Status</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* CPU Usage */}
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-full ${getGaugeBackground(systemStats?.cpu || 25)} flex items-center justify-center mb-2`}>
            <FaMicrochip className={`text-2xl ${getGaugeColor(systemStats?.cpu || 25)}`} />
          </div>
          <div className="text-sm font-semibold text-gray-800">CPU Usage</div>
          <div className={`text-lg font-bold ${getGaugeColor(systemStats?.cpu || 25)}`}>
            {systemStats?.cpu || 25}%
          </div>
        </div>

        {/* Memory Usage */}
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-full ${getGaugeBackground(systemStats?.memory || 45)} flex items-center justify-center mb-2`}>
            <FaMemory className={`text-2xl ${getGaugeColor(systemStats?.memory || 45)}`} />
          </div>
          <div className="text-sm font-semibold text-gray-800">Memory Usage</div>
          <div className={`text-lg font-bold ${getGaugeColor(systemStats?.memory || 45)}`}>
            {systemStats?.memory || 45}%
          </div>
        </div>

        {/* Network I/O */}
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-full ${getGaugeBackground(systemStats?.network || 70)} flex items-center justify-center mb-2`}>
            <FaNetworkWired className={`text-2xl ${getGaugeColor(systemStats?.network || 70)}`} />
          </div>
          <div className="text-sm font-semibold text-gray-800">Network I/O</div>
          <div className={`text-lg font-bold ${getGaugeColor(systemStats?.network || 70)}`}>
            {systemStats?.network || 70}%
          </div>
        </div>

        {/* System Uptime */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <FaClock className="text-2xl text-blue-500" />
          </div>
          <div className="text-sm font-semibold text-gray-800">System Uptime</div>
          <div className="text-lg font-bold text-blue-600">{systemStats?.uptime || '0d 0h 0m'}</div>
          <div className="text-xs text-gray-500">{systemStats?.sla || '99.9%'} SLA</div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusWidget;

