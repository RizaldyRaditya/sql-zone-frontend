import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AnimatedPage from '../components/AnimatedPage';

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Username dan password admin harus diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.auth.adminLogin({ username, password });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminData", JSON.stringify(response.data.admin));

        navigate("/admin/dashboard"); 
      } else {
        setError(response.data.message || "Login Admin gagal");
      }
    } catch (err) {
      console.error("Admin Login error:", err);
      setError(
        err.response?.data?.message || "Gagal login admin. Periksa koneksi Anda.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-12 left-12">
          <h1 className="text-white text-2xl font-bold tracking-[0.3em]">
            SQL ZONE 
          </h1>
        </div>

        <div className="bg-sql-card/40 backdrop-blur-md p-10 rounded-[50px] w-full max-w-[350px] shadow-2xl border border-white/5">
          <h2 className="text-white text-4xl font-semibold mb-12 text-center tracking-tight">
            Admin Login
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-2xl p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleAdminLogin}>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-red-400/40 transition-all text-slate-900 text-lg shadow-inner"
                placeholder="Admin Username"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-red-400/40 transition-all text-slate-900 text-lg shadow-inner"
                placeholder="Admin Password"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-center pt-6">
              <button
                type="submit"
                className="bg-[#4A89C5] hover:bg-[#5a99d5] text-white font-bold py-3 px-10 rounded-2xl shadow-lg transition-all text-lg disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Login Admin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default LoginAdmin;