import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  InputRecord,
  MasterRecord,
  MatchingCriteria,
  MatchingResult,
  MatchingSession,
  ParsedFileMeta,
} from "./types";
import { matchDatasets } from "./utils/matching";
import UploadSection from "./components/UploadSection";
import DashboardStats from "./components/DashboardStats";
import DataGrid from "./components/DataGrid";
import LoginScreen from "./components/LoginScreen";
import {
  FileSpreadsheet,
  History,
  RefreshCw,
  Layers,
  BellRing,
  LogOut,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    return localStorage.getItem("data_match_user_id") || "samsung_admin";
  });

  // 2 NGUỒN DỮ LIỆU ĐỘC LẬP HOÀN TOÀN (KHÔNG DỮ LIỆU GIẢ / DEMO)
  const [masterData, setMasterData] = useState<MasterRecord[]>([]);
  const [inputData, setInputData] = useState<InputRecord[]>([]);
  const [resultData, setResultData] = useState<MatchingResult[]>([]);

  const [masterMeta, setMasterMeta] = useState<ParsedFileMeta | null>(null);
  const [inputMeta, setInputMeta] = useState<ParsedFileMeta | null>(null);

  // Cấu hình thuật toán hiệu chỉnh
  const [criteria, setCriteria] = useState<MatchingCriteria>({
    minScoreThreshold: 80,
    strictPhoneFormatting: false,
    autoReconcileNames: true,
    autoReconcileIds: false,
    deduplicateByNameHighestScore: false,
    onlyFixNameTypos: true,
    maxPhoneDigits: 10,
    minNameSimilarityThreshold: 80,
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState<MatchingSession | null>(
    null
  );
  const [showCriteria, setShowCriteria] = useState<boolean>(false);
  const [historySessions, setHistorySessions] = useState<MatchingSession[]>([]);

  // Debug log theo yêu cầu mục 14 mỗi khi dữ liệu thay đổi
  useEffect(() => {
    const masterFileName = masterMeta?.fileName || "";
    const masterHeaders = masterMeta?.headers || [];
    const inputFileName = inputMeta?.fileName || "";
    const inputHeaders = inputMeta?.headers || [];

    console.log("MASTER FILE:", masterFileName);
    console.log("MASTER HEADERS:", masterHeaders);
    console.log("MASTER ROW COUNT:", masterData.length);
    console.log("MASTER FIRST 5:", masterData.slice(0, 5));

    console.log("INPUT FILE:", inputFileName);
    console.log("INPUT HEADERS:", inputHeaders);
    console.log("INPUT ROW COUNT:", inputData.length);
    console.log("INPUT FIRST 5:", inputData.slice(0, 5));

    console.log("RESULT ROW COUNT:", resultData.length);
    console.log("RESULT FIRST 5:", resultData.slice(0, 5));
  }, [masterData, inputData, resultData, masterMeta, inputMeta]);

  // Thực hiện matching tạo resultData từ inputData.map(...)
  const runMatching = (
    currentInputData: InputRecord[],
    currentMasterData: MasterRecord[],
    activeCriteria: MatchingCriteria,
    currentInputMeta: ParsedFileMeta | null,
    currentMasterMeta: ParsedFileMeta | null
  ) => {
    if (!currentInputData || currentInputData.length === 0) {
      setResultData([]);
      setCurrentSession(null);
      return;
    }

    setIsProcessing(true);
    try {
      const results = matchDatasets(
        currentInputData,
        currentMasterData,
        activeCriteria
      );
      setResultData(results);

      const totalRows = results.length;
      const cleanRows = results.filter(
        (r) => r.reconciliationStatus === "safe"
      ).length;
      const correctedRows = results.filter(
        (r) => r.reconciliationStatus === "corrected"
      ).length;
      const warningRows = results.filter(
        (r) => r.reconciliationStatus === "warning" || r.errors.scoreWarning
      ).length;
      const unresolvedRows = results.filter(
        (r) => r.reconciliationStatus === "cannot_resolve"
      ).length;

      const session: MatchingSession = {
        id: `SESSION_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        originalFileName: currentInputMeta?.fileName || "Tệp cần xử lý",
        masterFileName:
          currentMasterMeta?.fileName || "Chưa tải CSDL Gốc",
        totalRows,
        cleanRows,
        correctedRows,
        warningRows,
        unresolvedRows,
        results,
        operator: loggedInUser || "Người vận hành",
      };

      setCurrentSession(session);
      setHistorySessions((prev) => [session, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error("Reconciliation execution error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Khi người dùng upload Tệp Cơ Sở Dữ Liệu Gốc: chỉ cập nhật masterData, KHÔNG ghi đè inputData
  const handleMasterUploaded = (
    parsedMasterData: MasterRecord[],
    meta: ParsedFileMeta
  ) => {
    setMasterData(parsedMasterData);
    setMasterMeta(meta);
    if (inputData.length > 0) {
      runMatching(inputData, parsedMasterData, criteria, inputMeta, meta);
    }
  };

  // Khi người dùng upload Tệp cần xử lý: chỉ cập nhật inputData, KHÔNG ghi đè masterData
  const handleInputUploaded = (
    parsedInputData: InputRecord[],
    meta: ParsedFileMeta
  ) => {
    setInputData(parsedInputData);
    setInputMeta(meta);
    runMatching(parsedInputData, masterData, criteria, meta, masterMeta);
  };

  // Reset khi thay Tệp Cơ Sở Dữ Liệu Gốc
  const handleResetMaster = () => {
    setMasterData([]);
    setMasterMeta(null);
    if (inputData.length > 0) {
      runMatching(inputData, [], criteria, inputMeta, null);
    }
  };

  // Reset khi thay Tệp cần xử lý (Mục 12)
  const handleResetInput = () => {
    setInputData([]);
    setResultData([]);
    setInputMeta(null);
    setCurrentSession(null);
  };

  // Xóa toàn bộ dữ liệu
  const handleClearAll = () => {
    setMasterData([]);
    setInputData([]);
    setResultData([]);
    setMasterMeta(null);
    setInputMeta(null);
    setCurrentSession(null);
  };

  const handleUpdateCriteria = (newCriteria: Partial<MatchingCriteria>) => {
    const updated = { ...criteria, ...newCriteria };
    setCriteria(updated);
    if (inputData.length > 0) {
      runMatching(inputData, masterData, updated, inputMeta, masterMeta);
    }
  };

  if (!loggedInUser) {
    return <LoginScreen onLoginSuccess={(userId) => setLoggedInUser(userId)} />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-blue-500 selection:text-white pb-12">
      {/* HEADER BANNER */}
      <header className="bg-white border-b border-slate-200/90 text-slate-900 shrink-0 shadow-2xs sticky top-0 z-30 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base font-sans">
                  DataMatch Pro
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
                  · v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hệ thống chuẩn hóa &amp; đối soát dữ liệu giáo vụ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-sans">
            <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/80 py-1.5 px-3 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-700">{loggedInUser}</span>
            </div>
            <button
              onClick={() => setLoggedInUser(null)}
              className="flex items-center gap-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-xs font-medium"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 w-full">
        {/* KHU VỰC TẢI FILE */}
        <section
          id="upload-section"
          className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs"
        >
          <UploadSection
            masterData={masterData}
            masterMeta={masterMeta}
            inputData={inputData}
            inputMeta={inputMeta}
            onMasterUploaded={handleMasterUploaded}
            onInputUploaded={handleInputUploaded}
            onResetMaster={handleResetMaster}
            onResetInput={handleResetInput}
            onClearAll={handleClearAll}
            isProcessing={isProcessing}
          />
        </section>

        {/* CẤU HÌNH QUY CHUẨN ĐỐI SOÁT */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowCriteria(!showCriteria)}
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Quy chuẩn đối soát &amp; thuật toán tự động
                </h4>
                <p className="text-[11px] text-slate-400">
                  Ngưỡng điểm an toàn: {criteria.minScoreThreshold} · Độ khớp
                  tên: ≥ {criteria.minNameSimilarityThreshold}% · Số ĐT: Tối đa{" "}
                  {criteria.maxPhoneDigits} số
                </p>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg text-xs"
            >
              {showCriteria ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showCriteria && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block text-[11px]">
                  Ngưỡng điểm an toàn (&lt; {criteria.minScoreThreshold} báo
                  cảnh báo)
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={criteria.minScoreThreshold}
                  onChange={(e) =>
                    handleUpdateCriteria({
                      minScoreThreshold: Number(e.target.value) || 80,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block text-[11px]">
                  Độ khớp tên tối thiểu để tự sửa (≥{" "}
                  {criteria.minNameSimilarityThreshold}%)
                </label>
                <input
                  type="number"
                  min={60}
                  max={99}
                  value={criteria.minNameSimilarityThreshold}
                  onChange={(e) =>
                    handleUpdateCriteria({
                      minNameSimilarityThreshold: Number(e.target.value) || 80,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block text-[11px]">
                  Số ký tự ĐT chuẩn (Tối đa {criteria.maxPhoneDigits} số)
                </label>
                <input
                  type="number"
                  min={8}
                  max={15}
                  value={criteria.maxPhoneDigits}
                  onChange={(e) =>
                    handleUpdateCriteria({
                      maxPhoneDigits: Number(e.target.value) || 10,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={criteria.onlyFixNameTypos}
                    onChange={(e) =>
                      handleUpdateCriteria({
                        onlyFixNameTypos: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Chỉ sửa lỗi đánh máy ở cột họ tên</span>
                </label>
              </div>
            </div>
          )}
        </section>

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-3 min-h-[350px]"
            >
              <div className="relative">
                <div className="w-12 h-12 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-sans font-semibold text-slate-800 text-sm tracking-tight">
                  Giải thuật đang tính toán...
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Đang đối chiếu dữ liệu thực tế từ Tệp cần xử lý với Tệp Cơ Sở Dữ Liệu Gốc...
                </p>
              </div>
            </motion.div>
          ) : resultData.length > 0 && currentSession ? (
            <motion.div
              key="dashboard-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {currentSession.warningRows > 0 && (
                <div className="bg-amber-50/50 text-amber-900 border border-amber-200/50 p-4 rounded-xl flex items-start gap-2.5 text-xs leading-relaxed">
                  <BellRing className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold">
                      ⚠️ Cảnh báo đối soát dữ liệu
                    </span>
                    : Phát hiện <b>{currentSession.warningRows} trường hợp</b>{" "}
                    cần lưu ý (lệch thông tin hoặc điểm dưới ngưỡng{" "}
                    {criteria.minScoreThreshold}) trong tệp kết quả.
                  </div>
                </div>
              )}

              <section id="analytics-dashboard">
                <DashboardStats session={currentSession} />
              </section>

              <section id="reconciliation-workshop">
                <DataGrid
                  data={resultData}
                  results={resultData}
                  fileNameToExport={currentSession.originalFileName}
                  onExport={() => {}}
                />
              </section>

              {historySessions.length > 1 && (
                <section
                  id="history-reports"
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                >
                  <div className="pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <h3 className="font-sans font-semibold text-slate-800 text-xs tracking-wider uppercase">
                      Nhật ký lịch trình đối khớp làm sạch dữ liệu hôm nay
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {historySessions.map((session, sIdx) => (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-slate-150 rounded-xl hover:bg-slate-50 text-xs gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="p-1 px-2 bg-slate-100 rounded text-slate-500 flex items-center justify-center font-mono text-[9px] font-bold">
                            #{historySessions.length - sIdx}
                          </span>
                          <div>
                            <span className="font-medium text-slate-800">
                              Tệp: {session.originalFileName}
                            </span>
                            <div className="flex items-center gap-3 text-slate-400 text-[10px] mt-0.5 font-mono">
                              <span>Thời gian: {session.timestamp}</span>
                              <span>• Lọc bởi: {session.operator}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Khớp {session.cleanRows}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Sửa {session.correctedRows}
                            </span>
                            {session.warningRows > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Cảnh báo {session.warningRows}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setCurrentSession(session);
                              setResultData(session.results);
                            }}
                            id={`load-history-${session.id}`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg cursor-pointer text-[10px] transition-colors"
                          >
                            Xem lại phiên này
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="blank-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-4 min-h-[350px]"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                <Layers className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-sans font-semibold text-slate-800 text-sm tracking-tight">
                  Chưa có dữ liệu đối soát
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Chưa có dữ liệu. Vui lòng tải lên Tệp Cơ Sở Dữ Liệu Gốc và Tệp Cần Xử Lý phía trên để hệ thống đọc dữ liệu thực tế từ file Excel.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 py-6 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1 w-full">
        <div>
          <b>DataMatch Pro</b> • Hệ thống đối sánh và làm sạch dữ liệu đào tạo doanh nghiệp.
        </div>
      </footer>
    </div>
  );
}
