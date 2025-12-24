
import React, { useState } from 'react';
import { AcceptanceTask, AcceptanceStatus, EvidenceFile, Project } from '../types';
import { ClipboardCheck, FileText, CheckCircle2, AlertCircle, Clock, XCircle, Search, Filter, BrainCircuit, Upload, ExternalLink, Image as ImageIcon, X, FileSpreadsheet, File, Plus, Save, FilePlus, ChevronDown, ChevronRight, Layers, FlameKindling, Zap, Wind, Building2, Trash2 } from 'lucide-react';
import { analyzeQAQC } from '../services/geminiService';

interface QAQCManagerProps {
  tasks: AcceptanceTask[];
  projects: Project[];
  onUpdateTask: (task: AcceptanceTask) => void;
  onAddTask: (task: AcceptanceTask) => void;
  onDeleteTask: (id: string) => void;
}

const QAQC_CATEGORIES = [
    'Hệ thống báo cháy tự động',
    'Hệ thống chữa cháy vách tường',
    'Hệ thống Sprinkler tự động',
    'Hệ thống màn ngăn cháy',
    'Hệ thống tăng áp & Hút khói',
    'Hệ thống chống sét',
    'Hệ thống chiếu sáng sự cố & Thoát hiểm'
];

const QAQCManager: React.FC<QAQCManagerProps> = ({ tasks, projects, onUpdateTask, onAddTask, onDeleteTask }) => {
  const [filterStatus, setFilterStatus] = useState<AcceptanceStatus | 'ALL'>('ALL');
  const [filterProject, setFilterProject] = useState<string | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'checklist' | 'analysis' | 'create'>('checklist');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AcceptanceTask | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // New Task Form State
  const [newTaskData, setNewTaskData] = useState<Partial<AcceptanceTask>>({
      title: '',
      category: QAQC_CATEGORIES[0],
      standardRef: '',
      inspector: '',
      status: 'Pending',
      projectId: '',
      projectName: '',
      notes: ''
  });

  const filteredTasks = tasks.filter(t => {
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchesProject = filterProject === 'ALL' || t.projectId === filterProject;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesProject && matchesSearch;
  });

  const groupedTasks = filteredTasks.reduce((acc, task) => {
      const cat = task.category || 'Khác';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(task);
      return acc;
  }, {} as Record<string, AcceptanceTask[]>);

  const toggleGroup = (category: string) => {
      setExpandedGroups(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleStatusChange = (taskId: string, newStatus: AcceptanceStatus) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
          onUpdateTask({ ...task, status: newStatus });
      }
  };

  const handleDeleteTask = (e: React.MouseEvent, taskId: string, title: string) => {
      e.stopPropagation();
      if (window.confirm(`Xác nhận xóa hồ sơ nghiệm thu: "${title}"?\nHành động này không thể hoàn tác.`)) {
          onDeleteTask(taskId);
          if (selectedTask?.id === taskId) setSelectedTask(null);
      }
  };

  const handleCreateTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskData.title || !newTaskData.projectId) {
          alert("Vui lòng nhập đầy đủ Tên hồ sơ và Dự án.");
          return;
      }
      const newTask: AcceptanceTask = {
          id: `qa-${Date.now()}`,
          projectId: newTaskData.projectId,
          projectName: newTaskData.projectName || '',
          category: newTaskData.category || 'Khác',
          title: newTaskData.title,
          standardRef: newTaskData.standardRef || 'TCVN',
          status: 'Pending',
          documents: [],
          images: [],
          inspector: newTaskData.inspector || 'Chưa chỉ định',
          notes: newTaskData.notes,
          checkDate: new Date().toISOString().split('T')[0]
      };
      onAddTask(newTask);
      setActiveTab('checklist');
      // Reset form
      setNewTaskData({ title: '', category: QAQC_CATEGORIES[0], projectId: '', notes: '' });
  };

  const getStatusStyle = (status: AcceptanceStatus) => {
    switch (status) {
      case 'Approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="animate-fade-in space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ClipboardCheck className="text-teal-600" size={28} /> 
             Quản lý Nghiệm thu PCCC
           </h2>
           <p className="text-slate-500 text-sm mt-1">Lập hồ sơ, rà soát minh chứng và phê duyệt trạng thái nghiệm thu.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setActiveTab('checklist')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'checklist' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
                Hạng mục
            </button>
            <button 
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'create' ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
                <FilePlus size={16} /> Lập hồ sơ
            </button>
            <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
                <BrainCircuit size={16} /> AI Rà soát
            </button>
        </div>
      </div>

      {activeTab === 'create' && (
          <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-slide-up">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                  <FilePlus className="text-teal-600" size={24} />
                  <h3 className="font-bold text-lg text-slate-800">Lập mới hồ sơ nghiệm thu</h3>
              </div>
              <form onSubmit={handleCreateTask} className="p-8 space-y-5">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tên hồ sơ / Hạng mục <span className="text-red-500">*</span></label>
                      <input required type="text" placeholder="VD: Thử áp lực đường ống tầng 1..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all" value={newTaskData.title} onChange={e => setNewTaskData({...newTaskData, title: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Hệ thống</label>
                          <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none cursor-pointer" value={newTaskData.category} onChange={e => setNewTaskData({...newTaskData, category: e.target.value})}>
                              {QAQC_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dự án liên kết <span className="text-red-500">*</span></label>
                          <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none cursor-pointer" value={newTaskData.projectId} onChange={e => {
                              const p = projects.find(proj => proj.id === e.target.value);
                              setNewTaskData({...newTaskData, projectId: e.target.value, projectName: p?.name || ''});
                          }}>
                              <option value="">-- Chọn dự án --</option>
                              {projects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                          </select>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tiêu chuẩn áp dụng</label>
                          <input type="text" placeholder="VD: TCVN 7336:2021" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none" value={newTaskData.standardRef} onChange={e => setNewTaskData({...newTaskData, standardRef: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Kỹ sư phụ trách</label>
                          <input type="text" placeholder="Tên kỹ sư..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none" value={newTaskData.inspector} onChange={e => setNewTaskData({...newTaskData, inspector: e.target.value})} />
                      </div>
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Ghi chú</label>
                      <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none resize-none" value={newTaskData.notes} onChange={e => setNewTaskData({...newTaskData, notes: e.target.value})} />
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                      <button type="button" onClick={() => setActiveTab('checklist')} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700">Hủy</button>
                      <button type="submit" className="px-8 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all">Lập hồ sơ</button>
                  </div>
              </form>
          </div>
      )}

      {activeTab === 'checklist' && (
          <div className="flex gap-6 h-full min-h-[500px]">
              <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
                      <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="Tìm kiếm hồ sơ..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div className="flex gap-2">
                          <select className="flex-1 bg-white border border-slate-200 rounded-lg text-xs p-2 outline-none" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                              <option value="ALL">Tất cả dự án</option>
                              {projects.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                          </select>
                          <select className="flex-1 bg-white border border-slate-200 rounded-lg text-xs p-2 outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                              <option value="ALL">Trạng thái</option>
                              <option value="Pending">Chờ duyệt</option>
                              <option value="In Progress">Đang thực hiện</option>
                              <option value="Approved">Đã đạt</option>
                              <option value="Rejected">Không đạt</option>
                          </select>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {Object.entries(groupedTasks).map(([category, items]) => (
                          <div key={category} className="space-y-2">
                              <button onClick={() => toggleGroup(category)} className="w-full flex items-center justify-between p-2 bg-slate-100 rounded-lg font-bold text-xs text-slate-600 uppercase tracking-tighter">
                                  <span>{category} ({items.length})</span>
                                  {expandedGroups[category] === false ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                              </button>
                              {expandedGroups[category] !== false && (
                                  <div className="space-y-2 pl-2">
                                      {items.map(task => (
                                          <div key={task.id} onClick={() => setSelectedTask(task)} className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${selectedTask?.id === task.id ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                              <div className="flex justify-between items-start mb-2 pr-8">
                                                  <h4 className="font-bold text-slate-800 text-sm leading-tight">{task.title}</h4>
                                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border uppercase ${getStatusStyle(task.status)}`}>{task.status}</span>
                                              </div>
                                              <p className="text-[10px] text-slate-400 font-mono mb-2">TC: {task.standardRef} | Dự án: {task.projectName}</p>
                                              
                                              {/* Action: Delete in list */}
                                              <button 
                                                onClick={(e) => handleDeleteTask(e, task.id, task.title)}
                                                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      ))}
                      {tasks.length === 0 && (
                          <div className="h-40 flex flex-col items-center justify-center text-slate-300 italic text-sm">Chưa có hồ sơ nào được tạo</div>
                      )}
                  </div>
              </div>

              {/* Detail side */}
              <div className="hidden lg:block w-1/2 h-full">
                  {selectedTask ? (
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col animate-fade-in">
                          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                              <div className="flex items-center gap-2">
                                  <FileText className="text-teal-600" size={20} />
                                  <h3 className="font-bold text-slate-800">Chi tiết hồ sơ</h3>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={(e) => handleDeleteTask(e, selectedTask.id, selectedTask.title)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={20} /></button>
                                  <button onClick={() => setSelectedTask(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                              </div>
                          </div>
                          <div className="p-6 overflow-y-auto flex-1 space-y-6">
                              <div>
                                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 uppercase">{selectedTask.category}</span>
                                  <h2 className="text-xl font-bold text-slate-800 mt-2">{selectedTask.title}</h2>
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><Building2 size={14} /> {selectedTask.projectName}</p>
                              </div>

                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Phê duyệt trạng thái</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                      {(['Pending', 'In Progress', 'Approved', 'Rejected'] as AcceptanceStatus[]).map(status => (
                                          <button key={status} onClick={() => handleStatusChange(selectedTask.id, status)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedTask.status === status ? getStatusStyle(status) + ' ring-1 ring-current' : 'bg-white border-slate-200 text-slate-500'}`}>
                                              {status}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <div>
                                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                      <FileText size={18} className="text-blue-500" /> Tài liệu đính kèm ({selectedTask.documents.length})
                                  </h4>
                                  {selectedTask.documents.length === 0 ? (
                                      <div className="p-6 border-2 border-dashed border-slate-100 rounded-xl text-center text-slate-400 text-xs">Chưa có minh chứng hồ sơ</div>
                                  ) : (
                                      <div className="space-y-2">
                                          {selectedTask.documents.map((doc, i) => (
                                              <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                                  <div className="flex items-center gap-2">
                                                      <File size={16} className="text-blue-600" />
                                                      <span className="text-xs font-medium truncate max-w-[150px]">{doc.name}</span>
                                                  </div>
                                                  <ExternalLink size={14} className="text-slate-400" />
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>

                              <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl">
                                  <h4 className="text-[10px] font-bold text-yellow-600 uppercase mb-2">Ghi chú kiểm tra</h4>
                                  <p className="text-xs text-slate-600 italic">"{selectedTask.notes || 'Không có ghi chú'}"</p>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                          <ClipboardCheck size={48} className="opacity-10 mb-4" />
                          <p className="text-sm font-medium">Chọn một hạng mục để xem hồ sơ</p>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default QAQCManager;
