import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="text-xl font-bold tracking-wide">Orchestrator</div>
    </nav>
  );
};

export default Navbar;
