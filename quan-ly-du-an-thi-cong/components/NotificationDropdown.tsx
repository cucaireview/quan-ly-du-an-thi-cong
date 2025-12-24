import React from 'react';
import { Notification } from '../types';
import { AlertCircle, Clock, Info, CheckCircle, X } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (projectId?: string) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onNotificationClick }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle size={16} className="text-red-500" />;
      case 'warning': return <Clock size={16} className="text-yellow-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
     switch (type) {
      case 'critical': return 'bg-red-50';
      case 'warning': return 'bg-yellow-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in w-80 md:w-96 max-h-[80vh] flex flex-col">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h3 className="font-semibold text-slate-800">Thông báo</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Không có thông báo mới</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id}
              onClick={() => onNotificationClick(notif.projectId)}
              className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 flex gap-3 items-start border border-transparent hover:border-slate-200 relative group`}
            >
              <div className={`mt-0.5 p-1.5 rounded-full ${getBgColor(notif.type)} flex-shrink-0`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 mb-0.5">{notif.title}</p>
                <p className="text-xs text-slate-500 leading-snug">{notif.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.timestamp).toLocaleDateString('vi-VN')} {new Date(notif.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;