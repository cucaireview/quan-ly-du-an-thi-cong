import { Project, ProjectStatus, Notification, CalendarNote } from '../types';

export const generateNotifications = (projects: Project[], notes: CalendarNote[] = []): Notification[] => {
  const notifications: Notification[] = [];
  const now = new Date();
  
  // Helper to check same day
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // 1. Critical Project Issues (Status based)
  projects.forEach(project => {
    if (project.status === ProjectStatus.DELAYED) {
      notifications.push({
        id: `proj-delayed-${project.id}`,
        title: 'Cảnh báo dự án',
        message: `Dự án "${project.name}" đang ở trạng thái chậm tiến độ.`,
        type: 'critical',
        timestamp: now.toISOString(),
        projectId: project.id
      });
    }

    // 2. Task Deadlines
    project.tasks.forEach(task => {
        if (task.status === ProjectStatus.COMPLETED) return;

        const endDate = new Date(task.endDate);
        // Reset time part for accurate day diff
        const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endZero = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        const diffTime = endZero.getTime() - todayZero.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            notifications.push({
                id: `task-overdue-${task.id}`,
                title: 'Công việc quá hạn',
                message: `Hạng mục "${task.name}" (Dự án: ${project.name}) đã quá hạn ${Math.abs(diffDays)} ngày.`,
                type: 'critical',
                timestamp: now.toISOString(),
                projectId: project.id
            });
        } else if (diffDays <= 3 && diffDays >= 0) {
             notifications.push({
                id: `task-soon-${task.id}`,
                title: 'Sắp đến hạn',
                message: `Hạng mục "${task.name}" (Dự án: ${project.name}) sẽ hết hạn trong ${diffDays === 0 ? 'hôm nay' : diffDays + ' ngày nữa'}.`,
                type: 'warning',
                timestamp: now.toISOString(),
                projectId: project.id
            });
        }
    });
  });

  // 3. Calendar Note Reminders
  notes.forEach(note => {
      if (note.reminderTime && !note.isCompleted) {
          const reminderDate = new Date(note.reminderTime);
          const diffMs = reminderDate.getTime() - now.getTime();
          
          // Check if reminder is today or past due but not completed
          if (isSameDay(reminderDate, now) || diffMs < 0) {
               notifications.push({
                  id: `note-reminder-${note.id}`,
                  title: 'Nhắc hẹn ghi chú',
                  message: `Bạn có nhắc nhở: "${note.content}" vào lúc ${reminderDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`,
                  type: 'info',
                  timestamp: note.reminderTime
              });
          }
      }
  });

  // Sort: Critical first, then by date
  return notifications.sort((a, b) => {
      if (a.type === 'critical' && b.type !== 'critical') return -1;
      if (a.type !== 'critical' && b.type === 'critical') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};