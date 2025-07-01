import { useContext, useRef, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaUserCircle, FaSignOutAlt, FaUser, FaPalette, FaQuestionCircle, FaSlidersH } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FiUser, FiSettings, FiLogOut, FiHelpCircle, FiSun } from "react-icons/fi";

const Topbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const goToProfile = () => {
    setDropdownOpen(false);
    navigate("/profile");
  };
  const goToSettings = () => {
    setDropdownOpen(false);
    navigate("/settings");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header className="bg-white shadow flex items-center justify-end px-8 py-3 border-b border-gray-200 w-full">
      <div className="flex items-center space-x-6">
        <div className="relative" ref={dropdownRef}>
          <button
            className="btn btn-ghost btn-circle avatar p-0 m-0 border-none hover:bg-base-200"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-label="User menu"
          >
            <div className="w-8 rounded-full flex items-center justify-center bg-blue-100">
              <FaUserCircle className="text-2xl text-blue-700" />
            </div>
          </button>
          <div
            className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 transition-all duration-200 ease-out
              ${dropdownOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
            style={{ minWidth: '14rem' }}
          >
            <ul className="flex flex-col items-center py-2">
              <li className="w-full">
                <button onClick={goToProfile} className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-blue-50 rounded transition">
                  <FiUser className="mr-3 text-lg" /> <span className="flex-1 text-center">Profile</span>
                </button>
              </li>
              <li className="w-full">
                <button onClick={goToSettings} className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-blue-50 rounded transition">
                  <FiSettings className="mr-3 text-lg" /> <span className="flex-1 text-center">Settings</span>
                </button>
              </li>
              <li className="w-full">
                <a href="#theme" className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-blue-50 rounded transition">
                  <FiSun className="mr-3 text-lg" /> <span className="flex-1 text-center">Theme</span>
                </a>
              </li>
              <li className="w-full">
                <a href="#help" className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-blue-50 rounded transition">
                  <FiHelpCircle className="mr-3 text-lg" /> <span className="flex-1 text-center">Help</span>
                </a>
              </li>
              <div className="border-t my-2 w-4/5 mx-auto" />
              <li className="w-full">
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded transition">
                  <FiLogOut className="mr-3 text-lg" /> <span className="flex-1 text-center">Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <span className="text-gray-700 font-semibold text-base hidden md:block">{user?.email || "User"}</span>
      </div>
    </header>
  );
};

export default Topbar; 