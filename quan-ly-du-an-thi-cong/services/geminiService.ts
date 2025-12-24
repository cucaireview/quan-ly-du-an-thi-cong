import { GoogleGenerativeAI } from "@google/generative-ai";
import { Project, PCCCMaterial, AcceptanceTask } from "../types";

// Khởi tạo SDK với biến môi trường chuẩn Vite
// Biến này phải được thêm vào Vercel Settings > Environment Variables
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const analyzeProjectRisks = async (project: Project): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "Lỗi: Vui lòng cấu hình VITE_GEMINI_API_KEY trên Vercel để sử dụng tính năng này.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const paidStages = project.financials.filter(f => f.status === 'Paid').length;
    const overdueStages = project.financials.filter(f => f.status === 'Overdue').length;
    const missingDocs = project.documents.filter(d => d.status === 'Draft').map(d => d.name).join(', ');

    const prompt = `
      Bạn là một chuyên gia quản lý dự án xây dựng. Hãy phân tích dữ liệu dự án sau và báo cáo ngắn gọn bằng Tiếng Việt (< 300 từ).
      
      Thông tin:
      - Tên dự án: ${project.name}
      - Trạng thái: ${project.status} | Tiến độ: ${project.progress}%
      - Tài chính: Đã thanh toán ${paidStages} đợt. Quá hạn: ${overdueStages}. Ngân sách: ${project.budget.toLocaleString()} VNĐ.
      - Hồ sơ thiếu: ${missingDocs || 'Không có'}.
      - Vật tư: ${JSON.stringify(project.materials.map(m => ({name: m.name, status: m.status})))}

      Yêu cầu:
      1. Đánh giá chung dòng tiền & pháp lý.
      2. Chỉ ra rủi ro tiềm ẩn.
      3. Đề xuất 2-3 hành động cụ thể.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Không thể tạo phân tích.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lỗi kết nối AI Assistant. Vui lòng kiểm tra lại cấu hình API Key.";
  }
};

export const suggestTasks = async (projectDescription: string): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) return "Cần API Key để gợi ý công việc.";
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Dựa trên mô tả: "${projectDescription}", hãy liệt kê 5 hạng mục công việc quan trọng nhất theo trình tự thời gian (gạch đầu dòng).`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        return "Lỗi khi lấy gợi ý từ AI.";
    }
}

export const chatWithAI = async (message: string, context?: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) return "Vui lòng cấu hình API_KEY.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `${context ? 'Bối cảnh: ' + context : ''}\nNgười dùng hỏi: ${message}\nTrả lời ngắn gọn, chuyên nghiệp:`;
    
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    return "Sự cố kết nối AI. Thử lại sau.";
  }
};

export const analyzePCCCStock = async (materials: PCCCMaterial[]): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) return "Thiếu cấu hình API.";

  try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Phân tích kho PCCC: ${JSON.stringify(materials.map(m => ({
          name: m.name, available: m.availableQuantity, min: m.minStockLevel, expiry: m.inspectionExpiry
      })))}. Đưa ra cảnh báo về thiếu hụt và hạn kiểm định.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
  } catch (error) {
      return "Lỗi phân tích kho.";
  }
}

export const analyzeQAQC = async (tasks: AcceptanceTask[]): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) return "Cần API Key cho QA/QC.";

  try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Rà soát hồ sơ nghiệm thu PCCC: ${JSON.stringify(tasks.map(t => ({
          title: t.title, status: t.status, docCount: t.documents.length
      })))}. Cảnh báo thiếu hồ sơ và đánh giá độ sẵn sàng.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
  } catch (error) {
      return "Lỗi phân tích QA/QC.";
  }
}