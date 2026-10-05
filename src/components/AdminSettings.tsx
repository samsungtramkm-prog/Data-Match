import React from "react";
import { MatchingCriteria, UserRole } from "../types";
import { Sliders, RefreshCw, EyeOff, ShieldCheck, Lock, Check, Info } from "lucide-react";

interface AdminSettingsProps {
  role?: UserRole;
  criteria: MatchingCriteria;
  onCriteriaChange: (newCriteria: MatchingCriteria) => void;
  onApply: () => void;
  isProcessing: boolean;
}

export default function AdminSettings({
  criteria,
  onCriteriaChange,
  onApply,
  isProcessing,
}: AdminSettingsProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCriteriaChange({
      ...criteria,
      minScoreThreshold: parseInt(e.target.value) || 80,
    });
  };

  const handleNameThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCriteriaChange({
      ...criteria,
      minNameSimilarityThreshold: parseInt(e.target.value) || 80,
    });
  };

  const handleToggle = (key: keyof Omit<MatchingCriteria, "minScoreThreshold" | "minNameSimilarityThreshold">) => {
    onCriteriaChange({
      ...criteria,
      [key]: !criteria[key],
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="space-y-0.5">
          <h3 className="font-sans font-semibold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Cấu hình tham số thuật toán & đối chiếu dữ liệu
          </h3>
          <p className="text-[11px] text-slate-400">Điều chỉnh các biến cài đặt làm sạch dữ liệu tự động bên dưới</p>
        </div>
        
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Toàn quyền cấu hình
        </span>
      </div>

      <div className="space-y-6">
        {/* Sliders dải cài đặt ngưỡng: Điểm an toàn & Độ khớp tên */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          {/* Slider 1: Giới hạn điểm an toàn */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                Ngưỡng điểm an toàn tối thiểu
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] rounded p-2.5 w-48 z-30 font-normal shadow-lg leading-relaxed">
                    Điểm của học viên dưới ngưỡng này sẽ lập tức kích hoạt cảnh báo nguy cơ trượt đào tạo.
                  </div>
                </div>
              </span>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded text-xs border border-blue-100">
                {criteria.minScoreThreshold} điểm
              </span>
            </div>
            
            <input
              type="range"
              min="60"
              max="95"
              step="1"
              value={criteria.minScoreThreshold}
              onChange={handleSliderChange}
              disabled={isProcessing}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>60 (Kém)</span>
              <span>80 (Chuẩn mặc định)</span>
              <span>95 (Xuất sắc)</span>
            </div>
          </div>

          {/* Slider 2: Độ khớp tên cần trên 80% */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                Độ khớp tên tối thiểu (Sửa lỗi đánh máy)
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] rounded p-2.5 w-56 z-30 font-normal shadow-lg leading-relaxed">
                    Chỉ cho phép sửa lỗi đánh máy và đối soát tên khi độ tương đồng đạt từ mức này trở lên (&gt;= 80%). Dưới mức này sẽ giữ nguyên tên để không nhầm người.
                  </div>
                </div>
              </span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded text-xs border border-emerald-200">
                &gt;= {criteria.minNameSimilarityThreshold ?? 80}%
              </span>
            </div>
            
            <input
              type="range"
              min="70"
              max="95"
              step="1"
              value={criteria.minNameSimilarityThreshold ?? 80}
              onChange={handleNameThresholdChange}
              disabled={isProcessing}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>70% (Lỏng)</span>
              <span className="text-emerald-600 font-bold">80% (Chuẩn yêu cầu)</span>
              <span>95% (Rất chặt)</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* 1. CHỈ SỬA LỖI ĐÁNH MÁY Ở CỘT TÊN (YÊU CẦU TRỌNG TÂM) */}
          <div
            onClick={() => !isProcessing && handleToggle("onlyFixNameTypos")}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none sm:col-span-2 lg:col-span-1 ${
              criteria.onlyFixNameTypos
                ? "border-blue-400 bg-blue-50/30 ring-1 ring-blue-300"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Chỉ sửa lỗi đánh máy ở cột tên
              </span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  criteria.onlyFixNameTypos ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-sm transform duration-200 ease-in-out ${
                    criteria.onlyFixNameTypos ? "translate-x-4" : ""
                  }`}
                />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-normal">
              <strong>Ưu tiên cao nhất:</strong> Chỉ sửa lỗi chính tả ở cột Name. Giữ nguyên tất cả các cột khác không can thiệp đè dữ liệu.
            </p>
          </div>

          {/* 2. SOÁT THỪA / THIẾU SỐ ĐIỆN THOẠI (TỐI ĐA 10 SỐ) */}
          <div className="p-4 rounded-xl border border-blue-200 bg-slate-50/60 select-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Soát SĐT (Thừa / Thiếu)</span>
              <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Tối đa 10 số
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-normal">
              Tự động bắt lỗi: <strong>Thừa số</strong> (&gt;10 chữ số) hoặc <strong>Thiếu số</strong> (&lt;10 chữ số) để cảnh báo kịp thời.
            </p>
          </div>

          {/* 3. Lọc Trùng Lấy Điểm Cao Nhất */}
          <div
            onClick={() => !isProcessing && handleToggle("deduplicateByNameHighestScore")}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              criteria.deduplicateByNameHighestScore
                ? "border-blue-300 bg-blue-50/10"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Lọc trùng (Lấy điểm cao nhất)</span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  criteria.deduplicateByNameHighestScore ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-sm transform duration-200 ease-in-out ${
                    criteria.deduplicateByNameHighestScore ? "translate-x-4" : ""
                  }`}
                />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Nếu 1 học viên xuất hiện nhiều lần, tự động chọn bản ghi có điểm số cao nhất.
            </p>
          </div>

          {/* 4. Sửa Sai Lệch Họ Tên Bằng Thuật Toán Mờ */}
          <div
            onClick={() => !isProcessing && handleToggle("autoReconcileNames")}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              criteria.autoReconcileNames
                ? "border-blue-300 bg-blue-50/10"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Tự sửa chính tả Họ Tên</span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  criteria.autoReconcileNames ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-sm transform duration-200 ease-in-out ${
                    criteria.autoReconcileNames ? "translate-x-4" : ""
                  }`}
                />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Sử dụng giải thuật mờ Levenshtein tự động thay thế tên bị viết sai dấu/lỗi đánh máy.
            </p>
          </div>

          {/* 5. Tự sửa mã NV/Học viên (khi không ở chế độ chỉ sửa tên) */}
          <div
            onClick={() => !isProcessing && handleToggle("autoReconcileIds")}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              criteria.autoReconcileIds && !criteria.onlyFixNameTypos
                ? "border-blue-300 bg-blue-50/10"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Tự sửa mã NV/Học viên</span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  criteria.autoReconcileIds ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-sm transform duration-200 ease-in-out ${
                    criteria.autoReconcileIds ? "translate-x-4" : ""
                  }`}
                />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              {criteria.onlyFixNameTypos ? "Đang tạm khóa do bật 'Chỉ sửa lỗi đánh máy ở cột tên'." : "Tự động bổ sung mã theo data gốc khi trống hoặc sai."}
            </p>
          </div>

          {/* 6. Đồng bộ Số điện thoại */}
          <div
            onClick={() => !isProcessing && handleToggle("strictPhoneFormatting")}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              criteria.strictPhoneFormatting && !criteria.onlyFixNameTypos
                ? "border-blue-300 bg-blue-50/10"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Đồng bộ Số điện thoại</span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                  criteria.strictPhoneFormatting ? "bg-blue-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full shadow-sm transform duration-200 ease-in-out ${
                    criteria.strictPhoneFormatting ? "translate-x-4" : ""
                  }`}
                />
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              {criteria.onlyFixNameTypos ? "Đang tạm khóa do bật 'Chỉ sửa lỗi đánh máy ở cột tên'." : "Khôi phục SĐT theo lý lịch gốc khi ID trùng khớp."}
            </p>
          </div>
        </div>

        {/* THUẬT TOÁN LÀM SẠCH TRÙNG LỆCH & SỬA LỖI TỰ ĐỘNG DIỄN GIẢI */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 text-xs text-slate-600 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs pb-1.5 border-b border-slate-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Bản đồ Giải thuật Làm Sạch Trùng Lệch & Sửa Lỗi Tự Động
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
            <div className="space-y-1.5">
              <p className="flex items-start gap-1">
                <span className="text-blue-600 font-bold shrink-0">1.</span>
                <span>
                  <strong>Vietnamese Tones & Levenshtein:</strong> Tách dấu tiếng Việt và dùng giải thuật khoảng cách toán học Levenshtein đo độ giống nhau chính xác của họ tên.
                </span>
              </p>
              <p className="flex items-start gap-1">
                <span className="text-blue-600 font-bold shrink-0">2.</span>
                <span>
                  <strong>Sai Mã nhân viên:</strong> Tự động bổ sung mã khớp chuẩn qua số điện thoại hoặc họ tên có độ tương đồng cao (&gt;85%).
                </span>
              </p>
              <p className="flex items-start gap-1">
                <span className="text-blue-600 font-bold shrink-0">3.</span>
                <span>
                  <strong>Sửa sai chính tả tên:</strong> Tự động phát hiện lỗi đánh máy hoặc sai dấu họ tên khi độ tương đồng đạt ngưỡng cấu hình.
                </span>
              </p>
            </div>
            
            <div className="space-y-1.5">
              <p className="flex items-start gap-1">
                <span className="text-blue-600 font-bold shrink-0">4.</span>
                <span>
                  <strong>Sai số điện thoại:</strong> Khắc phục lỗi gõ nhầm một vài vần số dựa trên so khớp mã số lý lịch gốc ban đầu của học viên.
                </span>
              </p>
              <p className="flex items-start gap-1">
                <span className="text-blue-600 font-bold shrink-0">5.</span>
                <span>
                  <strong>Sai Mã lớp học:</strong> Tự động tìm kiếm, điền bổ sung mã lớp chuẩn xác dựa trên đối khớp hồ sơ định danh có độ tương đồng &gt;85%.
                </span>
              </p>
              <p className="flex items-start gap-1">
                <span className="text-blue-600 font-bold shrink-0">6.</span>
                <span>
                  <strong>Lọc trùng tên:</strong> Nếu học viên xuất hiện nhiều lần, tự động giữ bản ghi có điểm kiểm định tối đa (cao nhất).
                </span>
              </p>
              <p className="flex items-start gap-1">
                <span className="text-rose-600 font-bold shrink-0">⚠️</span>
                <span className="text-slate-700 font-medium">
                  <strong>Cảnh báo điểm số &lt;80:</strong> Kích hoạt các chỉ báo nguy cấp, gửi thông điệp yêu cầu tuyển dụng/đào tạo lưu tâm khẩn cấp.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Nút lưu áp dựng */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={onApply}
            disabled={isProcessing}
            id="btn-apply-settings"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95 m-0"
          >
            {isProcessing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Áp Dụng Cài Đặt & Khớp Lại
          </button>
        </div>
      </div>
    </div>
  );
}
