import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav>
      <Link to="/home">Dashboard</Link>
      {user && <button onClick={logout}>Logout</button>}
    </nav>
  );
};

export default Navbar;
