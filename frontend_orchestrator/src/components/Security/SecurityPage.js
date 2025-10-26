import { useState, useEffect } from "react";
import { 
  FaShieldAlt, 
  FaLock, 
  FaUnlock, 
  FaEye, 
  FaEyeSlash, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSearch,
  FaDownload,
  FaCog,
  FaUserShield,
  FaNetworkWired,
  FaHdd,
  FaPlay,
  FaStop,
  FaTrash,
  FaRefresh
} from "react-icons/fa";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";

const SecurityPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [containers, setContainers] = useState([]);
  const [securityPolicies, setSecurityPolicies] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Mock data for demonstration
    const mockContainers = [
      {
        id: "web-1",
        name: "nginx-web",
        image: "nginx:latest",
        status: "running",
        security: {
          privileged: false,
          readOnly: true,
          noNewPrivileges: true,
          user: "nginx",
          capabilities: ["NET_BIND_SERVICE"],
          seccomp: "default",
          apparmor: "docker-default",
          securityScan: "passed",
          lastScan: "2024-01-15T10:30:00Z",
          vulnerabilities: 0
        },
        ports: ["80:8080"],
        volumes: ["/var/log/nginx:/var/log/nginx:ro"]
      },
      {
        id: "api-1",
        name: "node-api",
        image: "node:16-alpine",
        status: "running",
        security: {
          privileged: false,
          readOnly: false,
          noNewPrivileges: true,
          user: "node",
          capabilities: [],
          seccomp: "default",
          apparmor: "docker-default",
          securityScan: "warning",
          lastScan: "2024-01-15T09:15:00Z",
          vulnerabilities: 3
        },
        ports: ["3000:3000"],
        volumes: ["/app/node_modules"]
      },
      {
        id: "db-1",
        name: "postgres-db",
        image: "postgres:13",
        status: "running",
        security: {
          privileged: false,
          readOnly: false,
          noNewPrivileges: false,
          user: "postgres",
          capabilities: ["DAC_OVERRIDE"],
          seccomp: "default",
          apparmor: "docker-default",
          securityScan: "failed",
          lastScan: "2024-01-14T16:45:00Z",
          vulnerabilities: 7
        },
        ports: ["5432:5432"],
        volumes: ["/var/lib/postgresql/data"]
      }
    ];

    const mockPolicies = [
      {
        id: "policy-1",
        name: "High Security Container Policy",
        description: "Strict security settings for production containers",
        rules: {
          privileged: false,
          readOnly: true,
          noNewPrivileges: true,
          allowedCapabilities: ["NET_BIND_SERVICE"],
          requiredUser: "non-root",
          seccomp: "default",
          apparmor: "docker-default"
        },
        containers: ["web-1"]
      },
      {
        id: "policy-2",
        name: "Development Container Policy",
        description: "Relaxed security for development environments",
        rules: {
          privileged: false,
          readOnly: false,
          noNewPrivileges: true,
          allowedCapabilities: [],
          requiredUser: "any",
          seccomp: "default",
          apparmor: "docker-default"
        },
        containers: ["api-1"]
      }
    ];

    const mockVulnerabilities = [
      {
        id: "vuln-1",
        containerId: "api-1",
        severity: "high",
        cve: "CVE-2023-1234",
        description: "Remote code execution vulnerability in Node.js",
        package: "node@16.14.0",
        fixedIn: "node@16.15.0",
        status: "open"
      },
      {
        id: "vuln-2",
        containerId: "api-1",
        severity: "medium",
        cve: "CVE-2023-5678",
        description: "Information disclosure in npm package",
        package: "npm@8.3.0",
        fixedIn: "npm@8.5.0",
        status: "open"
      },
      {
        id: "vuln-3",
        containerId: "db-1",
        severity: "critical",
        cve: "CVE-2023-9999",
        description: "SQL injection vulnerability in PostgreSQL",
        package: "postgresql@13.2",
        fixedIn: "postgresql@13.8",
        status: "open"
      }
    ];

    setContainers(mockContainers);
    setSecurityPolicies(mockPolicies);
    setVulnerabilities(mockVulnerabilities);
  }, []);

  const getSecurityStatusColor = (status) => {
    switch (status) {
      case "passed": return "text-green-600 bg-green-100";
      case "warning": return "text-yellow-600 bg-yellow-100";
      case "failed": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-100";
      case "high": return "text-orange-600 bg-orange-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const handleSecurityScan = async (containerId) => {
    setScanning(true);
    // Simulate scanning process
    setTimeout(() => {
      setScanning(false);
      alert(`Security scan completed for container ${containerId}`);
    }, 3000);
  };

  const handleApplyPolicy = (containerId, policyId) => {
    const policy = securityPolicies.find(p => p.id === policyId);
    if (policy) {
      alert(`Applying policy "${policy.name}" to container ${containerId}`);
      // Here you would apply the security policy to the container
    }
  };

  const handleToggleSecuritySetting = (containerId, setting) => {
    setContainers(prev => prev.map(container => {
      if (container.id === containerId) {
        return {
          ...container,
          security: {
            ...container.security,
            [setting]: !container.security[setting]
          }
        };
      }
      return container;
    }));
  };

  const tabs = [
    { id: "overview", label: "Security Overview", icon: FaShieldAlt },
    { id: "containers", label: "Container Security", icon: FaLock },
    { id: "policies", label: "Security Policies", icon: FaUserShield },
    { id: "vulnerabilities", label: "Vulnerabilities", icon: FaExclamationTriangle },
    { id: "network", label: "Network Security", icon: FaNetworkWired },
    { id: "storage", label: "Storage Security", icon: FaHdd }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Container Security</h1>
                <p className="text-gray-600 mt-2">Manage and monitor container security policies, vulnerabilities, and access controls</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setScanning(true)}
                  disabled={scanning}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <FaSearch className="mr-2" />
                  {scanning ? "Scanning..." : "Scan All Containers"}
                </button>
                
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  <FaDownload className="mr-2" />
                  Export Report
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <tab.icon className="mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeTab === "overview" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Overview</h2>
                  
                  {/* Security Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center">
                        <FaShieldAlt className="text-green-600 text-2xl mr-3" />
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {containers.filter(c => c.security.securityScan === "passed").length}
                          </div>
                          <div className="text-sm text-gray-600">Secure Containers</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center">
                        <FaExclamationTriangle className="text-yellow-600 text-2xl mr-3" />
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {containers.filter(c => c.security.securityScan === "warning").length}
                          </div>
                          <div className="text-sm text-gray-600">Warnings</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center">
                        <FaTimesCircle className="text-red-600 text-2xl mr-3" />
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {containers.filter(c => c.security.securityScan === "failed").length}
                          </div>
                          <div className="text-sm text-gray-600">Failed Scans</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center">
                        <FaExclamationTriangle className="text-orange-600 text-2xl mr-3" />
                        <div>
                          <div className="text-2xl font-bold text-gray-800">
                            {vulnerabilities.filter(v => v.severity === "critical" || v.severity === "high").length}
                          </div>
                          <div className="text-sm text-gray-600">High/Critical Vulnerabilities</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Security Events */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Security Events</h3>
                    <div className="space-y-3">
                      {[
                        { time: "2 minutes ago", event: "Security scan completed for nginx-web", status: "success" },
                        { time: "15 minutes ago", event: "Vulnerability detected in node-api", status: "warning" },
                        { time: "1 hour ago", event: "Security policy applied to postgres-db", status: "info" },
                        { time: "2 hours ago", event: "Container postgres-db failed security scan", status: "error" }
                      ].map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-3 ${
                              event.status === "success" ? "bg-green-500" :
                              event.status === "warning" ? "bg-yellow-500" :
                              event.status === "error" ? "bg-red-500" : "bg-blue-500"
                            }`}></div>
                            <span className="text-sm text-gray-800">{event.event}</span>
                          </div>
                          <span className="text-xs text-gray-500">{event.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "containers" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Container Security Management</h2>
                  
                  <div className="space-y-6">
                    {containers.map((container) => (
                      <div key={container.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <FaShieldAlt className="text-blue-600 mr-3" />
                            <div>
                              <h3 className="font-semibold text-gray-800">{container.name}</h3>
                              <p className="text-sm text-gray-600">{container.image}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSecurityStatusColor(container.security.securityScan)}`}>
                              {container.security.securityScan}
                            </span>
                            
                            <button
                              onClick={() => handleSecurityScan(container.id)}
                              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                              <FaSearch className="mr-1" />
                              Scan
                            </button>
                            
                            <button
                              onClick={() => setSelectedContainer(container)}
                              className="flex items-center px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                            >
                              <FaCog className="mr-1" />
                              Configure
                            </button>
                          </div>
                        </div>

                        {/* Security Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">Security Settings</h4>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">Privileged Mode</span>
                              <button
                                onClick={() => handleToggleSecuritySetting(container.id, "privileged")}
                                className={`flex items-center px-2 py-1 rounded text-xs ${
                                  container.security.privileged 
                                    ? "bg-red-100 text-red-800" 
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {container.security.privileged ? <FaUnlock className="mr-1" /> : <FaLock className="mr-1" />}
                                {container.security.privileged ? "Enabled" : "Disabled"}
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">Read-Only Root FS</span>
                              <button
                                onClick={() => handleToggleSecuritySetting(container.id, "readOnly")}
                                className={`flex items-center px-2 py-1 rounded text-xs ${
                                  container.security.readOnly 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {container.security.readOnly ? <FaCheckCircle className="mr-1" /> : <FaTimesCircle className="mr-1" />}
                                {container.security.readOnly ? "Enabled" : "Disabled"}
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">No New Privileges</span>
                              <button
                                onClick={() => handleToggleSecuritySetting(container.id, "noNewPrivileges")}
                                className={`flex items-center px-2 py-1 rounded text-xs ${
                                  container.security.noNewPrivileges 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {container.security.noNewPrivileges ? <FaCheckCircle className="mr-1" /> : <FaTimesCircle className="mr-1" />}
                                {container.security.noNewPrivileges ? "Enabled" : "Disabled"}
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">User & Capabilities</h4>
                            <div className="text-sm text-gray-700">
                              <div>User: <span className="font-medium">{container.security.user}</span></div>
                              <div>Capabilities: <span className="font-medium">{container.security.capabilities.join(", ") || "None"}</span></div>
                              <div>Seccomp: <span className="font-medium">{container.security.seccomp}</span></div>
                              <div>AppArmor: <span className="font-medium">{container.security.apparmor}</span></div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">Vulnerabilities</h4>
                            <div className="text-sm text-gray-700">
                              <div>Total: <span className="font-medium">{container.security.vulnerabilities}</span></div>
                              <div>Last Scan: <span className="font-medium">{new Date(container.security.lastScan).toLocaleDateString()}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "policies" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Policies</h2>
                  
                  <div className="space-y-6">
                    {securityPolicies.map((policy) => (
                      <div key={policy.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-800">{policy.name}</h3>
                            <p className="text-sm text-gray-600">{policy.description}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {policy.containers.length} containers
                            </span>
                            <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                              Edit Policy
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">Policy Rules</h4>
                            <div className="space-y-1 text-sm text-gray-700">
                              <div>Privileged: <span className="font-medium">{policy.rules.privileged ? "Allowed" : "Denied"}</span></div>
                              <div>Read-Only: <span className="font-medium">{policy.rules.readOnly ? "Required" : "Optional"}</span></div>
                              <div>No New Privileges: <span className="font-medium">{policy.rules.noNewPrivileges ? "Required" : "Optional"}</span></div>
                              <div>User: <span className="font-medium">{policy.rules.requiredUser}</span></div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">Applied Containers</h4>
                            <div className="space-y-1">
                              {policy.containers.map((containerId) => {
                                const container = containers.find(c => c.id === containerId);
                                return (
                                  <div key={containerId} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700">{container?.name || containerId}</span>
                                    <span className={`px-2 py-1 rounded text-xs ${getSecurityStatusColor(container?.security.securityScan || "unknown")}`}>
                                      {container?.security.securityScan || "unknown"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "vulnerabilities" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Vulnerabilities</h2>
                  
                  <div className="space-y-4">
                    {vulnerabilities.map((vuln) => {
                      const container = containers.find(c => c.id === vuln.containerId);
                      return (
                        <div key={vuln.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium mr-3 ${getSeverityColor(vuln.severity)}`}>
                                {vuln.severity.toUpperCase()}
                              </span>
                              <div>
                                <h3 className="font-semibold text-gray-800">{vuln.cve}</h3>
                                <p className="text-sm text-gray-600">{container?.name} - {vuln.package}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                vuln.status === "open" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                              }`}>
                                {vuln.status}
                              </span>
                              <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                                View Details
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3">{vuln.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-800">Current Version:</span> {vuln.package}
                            </div>
                            <div>
                              <span className="font-medium text-gray-800">Fixed In:</span> {vuln.fixedIn}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "network" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Network Security</h2>
                  <div className="text-center py-12">
                    <FaNetworkWired className="text-6xl text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Network Security Management</h3>
                    <p className="text-gray-600">Configure network policies, firewall rules, and traffic monitoring</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Configure Network Security
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "storage" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Storage Security</h2>
                  <div className="text-center py-12">
                    <FaHdd className="text-6xl text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Storage Security Management</h3>
                    <p className="text-gray-600">Manage volume encryption, access controls, and data protection</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Configure Storage Security
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SecurityPage;











