import React from "react";
import { MatchingSession } from "../types";
import { CheckCircle2, AlertTriangle, TrendingUp, Users, ShieldAlert, Sparkles, FileText } from "lucide-react";

interface DashboardStatsProps {
  session: MatchingSession;
}

export default function DashboardStats({ session }: DashboardStatsProps) {
  const cleanRate = Math.round((session.cleanRows / session.totalRows) * 100) || 0;
  const correctedRate = Math.round((session.correctedRows / session.totalRows) * 100) || 0;
  const warningRate = Math.round((session.warningRows / session.totalRows) * 100) || 0;
  const unresolvedRate = Math.round((session.unresolvedRows / session.totalRows) * 100) || 0;

  return (
    <div className="space-y-4">
      {/* THANH TỶ LỆ CHẤT LƯỢNG DỮ LIỆU TỔNG QUAN (DATA HEALTH METER) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-semibold text-slate-800">
              Tổng quan kết quả đối soát dữ liệu
            </h4>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] font-mono text-slate-500">
              {session.totalRows} hồ sơ
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              Sạch ({cleanRate}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
              Đã sửa ({correctedRate}%)
            </span>
            {session.warningRows > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                Cảnh báo ({warningRate}%)
              </span>
            )}
            {session.unresolvedRows > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                Chưa khớp ({unresolvedRate}%)
              </span>
            )}
          </div>
        </div>

        {/* Thanh phân bổ trực quan */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${cleanRate}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Sạch hoàn toàn: ${session.cleanRows} hàng (${cleanRate}%)`}
          />
          <div
            style={{ width: `${correctedRate}%` }}
            className="bg-blue-500 h-full transition-all duration-500"
            title={`Đã sửa lỗi tự động: ${session.correctedRows} hàng (${correctedRate}%)`}
          />
          <div
            style={{ width: `${warningRate}%` }}
            className="bg-amber-500 h-full transition-all duration-500"
            title={`Cảnh báo: ${session.warningRows} hàng (${warningRate}%)`}
          />
          <div
            style={{ width: `${unresolvedRate}%` }}
            className="bg-rose-500 h-full transition-all duration-500"
            title={`Chưa khớp CSDL: ${session.unresolvedRows} hàng (${unresolvedRate}%)`}
          />
        </div>
      </div>

      {/* GRID 5 THẺ CHỈ SỐ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Tổng số */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng hồ sơ</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {session.totalRows}
            </span>
            <span className="text-xs text-slate-400 font-sans">dòng</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate" title={session.originalFileName}>
            {session.originalFileName}
          </p>
        </div>

        {/* Sạch 100% */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Sạch chuẩn gốc</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
              {session.cleanRows}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
              {cleanRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Trùng khớp 100% CSDL</p>
        </div>

        {/* Đã sửa đổi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Đã sửa tự động</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-600 tabular-nums">
              {session.correctedRows}
            </span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded">
              {correctedRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sửa tên &amp; bổ sung cột</p>
        </div>

        {/* Cảnh báo điểm số / SĐT */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Cảnh báo điểm số</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
              {session.warningRows}
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
              {warningRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Điểm số &lt; 80 / lỗi SĐT</p>
        </div>

        {/* Chưa thể nhận diện */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-rose-300 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Chưa khớp CSDL</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600 tabular-nums">
              {session.unresolvedRows}
            </span>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded">
              {unresolvedRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Không có trong dữ liệu gốc</p>
        </div>
      </div>
    </div>
  );
}
