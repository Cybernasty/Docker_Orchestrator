import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const APP_VERSION = "v1.0.0"; // Set your version here

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(credentials);
      navigate("/home");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
      {/* Logo and app name */}
      <div className="flex flex-col items-center mb-6">
        {/* Logo area with blue circle and ship icon (placeholder) */}
        <div className="bg-blue-500 rounded-full p-4 shadow-lg mb-2">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill="#3498db" />
            <text x="18" y="24" textAnchor="middle" fontSize="18" fill="white" fontFamily="Arial">O</text>
          </svg>
        </div>
        <div className="text-3xl font-bold text-blue-500 mt-1 tracking-tight">orchestrator.io</div>
        <a href="#" className="text-xs text-blue-400 hover:underline mt-1">{APP_VERSION}</a>
      </div>
      {/* Card */}
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-2 text-gray-800">Log in to your account</h2>
        <p className="text-gray-400 text-center mb-6">Welcome back! Please enter your details</p>
        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-center text-sm font-medium">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-600 mb-1 font-medium">Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg pl-10 bg-blue-50/50 transition"
                required
              />
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 text-lg" />
            </div>
          </div>
          <div>
            <label className="block text-gray-600 mb-1 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg pl-10 pr-10 bg-blue-50/50 transition"
                required
              />
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 text-lg" />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-500 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-lg text-lg shadow transition duration-150"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
      {/* Version at the bottom */}
      <div className="mt-6 text-xs text-gray-400">{APP_VERSION}</div>
    </div>
  );
};

export default Login;
