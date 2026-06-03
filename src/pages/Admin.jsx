import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { User, BookOpen, HelpCircle, Pencil, Trash2, LogOut, Plus, X } from 'lucide-react';
import api from '../services/api'; 

const Admin = () => {
  const [activeTab, setActiveTab] = useState('user');
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'user') response = await api.user.getAll(); 
      else if (activeTab === 'materi') response = await api.materi.getAll();
      else if (activeTab === 'challenge') response = await api.challenge.getAll();
      
      if (response.data.success) {
        setListData(response.data.data);
      }
    } catch (err) {
      console.error("Gagal ambil data admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      try {
        let res;
        if (activeTab === 'user') res = await api.user.delete(id);
        else if (activeTab === 'materi') res = await api.materi.delete(id);
        else if (activeTab === 'challenge') res = await api.challenge.delete(id);
        
        if (res.data.success) {
          alert("Berhasil dihapus!");
          fetchData();
        }
      } catch (err) {
        alert("Gagal menghapus");
      }
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setIsEdit(true);
      if (activeTab === 'user') {
        setFormData({
          userId: item.userId,
          username: item.username,
          password: '', 
        });
      } else if (activeTab === 'materi') {
        setFormData({
          materiId: item.materiId,
          worldId: item.materi_worldId, 
          materiHeader: item.materiHeader || "",
          materiContent: item.materiContent
        });
        // Show file name as preview
        setFilePreview(item.materiContent);
        setSelectedFile(null);
      } else if (activeTab === 'challenge') {
        setFormData({
          challengeId: item.challengeId,
          worldId: item.challenge_worldId,
          challengeSequence: item.challengeSequence,
          challengeContent: item.challengeContent,
          expectedQuery: item.expectedQuery,
          baseScore: item.baseScore
        });
      }
    } else {
      setIsEdit(false);
      if (activeTab === 'user') {
        setFormData({ username: '', password: '' });
      } else if (activeTab === 'materi') {
        setFormData({ worldId: '', materiHeader: 'SQL Zone Lesson', materiContent: '' });
        setSelectedFile(null);
        setFilePreview(null);
      } else {
        setFormData({ worldId: '', challengeSequence: '', challengeContent: '', expectedQuery: '', baseScore: '' });
      }
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      let payload;

      if (activeTab === 'user') {
        if (isEdit) {
          payload = {
            userId: formData.userId,
            username: formData.username,
            password: formData.password
          };
        } else {
          payload = {
            username: formData.username,
            password: formData.password
          };
        }
        
        if (!payload.username || !payload.password) {
          alert("Username dan Password tidak boleh kosong!");
          return;
        }
      } else if (activeTab === 'materi') {
        // For materi, use FormData for file upload
        if (!formData.worldId || !formData.materiHeader) {
          alert("World ID dan Materi Header tidak boleh kosong!");
          return;
        }

        if (!isEdit && !selectedFile) {
          alert("File .md harus diupload untuk insert materi baru!");
          return;
        }

        payload = new FormData();
        payload.append('worldId', Number(formData.worldId));
        payload.append('materiHeader', formData.materiHeader);
        
        if (selectedFile) {
          payload.append('materiFile', selectedFile);
        }
        if (isEdit) {
          payload.append('materiId', formData.materiId);
        }
      } else {
        payload = { ...formData, worldId: Number(formData.worldId) };
      }

      console.log("Data dikirim:", payload);

      if (isEdit) {
        if (activeTab === 'user') res = await api.user.update(payload);
        else if (activeTab === 'materi') res = await api.materi.update(payload);
        else if (activeTab === 'challenge') res = await api.challenge.update(payload);
      } else {
        if (activeTab === 'user') res = await api.user.insert(payload);
        else if (activeTab === 'materi') res = await api.materi.insert(payload);
        else if (activeTab === 'challenge') res = await api.challenge.insert(payload);
      }
      
      if (res.data.success) {
        alert("Berhasil!");
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      console.error("Detail Error:", err.response?.data);
      alert(err.response?.data?.message || "Terjadi kesalahan pada server");
    }
  };

  return (
    <div className="min-h-screen p-12 font-mono">
      <div className="flex justify-between items-center border-b border-white/20 pb-4 mb-10">
        <h1 className="text-white text-4xl font-bold tracking-tighter">ADMIN PANEL</h1>
        <button onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("isAdmin");
              localStorage.removeItem("adminData");
              localStorage.removeItem("user"); 
              navigate("/admin/login");
            }}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl transition-all">
            Logout
          </button>
      </div>

      <div className="flex gap-8">
        <div className="w-64 space-y-4">
          {[
            { id: 'user', icon: <User size={20} />, label: 'User' },
            { id: 'materi', icon: <BookOpen size={20} />, label: 'Materi' },
            { id: 'challenge', icon: <HelpCircle size={20} />, label: 'Challenge' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white text-xl font-bold uppercase tracking-widest">Manage {activeTab}</h2>
              <button 
                onClick={() => openModal()}
                className="flex items-center gap-1 bg-blue-500 hover:bg-white hover:text-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg uppercase"
              >
                <Plus size={16} /> Insert {activeTab}
              </button>
          </div>

          <div className="bg-[#0A1128]/60 backdrop-blur-md rounded-[30px] p-8 min-h-[400px] shadow-2xl border border-white/5 overflow-x-auto">
            {loading ? (
              <div className="text-white text-center py-20 animate-pulse tracking-[0.3em]">SYNCHRONIZING DATA...</div>
            ) : (
              <table className="w-full text-left text-white">
                <thead>
                  <tr className="text-white/40 text-sm border-b border-white/10">
                    <th className="pb-4 px-4 w-20">ID</th>
                    {activeTab === 'materi' && <th className="pb-4 px-4">MATERI HEADER</th>}
                    {activeTab === 'challenge' && <th className="pb-4 px-4">World ID</th>}
                    {activeTab === 'challenge' && <th className="pb-4 px-4">Sequence</th>}
                    <th className="pb-4 px-4">
                      {activeTab === 'user' ? 'USERNAME' : 'CONTENT'}
                    </th>
                    {activeTab === 'user' && <th className="pb-4 px-4 text-center">TOTAL SCORE</th>}
                    {activeTab === 'challenge' && <th className="pb-4 px-4">Expected Query</th>}
                    {activeTab === 'challenge' && <th className="pb-4 px-4">Base Score</th>}
                    <th className="pb-4 px-4 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {listData.map((item) => {
                    const currentId = item.userId || item.materiId || item.challengeId;
                    return (
                      <tr key={currentId} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="px-4 py-4 text-blue-400 font-bold">#{currentId}</td>
                        {activeTab === 'materi' && (
                          <td className="px-4 py-4 font-bold text-white/90 truncate max-w-[150px]">
                            {item.materiHeader}
                          </td>
                        )}
                        {activeTab === 'challenge' && (
                          <td className="px-4 py-4 font-bold text-white/90 truncate max-w-[150px]">
                            {item.challenge_worldId}
                          </td>
                        )}
                        {activeTab === 'challenge' && (
                          <td className="px-4 py-4 font-bold text-white/90 truncate max-w-[150px]">
                            {item.challengeSequence}
                          </td>
                        )}
                        <td className="px-4 py-4 max-w-md truncate text-sm italic text-white/80">
                          {activeTab === 'user' ? item.username : (item.materiContent || item.challengeContent)}
                        </td>
                        {activeTab === 'challenge' && (
                          <td className="px-4 py-4 font-bold text-white/90 truncate max-w-[150px]">
                            {item.expectedQuery}
                          </td>
                        )}
                        {activeTab === 'challenge' && (
                          <td className="px-4 py-4 font-bold text-white/90 truncate max-w-[150px]">
                            {item.baseScore}
                          </td>
                        )}
                        {activeTab === 'user' && (
                          <td className="px-4 py-4 text-center text-yellow-400 font-bold">{item.totalScore || 0}</td>
                        )}
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-3">
                            <button onClick={() => openModal(item)} className="p-2 bg-white/10 hover:bg-blue-500 text-white rounded-lg transition-all">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDelete(currentId)} className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-lg transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e2d4d] border border-blue-500 rounded-[30px] w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h3 className="text-white text-xl font-bold uppercase tracking-widest">{isEdit ? 'Update' : 'Insert'} {activeTab}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white transition-colors"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} encType={activeTab === 'materi' ? 'multipart/form-data' : 'application/x-www-form-urlencoded'} className="space-y-4">
              {activeTab === 'user' ? (
                <>
                  <div>
                    <label className="text-blue-400 text-[10px] font-bold mb-1 block uppercase tracking-widest">Username</label>
                    <input 
                      type="text" required
                      value={formData.username || ''} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="text-blue-400 text-[10px] font-bold mb-1 block uppercase tracking-widest">
                      Password {isEdit}
                    </label>
                    <input 
                      type="password" required={!isEdit}
                      value={formData.password || ''} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-blue-400 text-[10px] font-bold mb-1 block uppercase tracking-widest">World ID</label>
                    <input 
                      type="number" required
                      value={formData.worldId || ''} 
                      onChange={(e) => setFormData({...formData, worldId: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>

                  {activeTab === 'materi' && (
                    <>
                      <div>
                        <label className="text-blue-400 text-[10px] font-bold mb-1 block uppercase tracking-widest">Materi Header</label>
                        <input 
                          type="text" required
                          value={formData.materiHeader || ''} 
                          onChange={(e) => setFormData({...formData, materiHeader: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-all" 
                        />
                      </div>
                      <div>
                        <label className="text-blue-400 text-[10px] font-bold mb-1 block uppercase tracking-widest">Materi File (.md)</label>
                        <input 
                          type="file" 
                          accept=".md"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
                                setSelectedFile(file);
                                setFilePreview(file.name);
                              } else {
                                alert('File harus berformat .md');
                                e.target.value = '';
                              }
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer" 
                        />
                        {filePreview && (
                          <div className="mt-2 text-xs text-green-400 flex items-center gap-2">
                            ✓ File: {filePreview}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {activeTab === 'challenge' && (
                    <>
                      <div>
                        <label className="text-blue-400 text-[10px] font-bold mb-1 block uppercase tracking-widest">Sequence</label>
                        <input type="number" required value={formData.challengeSequence || ''} onChange={(e) => setFormData({...formData, challengeSequence: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none" />
                      </div>
                      <div>
                        <label className="text-blue-400 text-[10px] font-bold mb-1 block uppercase tracking-widest">Expected Query</label>
                        <textarea required value={formData.expectedQuery || ''} onChange={(e) => setFormData({...formData, expectedQuery: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none" rows={2} />
                      </div>
                      <div>
                        <label className="text-blue-400 text-[10px] font-bold mb-1 block uppercase tracking-widest">Base Score</label>
                        <input type="number" required value={formData.baseScore || ''} onChange={(e) => setFormData({...formData, baseScore: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none" />
                      </div>
                    </>
                  )}

                  {activeTab !== 'materi' && (
                    <div>
                      <label className="text-blue-400 text-[10px] font-bold mb-1 block uppercase tracking-widest">Content</label>
                      <textarea 
                        required rows={4} 
                        value={activeTab === 'materi' ? formData.materiContent : formData.challengeContent} 
                        onChange={(e) => setFormData(activeTab === 'materi' ? {...formData, materiContent: e.target.value} : {...formData, challengeContent: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                  )}
                </>
              )}  
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold uppercase transition-all shadow-lg tracking-widest mt-4">
                {isEdit ? 'Update Changes' : 'Confirm Insert'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;