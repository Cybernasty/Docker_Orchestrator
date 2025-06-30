import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="text-xl font-bold tracking-wide">Orchestrator</div>
      {user && (
        <button
          onClick={handleLogout}
          className="bg-white text-blue-700 font-semibold px-4 py-1 rounded hover:bg-blue-100 transition"
        >
          Logout
        </button>
      )}
    </nav>
  );
};

export default Navbar;
