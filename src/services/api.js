import axios from "axios";

// Detect API URL berdasarkan environment
let API_BASE_URL;

if (import.meta.env.VITE_APP_API_URL) {
  API_BASE_URL = import.meta.env.VITE_APP_API_URL;
  console.log("API URL from env:", API_BASE_URL);
} else if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  API_BASE_URL = "http://localhost:8080/api";
  console.log("API URL (localhost):", API_BASE_URL);
} else {
  // Production: replace domain frontend dengan api subdomain
  const protocol = window.location.protocol;
  const domain = window.location.hostname;
  API_BASE_URL = `${protocol}//api.${domain}/api`;
  console.log("API URL (production):", API_BASE_URL);
}

console.log("Frontend hostname:", window.location.hostname);
console.log("Final API_BASE_URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default {
  auth: {
    login: (credentials) => api.post("/auth/login", credentials),
    register: (userData) => api.post("/auth/register", userData),
    adminLogin: (credentials) => api.post("/auth/admin/login", credentials),
  },
  user: {
    getAll: () => api.get("/user/getUser"),
    insert: (data) => api.post("/user/insertUser", data),
    update: (data) => api.put("/user/updateUser", data),
    updateProgress: (data) => api.post("/user/updateProgress", data),
    getLeaderboard: () => api.get("/user/leaderboard"),
    recordProgress: (data) => api.post("/user/recordProgress", data),
    checkWorldCompletion: (data) =>
      api.post("/user/checkWorldCompletion", data),
    getWorldChallengeStatus: (userId, worldId) =>
      api.get("/user/worldChallengeStatus", { params: { userId, worldId } }),
    delete: (id) => api.delete("/user/deleteUser", { data: { userId: id } }),
  },
  world: {
    getAll: () => api.get("/world/getWorld"),
    getSchema: (worldId) =>
      api.get("/world/getSchema", { params: { worldId } }),
  },
  challenge: {
    getAll: () => api.get("/challenge/getChallenge"),
    getChallenge: () => api.get("/challenge/getChallenge"),
    getChallengesByWorld: (worldId) =>
      api.get(`/challenge/getChallenge/world/${worldId}`),
    getChallengeByWorldAndSequence: (worldId, challengeSequence) =>
      api.get(`/challenge/getChallenge/${worldId}/${challengeSequence}`),
    insert: (data) => api.post("/challenge/insertChallenge", data),
    update: (data) => api.put("/challenge/updateChallenge", data),
    delete: (id) =>
      api.delete("/challenge/deleteChallenge", { data: { challengeId: id } }),
  },
  materi: {
    getAll: () => api.get("/materi/getMateri"),
    getMateriByWorld: (worldId) =>
      api.get(`/materi/getMateri/world/${worldId}`),
    insert: (data) => api.post("/materi/insertMateri", data),
    update: (data) => api.put("/materi/updateMateri", data),
    delete: (id) =>
      api.delete("/materi/deleteMateri", { data: { materiId: id } }),
    getMarkdownContent: (filePath) => {
      // Extract filename from path like "/uploads/materi/filename.md"
      const filename = filePath.split("/").pop();
      return api.get(`/materi/markdown/${filename}`).then((res) => res.data);
    },
  },
  query: {
    executeQuery: (query) => api.post(`/tes/executeQuery`, { query }),
  },
};
