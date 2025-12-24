import React, { useState } from 'react';
import { Project, Task, ProjectStatus, CalendarNote } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Plus, Bell, Trash2, X, Clock, StickyNote } from 'lucide-react';

interface CalendarViewProps {
  projects: Project[];
  notes: CalendarNote[];
  onTaskClick?: (task: Task, project: Project) => void;
  onAddNote: (note: CalendarNote) => void;
  onDeleteNote: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ projects, notes, onTaskClick, onAddNote, onDeleteNote }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterProject, setFilterProject] = useState<string>('ALL');
  
  // Day Detail Modal State
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    // 0 = Sunday, 1 = Monday, ...
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convert to Monday start (0 = Monday, 6 = Sunday)
    return day === 0 ? 6 : day - 1;
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTaskColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
      case ProjectStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200';
      case ProjectStatus.DELAYED: return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
    }
  };

  // Prepare data
  const daysInMonth = getDaysInMonth(currentDate);
  const startDay = getFirstDayOfMonth(currentDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayKey = formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  // Flatten tasks from projects
  const allTasks = projects.flatMap(p => 
    p.tasks.map(t => ({ ...t, projectCode: p.code, projectName: p.name, project: p }))
  ).filter(t => filterProject === 'ALL' || t.project.id === filterProject);

  const handleAddNoteSubmit = () => {
      if (!selectedDay || !newNoteContent.trim()) return;

      const newNote: CalendarNote = {
          id: `note-${Date.now()}`,
          date: selectedDay,
          content: newNoteContent,
          isCompleted: false,
          reminderTime: reminderTime ? `${selectedDay}T${reminderTime}:00` : undefined
      };

      onAddNote(newNote);
      setNewNoteContent('');
      setReminderTime('');
  };

  // Get data for selected Day Modal
  const getSelectedDayData = () => {
      if (!selectedDay) return { tasks: [], dayNotes: [] };
      
      const tasks = allTasks.filter(task => {
          return selectedDay >= task.startDate && selectedDay <= task.endDate;
      });

      const dayNotes = notes.filter(n => n.date === selectedDay);

      return { tasks, dayNotes };
  };

  const renderCalendarDays = () => {
    const days = [];
    // Padding for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`pad-${i}`} className="bg-slate-50/50 min-h-[120px] border-b border-r border-slate-100"></div>);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const isToday = dateKey === todayKey;

      // Find tasks active on this day
      const dayTasks = allTasks.filter(task => {
        const start = task.startDate; // YYYY-MM-DD
        const end = task.endDate;
        return dateKey >= start && dateKey <= end;
      });

      // Find notes for this day
      const dayNotes = notes.filter(n => n.date === dateKey);

      // Sort logic: Tasks starting today first
      dayTasks.sort((a, b) => {
          if (a.startDate === dateKey && b.startDate !== dateKey) return -1;
          if (a.startDate !== dateKey && b.startDate === dateKey) return 1;
          return 0;
      });

      days.push(
        <div 
            key={day} 
            onClick={() => setSelectedDay(dateKey)}
            className={`min-h-[120px] border-b border-r border-slate-100 p-2 transition-colors hover:bg-slate-50 relative group cursor-pointer ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
              {day}
            </span>
            <div className="flex gap-1">
                {dayNotes.length > 0 && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded flex items-center">
                        <StickyNote size={8} className="mr-0.5" /> {dayNotes.length}
                    </span>
                )}
                {dayTasks.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">{dayTasks.length} việc</span>
                )}
            </div>
          </div>
          
          <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
            {dayNotes.slice(0, 2).map(note => (
                 <div key={note.id} className="text-[10px] px-1.5 py-0.5 rounded border border-yellow-200 bg-yellow-50 text-yellow-800 truncate flex items-center gap-1">
                     {note.reminderTime && <Bell size={8} />} {note.content}
                 </div>
            ))}
            {dayTasks.map((task, idx) => {
               const isStart = task.startDate === dateKey;
               const isEnd = task.endDate === dateKey;
               
               return (
                  <div 
                    key={`${task.id}-${day}`}
                    className={`text-[10px] px-1.5 py-0.5 rounded border truncate transition-all ${getTaskColor(task.status)} ${!isStart && !isEnd ? 'opacity-70' : ''}`}
                    title={`${task.name} (${task.projectName})`}
                  >
                    {isStart && <span className="font-bold mr-1">•</span>}
                    {task.projectCode}: {task.name}
                  </div>
               );
            })}
          </div>
        </div>
      );
    }
    
    // Fill remaining grid
    const totalCells = days.length;
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7 && remaining > 0) {
        for (let i = 0; i < remaining; i++) {
            days.push(<div key={`pad-end-${i}`} className="bg-slate-50/50 min-h-[120px] border-b border-r border-slate-100"></div>);
        }
    }

    return days;
  };

  const { tasks: selectedDayTasks, dayNotes: selectedDayNotes } = getSelectedDayData();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 animate-fade-in flex flex-col h-[calc(100vh-140px)] relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
             <button onClick={prevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600">
                <ChevronLeft size={20} />
             </button>
             <button onClick={goToToday} className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-900">
                Hôm nay
             </button>
             <button onClick={nextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-600">
                <ChevronRight size={20} />
             </button>
          </div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <CalendarIcon className="text-blue-600" size={24} />
             Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
          </h2>
        </div>

        <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <Filter size={14} className="text-slate-400" />
                <select 
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="bg-transparent text-sm text-slate-600 outline-none border-none cursor-pointer min-w-[150px]"
                >
                    <option value="ALL">Tất cả dự án</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                </select>
             </div>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map(day => (
          <div key={day} className="py-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto bg-slate-100 gap-px border-l border-slate-200">
         {renderCalendarDays()}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <div>
                       <h3 className="font-bold text-lg text-slate-800">
                           {new Date(selectedDay).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                       </h3>
                   </div>
                   <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600">
                       <X size={20} />
                   </button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-6">
                   {/* Notes Section */}
                   <div className="space-y-3">
                       <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                           <StickyNote size={16} className="text-yellow-500" /> Ghi chú & Nhắc nhở
                       </h4>
                       
                       {selectedDayNotes.length === 0 ? (
                           <p className="text-sm text-slate-400 italic">Chưa có ghi chú nào.</p>
                       ) : (
                           selectedDayNotes.map(note => (
                               <div key={note.id} className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex justify-between items-start group">
                                   <div>
                                       <p className="text-sm text-slate-800">{note.content}</p>
                                       {note.reminderTime && (
                                           <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                                               <Bell size={10} /> 
                                               {new Date(note.reminderTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                           </p>
                                       )}
                                   </div>
                                   <button 
                                        onClick={() => onDeleteNote(note.id)}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                   >
                                       <Trash2 size={14} />
                                   </button>
                               </div>
                           ))
                       )}

                       {/* Add Note Form */}
                       <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
                           <textarea 
                               placeholder="Viết ghi chú mới..."
                               value={newNoteContent}
                               onChange={(e) => setNewNoteContent(e.target.value)}
                               className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                               rows={2}
                           />
                           <div className="flex items-center gap-2">
                               <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                                   <Clock size={14} className="text-slate-400"/>
                                   <input 
                                        type="time" 
                                        value={reminderTime}
                                        onChange={(e) => setReminderTime(e.target.value)}
                                        className="bg-transparent text-sm outline-none w-24"
                                   />
                               </div>
                               <button 
                                    onClick={handleAddNoteSubmit}
                                    disabled={!newNoteContent.trim()}
                                    className="ml-auto bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                               >
                                   <Plus size={14} /> Thêm
                               </button>
                           </div>
                       </div>
                   </div>

                   {/* Tasks Section */}
                   <div>
                       <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                           <CalendarIcon size={16} className="text-blue-500" /> Công việc trong ngày ({selectedDayTasks.length})
                       </h4>
                       <div className="space-y-2">
                           {selectedDayTasks.length === 0 ? (
                               <p className="text-sm text-slate-400 italic">Không có công việc nào.</p>
                           ) : (
                               selectedDayTasks.map(task => (
                                   <div 
                                        key={task.id} 
                                        onClick={() => {
                                            if (onTaskClick) onTaskClick(task, task.project);
                                            setSelectedDay(null);
                                        }}
                                        className="p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm cursor-pointer transition-all"
                                   >
                                       <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTaskColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">{task.projectCode}</span>
                                       </div>
                                       <h5 className="font-medium text-slate-800 text-sm mb-1">{task.name}</h5>
                                       <p className="text-xs text-slate-500 truncate">{task.projectName}</p>
                                   </div>
                               ))
                           )}
                       </div>
                   </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;