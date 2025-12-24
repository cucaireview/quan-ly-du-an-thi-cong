
import { Project, ProjectStatus, Worker, Material, Task, PaymentStage, ProjectDocument, PCCCMaterial, AcceptanceTask } from './types';

// Mock Data Generators
const generateWorkers = (count: number): Worker[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `w-${i + 1}`,
    name: `Công nhân ${i + 1}`,
    role: i % 3 === 0 ? 'Kỹ sư giám sát' : i % 3 === 1 ? 'Thợ nề' : 'Thợ điện',
    status: 'Active',
    avatar: `https://picsum.photos/seed/w${i}/50/50`
  }));
};

const generateMaterials = (): Material[] => [
  { id: 'm-1', name: 'Xi măng PCB40', quantity: 500, unit: 'Bao', status: 'Available', lastUpdated: '2023-10-25' },
  { id: 'm-2', name: 'Thép Pomina', quantity: 2000, unit: 'Kg', status: 'Low Stock', lastUpdated: '2023-10-24' },
  { id: 'm-3', name: 'Cát vàng', quantity: 50, unit: 'm3', status: 'Available', lastUpdated: '2023-10-26' },
  { id: 'm-4', name: 'Gạch ống', quantity: 10000, unit: 'Viên', status: 'Available', lastUpdated: '2023-10-20' },
  { id: 'm-5', name: 'Sơn nước', quantity: 0, unit: 'Thùng', status: 'Out of Stock', lastUpdated: '2023-10-27' },
];

const generateFinancials = (totalBudget: number): PaymentStage[] => [
  {
    id: 'pay-1',
    name: 'Tạm ứng hợp đồng (20%)',
    amount: totalBudget * 0.2,
    dueDate: '2023-11-01',
    status: 'Paid',
    paidDate: '2023-11-02',
    description: 'Thanh toán ngay sau khi ký hợp đồng'
  },
  {
    id: 'pay-2',
    name: 'Thanh toán giai đoạn 1: Xong móng',
    amount: totalBudget * 0.3,
    dueDate: '2023-12-15',
    status: 'Pending',
    description: 'Nghiệm thu phần ngầm và móng'
  },
  {
    id: 'pay-3',
    name: 'Thanh toán giai đoạn 2: Xong thô',
    amount: totalBudget * 0.3,
    dueDate: '2024-03-01',
    status: 'Pending',
    description: 'Hoàn thành kết cấu khung bê tông cốt thép'
  },
  {
    id: 'pay-4',
    name: 'Quyết toán & Bàn giao (20%)',
    amount: totalBudget * 0.2,
    dueDate: '2024-06-30',
    status: 'Pending',
    description: 'Sau khi nghiệm thu đưa vào sử dụng'
  }
];

const generateDocuments = (): ProjectDocument[] => [
  {
    id: 'doc-1',
    name: 'Hợp đồng thi công xây dựng',
    type: 'Contract',
    uploadDate: '2023-10-25',
    status: 'Approved',
    uploadedBy: 'Nguyễn Văn A'
  },
  {
    id: 'doc-2',
    name: 'Giấy phép xây dựng số 123/GPXD',
    type: 'Legal',
    uploadDate: '2023-10-20',
    status: 'Approved',
    uploadedBy: 'Trần Thị Pháp Chế'
  },
  {
    id: 'doc-3',
    name: 'Bản vẽ thiết kế thi công (Kiến trúc)',
    type: 'Design',
    uploadDate: '2023-10-30',
    status: 'Approved',
    uploadedBy: 'KTS. Lê Văn Vẽ'
  },
  {
    id: 'doc-4',
    name: 'Biên bản nghiệm thu phần móng',
    type: 'Handover',
    uploadDate: '2023-12-10',
    status: 'Draft',
    uploadedBy: 'Nguyễn Văn A'
  }
];

