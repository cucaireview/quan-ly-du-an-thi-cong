
import { GoogleGenAI } from "@google/genai";
import { Project, PCCCMaterial, AcceptanceTask } from "../types";

// Always use import.meta.env.VITE_GEMINI_API_KEY directly in the constructor.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const analyzeProjectRisks = async (project: Project): Promise<string> => {
  // Check for API key availability.
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "Vui lòng cấu hình API_KEY để sử dụng tính năng phân tích AI.";
  }

  try {
    // Summarize financials for the prompt
    const paidStages = project.financials.filter(f => f.status === 'Paid').length;
    const overdueStages = project.financials.filter(f => f.status === 'Overdue').length;
    
    // Summarize documents
    const missingDocs = project.documents.filter(d => d.status === 'Draft').map(d => d.name).join(', ');

    const prompt = `
      Bạn là một chuyên gia quản lý dự án xây dựng. Hãy phân tích dữ liệu dự án sau đây và đưa ra báo cáo ngắn gọn bằng Tiếng Việt (dưới 300 từ).
      
      Thông tin dự án:
      - Tên: ${project.name}
      - Trạng thái: ${project.status}
      - Tiến độ: ${project.progress}%
      - Tài chính: Đã thanh toán ${paidStages} đợt. Số đợt quá hạn: ${overdueStages}. Tổng ngân sách: ${project.budget.toLocaleString()}.
      - Hồ sơ: Có ${project.documents.length} hồ sơ. Các hồ sơ đang ở trạng thái nháp (chưa hoàn thành): ${missingDocs || 'Không có'}.
      - Số lượng công việc: ${project.tasks.length}
      - Tình trạng vật tư: ${JSON.stringify(project.materials.map(m => ({name: m.name, status: m.status})))}

      Yêu cầu:
      1. Đánh giá tình hình chung (bao gồm cả dòng tiền và pháp lý hồ sơ).
      2. Chỉ ra các rủi ro tiềm ẩn (về tài chính, tiến độ, hồ sơ hoặc vật tư).
      3. Đề xuất 2-3 hành động cụ thể cho người quản lý.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Không thể tạo phân tích vào lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI Assistant. Vui lòng thử lại sau.";
  }
};

export const suggestTasks = async (projectDescription: string): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) return "Cần API Key để gợi ý công việc.";
    
    try {
        const prompt = `
          Dựa trên mô tả dự án xây dựng sau: "${projectDescription}".
          Hãy liệt kê 5 hạng mục công việc quan trọng nhất cần thực hiện theo trình tự thời gian.
          Trả về kết quả dưới dạng danh sách gạch đầu dòng ngắn gọn.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        
        return response.text || "Không có gợi ý.";
    } catch (error) {
        return "Lỗi khi lấy gợi ý.";
    }
}

