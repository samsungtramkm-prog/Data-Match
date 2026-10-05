import React from "react";
import { UserRole } from "../types";
import { Shield, UserCheck, Eye, HelpCircle } from "lucide-react";

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export default function RoleSelector({ currentRole, onRoleChange }: RoleSelectorProps) {
  const roles = [
    {
      role: UserRole.QUALITY_OFFICER,
      title: "Nhân viên Kiểm soát (IQO)",
      desc: "Tải lên tài liệu, chạy chương trình sửa lỗi dũ liệu tự động, chỉnh sửa kết quả và xuất Excel sạch.",
      icon: UserCheck,
      color: "bg-slate-50/50 border-slate-200 text-slate-700",
      activeColor: "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-50",
    },
    {
      role: UserRole.ADMIN,
      title: "Quản trị viên (Admin)",
      desc: "Thay đổi cài đặt tiêu chí so khớp, xem toàn bộ thống kê chất lượng và quản trị hệ thống.",
      icon: Shield,
      color: "bg-slate-50/50 border-slate-200 text-slate-700",
      activeColor: "bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-100",
    },
    {
      role: UserRole.SUPERVISOR,
      title: "Giám sát / Quản trị đào tạo",
      desc: "Chỉ xem dashboard tổng quan, lọc danh sách điểm kém dưới 80 để lên kế hoạch bồi dưỡng.",
      icon: Eye,
      color: "bg-slate-50/50 border-slate-200 text-slate-700",
      activeColor: "bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-100",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-sans font-semibold text-slate-800 text-sm tracking-tight">Hệ thống phân quyền chi tiết (RBAC)</h3>
        <div className="group relative">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded p-2.5 w-64 z-10 font-normal leading-relaxed shadow-lg">
            Các tính năng của ứng dụng sẽ tự động ẩn/hiện hoặc khóa tùy thuộc vào phân quyền của tài khoản hiện tại.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((r) => {
          const IconComponent = r.icon;
          const isSelected = currentRole === r.role;
          return (
            <button
              key={r.role}
              id={`role-btn-${r.role}`}
              onClick={() => onRoleChange(r.role)}
              className={`p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                isSelected ? r.activeColor : `${r.color} hover:bg-slate-50 hover:border-slate-300`
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? "bg-white/20" : "bg-white border border-slate-150 shadow-sm text-slate-600"}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-xs tracking-tight mb-1">{r.title}</h4>
                  <p className={`text-[11px] leading-normal ${isSelected ? "text-white/90" : "text-slate-500"} line-clamp-2`}>
                    {r.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