const generateTasks = (projectId: string): Task[] => [
  { 
    id: `${projectId}-t1`, 
    name: 'Chuẩn bị mặt bằng', 
    type: 'general', 
    startDate: '2023-11-01', 
    endDate: '2023-11-05', 
    progress: 100, 
    status: ProjectStatus.COMPLETED,
    location: { address: 'Cổng chính công trường, Khu A' },
    images: ['https://images.unsplash.com/photo-1590059591461-9c368d30e525?w=200&h=200&fit=crop']
  },
  { 
    id: `${projectId}-t2`, 
    name: 'Thi công móng', 
    type: 'construction', 
    startDate: '2023-11-06', 
    endDate: '2023-11-20', 
    progress: 85, 
    status: ProjectStatus.IN_PROGRESS,
    location: { address: 'Khu vực móng trụ T1-T4' },
    images: [
      'https://images.unsplash.com/photo-1621905252507-b35a83013b2b?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200&h=200&fit=crop'
    ]
  },
  { id: `${projectId}-t3`, name: 'Đổ bê tông sàn tầng 1', type: 'construction', startDate: '2023-11-21', endDate: '2023-11-25', progress: 0, status: ProjectStatus.PLANNING, dependencies: [`${projectId}-t2`], images: [] },
  { id: `${projectId}-t4`, name: 'Xây tường bao', type: 'construction', startDate: '2023-11-26', endDate: '2023-12-10', progress: 0, status: ProjectStatus.PLANNING, images: [] },
  { id: `${projectId}-t5`, name: 'Lắp đặt điện nước', type: 'electrical', startDate: '2023-12-05', endDate: '2023-12-20', progress: 0, status: ProjectStatus.PLANNING, images: [] },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: 'Khu Đô Thị Xanh - Block A',
    code: 'KDT-001',
    location: 'Quận 9, TP.HCM',
    manager: 'Nguyễn Văn A',
    startDate: '2023-11-01',
    endDate: '2024-06-30',
    budget: 5000000000,
    spent: 1000000000,
    status: ProjectStatus.IN_PROGRESS,
    progress: 24,
    description: 'Xây dựng khu chung cư cao cấp 20 tầng.',
    tasks: generateTasks('p-1'),
    workers: generateWorkers(15),
    materials: generateMaterials(),
    financials: generateFinancials(5000000000),
    documents: generateDocuments()
  },
  {
    id: 'p-2',
    name: 'Biệt thự Ven Sông',
    code: 'BT-052',
    location: 'Đà Nẵng',
    manager: 'Trần Thị B',
    startDate: '2023-10-15',
    endDate: '2024-02-15',
    budget: 2000000000,
    spent: 400000000,
    status: ProjectStatus.DELAYED,
    progress: 80,
    description: 'Biệt thự nghỉ dưỡng cao cấp.',
    tasks: generateTasks('p-2'),
    workers: generateWorkers(8),
    materials: generateMaterials(),
    financials: generateFinancials(2000000000),
    documents: generateDocuments()
  },
  {
    id: 'p-3',
    name: 'Nhà máy Sản Xuất Bao Bì',
    code: 'NM-103',
    location: 'Bình Dương',
    manager: 'Lê Văn C',
    startDate: '2023-09-01',
    endDate: '2024-03-01',
    budget: 15000000000,
    spent: 3000000000,
    status: ProjectStatus.IN_PROGRESS,
    progress: 65,
    description: 'Nhà xưởng khung thép tiền chế.',
    tasks: generateTasks('p-3'),
    workers: generateWorkers(30),
    materials: generateMaterials(),
    financials: generateFinancials(15000000000),
    documents: generateDocuments()
  }
];

