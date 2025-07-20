import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FaDocker, 
  FaCode, 
  FaCog, 
  FaNetworkWired, 
  FaHdd, 
  FaMemory, 
  FaMicrochip, 
  FaPlay, 
  FaArrowLeft,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaRocket,
  FaShieldAlt,
  FaServer,
  FaSearch,
  FaImage
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";

const CreateContainerPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('dockerfile');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [imageSearchTerm, setImageSearchTerm] = useState('');
  const [useExistingImage, setUseExistingImage] = useState(true);
  const [selectedImage, setSelectedImage] = useState(''); // Track selected image separately

  // Form state
  const [formData, setFormData] = useState({
    dockerfileContent: `FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]`,
    imageName: '',
    containerName: '',
    tag: 'latest',
    ports: [{ hostPort: '', containerPort: '', protocol: 'tcp' }],
    environment: [{ key: '', value: '' }],
    volumes: [{ host: '', container: '', mode: 'rw' }],
    network: 'bridge',
    restartPolicy: 'no',
    memory: '',
    cpuShares: '',
    workingDir: '',
    command: '',
    entrypoint: ''
  });

  // Fetch images on component mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/containers/images", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Fetched images:', response.data.images);
        setImages(response.data.images || []);
      } catch (err) {
        console.error("Error fetching images:", err);
      } finally {
        setImagesLoading(false);
      }
    };
    fetchImages();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log('Click outside detected, dropdown state:', showImageDropdown);
      console.log('Clicked element:', event.target);
      
      // Check if click is on the dropdown trigger or inside the floating dropdown
      const isDropdownTrigger = event.target.closest('.image-dropdown');
      const isFloatingDropdown = event.target.closest('.fixed.inset-0');
      
      if (showImageDropdown && !isDropdownTrigger && !isFloatingDropdown) {
        console.log('Closing dropdown - click outside both trigger and floating dropdown');
        setShowImageDropdown(false);
        setImageSearchTerm('');
      }
    };

    if (showImageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showImageDropdown]);

  // Monitor selectedImage changes
  useEffect(() => {
    console.log('selectedImage changed to:', selectedImage);
  }, [selectedImage]);

  // Check if user has permission
  if (user?.role !== 'admin' && user?.role !== 'operator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-100">
                <div className="text-red-500 mb-6">
                  <FaExclamationTriangle className="text-7xl mx-auto mb-6 opacity-80" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h2>
                <p className="text-gray-600 text-lg mb-8">You don't have permission to create containers.</p>
                <button
                  onClick={() => navigate('/containers')}
                  className="btn btn-primary btn-lg px-8"
                >
                  <FaArrowLeft className="mr-3" />
                  Back to Containers
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [subField]: value } : item
      )
    }));
  };

  const addArrayItem = (field) => {
    const templates = {
      ports: { hostPort: '', containerPort: '', protocol: 'tcp' },
      environment: { key: '', value: '' },
      volumes: { host: '', container: '', mode: 'rw' }
    };
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], templates[field]]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get unique image names from the images array
  const getUniqueImages = () => {
    const uniqueImages = new Set();
    images.forEach(img => {
      if (img.RepoTags) {
        img.RepoTags.forEach(repoTag => {
          if (repoTag !== '<none>:<none>') {
            const [repo, tag] = repoTag.split(':');
            uniqueImages.add(`${repo}:${tag}`);
          }
        });
      }
    });
    return Array.from(uniqueImages).sort();
  };

  const filteredImages = getUniqueImages().filter(image => 
    image.toLowerCase().includes(imageSearchTerm.toLowerCase())
  );

  const selectImage = (imageName) => {
    console.log('Selecting image:', imageName);
    const [repo, tag] = imageName.split(':');
    console.log('Split into repo:', repo, 'tag:', tag);
    setSelectedImage(imageName); // Set the full image name
    setFormData(prev => {
      const newData = {
        ...prev,
        imageName: repo,
        tag: tag || 'latest'
      };
      console.log('Updated formData:', newData);
      return newData;
    });
    setShowImageDropdown(false);
    setImageSearchTerm('');
  };

  const constructImageName = (imageName, tag) => {
    // If we have a selected image, use it directly
    if (selectedImage) {
      return selectedImage;
    }
    // If imageName already contains a tag, use it as is
    if (imageName.includes(':')) {
      return imageName;
    }
    // Otherwise, construct with the provided tag
    return `${imageName}:${tag || 'latest'}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate required fields
    console.log('Validating form data:', formData);
    console.log('useExistingImage:', useExistingImage);
    
    if (!formData.containerName || formData.containerName.trim() === '') {
      console.log('Container name validation failed');
      setError('Container name is required');
      setLoading(false);
      return;
    }

    if (useExistingImage && !selectedImage) {
      console.log('Image name validation failed. selectedImage:', selectedImage);
      setError('Please select an image');
      setLoading(false);
      return;
    }

    if (!useExistingImage && (!formData.dockerfileContent || formData.dockerfileContent.trim() === '')) {
      console.log('Dockerfile content validation failed');
      setError('Dockerfile content is required when building from Dockerfile');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      let requestData;
      
      if (useExistingImage) {
        // Create container from existing image
        requestData = {
          imageName: constructImageName(formData.imageName, formData.tag),
          containerName: formData.containerName,
          ports: formData.ports
            .filter(port => port.hostPort && port.containerPort)
            .map(port => `${port.hostPort}:${port.containerPort}:${port.protocol}`),
          environment: formData.environment
            .filter(env => env.key && env.value)
            .map(env => ({ key: env.key, value: env.value })),
          volumes: formData.volumes
            .filter(vol => vol.host && vol.container)
            .map(vol => ({ host: vol.host, container: vol.container, mode: vol.mode })),
          network: formData.network,
          restartPolicy: formData.restartPolicy,
          memory: formData.memory || null,
          cpuShares: formData.cpuShares || null,
          workingDir: formData.workingDir || null,
          command: formData.command || null,
          entrypoint: formData.entrypoint || null
        };

        console.log('Creating container with data:', requestData);

        const response = await axios.post(
          "/api/containers/create",
          requestData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        // Build and create container from Dockerfile
        requestData = {
          dockerfileContent: formData.dockerfileContent,
          imageName: formData.imageName,
          containerName: formData.containerName,
          tag: formData.tag,
          ports: formData.ports
            .filter(port => port.hostPort && port.containerPort)
            .map(port => `${port.hostPort}:${port.containerPort}:${port.protocol}`),
          environment: formData.environment
            .filter(env => env.key && env.value)
            .map(env => ({ key: env.key, value: env.value })),
          volumes: formData.volumes
            .filter(vol => vol.host && vol.container)
            .map(vol => ({ host: vol.host, container: vol.container, mode: vol.mode })),
          network: formData.network,
          restartPolicy: formData.restartPolicy,
          memory: formData.memory || null,
          cpuShares: formData.cpuShares || null,
          workingDir: formData.workingDir || null,
          command: formData.command || null,
          entrypoint: formData.entrypoint || null
        };

        const response = await axios.post(
          "/api/containers/build-and-create",
          requestData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      setSuccess(`Container "${formData.containerName}" created successfully!`);
      setTimeout(() => {
        navigate('/containers');
      }, 2000);
    } catch (err) {
      console.error("Error creating container:", err);
      setError(err.response?.data?.error?.message || "Failed to create container");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigate('/containers')}
                  className="btn btn-ghost btn-circle mr-6 hover:bg-white/50 transition-all duration-200"
                >
                  <FaArrowLeft className="text-xl" />
                </button>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-800 flex items-center mb-2">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <FaDocker className="text-2xl text-white" />
                    </div>
                    Create Container
                  </h1>
                  <p className="text-gray-600 text-lg ml-18">Build and deploy containers from Dockerfiles with advanced configuration</p>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="alert alert-error mb-8 shadow-xl border-0 rounded-2xl">
                <FaExclamationTriangle className="text-xl" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success mb-8 shadow-xl border-0 rounded-2xl">
                <FaCheckCircle className="text-xl" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Card */}
              <div className="card bg-white shadow-xl border-0 rounded-3xl">
                <div className="card-body p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                      <FaServer className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Basic Information</h3>
                      <p className="text-gray-600">Configure your container's fundamental settings</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="form-control">
                      <label className="label pb-2">
                        <span className="label-text font-semibold text-gray-700 text-base">Image Source</span>
                      </label>
                      <div className="flex space-x-2 mb-4">
                        <button
                          type="button"
                          className={`btn btn-sm ${useExistingImage ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => {
                            setUseExistingImage(true);
                            setSelectedImage(''); // Reset selected image when switching modes
                          }}
                        >
                          <FaImage className="mr-2" />
                          Existing Image
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${!useExistingImage ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => {
                            setUseExistingImage(false);
                            setSelectedImage(''); // Reset selected image when switching modes
                          }}
                        >
                          <FaCode className="mr-2" />
                          Build from Dockerfile
                        </button>
                      </div>
                      
                      {useExistingImage ? (
                        <div className="relative image-dropdown">
                          <div 
                            className="input input-bordered input-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer flex items-center justify-between"
                            onClick={() => {
                              console.log('Dropdown clicked, current state:', showImageDropdown);
                              console.log('Images available:', images.length);
                              console.log('Filtered images:', filteredImages);
                              setShowImageDropdown(!showImageDropdown);
                            }}
                          >
                            <span className={selectedImage ? 'text-gray-800' : 'text-gray-500'}>
                              {selectedImage || 'Select an image...'}
                            </span>
                            <FaImage className="text-gray-400" />
                          </div>
                          
                          {/* Debug info */}
                          <div className="text-xs text-gray-400 mt-1">
                            Images loaded: {images.length} | Dropdown: {showImageDropdown ? 'OPEN' : 'CLOSED'} | Selected: {selectedImage || 'NONE'}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <input
                            type="text"
                            className="input input-bordered input-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            value={formData.imageName}
                            onChange={(e) => handleInputChange('imageName', e.target.value)}
                            placeholder="my-awesome-app"
                            required
                          />
                          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                            <FaInfoCircle className="inline mr-1 text-blue-500" />
                            This image will be built from the Dockerfile content below
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label pb-2">
                        <span className="label-text font-semibold text-gray-700 text-base">Container Name *</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        value={formData.containerName}
                        onChange={(e) => handleInputChange('containerName', e.target.value)}
                        placeholder="my-container"
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label pb-2">
                        <span className="label-text font-semibold text-gray-700 text-base">Tag</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        value={formData.tag}
                        onChange={(e) => handleInputChange('tag', e.target.value)}
                        placeholder="latest"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dockerfile Content Card - Full Width */}
              {!useExistingImage && (
                <div className="card bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
                  <div className="card-body p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                          <FaCode className="text-2xl text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">Dockerfile Content *</h3>
                          <p className="text-gray-600">Write or paste your Dockerfile instructions with syntax highlighting</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                          <span className="font-mono">{formData.dockerfileContent.split('\n').length} lines</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(formData.dockerfileContent)}
                          className="btn btn-outline btn-lg px-6"
                        >
                          <FaCopy className="mr-2" />
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="form-control">
                      <div className="relative bg-gray-900 rounded-2xl p-1 border-2 border-gray-700">
                        <textarea
                          className="textarea textarea-bordered font-mono text-base bg-gray-900 text-green-300 border-0 h-96 w-full resize-none rounded-xl p-8 focus:ring-0 focus:outline-none leading-relaxed"
                          value={formData.dockerfileContent}
                          onChange={(e) => handleInputChange('dockerfileContent', e.target.value)}
                          placeholder="FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD [&quot;npm&quot;, &quot;start&quot;]"
                          required
                          style={{
                            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            tabSize: 2
                          }}
                        />
                        <div className="absolute top-4 right-4 text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-lg border border-gray-600">
                          Dockerfile
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-6">
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            Ready to build
                          </span>
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            Syntax: Dockerfile
                          </span>
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            Auto-save enabled
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-gray-400">
                            {formData.dockerfileContent.replace(/\s/g, '').length} characters
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration Cards Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Port Mappings Card */}
                <div className="card bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
                  <div className="card-body p-8">
                    <div className="flex items-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                        <FaNetworkWired className="text-2xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Port Mappings</h3>
                        <p className="text-gray-600">Map host ports to container ports</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.ports.map((port, index) => (
                        <div key={index} className="flex gap-4 items-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                          <input
                            type="text"
                            className="input input-bordered flex-1 bg-white border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            placeholder="Host Port"
                            value={port.hostPort}
                            onChange={(e) => handleArrayChange('ports', index, 'hostPort', e.target.value)}
                          />
                          <span className="text-gray-400 font-bold text-xl">:</span>
                          <input
                            type="text"
                            className="input input-bordered flex-1 bg-white border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            placeholder="Container Port"
                            value={port.containerPort}
                            onChange={(e) => handleArrayChange('ports', index, 'containerPort', e.target.value)}
                          />
                          <select
                            className="select select-bordered bg-white border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            value={port.protocol}
                            onChange={(e) => handleArrayChange('ports', index, 'protocol', e.target.value)}
                          >
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                          </select>
                          <button
                            type="button"
                            className="btn btn-circle btn-error btn-sm hover:scale-110 transition-transform"
                            onClick={() => removeArrayItem('ports', index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        className="btn btn-outline btn-lg w-full border-dashed border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                        onClick={() => addArrayItem('ports')}
                      >
                        + Add Port Mapping
                      </button>
                    </div>
                  </div>
                </div>

                {/* Environment Variables Card */}
                <div className="card bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
                  <div className="card-body p-8">
                    <div className="flex items-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                        <FaCog className="text-2xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Environment Variables</h3>
                        <p className="text-gray-600">Set environment variables for your container</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.environment.map((env, index) => (
                        <div key={index} className="flex gap-4 items-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                          <input
                            type="text"
                            className="input input-bordered flex-1 bg-white border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            placeholder="Key"
                            value={env.key}
                            onChange={(e) => handleArrayChange('environment', index, 'key', e.target.value)}
                          />
                          <span className="text-gray-400 font-bold text-xl">=</span>
                          <input
                            type="text"
                            className="input input-bordered flex-1 bg-white border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            placeholder="Value"
                            value={env.value}
                            onChange={(e) => handleArrayChange('environment', index, 'value', e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-circle btn-error btn-sm hover:scale-110 transition-transform"
                            onClick={() => removeArrayItem('environment', index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        className="btn btn-outline btn-lg w-full border-dashed border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200"
                        onClick={() => addArrayItem('environment')}
                      >
                        + Add Environment Variable
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volumes Card */}
              <div className="card bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
                <div className="card-body p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                      <FaHdd className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Volumes</h3>
                      <p className="text-gray-600">Mount host directories to container paths</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.volumes.map((volume, index) => (
                      <div key={index} className="flex gap-4 items-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <input
                          type="text"
                          className="input input-bordered flex-1 bg-white border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          placeholder="Host Path"
                          value={volume.host}
                          onChange={(e) => handleArrayChange('volumes', index, 'host', e.target.value)}
                        />
                        <span className="text-gray-400 font-bold text-xl">:</span>
                        <input
                          type="text"
                          className="input input-bordered flex-1 bg-white border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          placeholder="Container Path"
                          value={volume.container}
                          onChange={(e) => handleArrayChange('volumes', index, 'container', e.target.value)}
                        />
                        <select
                          className="select select-bordered bg-white border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          value={volume.mode}
                          onChange={(e) => handleArrayChange('volumes', index, 'mode', e.target.value)}
                        >
                          <option value="rw">Read/Write</option>
                          <option value="ro">Read Only</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-circle btn-error btn-sm hover:scale-110 transition-transform"
                          onClick={() => removeArrayItem('volumes', index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="btn btn-outline btn-lg w-full border-dashed border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
                      onClick={() => addArrayItem('volumes')}
                    >
                      + Add Volume
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Options Card */}
              <div className="card bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
                <div className="card-body p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                        <FaShieldAlt className="text-2xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Advanced Options</h3>
                        <p className="text-gray-600">Configure advanced container settings</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="btn btn-ghost btn-lg px-6 hover:bg-red-50 transition-all duration-200"
                    >
                      {showAdvanced ? <FaEyeSlash className="mr-2" /> : <FaEye className="mr-2" />}
                      {showAdvanced ? ' Hide' : ' Show'} Advanced
                    </button>
                  </div>
                  
                  {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text font-semibold text-gray-700 text-base flex items-center">
                            <FaNetworkWired className="mr-3 text-red-500" />
                            Network Mode
                          </span>
                        </label>
                        <select
                          className="select select-bordered select-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          value={formData.network}
                          onChange={(e) => handleInputChange('network', e.target.value)}
                        >
                          <option value="bridge">Bridge</option>
                          <option value="host">Host</option>
                          <option value="none">None</option>
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text font-semibold text-gray-700 text-base">Restart Policy</span>
                        </label>
                        <select
                          className="select select-bordered select-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          value={formData.restartPolicy}
                          onChange={(e) => handleInputChange('restartPolicy', e.target.value)}
                        >
                          <option value="no">No</option>
                          <option value="always">Always</option>
                          <option value="unless-stopped">Unless Stopped</option>
                          <option value="on-failure">On Failure</option>
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text font-semibold text-gray-700 text-base flex items-center">
                            <FaMemory className="mr-3 text-red-500" />
                            Memory Limit (MB)
                          </span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          value={formData.memory}
                          onChange={(e) => handleInputChange('memory', e.target.value)}
                          placeholder="512"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text font-semibold text-gray-700 text-base flex items-center">
                            <FaMicrochip className="mr-3 text-red-500" />
                            CPU Shares
                          </span>
                        </label>
                        <input
                          type="number"
                          className="input input-bordered input-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          value={formData.cpuShares}
                          onChange={(e) => handleInputChange('cpuShares', e.target.value)}
                          placeholder="1024"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text font-semibold text-gray-700 text-base">Working Directory</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered input-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          value={formData.workingDir}
                          onChange={(e) => handleInputChange('workingDir', e.target.value)}
                          placeholder="/app"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label pb-2">
                          <span className="label-text font-semibold text-gray-700 text-base">Command</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered input-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          value={formData.command}
                          onChange={(e) => handleInputChange('command', e.target.value)}
                          placeholder="npm start"
                        />
                      </div>

                      <div className="form-control md:col-span-2">
                        <label className="label pb-2">
                          <span className="label-text font-semibold text-gray-700 text-base">Entrypoint</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered input-lg bg-gray-50 focus:bg-white transition-all duration-200 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          value={formData.entrypoint}
                          onChange={(e) => handleInputChange('entrypoint', e.target.value)}
                          placeholder="/bin/sh"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-6 pt-8">
                <button
                  type="button"
                  className="btn btn-outline btn-lg px-8 hover:bg-gray-50 transition-all duration-200"
                  onClick={() => navigate('/containers')}
                >
                  <FaArrowLeft className="mr-3" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-md"></span>
                  ) : (
                    <FaRocket className="mr-3" />
                  )}
                  {loading ? 'Creating Container...' : 'Create Container'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
      
      {/* Floating Image Dropdown */}
      {showImageDropdown && useExistingImage && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-25" onClick={() => setShowImageDropdown(false)}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-w-md w-full max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Select Image</h3>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search images..."
                  className="input input-bordered w-full pl-10 bg-white focus:bg-white border-gray-300"
                  value={imageSearchTerm}
                  onChange={(e) => setImageSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto bg-white">
              {imagesLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Loading images...
                </div>
              ) : filteredImages.length > 0 ? (
                filteredImages.map((image, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => {
                      console.log('Image clicked:', image);
                      selectImage(image);
                    }}
                  >
                    <div className="flex items-center">
                      <FaImage className="text-blue-500 mr-3" />
                      <span className="font-mono text-sm">{image}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {imageSearchTerm ? 'No images found matching your search.' : 'No images available.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateContainerPage; 