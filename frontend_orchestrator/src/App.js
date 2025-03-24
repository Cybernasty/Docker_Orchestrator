import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import Home from "./components/Dashboard/Home"; 
// import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/common/Navbar";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          {/* <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