// --- PCCC Mock Data ---
export const MOCK_PCCC_MATERIALS: PCCCMaterial[] = [
    {
        id: 'pccc-1',
        name: 'Đầu phun Sprinkler Quay xuống',
        category: 'Sprinkler',
        spec: '68°C, K=5.6, Tyco',
        totalQuantity: 1000,
        availableQuantity: 800,
        minStockLevel: 200,
        unit: 'Cái',
        status: 'Good',
        allocatedTo: [
            { projectId: 'p-1', projectName: 'Khu Đô Thị Xanh - Block A', quantity: 200, status: 'Issued' }
        ]
    },
    {
        id: 'pccc-2',
        name: 'Tủ báo cháy trung tâm',
        category: 'Alarm',
        spec: '10 Loop, Addressable',
        totalQuantity: 5,
        availableQuantity: 1,
        minStockLevel: 2,
        unit: 'Bộ',
        inspectionExpiry: '2023-12-01', // Expired
        status: 'Expired',
        allocatedTo: [
            { projectId: 'p-3', projectName: 'Nhà máy Sản Xuất Bao Bì', quantity: 2, status: 'Installed', installDate: '2023-10-15' },
            { projectId: 'p-1', projectName: 'Khu Đô Thị Xanh - Block A', quantity: 2, status: 'Issued' }
        ]
    },
    {
        id: 'pccc-3',
        name: 'Bình chữa cháy bột ABC',
        category: 'Extinguisher',
        spec: 'MFZ4 4kg',
        totalQuantity: 200,
        availableQuantity: 30,
        minStockLevel: 50,
        unit: 'Bình',
        inspectionExpiry: '2024-05-20',
        status: 'Low Stock',
        allocatedTo: [
            { projectId: 'p-2', projectName: 'Biệt thự Ven Sông', quantity: 20, status: 'Installed' },
            { projectId: 'p-3', projectName: 'Nhà máy Sản Xuất Bao Bì', quantity: 150, status: 'Installed' }
        ]
    },
    {
        id: 'pccc-4',
        name: 'Ống thép đúc PCCC',
        category: 'Pipe',
        spec: 'DN100 Sch40',
        totalQuantity: 500,
        availableQuantity: 450,
        minStockLevel: 100,
        unit: 'Cây (6m)',
        status: 'Good',
        allocatedTo: [
             { projectId: 'p-1', projectName: 'Khu Đô Thị Xanh - Block A', quantity: 50, status: 'Issued' }
        ]
    },
    {
        id: 'pccc-5',
        name: 'Van cổng tín hiệu điện',
        category: 'Valve',
        spec: 'OS&Y DN100',
        totalQuantity: 20,
        availableQuantity: 20,
        minStockLevel: 5,
        unit: 'Cái',
        status: 'Good',
        allocatedTo: []
    }
];

// --- QA/QC Mock Data ---
export const MOCK_QAQC_TASKS: AcceptanceTask[] = [
  {
    id: 'qa-1',
    projectId: 'p-1',
    projectName: 'Khu Đô Thị Xanh - Block A',
    category: 'Hệ thống chữa cháy vách tường',
    title: 'Thử áp lực đường ống cứu hỏa tầng 1-5',
    standardRef: 'TCVN 7336:2021',
    status: 'Approved',
    documents: [
      { name: 'Bien_ban_test_ap_luc_T1-T5.pdf', type: 'PDF', date: '2023-11-20' },
      { name: 'Bieu_do_ap_luc.xlsx', type: 'Excel', date: '2023-11-20' }
    ],
    images: ['https://images.unsplash.com/photo-1581092921461-eab62496096b?w=200'],
    inspector: 'Nguyễn Văn Kiểm',
    checkDate: '2023-11-20'
  },
  {
    id: 'qa-2',
    projectId: 'p-1',
    projectName: 'Khu Đô Thị Xanh - Block A',
    category: 'Hệ thống Sprinkler',
    title: 'Nghiệm thu lắp đặt đầu phun Sprinkler',
    standardRef: 'TCVN 7336:2021',
    status: 'Pending',
    documents: [],
    images: [],
    inspector: 'Chưa phân công'
  },
  {
    id: 'qa-3',
    projectId: 'p-3',
    projectName: 'Nhà máy Sản Xuất Bao Bì',
    category: 'Hệ thống báo cháy tự động',
    title: 'Test liên động hệ thống báo cháy',
    standardRef: 'TCVN 5738:2021',
    status: 'In Progress',
    documents: [
      { name: 'Kich_ban_dien_tap.pdf', type: 'PDF', date: '2023-12-01' }
    ],
    images: [],
    notes: 'Đang chờ đấu nối bơm bù áp'
  },
  {
    id: 'qa-4',
    projectId: 'p-2',
    projectName: 'Biệt thự Ven Sông',
    category: 'Hệ thống chống sét',
    title: 'Đo điện trở tiếp địa hệ thống chống sét',
    standardRef: 'TCVN 9385:2012',
    status: 'Rejected',
    documents: [
       { name: 'Ket_qua_do_lan_1.pdf', type: 'PDF', date: '2023-11-15' }
    ],
    images: [],
    notes: 'Điện trở đo được 12 Ohm > 10 Ohm (Yêu cầu). Cần đóng thêm cọc.',
    inspector: 'Trần Kỹ Thuật'
  }
];
