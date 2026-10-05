import React, { useState } from "react";
import * as XLSX from "xlsx";
import { MatchingResult, UserRole } from "../types";
import { inspectPhoneNumber } from "../utils/matching";
import {
  Search,
  Filter,
  Download,
  UserX,
  Sparkles,
  Layers,
} from "lucide-react";

interface DataGridProps {
  role?: UserRole;
  data?: MatchingResult[];
  results?: MatchingResult[];
  onExport?: () => void;
  fileNameToExport?: string;
}

type StatusFilter =
  | "ALL"
  | "CORRECTED"
  | "WARNING"
  | "UNRESOLVED"
  | "SAFE"
  | "NAME_ERROR"
  | "PHONE_EXCESS"
  | "PHONE_MISSING"
  | "PHONE_ERROR"
  | "ID_ERROR"
  | "SITE_ERROR";

export default function DataGrid({
  data,
  results,
  onExport,
}: DataGridProps) {
  // Bảng kết quả CHỈ được render từ resultData
  const resultData: MatchingResult[] = data ?? results ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  if (resultData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-3 min-h-[280px]">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
          <Layers className="w-5 h-5 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h4 className="font-sans font-semibold text-slate-800 text-sm tracking-tight">
            Chưa có dữ liệu đối soát
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Chưa có dữ liệu. Vui lòng tải lên Tệp Cơ Sở Dữ Liệu Gốc và Tệp Cần Xử Lý ở phía trên để thực hiện đối soát.
          </p>
        </div>
      </div>
    );
  }

  // Lọc dữ liệu theo tìm kiếm & trạng thái lỗi
  const filteredResults = resultData.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      String(r.STT).includes(searchTerm) ||
      (r.IDNumber && r.IDNumber.toLowerCase().includes(term)) ||
      (r.Name && r.Name.toLowerCase().includes(term)) ||
      (r.Phone && r.Phone.toLowerCase().includes(term)) ||
      (r.HocVienNhap && r.HocVienNhap.toLowerCase().includes(term)) ||
      (r.SiteCode && r.SiteCode.toLowerCase().includes(term)) ||
      (r.SiteName && r.SiteName.toLowerCase().includes(term)) ||
      (r.District && r.District.toLowerCase().includes(term)) ||
      (r.City && r.City.toLowerCase().includes(term)) ||
      (r.DetailAddress && r.DetailAddress.toLowerCase().includes(term)) ||
      (r.CustomerMerge && r.CustomerMerge.toLowerCase().includes(term)) ||
      (r.Customer && r.Customer.toLowerCase().includes(term)) ||
      (r.SellInType && r.SellInType.toLowerCase().includes(term)) ||
      (r.SalesRegion && r.SalesRegion.toLowerCase().includes(term)) ||
      (r.Region && r.Region.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    if (statusFilter === "CORRECTED")
      return r.reconciliationStatus === "corrected";
    if (statusFilter === "WARNING")
      return r.reconciliationStatus === "warning" || r.errors.scoreWarning;
    if (statusFilter === "UNRESOLVED")
      return r.reconciliationStatus === "cannot_resolve";
    if (statusFilter === "SAFE") return r.reconciliationStatus === "safe";
    if (statusFilter === "NAME_ERROR") return r.errors.nameError;
    if (statusFilter === "PHONE_EXCESS") return !!r.errors.phoneExcessError;
    if (statusFilter === "PHONE_MISSING") return !!r.errors.phoneMissingError;
    if (statusFilter === "PHONE_ERROR") return r.errors.phoneError;
    if (statusFilter === "ID_ERROR") return r.errors.idError;
    if (statusFilter === "SITE_ERROR") return r.errors.siteError;
    return true;
  });

  const resultColumns = [
    { key: "STT", label: "STT" },
    { key: "ID Number", label: "ID Number" },
    { key: "Name", label: "Name" },
    { key: "Phone", label: "Phone" },
    { key: "Internal/ External", label: "Internal/ External" },
    { key: "Trainee Type", label: "Trainee Type" },
    { key: "Customer - Merge", label: "Customer - Merge" },
    { key: "Học Viên Nhập", label: "Học Viên Nhập" },
    { key: "Site Code", label: "Site Code" },
    { key: "Site Name", label: "Site Name" },
    { key: "District", label: "District" },
    { key: "City", label: "City" },
    { key: "Detail Address", label: "Detail Address" },
    { key: "Shop Grade", label: "Shop Grade" },
    { key: "Customer", label: "Customer" },
    { key: "Sell In Type", label: "Sell In Type" },
    { key: "Sales Region", label: "Sales Region" },
    { key: "Region", label: "Region" },
    { key: "Score", label: "Score" },
  ];

  // Mapping trực tiếp từ resultData (không ghi đè Học Viên Nhập bằng Site Code chuẩn)
  const mappedResults = filteredResults.map((r) => ({
    STT: r.STT,
    "ID Number": r.IDNumber ?? "",
    Name: r.Name ?? "",
    Phone: r.Phone ?? "",
    "Internal/ External": r.InternalExternal ?? "",
    "Trainee Type": r.TraineeType ?? "",
    "Customer - Merge": r.CustomerMerge ?? "",
    "Học Viên Nhập": r.HocVienNhap ?? "",
    "Site Code": r.SiteCode ?? "",
    "Site Name": r.SiteName ?? "",
    District: r.District ?? "",
    City: r.City ?? "",
    "Detail Address": r.DetailAddress ?? "",
    "Shop Grade": r.ShopGrade ?? "",
    Customer: r.Customer ?? "",
    "Sell In Type": r.SellInType ?? "",
    "Sales Region": r.SalesRegion ?? "",
    Region: r.Region ?? "",
    Score: r.Score ?? "",
    _raw: r,
  }));

  const counts = {
    ALL: resultData.length,
    CORRECTED: resultData.filter((r) => r.reconciliationStatus === "corrected")
      .length,
    WARNING: resultData.filter(
      (r) => r.reconciliationStatus === "warning" || r.errors.scoreWarning
    ).length,
    UNRESOLVED: resultData.filter(
      (r) => r.reconciliationStatus === "cannot_resolve"
    ).length,
    SAFE: resultData.filter((r) => r.reconciliationStatus === "safe").length,
    NAME_ERROR: resultData.filter((r) => r.errors.nameError).length,
    PHONE_EXCESS: resultData.filter((r) => r.errors.phoneExcessError).length,
    PHONE_MISSING: resultData.filter((r) => r.errors.phoneMissingError).length,
    PHONE_ERROR: resultData.filter((r) => r.errors.phoneError).length,
    ID_ERROR: resultData.filter((r) => r.errors.idError).length,
    SITE_ERROR: resultData.filter((r) => r.errors.siteError).length,
  };

  // Xuất file Excel từ resultData
  const handleDownloadExcel = () => {
    const cleanOutput = resultData.map((r) => ({
      STT: r.STT,
      "ID Number": String(r.IDNumber ?? ""),
      Name: String(r.Name ?? ""),
      Phone: String(r.Phone ?? ""),
      "Internal/ External": String(r.InternalExternal ?? ""),
      "Trainee Type": String(r.TraineeType ?? ""),
      "Customer - Merge": String(r.CustomerMerge ?? ""),
      "Học Viên Nhập": String(r.HocVienNhap ?? ""),
      "Site Code": String(r.SiteCode ?? ""),
      "Site Name": String(r.SiteName ?? ""),
      District: String(r.District ?? ""),
      City: String(r.City ?? ""),
      "Detail Address": String(r.DetailAddress ?? ""),
      "Shop Grade": String(r.ShopGrade ?? ""),
      Customer: String(r.Customer ?? ""),
      "Sell In Type": String(r.SellInType ?? ""),
      "Sales Region": String(r.SalesRegion ?? ""),
      Region: String(r.Region ?? ""),
      Score: r.Score ?? "",
      "Chi Tiết Đối Soát": r.explanation,
    }));

    const worksheet = XLSX.utils.json_to_sheet(cleanOutput);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Result Data");

    const dateStr = new Date().toISOString().split("T")[0];
    const exportName = `DataMatch_Result_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, exportName);
    onExport?.();
  };

  const renderCellContent = (
    columnKey: string,
    value: any,
    raw: MatchingResult
  ) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-slate-300 italic">-</span>;
    }

    if (columnKey === "Score") {
      const isWarning = raw.errors?.scoreWarning || Number(value) < 80;
      return (
        <span
          className={`inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
            isWarning
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {value}
        </span>
      );
    }

    if (columnKey === "Name") {
      const isTypoFixed =
        raw.originalName !== raw.correctedName && raw.correctedName;
      if (isTypoFixed) {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-blue-700 text-xs">{value}</span>
            <span className="text-[10.5px] text-slate-400 line-through mt-0.5">
              {raw.originalName}
            </span>
          </div>
        );
      }
      return <span className="font-medium text-slate-800">{value}</span>;
    }

    if (columnKey === "Phone") {
      if (raw.errors?.phoneExcessError) {
        return (
          <div className="flex flex-col font-mono text-[11px]">
            <span className="text-red-700 font-bold">{value}</span>
            <span className="text-[9px] font-sans text-red-600 bg-red-50 border border-red-200 px-1 py-0.5 rounded mt-0.5 w-fit">
              ❌ Thừa ({inspectPhoneNumber(raw.originalPhone).digitCount} số)
            </span>
          </div>
        );
      }
      if (raw.errors?.phoneMissingError) {
        return (
          <div className="flex flex-col font-mono text-[11px]">
            <span className="text-amber-700 font-bold">{value}</span>
            <span className="text-[9px] font-sans text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded mt-0.5 w-fit">
              ⚠️ Thiếu ({inspectPhoneNumber(raw.originalPhone).digitCount} số)
            </span>
          </div>
        );
      }
      return <span className="font-mono text-slate-700">{value}</span>;
    }

    if (columnKey === "ID Number") {
      return <span className="font-mono text-slate-700">{value}</span>;
    }

    if (columnKey === "Học Viên Nhập") {
      const hasMismatch =
        raw.errors?.siteError && raw.inputSiteCode && raw.masterSiteCode;
      return (
        <div className="flex flex-col font-mono text-[11px]">
          <span
            className={
              hasMismatch
                ? "text-amber-700 font-semibold"
                : "text-slate-700"
            }
          >
            {value}
          </span>
          {hasMismatch && (
            <span className="text-[9px] font-sans text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded mt-0.5 w-fit">
              ≠ Chuẩn: {raw.masterSiteCode}
            </span>
          )}
        </div>
      );
    }

    if (columnKey === "Site Code") {
      return <span className="font-mono text-slate-700">{value}</span>;
    }

    if (columnKey === "Site Name") {
      return <span className="text-slate-800 font-medium">{value}</span>;
    }

    return <span className="text-slate-700 break-words">{value}</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Khối tiêu đề và nút Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="font-sans font-bold text-slate-900 text-base sm:text-lg tracking-tight">
              Bảng kết quả đối soát ({resultData.length} dòng)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Dữ liệu đối soát thực tế từ Tệp cần xử lý ({resultData.length} dòng) đối chiếu với Tệp Cơ Sở Dữ Liệu Gốc
          </p>
        </div>

        <button
          onClick={handleDownloadExcel}
          id="btn-export-excel"
          className="flex items-center justify-center gap-2 font-semibold text-xs px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* Tìm kiếm & Thanh bộ lọc */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm theo ID, họ tên, SĐT, Học Viên Nhập, Site Code, Site Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-xs rounded-lg py-2.5 pl-10 pr-9 transition-colors font-sans outline-none placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { tag: "ALL", label: "Tất cả", count: counts.ALL },
              {
                tag: "CORRECTED",
                label: "Đã sửa tự động",
                count: counts.CORRECTED,
              },
              { tag: "SAFE", label: "Khớp chuẩn", count: counts.SAFE },
              {
                tag: "UNRESOLVED",
                label: "Chưa khớp CSDL",
                count: counts.UNRESOLVED,
              },
              { tag: "WARNING", label: "Cảnh báo", count: counts.WARNING },
            ].map((item) => (
              <button
                key={item.tag}
                id={`filter-btn-${item.tag}`}
                onClick={() => setStatusFilter(item.tag as StatusFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                  statusFilter === item.tag
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                    statusFilter === item.tag
                      ? "bg-white/20 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Lọc theo dạng lỗi:
          </span>
          {[
            {
              tag: "SITE_ERROR",
              label: "Lệch Site Code (Học Viên Nhập ≠ Chuẩn)",
              count: counts.SITE_ERROR,
              color: "text-amber-700 bg-amber-50 border-amber-200",
            },
            {
              tag: "NAME_ERROR",
              label: "Lệch / Lỗi chính tả Tên",
              count: counts.NAME_ERROR,
              color: "text-blue-700 bg-blue-50 border-blue-200",
            },
            {
              tag: "PHONE_EXCESS",
              label: "Thừa SĐT (>10 số)",
              count: counts.PHONE_EXCESS,
              color: "text-red-700 bg-red-50 border-red-200",
            },
            {
              tag: "PHONE_MISSING",
              label: "Thiếu SĐT (<10 số)",
              count: counts.PHONE_MISSING,
              color: "text-amber-700 bg-amber-50 border-amber-200",
            },
            {
              tag: "PHONE_ERROR",
              label: "Lệch SĐT",
              count: counts.PHONE_ERROR,
              color: "text-slate-700 bg-slate-50 border-slate-200",
            },
            {
              tag: "ID_ERROR",
              label: "Lệch / Trống ID Number",
              count: counts.ID_ERROR,
              color: "text-slate-700 bg-slate-50 border-slate-200",
            },
          ].map((item) => (
            <button
              key={item.tag}
              id={`filter-error-btn-${item.tag}`}
              onClick={() => setStatusFilter(item.tag as StatusFilter)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                statusFilter === item.tag
                  ? "bg-slate-900 text-white shadow-xs border border-slate-900"
                  : `${item.color} hover:opacity-80 border`
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded tabular-nums ${
                  statusFilter === item.tag
                    ? "bg-white/20 text-white"
                    : "bg-white/80 text-slate-800"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bảng Hiển Thị Kết Quả */}
      <div
        style={{ overflowX: "auto", width: "100%" }}
        className="rounded-xl border border-slate-200/90 shadow-2xs bg-white"
      >
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/95 sticky top-0 backdrop-blur-xs text-slate-700 font-semibold text-[11px] border-b border-slate-200">
              {resultColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3.5 py-3 font-semibold whitespace-nowrap tracking-tight ${
                    column.key === "STT" || column.key === "Score"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mappedResults.length === 0 ? (
              <tr>
                <td
                  colSpan={resultColumns.length}
                  className="p-12 text-center text-slate-400"
                >
                  <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">
                    Không tìm thấy bản ghi nào khớp điều kiện lọc.
                  </p>
                </td>
              </tr>
            ) : (
              mappedResults.map((row, index) => (
                <tr
                  key={row.STT ?? index}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  {resultColumns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-3.5 py-3 align-top text-xs ${
                        column.key === "STT" || column.key === "Score"
                          ? "text-center"
                          : "text-left"
                      }`}
                    >
                      {column.key === "STT" ? (
                        <span className="font-mono tabular-nums text-slate-400 font-medium">
                          {row.STT}
                        </span>
                      ) : (
                        renderCellContent(
                          column.key,
                          row[column.key as keyof typeof row],
                          row._raw
                        )
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredResults.length > 0 && (
        <div className="text-[11px] text-slate-400 text-right">
          Hiển thị <b>{filteredResults.length}</b> trên tổng số{" "}
          <b>{resultData.length}</b> hàng dữ liệu đối soát.
        </div>
      )}
    </div>
  );
}
