
import { Project } from "../types";

export const exportProjectsToExcel = (projects: Project[]) => {
  // 1. Define Headers in Vietnamese (Matching the user request)
  const headers = [
    "Mã Dự Án",
    "Tên Dự Án",
    "Quản Lý",
    "Địa Điểm",
    "Ngày Bắt Đầu",
    "Ngày Kết Thúc",
    "Trạng Thái",
    "Tiến Độ (%)",
    "Ngân Sách (VNĐ)",
    "Đã Chi (VNĐ)",
    "Số Lượng Công Việc",
    "Số Lượng Nhân Công",
    "Số Lượng Vật Tư",
    "Hồ Sơ Đã Duyệt",
    "Mô Tả Chi Tiết"
  ];

  // 2. Map data to rows
  const rows = projects.map(p => {
    // Count approved documents (Approved or Completed)
    const approvedDocs = p.documents.filter(d => d.status === 'Approved' || d.status === 'Completed').length;

    return [
      p.code,
      p.name,
      p.manager,
      // Fix: Changed p.address back to p.location to match Project type definition
      p.location,
      new Date(p.startDate).toLocaleDateString('vi-VN'),
      new Date(p.endDate).toLocaleDateString('vi-VN'),
      p.status,
      p.progress + "%",
      p.budget,
      p.spent,
      p.tasks.length,
      p.workers.length,
      p.materials.length,
      approvedDocs,
      p.description
    ];
  });

  // 3. Convert to CSV string
  // Helper to escape special characters and wrap in quotes if needed
  const escapeCsv = (field: any) => {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    // Escape quotes and wrap in quotes if containing comma, quote or newline
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const generateCSV = (headers: string[], rows: any[][]) => {
      return [
        headers.map(escapeCsv).join(','),
        ...rows.map(row => row.map(escapeCsv).join(','))
      ].join('\n');
  };

  const csvContent = generateCSV(headers, rows);

  // 4. Create Blob with BOM for UTF-8 (Crucial for Vietnamese support in Excel)
  const BOM = "\uFEFF"; 
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // 5. Trigger Download
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Danh_Sach_Du_An_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportProjectDetailsToExcel = (project: Project) => {
    // Defines Headers for the detailed Task list
    const headers = [
        "Mã Hạng Mục",
        "Tên Hạng Mục",
        "Loại Công Việc",
        "Ngày Bắt Đầu",
        "Ngày Kết Thúc",
        "Tiến Độ (%)",
        "Trạng Thái",
        "Vị Trí Thi Công"
    ];

    const rows = project.tasks.map(t => [
        t.id,
        t.name,
        t.type,
        new Date(t.startDate).toLocaleDateString('vi-VN'),
        new Date(t.endDate).toLocaleDateString('vi-VN'),
        t.progress + "%",
        t.status,
        t.location?.address || ''
    ]);

    const escapeCsv = (field: any) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    const csvContent = [
        headers.map(escapeCsv).join(','),
        ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const BOM = "\uFEFF"; 
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        // Clean filename from project code
        const safeCode = project.code.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute("download", `Chi_Tiet_${safeCode}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
