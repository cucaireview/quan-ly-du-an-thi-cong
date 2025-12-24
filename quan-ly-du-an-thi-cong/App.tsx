
import React, { useState, useEffect } from 'react';
import { Project, Notification, ProjectStatus, CalendarNote, PCCCMaterial, AcceptanceTask } from './types';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import NotificationDropdown from './components/NotificationDropdown';
import ProjectForm from './components/ProjectForm';
import Login from './components/Login';
import CalendarView from './components/CalendarView';
import PCCCWarehouse from './components/PCCCWarehouse';
import QAQCManager from './components/QAQCManager';
import Chatbot from './components/Chatbot';
import { dbService } from './services/dbService';
import { generateNotifications } from './services/notificationService';
import { exportProjectsToExcel } from './services/exportService';
import { LayoutDashboard, Briefcase, Settings, Bell, Search, Menu, Plus, Filter, FileSpreadsheet, Calendar as CalendarIcon, ShieldAlert, ClipboardCheck, Database, Trash2, X, AlertTriangle, Clock, MapPin, User } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [pcccMaterials, setPcccMaterials] = useState<PCCCMaterial[]>([]);
  const [qaqcTasks, setQaqcTasks] = useState<AcceptanceTask[]>([]);
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'detail' | 'calendar' | 'pccc' | 'qaqc'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Initialize Backend
  useEffect(() => {
    const initBackend = async () => {
      try {
        await dbService.init();
        const [proj, materials, tasks] = await Promise.all([
          dbService.getAll<Project>('projects'),
          dbService.getAll<PCCCMaterial>('pccc_materials'),
          dbService.getAll<AcceptanceTask>('qaqc_tasks')
        ]);
        setProjects(proj);
        setPcccMaterials(materials);
        setQaqcTasks(tasks);
        setIsDbReady(true);
      } catch (err) {
        console.error("Failed to initialize database", err);
      }
    };
    initBackend();
  }, []);

  useEffect(() => {
    if (isDbReady) {
      setNotifications(generateNotifications(projects, calendarNotes));
    }
  }, [projects, calendarNotes, isDbReady]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('detail');
    setIsSidebarOpen(false);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setCurrentView('projects');
  };

  const getStatusBadgeClass = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
      case ProjectStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
      case ProjectStatus.DELAYED: return 'bg-red-100 text-red-700 border-red-200';
      case ProjectStatus.ON_HOLD: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getProgressBarClass = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED: return 'bg-green-500';
      case ProjectStatus.DELAYED: return 'bg-red-500';
      case ProjectStatus.ON_HOLD: return 'bg-amber-500';
      default: return 'bg-blue-600';
    }
  };

  // --- Persistence Handlers ---

  const handleSaveProject = async (project: Project) => {
    await dbService.save('projects', project);
    const updated = await dbService.getAll<Project>('projects');
    setProjects(updated);
    if (selectedProject?.id === project.id) setSelectedProject(project);
    setIsProjectFormOpen(false);
  };

  const handleDirectUpdateProject = async (updatedProject: Project) => {
    await dbService.save('projects', updatedProject);
    const updated = await dbService.getAll<Project>('projects');
    setProjects(updated);
    setSelectedProject(updatedProject);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await dbService.delete('projects', projectToDelete.id);
      const updated = await dbService.getAll<Project>('projects');
      setProjects(updated);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  const handleConfirmDelete = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const handleUpdatePCCCMaterial = async (updatedMaterial: PCCCMaterial) => {
    await dbService.save('pccc_materials', updatedMaterial);
    setPcccMaterials(await dbService.getAll<PCCCMaterial>('pccc_materials'));
  };

  const handleAddPCCCMaterial = async (newMaterial: PCCCMaterial) => {
    await dbService.save('pccc_materials', newMaterial);
    setPcccMaterials(await dbService.getAll<PCCCMaterial>('pccc_materials'));
  };

  const handleDeletePCCCMaterial = async (id: string) => {
    await dbService.delete('pccc_materials', id);
    setPcccMaterials(await dbService.getAll<PCCCMaterial>('pccc_materials'));
  };

  const handleUpdateQAQCTask = async (updatedTask: AcceptanceTask) => {
    await dbService.save('qaqc_tasks', updatedTask);
    setQaqcTasks(await dbService.getAll<AcceptanceTask>('qaqc_tasks'));
  };

  const handleAddQAQCTask = async (newTask: AcceptanceTask) => {
    await dbService.save('qaqc_tasks', newTask);
    setQaqcTasks(await dbService.getAll<AcceptanceTask>('qaqc_tasks'));
  };

  const handleDeleteQAQCTask = async (id: string) => {
    await dbService.delete('qaqc_tasks', id);
    setQaqcTasks(await dbService.getAll<AcceptanceTask>('qaqc_tasks'));
  };

  const NavItem = ({ view, icon: Icon, label }: { view: any, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setSelectedProject(null);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
        currentView === view && !selectedProject
          ? 'bg-slate-800 text-white' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  if (!isDbReady) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <Database size={48} className="animate-bounce text-blue-500 mb-4" />
        <p className="text-lg font-medium">Đang khởi tạo cơ sở dữ liệu...</p>
      </div>
    );
  }

  const filteredProjects = projects.filter(p => filterStatus === 'ALL' || p.status === filterStatus);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">Q</div>
            <span className="font-bold text-lg tracking-tight">Quản Lý Thi Công</span>
        </div>
        
        <div className="p-4 space-y-2">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Tổng quan" />
          <NavItem view="projects" icon={Briefcase} label="Dự án" />
          <NavItem view="calendar" icon={CalendarIcon} label="Lịch thi công" />
          <NavItem view="pccc" icon={ShieldAlert} label="Kho PCCC" />
          <NavItem view="qaqc" icon={ClipboardCheck} label="Nghiệm thu PCCC" />
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
            <div className="flex items-center gap-2 px-4 py-2 text-[10px] text-green-500 font-bold uppercase tracking-widest">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                DB Connected
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white text-sm font-medium">
                <Settings size={18} />
                Cài đặt
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800">
                    <Menu size={24} />
                </button>
                <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg w-64">
                    <Search size={16} className="text-slate-400" />
                    <input type="text" placeholder="Tìm kiếm dự án..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400" />
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative text-slate-500 hover:text-slate-800 focus:outline-none">
                        <Bell size={20} />
                        {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 z-50">
                            <NotificationDropdown notifications={notifications} onClose={() => setIsNotificationsOpen(false)} onNotificationClick={(pid) => pid && handleProjectClick(projects.find(p => p.id === pid)!)} />
                        </div>
                    )}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                     <img src="https://picsum.photos/id/64/100/100" alt="Admin" />
                </div>
            </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentView === 'dashboard' && <Dashboard projects={projects} />}

          {currentView === 'projects' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">Danh sách dự án</h2>
                    <p className="text-sm text-slate-500">Theo dõi tiến độ và tình thái các công trình đang thực hiện</p>
                 </div>
                 <button onClick={() => setIsProjectFormOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
                    <Plus size={16} /> Thêm dự án
                 </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredProjects.map(p => (
                   <div key={p.id} onClick={() => handleProjectClick(p)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all relative group overflow-hidden">
                      {/* Status Background Accent */}
                      <div className={`absolute top-0 left-0 w-full h-1 ${getProgressBarClass(p.status)} opacity-50`}></div>
                      
                      <button 
                        onClick={(e) => handleConfirmDelete(e, p)}
                        className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                        title="Xóa dự án"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="flex justify-between items-start mb-4 pr-8">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">{p.code}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(p.status)}`}>
                          {p.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-800 text-lg mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                           <MapPin size={14} className="text-slate-400" />
                           <span className="truncate">{p.location}</span>
                        </div>
                        
                        <div className="pt-2">
                          <div className="flex justify-between items-end mb-2">
                             <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Tiến độ</span>
                             </div>
                             <span className={`text-sm font-black ${p.status === ProjectStatus.DELAYED ? 'text-red-600' : 'text-blue-600'}`}>{p.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-50">
                             <div 
                               className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getProgressBarClass(p.status)}`} 
                               style={{ width: `${p.progress}%` }}
                             ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Clock size={14} />
                                <span>Hạn: {new Date(p.endDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                                <User size={14} className="text-blue-500" />
                                <span>{p.manager.split(' ').pop()}</span>
                            </div>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {currentView === 'calendar' && (
            <CalendarView projects={projects} notes={calendarNotes} onAddNote={n => setCalendarNotes([...calendarNotes, n])} onDeleteNote={id => setCalendarNotes(calendarNotes.filter(n => n.id !== id))} onTaskClick={(t, p) => handleProjectClick(p)} />
          )}

          {currentView === 'pccc' && (
            <PCCCWarehouse materials={pcccMaterials} onUpdateMaterial={handleUpdatePCCCMaterial} onAddMaterial={handleAddPCCCMaterial} onDeleteMaterial={handleDeletePCCCMaterial} />
          )}

          {currentView === 'qaqc' && (
            <QAQCManager tasks={qaqcTasks} projects={projects} onUpdateTask={handleUpdateQAQCTask} onAddTask={handleAddQAQCTask} onDeleteTask={handleDeleteQAQCTask} />
          )}

          {currentView === 'detail' && selectedProject && (
            <ProjectDetail project={selectedProject} onBack={handleBackToProjects} onEdit={p => {setEditingProject(p); setIsProjectFormOpen(true);}} onUpdateProject={handleDirectUpdateProject} />
          )}
        </div>
        
        <Chatbot currentProject={selectedProject} allProjects={projects} />
      </main>

      <ProjectForm isOpen={isProjectFormOpen} onClose={() => setIsProjectFormOpen(false)} onSave={handleSaveProject} initialData={editingProject} />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Xác nhận xóa dự án</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Bạn có chắc chắn muốn xóa dự án này?<br/>
                <span className="font-semibold text-slate-700">"{projectToDelete?.name}"</span><br/>
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleDeleteProject}
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
