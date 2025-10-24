import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./components/Auth/Login";
import Home from "./components/Dashboard/Home"; 
import ContainersPage from "./components/Containers/ContainersPage";
import CreateContainerPage from "./components/Containers/CreateContainerPage";
import ImagesPage from "./components/Images/ImagesPage";
import ProfilePage from "./components/Profile/ProfilePage";
import SettingsPage from "./components/Settings/SettingsPage";
import SecurityPage from "./components/Security/SecurityPage";
import MonitoringPage from "./components/Monitoring/MonitoringPage";
import VolumesPage from "./components/Volumes/VolumesPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/containers" element={<ContainersPage />} />
            <Route path="/containers/create" element={<CreateContainerPage />} />
            <Route path="/images" element={<ImagesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/volumes" element={<VolumesPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
