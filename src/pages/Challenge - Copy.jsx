import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { lineNumbers, EditorView } from "@codemirror/view";
import api from "../services/api";
import MarkdownDisplay from "../components/MarkdownDisplay";

const Challenge = () => {
  const { worldId } = useParams();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [materi, setMateri] = useState(null);
  const [materiContent, setMateriContent] = useState(null);
  const [materiLoading, setMateriLoading] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [selectedChallengeSequence, setSelectedChallengeSequence] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(180);
  const [queryLoading, setQueryLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [allCompleted, setAllCompleted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [expectedResult, setExpectedResult] = useState(null);
  const [worldChallengeStatus, setWorldChallengeStatus] = useState({}); // Track completed challenges in this world
  const [penaltyAnimation, setPenaltyAnimation] = useState(false); // For penalty animation
  const [initialTimeLeft, setInitialTimeLeft] = useState(180); // Store initial time for each challenge
  const [schema, setSchema] = useState([]);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Challenge state storage per sequence
  const [challengeData, setChallengeData] = useState({});

  // Get user dari localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // Current challenge state (derived from challengeData)
  const currentChallengeData = challengeData[selectedChallengeSequence] || {
    userQuery: "",
    queryResult: null,
    queryError: "",
    submissionResult: null,
    score: null,
    isSubmitted: false,
    timeUsed: 0,
  };

  const setCurrentChallengeData = (updates) => {
    setChallengeData((prev) => ({
      ...prev,
      [selectedChallengeSequence]: {
        ...currentChallengeData,
        ...updates,
      },
    }));
  };

  // Calculate total accumulated score
  const calculateTotalScore = () => {
    return Object.values(challengeData).reduce((total, data) => {
      return total + (data.score !== null ? data.score : 0);
    }, 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [challengesRes, materiRes, schemaRes] = await Promise.all([
          api.challenge.getChallengesByWorld(worldId),
          api.materi.getMateriByWorld(worldId),
          api.world.getSchema(worldId),
        ]);

        if (challengesRes.data.success) {
          setChallenges(challengesRes.data.data);
        }

        if (schemaRes.data.success) {
          setSchema(schemaRes.data.data);
        }

        if (materiRes.data.success) {
          setMateri(materiRes.data.data);

          // Fetch markdown file content if materiContent is a file path
          if (
            materiRes.data.data?.materiContent &&
            materiRes.data.data.materiContent.startsWith("/uploads")
          ) {
            try {
              setMateriLoading(true);
              const filePath = materiRes.data.data.materiContent;
              console.log("Fetching markdown from:", filePath);
              const mdContent = await api.materi.getMarkdownContent(filePath);
              console.log(
                "Successfully loaded markdown content, length:",
                mdContent.length,
              );
              setMateriContent(mdContent);
            } catch (mdErr) {
              console.error("Error fetching markdown content:", mdErr);
              console.error("Full error:", mdErr.message);
              setMateriContent(
                "⚠️ Error loading markdown file. Check console for details.",
              );
            } finally {
              setMateriLoading(false);
            }
          } else {
            // If it's plain text, use it directly
            console.log("Using plain text materi content");
            setMateriContent(materiRes.data.data?.materiContent || "");
          }
        }
      } catch (err) {
        console.error("Error details:", err);
        const errorMsg =
          err.response?.data?.message || err.message || "Failed to fetch data";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [worldId]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.user.getLeaderboard();
        if (response.data.success) {
          setLeaderboard(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      }
    };

    fetchLeaderboard();
  }, []);

  // Fetch world challenge completion status
  useEffect(() => {
    if (!user || !worldId) return;

    const fetchWorldStatus = async () => {
      try {
        const response = await api.user.getWorldChallengeStatus(
          user.id,
          worldId,
        );
        if (response.data.success) {
          // Create a map of challengeId -> isCompleted
          const statusMap = {};
          response.data.data.forEach((status) => {
            statusMap[status.challengeId] = status.isCompleted;
          });
          setWorldChallengeStatus(statusMap);
          console.log("World challenge status:", statusMap);
        }
      } catch (err) {
        console.error("Error fetching world challenge status:", err);
      }
    };

    fetchWorldStatus();
  }, [user, worldId]);

  const fetchChallengeData = async (worldId, challengeSequence) => {
    try {
      const response = await api.challenge.getChallengeByWorldAndSequence(
        worldId,
        challengeSequence,
      );
      if (response.data.success) {
        setSelectedChallenge(response.data.data);
        setSelectedChallengeSequence(challengeSequence);
        setActiveTab("level");

        // Initialize challenge data jika belum ada
        if (!challengeData[challengeSequence]) {
          setChallengeData((prev) => ({
            ...prev,
            [challengeSequence]: {
              userQuery: "",
              queryResult: null,
              queryError: "",
              submissionResult: null,
              score: null,
              isSubmitted: false,
              timeUsed: 0,
            },
          }));
        }

        console.log("Challenge data:", response.data.data);
      }
    } catch (err) {
      console.error("Error fetching challenge data:", err);
      alert("Gagal mengambil data challenge");
    }
  };

  const handleRunQuery = async () => {
    if (
      selectedChallenge &&
      worldChallengeStatus[selectedChallenge.challengeId]
    ) {
      alert("This challenge is already completed. You cannot modify it.");
      return;
    }

    if (!currentChallengeData.userQuery.trim()) {
      setCurrentChallengeData({ queryError: "Query tidak boleh kosong" });
      return;
    }

    setQueryLoading(true);
    setExpectedResult(null);

    setCurrentChallengeData({
      queryError: "",
      queryResult: null,
      submissionResult: null,
      score: null,
      isSubmitted: false,
    });

    try {
      const userQueryResponse = await api.query.executeQuery(
        currentChallengeData.userQuery,
      );
      if (userQueryResponse.data.success) {
        const expectedQueryResponse = await api.query.executeQuery(
          selectedChallenge.expectedQuery,
        );

        if (expectedQueryResponse.data.success) {
          const isCorrect = compareResults(
            userQueryResponse.data.data,
            expectedQueryResponse.data.data,
          );
          const timeUsedValue = initialTimeLeft - timeLeft;

          if (isCorrect) {
            const calculatedScore = Math.max(
              0,
              selectedChallenge.baseScore - timeUsedValue * 10,
            );

            setCurrentChallengeData({
              queryResult: userQueryResponse.data.data,
              submissionResult: "correct",
              score: calculatedScore,
              isSubmitted: true,
              timeUsed: timeUsedValue,
            });

            if (user && selectedChallenge) {
              api.user
                .recordProgress({
                  userId: user.id,
                  worldId: parseInt(worldId),
                  challengeId: selectedChallenge.challengeId,
                })
                .then((response) => {
                  console.log("Progress recorded:", response.data);

                  setWorldChallengeStatus((prev) => ({
                    ...prev,
                    [selectedChallenge.challengeId]: true,
                  }));
                })
                .catch((error) => {
                  console.error("Error recording progress:", error);
                  alert("Berhasil menjawab, tapi gagal simpan ke database.");
                });
            }
          } else {
            setExpectedResult(expectedQueryResponse.data.data);
            setCurrentChallengeData({
              queryResult: userQueryResponse.data.data,
              submissionResult: "incorrect",
              score: 0,
              isSubmitted: true,
              timeUsed: timeUsedValue,
            });
            // Penalti waktu 30 detik untuk jawaban salah dengan animasi
            setPenaltyAnimation(true);
            setTimeLeft((prev) => Math.max(0, prev - 30));
            setTimeout(() => setPenaltyAnimation(false), 600);
          }
        } else {
          // Error saat execute expected query
          const errorMsg = expectedQueryResponse.data.error || "Unknown error";
          setCurrentChallengeData({
            queryError: `❌ Kesalahan di expected query: ${errorMsg}`,
          });
        }
      } else {
        // Error saat execute user query
        const errorMsg =
          userQueryResponse.data.error ||
          userQueryResponse.data.message ||
          "Unknown error";
        setCurrentChallengeData({
          queryError: `❌ Kesalahan di query Anda:\n\n${errorMsg}`,
        });
      }
    } catch (err) {
      console.error("Error executing query:", err);

      // Parse error message untuk memberikan feedback yang lebih detail
      let errorMessage = "Gagal menjalankan query.";

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Provide helpful hints based on common SQL errors
      let hint = "";
      if (errorMessage.includes("syntax error")) {
        hint =
          "\n💡 Tips: Cek syntax SQL Anda, mungkin ada kesalahan penulisan.";
      } else if (errorMessage.includes("GROUP BY")) {
        hint =
          "\n💡 Tips: Jika menggunakan aggregate function (SUM, COUNT, AVG, dll), gunakan GROUP BY untuk kolom non-aggregate.";
      } else if (
        errorMessage.includes("column") &&
        errorMessage.includes("ambiguous")
      ) {
        hint =
          "\n💡 Tips: Ada kolom yang ambiguous (muncul di multiple table). Gunakan alias atau nama table lengkap.";
      } else if (errorMessage.includes("Unknown column")) {
        hint =
          "\n💡 Tips: Kolom yang Anda gunakan tidak ada di table. Cek kembali nama kolom dan spelling-nya.";
      } else if (errorMessage.includes("table doesn't exist")) {
        hint =
          "\n💡 Tips: Table tidak ditemukan. Cek kembali nama table atau lihat di menu Schema Database.";
      }

      setCurrentChallengeData({
        queryError: `❌ Error: ${errorMessage}${hint}`,
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const compareResults = (userResult, expectedResult) => {
    if (!userResult || !expectedResult) {
      return !userResult && !expectedResult;
    }

    if (userResult.length !== expectedResult.length) {
      return false;
    }

    for (let i = 0; i < userResult.length; i++) {
      const userRow = userResult[i];
      const expectedRow = expectedResult[i];

      if (Object.keys(userRow).length !== Object.keys(expectedRow).length) {
        return false;
      }

      for (const key in expectedRow) {
        if (
          String(userRow[key] ?? "").trim() !==
          String(expectedRow[key] ?? "").trim()
        ) {
          return false;
        }
      }
    }

    return true;
  };

  // Check if all challenges are completed and save to database
  useEffect(() => {
    if (challenges.length === 0) return;

    const completedCount = challenges.filter((c) => {
      return challengeData[c.challengeSequence]?.submissionResult === "correct";
    }).length;

    if (completedCount === challenges.length && completedCount > 0) {
      setAllCompleted(true);

      // Calculate total score and time
      const totalScore = calculateTotalScore();
      const totalTime = Object.values(challengeData).reduce((total, data) => {
        return total + (data.timeUsed || 0);
      }, 0);

      // Save to database
      if (user) {
        console.log("Saving progress:", {
          userId: user.id,
          worldId,
          totalScore,
          totalTime,
        });

        api.user
          .updateProgress({
            userId: user.id,
            worldId,
            totalScore,
            totalTime,
          })
          .then((response) => {
            console.log("Progress saved successfully:", response.data);

            const newStatusMap = {};
            challenges.forEach((c) => {
              newStatusMap[c.challengeId] = true;
            });
            setWorldChallengeStatus(newStatusMap);
          })
          .catch((error) => {
            console.error("Error saving progress:", error);
          });
      }
    }
  }, [challenges, challengeData, user]);

  useEffect(() => {
    let timer;
    if (activeTab === "level" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      alert("WAKTU HABIS! Silakan coba lagi.");
      setActiveTab("idle");
      setTimeLeft(300);
      // Clear challenge timer from localStorage
      if (worldId && selectedChallengeSequence) {
        localStorage.removeItem(
          `challenge_timer_${worldId}_${selectedChallengeSequence}`,
        );
      }
    }

    return () => clearInterval(timer);
  }, [activeTab, timeLeft, worldId, selectedChallengeSequence]);

  useEffect(() => {
    // Only reset timer if this is a fresh challenge selection (not from mount)
    if (!selectedChallengeSequence) return;

    const timerKey = `challenge_timer_${worldId}_${selectedChallengeSequence}`;
    const savedStartTime = localStorage.getItem(timerKey);

    if (savedStartTime) {
      // Challenge already started, calculate remaining time
      const startTime = parseInt(savedStartTime);
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 300 - elapsedSeconds);
      setTimeLeft(remaining);
      setInitialTimeLeft(remaining);
    } else {
      // Fresh challenge, save start time
      localStorage.setItem(timerKey, Date.now().toString());
      setTimeLeft(300);
      setInitialTimeLeft(300);
    }
  }, [selectedChallengeSequence, worldId]);

  const TableDisplay = ({ data, color }) => {
    if (!data || data.length === 0)
      return (
        <div className="p-2 text-[10px] text-white/50">No rows returned</div>
      );

    const borderColor =
      color === "red" ? "border-red-500/20" : "border-green-500/20";
    const headerBg = color === "red" ? "bg-red-500/10" : "bg-green-500/10";

    return (
      <table className="w-full text-white text-[10px]">
        <thead className={`${headerBg} sticky top-0`}>
          <tr>
            {Object.keys(data[0]).map((col) => (
              <th
                key={col}
                className={`px-2 py-1 text-left border-b ${borderColor}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-white/5">
              {Object.values(row).map((val, i) => (
                <td key={i} className="px-2 py-1">
                  {val === null ? "NULL" : String(val)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl border-b border-white/20 pb-4 mb-8 flex items-center justify-between">
        <h1 className="text-white text-3xl font-bold tracking-[0.3em]">
          <a
            href="/select-world"
            className="hover:text-sql-blue-light transition-colors"
          >
            SQL ZONE
          </a>
        </h1>
        <div className="flex items-center gap-6">
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
      </div>

      <div className="w-full max-w-full grid grid-cols-12 gap-6 min-h-screen">
        <div className="col-span-2 sticky top-24 h-fit space-y-6">
          {loading && (
            <p className="text-white text-center">Loading challenges...</p>
          )}
          {error && <p className="text-red-500 text-center">Error: {error}</p>}

          {!loading && !error && challenges.length > 0 && (
            <div className="bg-[#0A1128]/60 border-y-2 border-l-2 border-sql-blue-light rounded-[30px] p-6">
              <h2 className="text-white text-center font-bold border-b-2 border-sql-blue-light pb-2 mb-6 tracking-widest uppercase">
                {challenges[0]?.worldName || "World 1"}
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setActiveTab("materi");
                    setSelectedChallengeSequence(null);
                  }}
                  className={`w-full py-2 border-2 rounded-xl transition-all ${activeTab === "materi" ? "bg-sql-blue-light text-black border-sql-blue-light" : "border-sql-blue-light text-white hover:bg-sql-blue-light/10"}`}
                >
                  Materi
                </button>
                <button
                  onClick={() => {
                    setActiveTab("schema");
                    setSelectedChallengeSequence(null);
                  }}
                  className={`w-full py-2 border-2 rounded-xl transition-all ${activeTab === "schema" ? "bg-sql-blue-light text-black border-sql-blue-light" : "border-sql-blue-light text-white hover:bg-sql-blue-light/10"}`}
                >
                  Schema Database
                </button>
                {challenges.map((challenge) => {
                  const isWorldCompleted =
                    worldChallengeStatus[challenge.challengeId];

                  const isCompleted =
                    isWorldCompleted ||
                    challengeData[challenge.challengeSequence]
                      ?.submissionResult === "correct";

                  const isSelected =
                    selectedChallengeSequence === challenge.challengeSequence;

                  return (
                    <button
                      key={challenge.challengeContent}
                      onClick={() => {
                        setActiveTab("level");
                        setSelectedChallengeSequence(
                          challenge.challengeSequence,
                        );
                        fetchChallengeData(
                          challenge.challenge_worldId,
                          challenge.challengeSequence,
                        );
                      }}
                      className={`w-full py-2 border-2 rounded-xl transition-all ${
                        isCompleted
                          ? "bg-green-500/20 border-green-500 text-green-400"
                          : isSelected
                            ? "bg-sql-blue-light text-black border-sql-blue-light"
                            : "border-sql-blue-light text-white hover:bg-sql-blue-light/10"
                      }`}
                    >
                      {challenge.challengeSequence}
                      {isCompleted ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "level" && (
            <div className="bg-[#0A1128]/60 border-2 border-sql-blue-light rounded-[30px] p-6 text-center">
              <h3 className="text-white font-bold border-b-2 border-sql-blue-light inline-block px-4 pb-1 mb-4 uppercase text-xs tracking-widest">
                Timer
              </h3>
              <div
                className={`text-5xl font-bold tracking-tighter transition-all duration-300 ${
                  penaltyAnimation
                    ? "scale-110 text-red-500 drop-shadow-lg"
                    : "scale-100"
                } ${timeLeft <= 10 ? "text-red-500" : "text-white"}`}
              >
                {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
                {String(timeLeft % 60).padStart(2, "0")}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-7">
          <div className="bg-[#0A1128]/60 border-y-2 border-sql-blue-light rounded-[30px] min-h-[600px] p-8 overflow-hidden relative">
            {activeTab === "materi" && (
              <div className="animate-fade-in overflow-y-auto max-h-[calc(100vh-240px)] pr-4">
                <h2 className="text-3xl font-bold mb-6 text-sql-blue-light border-b-2 border-sql-blue-light pb-4">
                  {materi?.materiHeader}
                </h2>
                {materiLoading ? (
                  <div className="text-white/50 text-center py-12">
                    Loading materi...
                  </div>
                ) : materiContent?.startsWith("⚠️") ? (
                  <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
                    <p className="text-red-400 mb-4">{materiContent}</p>
                    <p className="text-white/50 text-sm mb-3">
                      File path: {materi?.materiContent}
                    </p>
                    <a
                      href={`http://localhost:8080${materi?.materiContent}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline text-sm"
                    >
                      Try opening file directly
                    </a>
                  </div>
                ) : materiContent ? (
                  <MarkdownDisplay content={materiContent} />
                ) : (
                  <div className="text-white/50 text-center py-12">
                    Materi tidak tersedia
                  </div>
                )}
              </div>
            )}

            {activeTab === "schema" && (
              <div className="animate-fade-in overflow-y-auto max-h-[calc(100vh-240px)] pr-4">
                <h2 className="text-3xl font-bold mb-6 text-sql-blue-light border-b-2 border-sql-blue-light pb-4">
                  Database Schema
                </h2>
                {schemaLoading ? (
                  <div className="text-white/50 text-center py-12">
                    Loading schema...
                  </div>
                ) : schema.length === 0 ? (
                  <div className="text-white/50 text-center py-12">
                    Tidak ada tabel dalam database
                  </div>
                ) : (
                  <div className="space-y-6">
                    {schema.map((table) => (
                      <div
                        key={table.tableName}
                        className="bg-[#0A1128]/40 border border-sql-blue-light/30 rounded-lg p-4"
                      >
                        <h3 className="text-xl font-bold text-sql-blue-light mb-3 uppercase tracking-wider">
                          📊 {table.tableName}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-white text-sm">
                            <thead>
                              <tr className="border-b border-sql-blue-light/50">
                                <th className="text-left px-3 py-2 text-sql-blue-light font-bold">
                                  Column Name
                                </th>
                                <th className="text-left px-3 py-2 text-sql-blue-light font-bold">
                                  Type
                                </th>
                                <th className="text-left px-3 py-2 text-sql-blue-light font-bold">
                                  Nullable
                                </th>
                                <th className="text-left px-3 py-2 text-sql-blue-light font-bold">
                                  Key
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.columns.map((col, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-white/5 hover:bg-sql-blue-light/5 transition"
                                >
                                  <td className="px-3 py-2 font-mono text-green-400">
                                    {col.COLUMN_NAME}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-yellow-400">
                                    {col.COLUMN_TYPE}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`${col.IS_NULLABLE === "YES" ? "text-orange-400" : "text-red-400"}`}
                                    >
                                      {col.IS_NULLABLE}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    {col.COLUMN_KEY ? (
                                      <span className="bg-purple-500/30 text-purple-200 px-2 py-1 rounded text-xs font-bold">
                                        {col.COLUMN_KEY}
                                      </span>
                                    ) : (
                                      <span className="text-white/30">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "level" && selectedChallenge && (
              <div className="flex flex-col h-full space-y-4">
                <p className="text-white text-sm">
                  {selectedChallenge?.challengeContent ||
                    "Tuliskan query untuk menampilkan semua data dari tabel yang ditentukan."}
                </p>

                {worldChallengeStatus[selectedChallenge.challengeId] ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-green-500/50 rounded-lg bg-green-500/10">
                    <div className="text-4xl mb-4">✅</div>
                    <p className="text-green-400 font-bold text-lg">
                      Challenge Completed!
                    </p>
                    <p className="text-green-300 text-sm mt-2">
                      This challenge is already finished.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-sql-gray text-white text-[10px] px-3 py-1 font-bold flex items-center gap-2 tracking-widest">
                      <span>💡 HINT</span>
                    </div>

                    <div className="flex-1 border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                      <CodeMirror
                        value={currentChallengeData.userQuery}
                        height="100%"
                        theme={vscodeDark}
                        extensions={[
                          sql(),
                          lineNumbers(),
                          EditorView.lineWrapping,
                        ]}
                        onChange={(value) =>
                          setCurrentChallengeData({ userQuery: value })
                        }
                        readOnly={
                          currentChallengeData.submissionResult === "correct"
                        }
                        className="text-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRunQuery}
                        disabled={
                          queryLoading ||
                          currentChallengeData.submissionResult === "correct"
                        }
                        className="bg-sql-blue-light text-black font-bold px-4 py-1 rounded text-xs uppercase tracking-tighter hover:bg-white transition-all disabled:opacity-50"
                      >
                        {queryLoading ? "Running..." : "Run Query ▶"}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentChallengeData({
                            userQuery: "",
                            queryResult: null,
                            queryError: "",
                            submissionResult: null,
                            isSubmitted: false,
                            score: null,
                          });
                        }}
                        className="bg-sql-blue-light text-black px-2 py-1 rounded text-xs hover:bg-red-400 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}

                {currentChallengeData.queryError && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                    <p className="text-red-400 text-sm font-semibold mb-2">
                      ⚠️ Error di Query Anda
                    </p>
                    <p className="text-red-300 text-xs whitespace-pre-wrap font-mono bg-red-500/5 p-3 rounded border border-red-500/20">
                      {currentChallengeData.queryError}
                    </p>
                  </div>
                )}

                {currentChallengeData.queryResult &&
                  currentChallengeData.queryResult.length > 0 && (
                    <div className="bg-[#0A1128] border border-sql-blue-light rounded overflow-auto max-h-[200px]">
                      <table className="w-full text-white text-xs">
                        <thead className="bg-sql-blue-light/20 sticky top-0">
                          <tr>
                            {Object.keys(
                              currentChallengeData.queryResult[0],
                            ).map((col) => (
                              <th
                                key={col}
                                className="px-3 py-2 text-left border-b border-sql-blue-light"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentChallengeData.queryResult.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-sql-blue-light/20"
                            >
                              {Object.values(row).map((val, i) => (
                                <td key={i} className="px-3 py-2">
                                  {val === null ? "NULL" : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                {currentChallengeData.queryResult &&
                  currentChallengeData.queryResult.length === 0 && (
                    <div className="text-white text-center text-xs">
                      Query berhasil dijalankan, tapi tidak ada hasil
                    </div>
                  )}

                {currentChallengeData.isSubmitted && (
                  <div className="space-y-4">
                    <div
                      className={`border-2 rounded p-4 text-center ${
                        currentChallengeData.submissionResult === "correct"
                          ? "border-green-500 bg-green-500/20"
                          : "border-red-500 bg-red-500/20"
                      }`}
                    >
                      {currentChallengeData.submissionResult === "correct" ? (
                        <h4 className="text-green-400 font-bold text-lg">
                          ✓ JAWABAN BENAR!
                        </h4>
                      ) : (
                        <h4 className="text-red-400 font-bold text-lg">
                          ✗ JAWABAN SALAH
                        </h4>
                      )}
                    </div>

                    {currentChallengeData.submissionResult === "incorrect" &&
                      expectedResult && (
                        <div className="animate-fade-in">
                          <div>
                            <p className="text-green-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                              Expected Output
                            </p>
                            <div className="bg-green-500/5 border border-green-500/20 rounded overflow-auto max-h-[150px]">
                              <TableDisplay
                                data={expectedResult}
                                color="green"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "idle" && (
              <div className="h-full flex items-center justify-center text-white/20 uppercase tracking-[0.5em]">
                Select Materi or Level
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 space-y-6">
          <div className="bg-[#0A1128]/60 border-y-2 border-r-2 border-sql-blue-light rounded-[30px] h-[350px] p-6 overflow-y-auto">
            <h3 className="text-white text-center font-bold border-b-2 border-sql-blue-light pb-2 mb-4 sticky top-0 bg-[#0A1128]/60">
              Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <div className="text-white/50 text-center text-xs py-8">
                  Belum ada data leaderboard
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                      entry.userId === user?.id
                        ? "bg-sql-blue-light/20 border border-sql-blue-light"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sql-blue-light font-bold w-6">
                        {index + 1}.
                      </span>
                      <span className="text-white text-xs truncate">
                        {entry.username}
                      </span>
                      {entry.userId === user?.id && (
                        <span className="text-yellow-400 text-xs">(You)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-xs">
                        {entry.totalScore || 0} pts
                      </div>
                      <div className="text-gray-400 text-xs">
                        {entry.totalTime || "00:00:00"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#0A1128]/60 border-y-2 border-r-2 border-sql-blue-light rounded-[30px] p-6 text-center">
            <h3 className="text-white font-bold border-b-2 border-sql-blue-light inline-block px-4 pb-1 mb-4">
              Total Poin
            </h3>
            <div
              className={`text-5xl font-bold tracking-tighter ${
                calculateTotalScore() > 0 ? "text-green-400" : "text-white"
              }`}
            >
              {calculateTotalScore()}
            </div>
          </div>
        </div>

        {allCompleted && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#0A1128] border-2 border-green-500 rounded-[30px] p-12 max-w-md text-center shadow-2xl">
              <h2 className="text-green-400 text-4xl font-bold mb-6 tracking-wide">
                🎉 SELESAI!
              </h2>
              <div className="space-y-6 mb-8">
                <div className="bg-green-500/20 border border-green-500 rounded-xl p-4">
                  <p className="text-green-300 text-sm mb-2">Total Skor</p>
                  <p className="text-green-400 text-5xl font-bold">
                    {calculateTotalScore()}
                  </p>
                </div>
                <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4">
                  <p className="text-blue-300 text-sm mb-2">Total Waktu</p>
                  <p className="text-blue-400 text-3xl font-bold">
                    {(() => {
                      const totalSeconds = Object.values(challengeData).reduce(
                        (total, data) => {
                          return total + (data.timeUsed || 0);
                        },
                        0,
                      );
                      const minutes = Math.floor(totalSeconds / 60);
                      const seconds = totalSeconds % 60;
                      return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
                    })()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/select-world")}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-all text-lg"
              >
                Kembali ke World
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenge;
