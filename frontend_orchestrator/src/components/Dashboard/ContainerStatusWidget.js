import { FaBuilding, FaGlobe, FaHeart, FaServer } from "react-icons/fa";

const ContainerStatusWidget = ({ stats }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <FaServer className="mr-2 text-blue-600" />
        Container Status
      </h3>
      
      <div className="space-y-4">
        {/* Production Environment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaBuilding className="text-gray-600 mr-3" />
            <span className="text-gray-700">Production</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-800 mr-2">
              {stats?.running || 0}/{stats?.total || 0}
            </span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats?.total > 0 ? (stats.running / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Development Environment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaBuilding className="text-gray-600 mr-3" />
            <span className="text-gray-700">Development</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-800 mr-2">
              {stats?.stopped || 0}/{stats?.total || 0}
            </span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats?.total > 0 ? (stats.stopped / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Network Bandwidth */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaGlobe className="text-gray-600 mr-3" />
            <span className="text-gray-700">Network I/O</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-gray-800 mr-2">
              {stats?.networkUsage || '0'}/100 Mbps
            </span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats?.networkUsage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaHeart className="text-gray-600 mr-3" />
            <span className="text-gray-700">System Health</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-semibold text-green-600 flex items-center">
              <FaHeart className="mr-1 text-green-500" />
              Excellent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerStatusWidget;

