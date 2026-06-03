import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import LoginAdmin from './pages/LoginAdmin';
import Register from './pages/Register';
import WorldList from './pages/WorldList';
import Challenge from './pages/Challenge';
import Admin from './pages/Admin';
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectRoute from "./components/AdminProtectRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/select-world" element={<ProtectedRoute element={<WorldList />} />}/>
        <Route path="/challenge/:worldId" element={<ProtectedRoute element={<Challenge />} />}/>
        <Route path="/admin/dashboard" element={<AdminProtectRoute element={<Admin />} />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;