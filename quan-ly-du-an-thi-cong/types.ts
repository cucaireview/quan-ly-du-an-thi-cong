
export enum ProjectStatus {
  PLANNING = 'Đang lập kế hoạch',
  IN_PROGRESS = 'Đang thi công',
  DELAYED = 'Chậm tiến độ',
  COMPLETED = 'Đã hoàn thành',
  ON_HOLD = 'Tạm dừng'
}

export enum Priority {
  LOW = 'Thấp',
  MEDIUM = 'Trung bình',
  HIGH = 'Cao',
  CRITICAL = 'Khẩn cấp'
}

export type TaskType = 'construction' | 'electrical' | 'plumbing' | 'finishing' | 'inspection' | 'general';

export interface TaskLocation {
  lat?: number;
  lng?: number;
  address?: string;
  mapLink?: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Inactive';
  avatar: string;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  status: ProjectStatus;
  assigneeId?: string;
  dependencies?: string[];
  location?: TaskLocation;
  images?: string[];
}

export interface PaymentStage {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paidDate?: string;
  description?: string;
}

export type DocumentType = 'Legal' | 'Design' | 'Contract' | 'Handover' | 'Invoice';

export interface ProjectDocument {
  id: string;
  name: string;
  type: DocumentType;
  uploadDate: string;
  status: 'Draft' | 'Approved' | 'Completed';
  url?: string;
  uploadedBy: string;
  version?: string;
  notes?: string;
  fileSize?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  location: string; // Đồng bộ với cột 'location' trong DB
  manager: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: ProjectStatus;
  progress: number;
  description: string;
  tasks: Task[];
  workers: Worker[];
  materials: Material[];
  financials: PaymentStage[];
  documents: ProjectDocument[];
}

export interface CalendarNote {
  id: string;
  date: string;
  content: string;
  reminderTime?: string;
  isCompleted: boolean;
}

export type PCCCCategory = 'Pipe' | 'Sprinkler' | 'Valve' | 'Cabinet' | 'Alarm' | 'Extinguisher';

export interface PCCCMaterial {
  id: string;
  name: string;
  category: PCCCCategory;
  spec: string;
  totalQuantity: number;
  availableQuantity: number;
  minStockLevel: number;
  unit: string;
  inspectionExpiry?: string;
  status: 'Good' | 'Low Stock' | 'Expired';
  allocatedTo: {
    projectId: string;
    projectName: string;
    quantity: number;
    status: 'Issued' | 'Installed';
    installDate?: string;
  }[];
}

export type AcceptanceStatus = 'Pending' | 'In Progress' | 'Approved' | 'Rejected';

export interface EvidenceFile {
  name: string;
  type: 'PDF' | 'Image' | 'Excel';
  url?: string;
  date: string;
}

export interface AcceptanceTask {
  id: string;
  projectId: string;
  projectName: string;
  category: string;
  title: string; 
  standardRef: string;
  status: AcceptanceStatus;
  documents: EvidenceFile[];
  images: string[];
  inspector?: string;
  notes?: string;
  checkDate?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  timestamp: string;
  projectId?: string;
}
