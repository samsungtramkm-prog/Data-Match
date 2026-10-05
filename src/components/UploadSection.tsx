import React, { useState, useRef } from "react";
import {
  Upload,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { InputRecord, MasterRecord, ParsedFileMeta } from "../types";
import {
  readWorkbookFromFile,
  parseMasterWorkbook,
  parseInputWorkbook,
} from "../utils/fileParser";

interface UploadSectionProps {
  masterData: MasterRecord[];
  masterMeta: ParsedFileMeta | null;
  inputData: InputRecord[];
  inputMeta: ParsedFileMeta | null;
  onMasterUploaded: (data: MasterRecord[], meta: ParsedFileMeta) => void;
  onInputUploaded: (data: InputRecord[], meta: ParsedFileMeta) => void;
  onResetMaster: () => void;
  onResetInput: () => void;
  onClearAll: () => void;
  isProcessing: boolean;
}

export default function UploadSection({
  masterData,
  masterMeta,
  inputData,
  inputMeta,
  onMasterUploaded,
  onInputUploaded,
  onResetMaster,
  onResetInput,
  onClearAll,
}: UploadSectionProps) {
  const [dragActiveMaster, setDragActiveMaster] = useState(false);
  const [dragActiveInput, setDragActiveInput] = useState(false);
  const [showMasterPreview, setShowMasterPreview] = useState(false);
  const [showInputPreview, setShowInputPreview] = useState(false);

  const [fileNotification, setFileNotification] = useState<{
    type: "warning" | "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRefMaster = useRef<HTMLInputElement>(null);
  const fileInputRefInput = useRef<HTMLInputElement>(null);

  // Xử lý đọc Tệp Cơ Sở Dữ Liệu Gốc (Master) độc lập hoàn toàn với inputData
  const handleMasterFileUpload = async (file: File) => {
    try {
      onResetMaster();
      const workbook = await readWorkbookFromFile(file);
      const { meta, data } = parseMasterWorkbook(workbook, file.name);

      if (data.length === 0) {
        setFileNotification({
          type: "error",
          message: `Tệp "${file.name}" không chứa dòng dữ liệu nào.`,
        });
        return;
      }

      onMasterUploaded(data, meta);
      setFileNotification({
        type: "success",
        message: `✓ Đã đọc Tệp Cơ Sở Dữ Liệu Gốc "${meta.fileName}" (Sheet: ${meta.sheetName}, ${data.length} dòng, ${meta.colCount} cột).`,
      });
    } catch (err: any) {
      console.error("Error reading master file:", err);
      setFileNotification({
        type: "error",
        message: `Lỗi đọc Tệp Cơ Sở Dữ Liệu Gốc "${file.name}": ${
          err?.message || "Định dạng file không hợp lệ"
        }.`,
      });
    }
  };

  // Xử lý đọc Tệp cần xử lý (Input) độc lập hoàn toàn với masterData
  const handleInputFileUpload = async (file: File) => {
    try {
      // Reset inputData và resultData trước khi đọc file mới
      onResetInput();
      const workbook = await readWorkbookFromFile(file);
      const { meta, data } = parseInputWorkbook(workbook, file.name);

      if (data.length === 0) {
        setFileNotification({
          type: "error",
          message: `Tệp "${file.name}" không chứa dòng dữ liệu nào.`,
        });
        return;
      }

      onInputUploaded(data, meta);
      setFileNotification({
        type: "success",
        message: `✓ Đã đọc Tệp cần xử lý "${meta.fileName}" (Sheet: ${meta.sheetName}, ${data.length} dòng, ${meta.colCount} cột).`,
      });
    } catch (err: any) {
      console.error("Error reading input file:", err);
      setFileNotification({
        type: "error",
        message: `Lỗi đọc Tệp cần xử lý "${file.name}": ${
          err?.message || "Định dạng file không hợp lệ"
        }.`,
      });
    }
  };

  const handleDrag = (e: React.DragEvent, isMaster: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      isMaster ? setDragActiveMaster(true) : setDragActiveInput(true);
    } else if (e.type === "dragleave") {
      isMaster ? setDragActiveMaster(false) : setDragActiveInput(false);
    }
  };

  const handleDrop = (e: React.DragEvent, isMaster: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    isMaster ? setDragActiveMaster(false) : setDragActiveInput(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isMaster) {
        handleMasterFileUpload(file);
      } else {
        handleInputFileUpload(file);
      }
    }
  };

  const masterFirst5 = masterData.slice(0, 5);
  const inputFirst5 = inputData.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* THÔNG BÁO QUÉT FILE (NẾU CÓ) */}
      {fileNotification && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
            fileNotification.type === "warning"
              ? "bg-amber-50 text-amber-900 border-amber-200"
              : fileNotification.type === "error"
              ? "bg-red-50 text-red-900 border-red-200"
              : "bg-emerald-50 text-emerald-900 border-emerald-200"
          }`}
        >
          {fileNotification.type === "warning" && (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          {fileNotification.type === "error" && (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          {fileNotification.type === "success" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium leading-relaxed">
              {fileNotification.message}
            </p>
          </div>
          <button
            onClick={() => setFileNotification(null)}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FILE A: TỆP CƠ SỞ DỮ LIỆU GỐC (masterData) */}
        <div className="flex flex-col space-y-3">
          <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              1. Tệp Cơ Sở Dữ Liệu Gốc (Master Database)
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              masterData
            </span>
          </label>

          <div
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, true)}
            onDragOver={(e) => handleDrag(e, true)}
            onDrop={(e) => handleDrop(e, true)}
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 min-h-[210px] ${
              masterMeta && masterData.length > 0
                ? "border-blue-400 bg-blue-50/10"
                : dragActiveMaster
                ? "border-blue-500 bg-blue-50/50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            {masterMeta && masterData.length > 0 ? (
              <div className="space-y-3 w-full max-w-sm mx-auto">
                <div className="mx-auto w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-emerald-700">
                  ✓ Đã đọc file thành công
                </div>
                <div className="bg-white border border-slate-200/80 rounded-lg p-3 text-left text-xs space-y-1 font-mono text-slate-700">
                  <div>
                    <span className="text-slate-400 font-sans">Tên file: </span>
                    <span className="font-semibold break-all">
                      {masterMeta.fileName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">Sheet: </span>
                    <span className="font-semibold">{masterMeta.sheetName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">Số dòng: </span>
                    <span className="font-semibold">{masterData.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">Số cột: </span>
                    <span className="font-semibold">{masterMeta.colCount}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMasterPreview(!showMasterPreview)}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    {showMasterPreview ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>Xem trước dữ liệu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMasterPreview(false);
                      onResetMaster();
                      if (fileInputRefMaster.current) {
                        fileInputRefMaster.current.value = "";
                        fileInputRefMaster.current.click();
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
                  >
                    Thay đổi file khác
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRefMaster}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleMasterFileUpload(file);
                    }
                    e.target.value = "";
                  }}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-10 h-10 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-center text-slate-400">
                  <Upload className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Chưa có dữ liệu
                  </p>
                  <p className="text-xs font-medium text-slate-700 mt-1">
                    Kéo &amp; thả file Excel hoặc click chọn
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Cột chuẩn: ID number, Name, Phone, Site code, Site name, District, City, Địa chỉ, Customer, Sell In Type, Sales Region, Region2
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRefMaster.current?.click()}
                  className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-slate-700 font-medium text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Chọn Tệp Cơ Sở Dữ Liệu Gốc
                </button>
                <input
                  type="file"
                  ref={fileInputRefMaster}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleMasterFileUpload(file);
                    }
                    e.target.value = "";
                  }}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* PREVIEW 5 DÒNG ĐẦU TIÊN CỦA MASTER DATA */}
          {showMasterPreview && masterData.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>
                  Xem trước 5 dòng đầu tiên (masterData — tổng {masterData.length} dòng)
                </span>
                <button
                  type="button"
                  onClick={() => setShowMasterPreview(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Đóng
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">#</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">ID number</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Name</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Phone</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Site code</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Site name</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">District</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">City</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Customer</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Region2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {masterFirst5.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-2.5 py-1.5 text-slate-400">{idx + 1}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{row.id || "-"}</td>
                        <td className="px-2.5 py-1.5 font-sans whitespace-nowrap">{row.name || "-"}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{row.phone || "-"}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{row.siteCode || "-"}</td>
                        <td className="px-2.5 py-1.5 font-sans whitespace-nowrap">{row.siteName || "-"}</td>
                        <td className="px-2.5 py-1.5 font-sans whitespace-nowrap">{row.district || "-"}</td>
                        <td className="px-2.5 py-1.5 font-sans whitespace-nowrap">{row.city || "-"}</td>
                        <td className="px-2.5 py-1.5 font-sans whitespace-nowrap">{row.customer || "-"}</td>
                        <td className="px-2.5 py-1.5 font-sans whitespace-nowrap">{row.region2 || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FILE B: TỆP CẦN XỬ LÝ (inputData) */}
        <div className="flex flex-col space-y-3">
          <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              2. Tệp Cần Xử Lý (Input File)
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              inputData
            </span>
          </label>

          <div
            onDragEnter={(e) => handleDrag(e, false)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDragOver={(e) => handleDrag(e, false)}
            onDrop={(e) => handleDrop(e, false)}
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 min-h-[210px] ${
              inputMeta && inputData.length > 0
                ? "border-blue-400 bg-blue-50/10"
                : dragActiveInput
                ? "border-blue-500 bg-blue-50/50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            {inputMeta && inputData.length > 0 ? (
              <div className="space-y-3 w-full max-w-sm mx-auto">
                <div className="mx-auto w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-emerald-700">
                  ✓ Đã đọc file thành công
                </div>
                <div className="bg-white border border-slate-200/80 rounded-lg p-3 text-left text-xs space-y-1 font-mono text-slate-700">
                  <div>
                    <span className="text-slate-400 font-sans">Tên file: </span>
                    <span className="font-semibold break-all">
                      {inputMeta.fileName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">Sheet: </span>
                    <span className="font-semibold">{inputMeta.sheetName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">Số dòng: </span>
                    <span className="font-semibold">{inputData.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans">Số cột: </span>
                    <span className="font-semibold">{inputMeta.colCount}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInputPreview(!showInputPreview)}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    {showInputPreview ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>Xem trước dữ liệu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInputPreview(false);
                      onResetInput();
                      if (fileInputRefInput.current) {
                        fileInputRefInput.current.value = "";
                        fileInputRefInput.current.click();
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
                  >
                    Thay đổi file khác
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRefInput}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInputFileUpload(file);
                    }
                    e.target.value = "";
                  }}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto w-10 h-10 bg-slate-50 border border-slate-150 rounded-lg flex items-center justify-center text-slate-400">
                  <Upload className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Chưa có dữ liệu
                  </p>
                  <p className="text-xs font-medium text-slate-700 mt-1">
                    Kéo &amp; thả file Excel hoặc click chọn
                  </p>
                  <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                    Nhận diện: Mã số nhân viên của bạn: 2, Họ tên đầy đủ của bạn: 2, Số điện thoại của bạn: 2, Mã siêu thị của bạn:, Điểm số
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRefInput.current?.click()}
                  className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-slate-700 font-medium text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Chọn Tệp Cần Xử Lý
                </button>
                <input
                  type="file"
                  ref={fileInputRefInput}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInputFileUpload(file);
                    }
                    e.target.value = "";
                  }}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* PREVIEW 5 DÒNG ĐẦU TIÊN CỦA INPUT DATA */}
          {showInputPreview && inputData.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>
                  Xem trước 5 dòng đầu tiên (inputData — tổng {inputData.length} dòng)
                </span>
                <button
                  type="button"
                  onClick={() => setShowInputPreview(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Đóng
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">#</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">ID Number</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Name</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Phone</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Học Viên Nhập (Mã siêu thị)</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Tên siêu thị nhập</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Customer nhập</th>
                      <th className="px-2.5 py-2 font-semibold whitespace-nowrap">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {inputFirst5.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-2.5 py-1.5 text-slate-400">{idx + 1}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{row.IDNumber || "-"}</td>
                        <td className="px-2.5 py-1.5 font-sans whitespace-nowrap">{row.Name || "-"}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{row.Phone || "-"}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{row.inputSiteCode || "-"}</td>
                        <td className="px-2.5 py-1.5 font-sans whitespace-nowrap">{row.inputSiteName || "-"}</td>
                        <td className="px-2.5 py-1.5 font-sans whitespace-nowrap">{row.inputCustomer || "-"}</td>
                        <td className="px-2.5 py-1.5 whitespace-nowrap">{row.score !== "" ? row.score : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {(masterData.length > 0 || inputData.length > 0) && (
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => {
              setShowMasterPreview(false);
              setShowInputPreview(false);
              setFileNotification(null);
              onClearAll();
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 cursor-pointer whitespace-nowrap transition-colors"
          >
            Xóa Toàn Bộ dữ liệu
          </button>
        </div>
      )}
    </div>
  );
}
