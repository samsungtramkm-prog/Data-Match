import React, { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, LogIn, UserPlus, ShieldCheck, FileSpreadsheet } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (userId: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Kiểm tra xem đã có tài khoản lưu trữ hay chưa
  const [hasStoredAccount, setHasStoredAccount] = useState<boolean>(false);
  const [storedUserId, setStoredUserId] = useState<string>("");

  useEffect(() => {
    const savedId = localStorage.getItem("data_match_user_id");
    const savedPw = localStorage.getItem("data_match_password");
    if (savedId && savedPw) {
      setHasStoredAccount(true);
      setStoredUserId(savedId);
    } else {
      setHasStoredAccount(false);
      // Nếu chưa có tài khoản thì hiển thị màn Đăng ký trước
      setIsRegistering(true);
    }
  }, []);

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedId = userId.trim();
    if (!trimmedId) {
      setErrorMsg("Vui lòng nhập ID tài khoản.");
      return;
    }
    if (!password) {
      setErrorMsg("Vui lòng nhập mật khẩu.");
      return;
    }

    if (isRegistering) {
      if (password.length < 4) {
        setErrorMsg("Mật khẩu phải chứa ít nhất 4 ký tự.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Mật khẩu xác nhận không trùng khớp.");
        return;
      }

      // Đăng ký tài khoản mới và ghi đè vào localStorage
      localStorage.setItem("data_match_user_id", trimmedId);
      localStorage.setItem("data_match_password", password);
      
      setSuccessMsg("Tạo tài khoản thành công! Hãy đăng nhập bằng thông tin vừa tạo.");
      setHasStoredAccount(true);
      setStoredUserId(trimmedId);
      setIsRegistering(false);
      setPassword("");
      setConfirmPassword("");
    } else {
      // Tiến hành Đăng nhập
      const savedId = localStorage.getItem("data_match_user_id") || "";
      const savedPw = localStorage.getItem("data_match_password") || "";

      if (trimmedId.toLowerCase() === savedId.toLowerCase() && password === savedPw) {
        onLoginSuccess(savedId);
      } else {
        setErrorMsg("Nhập sai ID tài khoản hoặc Mật khẩu. Vui lòng thử lại.");
      }
    }
  };

  const handleResetPassword = () => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại (xóa) tài khoản hiện tại để tạo ID và Mật khẩu mới không? Giao diện sẽ tải lại.")) {
      localStorage.removeItem("data_match_user_id");
      localStorage.removeItem("data_match_password");
      setHasStoredAccount(false);
      setIsRegistering(true);
      setUserId("");
      setPassword("");
      setConfirmPassword("");
      setErrorMsg("");
      setSuccessMsg("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center bg-blue-600 text-white p-3.5 rounded-2xl shadow-sm mb-4">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          DataMatch Pro
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          Hệ thống đối soát chất lượng thông tin, hiệu chỉnh sai lệch danh sách và chuẩn hóa điểm số giáo vụ thông minh.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-9 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex border-b border-slate-100 pb-1 justify-center space-x-8">
            <button
              onClick={() => {
                setIsRegistering(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-b-2 px-1 ${
                !isRegistering
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                setIsRegistering(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-b-2 px-1 ${
                isRegistering
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Tạo tài khoản mới
            </button>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isRegistering
                ? "Thiết lập một ID tài khoản và mật khẩu bảo mật riêng để quản lý các phiên đối soát dữ liệu."
                : hasStoredAccount
                ? `Đăng nhập sử dụng tài khoản ID quản trị đã lưu trên thiết bị (${storedUserId}).`
                : "Đăng nhập để vào không gian làm việc đối soát dữ liệu."
              }
            </p>
          </div>

          <form onSubmit={handleAction} className="space-y-4">
            {/* ALERT BÁO LỖI / THÀNH CÔNG */}
            {errorMsg && (
              <div className="bg-red-50 text-red-700 border border-red-200/70 p-3 rounded-lg text-xs font-medium leading-relaxed">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/70 p-3 rounded-lg text-xs font-medium leading-relaxed flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TRƯỜNG ID TÀI KHOẢN */}
            <div>
              <label htmlFor="user-id" className="block text-xs font-semibold text-slate-700 mb-1">
                ID Tài khoản (Mã định danh)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="user-id"
                  type="text"
                  required
                  placeholder="Ví dụ: samsung_admin, gv_huynhtram"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-xs rounded-lg py-2.5 pl-9 pr-3 transition-colors font-sans outline-none placeholder-slate-400 text-slate-800"
                />
              </div>
            </div>

            {/* TRƯỜNG MẬT KHẨU */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-xs rounded-lg py-2.5 pl-9 pr-10 transition-colors font-mono outline-none placeholder-slate-400 text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* XÁC NHẬN MẬT KHẨU (NẾU ĐĂNG KÝ) */}
            {isRegistering && (
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="confirm-password"
                    type={passwordVisible ? "text" : "password"}
                    required={isRegistering}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-xs rounded-lg py-2.5 pl-9 pr-10 transition-colors font-mono outline-none placeholder-slate-400 text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* NÚT THỰC THI */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 font-semibold text-xs px-5 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {isRegistering ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Tạo Tài Khoản Hoạt Động
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Kích Hoạt Vào Hệ Thống
                </>
              )}
            </button>

            {/* ĐĂNG NHẬP NHANH */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onLoginSuccess("samsung_admin")}
                className="w-full flex items-center justify-center gap-1.5 font-medium text-xs px-4 py-2.5 rounded-lg text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/70 transition-colors cursor-pointer"
              >
                <span>Vào nhanh hệ thống (samsung_admin)</span>
              </button>
            </div>
          </form>

          {/* RESET SANG MÀN HÌNH TẠO ID MỚI TRONG TRƯỜNG HỢP MUỐN XÓA TÀI KHOẢN CŨ */}
          {hasStoredAccount && (
            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-[11px] text-slate-400 hover:text-red-500 transition-colors underline cursor-pointer"
              >
                Xóa hoặc Đặt lại tài khoản cũ đã lưu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