export const chatWithAI = async (message: string, context?: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) return "Vui lòng cấu hình API_KEY để chat với AI.";

  try {
    let fullPrompt = "";
    if (context) {
      fullPrompt += `
      [Thông tin bối cảnh dự án hiện tại mà người dùng đang xem:
      ${context}]
      `;
    }

    fullPrompt += `
      Bạn là trợ lý ảo AI chuyên về xây dựng và quản lý dự án. 
      Hãy trả lời câu hỏi của người dùng một cách ngắn gọn, chuyên nghiệp và hữu ích.
      Nếu có thông tin bối cảnh ở trên, hãy sử dụng nó để trả lời cụ thể hơn.
      
      Người dùng: "${message}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
    });

    return response.text || "Xin lỗi, tôi không hiểu câu hỏi.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Đang gặp sự cố kết nối. Vui lòng thử lại.";
  }
};

export const searchLocation = async (query: string): Promise<{ text: string, mapLink?: string }> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) return { text: "Chưa cấu hình API Key. Không thể tìm địa điểm." };
  
  try {
     const response = await ai.models.generateContent({
        // Maps grounding requires 2.5 series model.
        model: 'gemini-2.5-flash',
        contents: `Find the exact address and location for: "${query}".`,
        config: { 
            tools: [{ googleMaps: {} }] 
        }
     });
     
     const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
     let link = undefined;
     
     if (chunks) {
        for (const c of chunks) {
            // Check for maps grounding chunk
            if ((c as any).maps?.uri) {
                link = (c as any).maps.uri;
                break;
            }
        }
     }
     
     // Fallback link creation
     if (!link) {
         link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
     }

     return { 
         text: response.text || query, 
         mapLink: link 
     };
  } catch (e) {
     console.error("Map Search Error", e);
     return { text: "Không tìm thấy địa điểm này.", mapLink: undefined };
  }
};

export const analyzePCCCStock = async (materials: PCCCMaterial[]): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) return "Cần API Key để phân tích.";

  try {
      const prompt = `
        Bạn là chuyên gia quản lý kho vật tư thiết bị PCCC (Phòng Cháy Chữa Cháy). Hãy phân tích dữ liệu tồn kho sau và đưa ra cảnh báo.
        
        Dữ liệu kho:
        ${JSON.stringify(materials.map(m => ({
            name: m.name,
            available: m.availableQuantity,
            minStock: m.minStockLevel,
            expiry: m.inspectionExpiry,
            allocatedTo: m.allocatedTo.map(a => `${a.quantity} cho ${a.projectName} (${a.status})`).join(', ')
        })))}

        Yêu cầu phân tích:
        1. **Dự báo thiếu hụt**: Dựa trên tồn kho khả dụng (available) so với định mức tối thiểu (minStock). Cảnh báo các vật tư sắp hết.
        2. **Cảnh báo thiết bị**: Kiểm tra hạn kiểm định (expiry) so với hiện tại (${new Date().toISOString().split('T')[0]}). Cảnh báo nếu quá hạn.
        3. **Phân tích phân bổ**: Nhận xét về việc vật tư đã xuất (Allocated/Issued) nhưng chưa lắp đặt (chưa Installed) có nguy cơ thất thoát không?
        4. **Gợi ý**: Đề xuất danh sách cần đặt hàng ngay.

        Trả lời ngắn gọn, sử dụng các gạch đầu dòng và icon cảnh báo.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text || "Không có dữ liệu phân tích.";
  } catch (error) {
      console.error("AI Analysis Error", error);
      return "Lỗi khi phân tích dữ liệu kho PCCC.";
  }
}

export const analyzeQAQC = async (tasks: AcceptanceTask[]): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) return "Cần API Key để phân tích QA/QC.";

  try {
      // Prepare checklist data
      const checklistData = tasks.map(t => ({
          title: t.title,
          standard: t.standardRef,
          status: t.status,
          docCount: t.documents.length,
          documents: t.documents.map(d => d.name).join(', '),
          notes: t.notes
      }));

      const prompt = `
        Bạn là chuyên gia QA/QC và Thẩm duyệt PCCC. Hãy đóng vai trò người rà soát hồ sơ trước khi đoàn Cảnh sát PCCC xuống kiểm tra.
        
        Danh sách hạng mục nghiệm thu hiện tại:
        ${JSON.stringify(checklistData)}

        Yêu cầu phân tích:
        1. **Phát hiện thiếu hồ sơ**: Tìm các hạng mục có trạng thái 'Approved' hoặc 'In Progress' nhưng thiếu tài liệu minh chứng (docCount = 0 hoặc thiếu các biên bản quan trọng như Biên bản thử kín, Biên bản đo điện trở...).
        2. **Đối chiếu tiêu chuẩn**: Dựa trên các tiêu chuẩn (TCVN 7336, 5738...), nhắc nhở các yêu cầu kỹ thuật quan trọng thường bị bỏ sót cho từng hạng mục.
        3. **Cảnh báo "Hỏi thăm"**: Chỉ ra các hạng mục nhạy cảm mà Cảnh sát PCCC thường kiểm tra gắt gao nhất (ví dụ: đường đặc tuyến máy bơm, thời gian kích hoạt màn ngăn cháy...).
        4. **Tổng kết**: Đánh giá mức độ sẵn sàng của hồ sơ (Thấp/Trung bình/Cao).

        Trả lời ngắn gọn, đánh dấu các mục quan trọng bằng icon cảnh báo.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      return response.text || "Không có dữ liệu phân tích QA/QC.";
  } catch (error) {
      console.error("AI QA/QC Analysis Error", error);
      return "Lỗi khi phân tích dữ liệu QA/QC.";
  }
}
