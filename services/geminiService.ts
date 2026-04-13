
import { GoogleGenAI, Type } from "@google/genai";
import { Student, Activity, DiaryEntry } from "../types";

export const analyzeStudent = async (student: Student, activities: Activity[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const historyText = activities
    .map(a => `${new Date(a.timestamp).toLocaleDateString()}: ${a.content}`)
    .join('\n');

  const prompt = `Phân tích hồ sơ và lịch sử hoạt động của học sinh sau:
  Họ tên: ${student.name}
  Giới tính: ${student.gender}
  Ngày sinh: ${student.birthday}
  Điểm thi đua hiện tại: ${student.points}
  Ghi chú giáo viên: ${student.notes}
  
  Lịch sử hoạt động gần đây:
  ${historyText}
  
  Hãy đưa ra nhận xét chuyên sâu bằng tiếng Việt. Trả về định dạng JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rating: { type: Type.STRING, description: 'Đánh giá chung (Tốt/Khá/Cần cố gắng)' },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Các từ khóa đặc điểm' },
            advice: { type: Type.STRING, description: 'Lời khuyên giáo dục' },
            sentiment: { type: Type.STRING, description: 'Sắc thái cảm xúc của học sinh gần đây' }
          },
          required: ["rating", "keywords", "advice"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis error:", error);
    return null;
  }
};

export const draftNotification = async (student: Student, type: 'Absent' | 'Late' | 'Good' | 'Bad') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const typeMap = {
    'Absent': 'vắng mặt không lý do hôm nay',
    'Late': 'đi học muộn',
    'Good': 'có thành tích tốt/được tuyên dương',
    'Bad': 'vi phạm nề nếp'
  };

  const prompt = `Bạn là giáo viên chủ nhiệm lớp 6A1. Hãy viết một tin nhắn ngắn gọn (dưới 100 chữ), lịch sự và chân thành để gửi cho phụ huynh của em ${student.name} (${student.gender === 'Nam' ? 'con' : 'cháu'}) về việc: ${typeMap[type]}. 
  Tin nhắn cần bắt đầu bằng "Kính gửi phụ huynh em ${student.name},...". 
  Trả về duy nhất nội dung tin nhắn.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return `Kính gửi phụ huynh em ${student.name}, tôi thông báo về tình hình học tập của em hôm nay. Trân trọng!`;
  }
};

export const generateTaskChecklist = async (taskTitle: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Tôi là giáo viên chủ nhiệm. Tôi cần thực hiện công việc: "${taskTitle}". Hãy liệt kê các bước thực hiện chi tiết (checklist) để hoàn thành tốt công việc này. Trả về danh sách các chuỗi văn bản dạng JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return [];
  }
};

export const summarizeDiary = async (entries: DiaryEntry[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const content = entries.map(e => `${e.date} (${e.mood}): ${e.content}`).join('\n');
  const prompt = `Dựa trên các ghi chép nhật ký chủ nhiệm sau, hãy viết một báo cáo tổng kết tuần ngắn gọn, chuyên nghiệp và có các gợi ý hành động cụ thể cho tuần tới:\n\n${content}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Không thể tạo báo cáo lúc này.";
  } catch (error) {
    return "Không thể tạo báo cáo lúc này.";
  }
};

export const chatWithAI = async (message: string, context: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: `Bạn là một trợ lý ảo chuyên gia giáo dục (GVCN AI). Ngôn ngữ: Tiếng Việt sư phạm. Bối cảnh: ${context}`
    }
  });
  return response.text || "";
};
