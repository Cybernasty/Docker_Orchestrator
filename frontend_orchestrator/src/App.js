import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import Home from "./components/Dashboard/Home"; 
// import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/common/Navbar";
import ContainersPage from "./components/Containers/ContainersPage";
import CreateContainerPage from "./components/Containers/CreateContainerPage";
import ImagesPage from "./components/Images/ImagesPage";
import ProfilePage from "./components/Profile/ProfilePage";
import SettingsPage from "./components/Settings/SettingsPage";
import AddUser from "./components/Admin/AddUser";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/containers/create" element={<CreateContainerPage />} />
          <Route path="/images" element={<ImagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin/add-user" element={<AddUser />} />
          {/* <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
