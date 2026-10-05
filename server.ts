import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Chia sẻ client Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint phân tích dữ liệu lỗi bằng AI
app.post("/api/analyze", async (req, res) => {
  try {
    const { sessionStats, topIssues } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        report: `### ⚠️ CHƯA CẬU HÌNH API KEY GEMINI

Để trải nghiệm tính năng phân tích báo cáo chất lượng dữ liệu bằng AI, quý khách vui lòng cấu hình **GEMINI_API_KEY** trong mục **Settings > Secrets** trên AI Studio.

**Phương án khắc phục cơ bản:**
- Tổng cộng phát hiện **${sessionStats?.correctedRows || 0} dòng cần sửa đổi**.
- Số học viên có điểm dưới ngưỡng an toàn (<80): **${sessionStats?.warningRows || 0} học viên**.
- Tỷ lệ dữ liệu sạch hiện tại: **${sessionStats?.cleanRate || 100}%**.`
      });
    }

    const prompt = `
Hãy đóng vai một Chuyên gia Kiểm định Chất lượng Dữ liệu (Chief Data Quality Officer) và Phụ trách đào tạo doanh nghiệp.
Bạn có một công cụ tự động đối chiếu dữ liệu đào tạo/tuyển dụng giữa 2 file: 1 file Gốc (Master database) và 1 file Cần Xử Lý nhập liệu bởi các phòng ban.

Dưới đây là số liệu thống kê từ phiên đối chiếu dữ liệu hôm nay:
- Tổng số dòng đối chiếu: ${sessionStats.totalRows}
- Số dòng trùng khớp hoàn hảo (Sạch): ${sessionStats.cleanRows}
- Số dòng đã được tự động phát hiện lệch và tự động sửa khớp: ${sessionStats.correctedRows}
- Số dòng cảnh báo học tập (Điểm dưới 80): ${sessionStats.warningRows}
- Số dòng không thể đối sánh tự động (Không tìm thấy thông tin trên hệ thống gốc): ${sessionStats.unresolvedRows}
- Tỷ lệ dữ liệu ban đầu đạt chất lượng tối đa: ${sessionStats.cleanRate}%

Danh sách các trường hợp tiêu biểu có vấn đề:
${JSON.stringify(topIssues)}

Yêu cầu:
Viết một báo cáo kiểm định chất lượng ngắn gọn, súc tích và chuyên nghiệp (bằng Tiếng Việt, định dạng Markdown) để gửi ban giám đốc hàng ngày. Báo cáo cần bao gồm:
1. **Đánh giá tổng quan chất lượng nhập liệu** (Khen ngợi hay cảnh báo mức độ cẩu thả).
2. **Phân tích nguyên nhân cốt lõi** dựa trên các lỗi tiêu biểu (ví dụ: gõ nhầm mã, gõ thiếu số SĐT, viết sai dấu tiếng Việt dẫn đến mâu thuẫn hệ thống).
3. **Cảnh báo học tập/tuyển dụng** cho các nhân sự có điểm dưới 80 (cần kèm hành động đào tạo lại hay theo dõi sát sao).
4. **Hành động đề xuất (Action Plan)** cụ thể cho ngày mai đối với nhân viên xử lý dữ liệu và các phòng ban.

Lưu ý: Giọng điệu chuyên nghiệp, tự tin, mang tinh thần hướng dẫn và xây dựng. Tránh dùng từ quá máy móc, hãy biểu thị như một nhà quản trị thông thái. Sử dụng định dạng markdown rõ ràng, sử dụng bullet-points hợp lý.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const reportText = response.text || "Không thể tạo báo cáo vào lúc này.";
    res.json({ report: reportText });

  } catch (error: any) {
    console.error("Gemini API Error in server.ts:", error);
    res.status(500).json({ error: "Lỗi nội bộ server khi kết nối trí tuệ nhân tạo Gemini." });
  }
});

// Cấu hình Vite as a Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
