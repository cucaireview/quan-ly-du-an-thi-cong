
import React from 'react';
import { Task, ProjectStatus, TaskType } from '../types';
import { Calendar, BrickWall, Zap, Droplet, PaintBucket, ClipboardList, Hammer, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface TimelineProps {
  tasks: Task[];
}

const Timeline: React.FC<TimelineProps> = ({ tasks }) => {
  // Sort tasks by start date
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Helper to format date
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
        case 'construction': return <BrickWall size={16} />;
        case 'electrical': return <Zap size={16} />;
        case 'plumbing': return <Droplet size={16} />;
        case 'finishing': return <PaintBucket size={16} />;
        case 'inspection': return <ClipboardList size={16} />;
        default: return <Hammer size={16} />;
    }
  };

  const getStatusInfo = (status: ProjectStatus, progress: number) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    switch (status) {
      case ProjectStatus.COMPLETED: 
        return { color: 'bg-green-500', text: 'text-green-600', icon: <CheckCircle2 size={12} />, bg: 'bg-green-50' };
      case ProjectStatus.DELAYED: 
        return { color: 'bg-red-500', text: 'text-red-600', icon: <AlertCircle size={12} />, bg: 'bg-red-50' };
      case ProjectStatus.IN_PROGRESS: 
        return { color: 'bg-blue-500', text: 'text-blue-600', icon: <Clock size={12} />, bg: 'bg-blue-50' };
      default: 
        return { color: 'bg-slate-300', text: 'text-slate-500', icon: <Calendar size={12} />, bg: 'bg-slate-50' };
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Lộ trình thi công chi tiết
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Danh sách các hạng mục sắp xếp theo thời gian</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Xong
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Đang làm
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-slate-300"></span> Kế hoạch
          </div>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {sortedTasks.length === 0 ? (
          <div className="py-10 text-center text-slate-400 italic text-sm">Chưa có hạng mục thi công nào được lập lịch.</div>
        ) : (
          sortedTasks.map((task) => {
            const statusInfo = getStatusInfo(task.status, task.progress);
            return (
              <div key={task.id} className="relative pl-12 group">
                {/* Timeline Dot with Icon */}
                <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl border-2 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${statusInfo.bg} ${statusInfo.text}`}>
                  {getTaskIcon(task.type)}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{task.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.icon} {task.status}
                      </span>
                      <span className="text-slate-400 text-[10px] font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {formatDate(task.startDate)} — {formatDate(task.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-700">{task.progress}%</span>
                  </div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${statusInfo.color} transition-all duration-700 ease-out`} 
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Timeline;
