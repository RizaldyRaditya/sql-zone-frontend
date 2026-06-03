import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AnimatedPage from '../components/AnimatedPage';

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username || !password || !confirmPassword) {
      setError("Semua field harus diisi");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.auth.register({ username, password });

      if (response.data.success) {
        setSuccess("Registrasi berhasil! Silakan login.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.data.message || "Registrasi gagal");
      }
    } catch (err) {
      console.error("Register error:", err);
      setError(
        err.response?.data?.message || "Gagal registrasi. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
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
            Register
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-2xl p-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500 rounded-2xl p-3 mb-6">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleRegister}>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-sql-blue-light/40 transition-all text-slate-900 text-lg shadow-inner"
                placeholder="Username"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-sql-blue-light/40 transition-all text-slate-900 text-lg shadow-inner"
                placeholder="Password"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-sql-blue-light/40 transition-all text-slate-900 text-lg shadow-inner"
                placeholder="Confirm Password"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between pt-6 px-2">
              <button
                type="submit"
                className="bg-[#4A89C5] hover:bg-[#5a99d5] text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all text-lg disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Loading..." : "Register"}
              </button>

              <button
                type="button"
                onClick={handleLoginClick}
                className="text-white hover:text-sql-blue-light font-medium transition-all text-lg tracking-wide"
                disabled={loading}
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Register;
