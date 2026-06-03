import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function WorldsListComponent() {
  const [worlds, setWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [worldAccess, setWorldAccess] = useState({});
  const [lockMessage, setLockMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        const response = await api.world.getAll();
        if (response.data.success) {
          const sorted = response.data.data.sort((a, b) => a.sequence - b.sequence);
          setWorlds(sorted);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch worlds");
      } finally {
        setLoading(false);
      }
    };
    fetchWorlds();
  }, []);

  useEffect(() => {
const checkWorldAccess = async () => {
  if (!user || worlds.length === 0) return;

  const accessStatus = {};
  let hasEncounteredLock = false;

  for (const world of worlds) {
    if (world.sequence === 1) {
      accessStatus[world.worldId] = true;
      continue;
    }

    if (hasEncounteredLock) {
      accessStatus[world.worldId] = false;
      continue;
    }

    try {
      const response = await api.user.checkWorldCompletion({
        userId: user.id,
        worldId: world.worldId,
      });

      if (response.data.canAccess) {
        accessStatus[world.worldId] = true;
      } else {
        accessStatus[world.worldId] = false;
        hasEncounteredLock = true; // Sekali terkunci, depannya ikut terkunci
      }
    } catch (err) {
      accessStatus[world.worldId] = false;
      hasEncounteredLock = true;
    }
  }
  setWorldAccess(accessStatus);
};

    checkWorldAccess();
  }, [user, worlds]);

  const handleWorldClick = (world) => {
    if (worldAccess[world.worldId] === true) {
      navigate(`/challenge/${world.worldId}`);
    } else {
      const prevWorldNum = world.sequence - 1;
      setLockMessage(`🔒 Selesaikan semua tantangan di World ${prevWorldNum} terlebih dahulu!`);
      setTimeout(() => setLockMessage(""), 3000);
    }
  };

  return (
    <div className="relative min-h-screen p-12 flex flex-col items-center">
      <div className="absolute top-12 left-12">
        <h1 className="text-white text-3xl font-bold tracking-[0.3em]">
          <a
            href="/select-world"
            className="hover:text-sql-blue-light transition-colors"
          >
            SQL ZONE
          </a>
        </h1>
      </div>

      <div className="absolute top-12 right-12 flex items-center gap-6">
        {user && (
          <div className="text-white font-semibold">
            👤 {user.name || user.username}
          </div>
        )}
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
          }}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl transition-all"
        >
          Logout
        </button>
      </div>

      {lockMessage && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold">
          {lockMessage}
        </div>
      )}

      <div className="mt-24 w-full max-w-6xl space-y-8">
        <div className="bg-[#0A1128]/60 backdrop-blur-sm border-2 border-sql-blue-light rounded-[30px] p-12 shadow-[0_0_15px_rgba(0,209,255,0.2)]">
          <p className="text-white text-xl leading-relaxed tracking-wide font-light max-w-4xl italic text-center mx-auto">
            "Kamu telah memasuki SQL Zone. Taklukkan setiap dunia, kuasai setiap perintah, dan jadilah master database yang sesungguhnya."
          </p>
        </div>

        {loading && (
          <p className="text-white text-center text-lg">Loading worlds...</p>
        )}
        {error && (
          <p className="text-red-500 text-center text-lg">Error: {error}</p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {worlds.map((world) => {
              const isLocked = worldAccess[world.worldId] !== true;
              return (
                <div
                  key={world.worldId}
                  onClick={() => handleWorldClick(world)}
                  className={`bg-[#0A1128]/60 backdrop-blur-sm border-2 rounded-[30px] h-[250px] flex flex-col items-center justify-center pt-10 transition-all group ${
                    isLocked
                      ? "border-gray-500 opacity-50 cursor-not-allowed hover:bg-[#0A1128]/60"
                      : "border-sql-blue-light cursor-pointer hover:bg-sql-blue-light/10 hover:shadow-[0_0_25px_rgba(0,209,255,0.3)]"
                  }`}
                >
                  {isLocked && (
                    <div className="absolute top-6 right-6 text-yellow-400 text-2xl">
                      🔒
                    </div>
                  )}
                  <h2
                    className={`text-xl font-bold tracking-[0.2em] transition-transform ${
                      isLocked
                        ? "text-gray-400"
                        : "text-white group-hover:scale-110"
                    }`}
                  >
                    {world.worldName}
                  </h2>
                  <p
                    className={`text-sm mt-4 text-center px-4 ${
                      isLocked ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {world.worldDescription}
                  </p>
                  {isLocked && (
                    <p className="text-yellow-400 text-xs mt-4 font-semibold">
                      Complete World {world.sequence - 1} first
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorldsListComponent;
