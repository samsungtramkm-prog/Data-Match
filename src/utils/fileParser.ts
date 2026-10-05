import * as XLSX from "xlsx";
import { InputRecord, MasterRecord, ParsedFileMeta } from "../types";

/**
 * Chuẩn hóa chuỗi header:
 * - Normalize Unicode NFC
 * - Xóa ký tự ẩn / BOM / non-breaking space
 * - Thay xuống dòng, tab bằng khoảng trắng
 * - Chuẩn hóa khoảng trắng quanh dấu ':' (ví dụ "bạn: 2", "bạn :  2" -> "bạn: 2", "bạn: " cuối câu -> "bạn:")
 * - Gom nhiều khoảng trắng liên tiếp thành 1 khoảng trắng
 * - Trim khoảng trắng đầu/cuối
 *
 * Ví dụ:
 * "  Mã   số nhân viên của bạn: 2 " -> "Mã số nhân viên của bạn: 2"
 */
export function normalizeHeader(raw: any): string {
  if (raw === null || raw === undefined) return "";
  return String(raw)
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Chuẩn hóa header phục vụ so khớp tên cột không phụ thuộc hoa/thường hay dấu ':' ở cuối
 */
export function normalizeHeaderKey(raw: any): string {
  const norm = normalizeHeader(raw).toLowerCase();
  return norm
    .replace(/:\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Chuyển giá trị ô Excel sang dạng TEXT (string), giữ nguyên số 0 ở đầu
 * và tuyệt đối không chuyển sang scientific notation.
 */
export function toTextString(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") {
    return val
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
      .trim();
  }
  if (typeof val === "number") {
    if (isNaN(val)) return "";
    // Không bao giờ để số bị chuyển sang dạng scientific notation (ví dụ 1.23e+10)
    return val.toLocaleString("fullwide", { useGrouping: false }).trim();
  }
  return String(val).trim();
}

/**
 * Tiền xử lý worksheet để đảm bảo các ô số (ID, Phone, Site Code)
 * giữ nguyên số 0 ở đầu nếu có định dạng text/custom format,
 * và không bị biến thành scientific notation hoặc bị chèn dấu phẩy phân cách hàng nghìn.
 */
function sanitizeWorksheetCells(ws: XLSX.WorkSheet): void {
  for (const key of Object.keys(ws)) {
    if (key.startsWith("!")) continue;
    const cell = ws[key] as XLSX.CellObject | undefined;
    if (!cell) continue;

    if (cell.t === "n" && typeof cell.v === "number") {
      const formatted = typeof cell.w === "string" ? cell.w.trim() : "";
      if (!formatted || /[eE][+-]?\d+/.test(formatted)) {
        cell.w = cell.v.toLocaleString("fullwide", { useGrouping: false });
      } else if (/^0\d+$/.test(formatted)) {
        // Giữ nguyên số 0 ở đầu từ định dạng ô Excel (ví dụ "04521" hoặc "0972147072")
        cell.w = formatted;
      } else if (/^\d{1,3}(,\d{3})+$/.test(formatted)) {
        // Tránh dấu phẩy phân cách hàng nghìn làm biến dạng ID hoặc SĐT
        cell.w = cell.v.toLocaleString("fullwide", { useGrouping: false });
      }
    }
  }
}

/**
 * Đọc File Excel từ người dùng:
 * File -> ArrayBuffer -> XLSX.read()
 */
export async function readWorkbookFromFile(file: File): Promise<XLSX.WorkBook> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: true,
    cellNF: true,
    cellText: true,
    raw: false,
  });
  return workbook;
}

/**
 * Tìm sheet có dữ liệu thực tế trong workbook và trích xuất:
 * - Dòng đầu tiên của bảng làm HEADER (originalHeaders & normalizedHeaders)
 * - Toàn bộ các dòng dữ liệu còn lại (không giới hạn số cột hay số dòng)
 */
export function extractSheetData(workbook: XLSX.WorkBook): {
  sheetName: string;
  originalHeaders: string[];
  normalizedHeaders: string[];
  rawRows: string[][];
} {
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("File Excel không có trang tính (Sheet) nào.");
  }

  let selectedSheetName = workbook.SheetNames[0];
  let selectedMatrix: any[][] = [];

  // Chọn sheet đầu tiên có dữ liệu thực tế (nhiều hơn 1 dòng có dữ liệu)
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;

    sanitizeWorksheetCells(ws);

    const matrix: any[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: false,
      defval: "",
    });

    const nonEmptyRows = matrix.filter(
      (row) =>
        Array.isArray(row) &&
        row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")
    );

    if (nonEmptyRows.length > 0) {
      selectedSheetName = sheetName;
      selectedMatrix = matrix;
      if (nonEmptyRows.length > 1) {
        break;
      }
    }
  }

  if (selectedMatrix.length === 0) {
    return {
      sheetName: selectedSheetName,
      originalHeaders: [],
      normalizedHeaders: [],
      rawRows: [],
    };
  }

  // Tìm dòng đầu tiên của bảng có dữ liệu làm HEADER
  let headerRowIndex = 0;
  for (let i = 0; i < selectedMatrix.length; i++) {
    const row = selectedMatrix[i];
    if (
      Array.isArray(row) &&
      row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRowRaw = selectedMatrix[headerRowIndex] || [];

  // Xác định số lượng cột tối đa trên toàn bộ bảng (không giới hạn 18 hay 19 cột)
  let maxCols = headerRowRaw.length;
  for (let i = headerRowIndex + 1; i < selectedMatrix.length; i++) {
    const row = selectedMatrix[i];
    if (Array.isArray(row) && row.length > maxCols) {
      maxCols = row.length;
    }
  }

  const originalHeaders: string[] = [];
  const normalizedHeaders: string[] = [];
  const seenBaseHeaders = new Map<string, number>();

  for (let c = 0; c < maxCols; c++) {
    const rawH = headerRowRaw[c] !== undefined ? String(headerRowRaw[c]) : "";
    const normH = normalizeHeader(rawH);

    // Giữ nguyên originalHeader để debug
    originalHeaders.push(rawH !== "" ? rawH : `Column_${c + 1}`);

    // Nếu trong file có 2 cột trùng hệt tên nhau (ví dụ chưa đánh số : 2),
    // tự động ghi nhận lần xuất hiện thứ 2 trở đi là ": 2", ": 3"...
    const baseKey = normalizeHeaderKey(normH);
    if (baseKey) {
      const count = (seenBaseHeaders.get(baseKey) || 0) + 1;
      seenBaseHeaders.set(baseKey, count);
      if (count > 1 && !/[:\s_]\d+$/.test(normH)) {
        normalizedHeaders.push(`${normH.replace(/:\s*$/, "")}: ${count}`);
      } else {
        normalizedHeaders.push(normH);
      }
    } else {
      normalizedHeaders.push(`Column_${c + 1}`);
    }
  }

  // Đọc TOÀN BỘ các dòng còn lại sau dòng HEADER
  const rawRows: string[][] = [];
  for (let r = headerRowIndex + 1; r < selectedMatrix.length; r++) {
    const row = selectedMatrix[r];
    if (!Array.isArray(row)) continue;

    const hasContent = row.some(
      (cell) => cell !== null && cell !== undefined && String(cell).trim() !== ""
    );
    if (!hasContent) continue;

    const rowValues: string[] = [];
    for (let c = 0; c < maxCols; c++) {
      rowValues.push(toTextString(row[c]));
    }
    rawRows.push(rowValues);
  }

  return {
    sheetName: selectedSheetName,
    originalHeaders,
    normalizedHeaders,
    rawRows,
  };
}

/**
 * Tìm vị trí cột trong danh sách normalizedHeaders
 */
function findColumnIndex(
  normalizedHeaders: string[],
  exactMatches: string[],
  partialMatches: string[] = [],
  excludeIndices: number[] = []
): number {
  const compareHeaders = normalizedHeaders.map((h) => normalizeHeaderKey(h));

  // 1. Ưu tiên khớp chính xác (sau khi normalizeHeaderKey)
  for (const target of exactMatches) {
    const normTarget = normalizeHeaderKey(target);
    for (let i = 0; i < compareHeaders.length; i++) {
      if (excludeIndices.includes(i)) continue;
      if (compareHeaders[i] === normTarget) {
        return i;
      }
    }
  }

  // 2. Khớp chứa cụm từ (partial match)
  for (const partial of partialMatches) {
    const normPartial = normalizeHeaderKey(partial);
    for (let i = 0; i < compareHeaders.length; i++) {
      if (excludeIndices.includes(i)) continue;
      if (compareHeaders[i].includes(normPartial)) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * ĐỌC TỆP CƠ SỞ DỮ LIỆU GỐC (MASTER DATABASE)
 * Các cột có thể gồm:
 * - ID number
 * - Name
 * - Phone
 * - Site code
 * - Site name
 * - District
 * - City
 * - Địa chỉ / Detail Address
 * - Customer / Customer - Merge
 * - Sell In Type
 * - Sales Region
 * - Region2 / Region
 */
export function parseMasterWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string
): {
  meta: ParsedFileMeta;
  data: MasterRecord[];
} {
  const { sheetName, originalHeaders, normalizedHeaders, rawRows } =
    extractSheetData(workbook);

  const idIdx = findColumnIndex(
    normalizedHeaders,
    [
      "ID number",
      "ID Number",
      "ID_Number",
      "IDNumber",
      "ID",
      "Mã số nhân viên",
      "Mã nhân viên",
      "MSNV",
      "Mã số nhân viên của bạn: 2",
      "Mã số nhân viên của bạn",
    ],
    ["id number", "mã số nhân viên", "mã nhân viên"]
  );

  const nameIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Name",
      "Họ và tên",
      "Họ tên",
      "Full Name",
      "Fullname",
      "Họ tên đầy đủ của bạn: 2",
      "Họ tên đầy đủ của bạn",
    ],
    ["name", "họ tên", "họ và tên"],
    [idIdx]
  );

  const phoneIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Phone",
      "Phone Number",
      "Số điện thoại",
      "SĐT",
      "SDT",
      "Tel",
      "Mobile",
      "Số điện thoại của bạn: 2",
      "Số điện thoại của bạn",
    ],
    ["phone", "số điện thoại", "điện thoại"]
  );

  const siteCodeIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Site code",
      "Site Code",
      "Sitecode",
      "Site_Code",
      "Mã siêu thị",
      "Mã cửa hàng",
      "Mã cơ sở",
    ],
    ["site code", "sitecode", "mã siêu thị"]
  );

  const siteNameIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Site name",
      "Site Name",
      "Sitename",
      "Site_Name",
      "Tên siêu thị",
      "Tên cửa hàng",
      "Tên cơ sở",
    ],
    ["site name", "sitename", "tên siêu thị"],
    [siteCodeIdx]
  );

  const districtIdx = findColumnIndex(
    normalizedHeaders,
    ["District", "Quận/Huyện", "Quận / Huyện", "Quận Huyện", "Quận", "Huyện"],
    ["district", "quận", "huyện"]
  );

  const cityIdx = findColumnIndex(
    normalizedHeaders,
    [
      "City",
      "Tỉnh/Thành phố",
      "Tỉnh / Thành phố",
      "Tỉnh/TP",
      "Thành phố",
      "Tỉnh",
      "Province",
    ],
    ["city", "thành phố", "province", "tỉnh"]
  );

  const addressIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Địa chỉ",
      "Detail Address",
      "Địa chỉ chi tiết",
      "Address",
      "Detail_Address",
    ],
    ["địa chỉ", "detail address", "address"]
  );

  const customerMergeIdx = findColumnIndex(
    normalizedHeaders,
    ["Customer - Merge", "Customer-Merge", "Customer Merge", "Customer_Merge"],
    ["customer - merge", "customer merge"]
  );

  const customerIdx = findColumnIndex(
    normalizedHeaders,
    ["Customer", "Khách hàng", "Hệ thống"],
    ["customer", "khách hàng"],
    customerMergeIdx !== -1 ? [customerMergeIdx] : []
  );

  const sellInTypeIdx = findColumnIndex(
    normalizedHeaders,
    ["Sell In Type", "Sell-In Type", "SellInType", "Sell_In_Type", "Sell in"],
    ["sell in"]
  );

  const salesRegionIdx = findColumnIndex(
    normalizedHeaders,
    ["Sales Region", "SalesRegion", "Sales_Region", "Khu vực bán hàng", "Vùng bán hàng"],
    ["sales region"]
  );

  const region2Idx = findColumnIndex(
    normalizedHeaders,
    ["Region2", "Region 2", "Region_2", "Region", "Vùng", "Miền"],
    ["region2", "region"],
    salesRegionIdx !== -1 ? [salesRegionIdx] : []
  );

  const shopGradeIdx = findColumnIndex(
    normalizedHeaders,
    ["Shop Grade", "ShopGrade", "Shop_Grade", "Hạng cửa hàng"],
    ["shop grade"]
  );

  const internalExternalIdx = findColumnIndex(
    normalizedHeaders,
    ["Internal/ External", "Internal/External", "Internal / External"],
    ["internal"]
  );

  const traineeTypeIdx = findColumnIndex(
    normalizedHeaders,
    ["Trainee Type", "TraineeType", "Loại học viên", "Vị trí"],
    ["trainee type"]
  );

  const getVal = (row: string[], idx: number): string => {
    if (idx < 0 || idx >= row.length) return "";
    return toTextString(row[idx]);
  };

  const data: MasterRecord[] = rawRows.map((row, idx) => {
    const rawRowObj: Record<string, string> = {};
    for (let c = 0; c < originalHeaders.length; c++) {
      const key = normalizedHeaders[c] || originalHeaders[c] || `Col_${c + 1}`;
      rawRowObj[key] = toTextString(row[c]);
    }

    const idVal = getVal(row, idIdx);
    const nameVal = getVal(row, nameIdx);
    const phoneVal = getVal(row, phoneIdx);
    const siteCodeVal = getVal(row, siteCodeIdx);
    const siteNameVal = getVal(row, siteNameIdx);
    const districtVal = getVal(row, districtIdx);
    const cityVal = getVal(row, cityIdx);
    const addressVal = getVal(row, addressIdx);
    const custVal = getVal(row, customerIdx);
    const custMergeVal = getVal(row, customerMergeIdx) || custVal;
    const sellInVal = getVal(row, sellInTypeIdx);
    const salesRegionVal = getVal(row, salesRegionIdx);
    const region2Val = getVal(row, region2Idx);
    const shopGradeVal = getVal(row, shopGradeIdx);
    const intExtVal = getVal(row, internalExternalIdx);
    const traineeVal = getVal(row, traineeTypeIdx);

    return {
      stt: idx + 1,
      id: idVal,
      IDNumber: idVal,
      name: nameVal,
      Name: nameVal,
      phone: phoneVal,
      Phone: phoneVal,
      siteCode: siteCodeVal,
      siteName: siteNameVal,
      district: districtVal,
      city: cityVal,
      address: addressVal,
      detailAddress: addressVal,
      customer: custVal || custMergeVal,
      customerMerge: custMergeVal || custVal,
      sellInType: sellInVal,
      salesRegion: salesRegionVal,
      region2: region2Val,
      region: region2Val,
      shopGrade: shopGradeVal,
      internalExternal: intExtVal,
      traineeType: traineeVal,
      rawRow: rawRowObj,
    };
  });

  return {
    meta: {
      fileName,
      sheetName,
      headers: originalHeaders,
      normalizedHeaders,
      rowCount: data.length,
      colCount: originalHeaders.length,
    },
    data,
  };
}

/**
 * ĐỌC TỆP CẦN XỬ LÝ (INPUT FILE)
 *
 * Hỗ trợ cấu trúc thực tế của Tệp cần xử lý:
 * - Dấu thời gian
 * - Điểm số -> Score
 * - Chọn vùng tham gia lớp học của bạn:
 * - Chọn mã lớp học: / 2 / 3 / 4
 * - Bạn là Nhân viên Samsung hay Nhân viên Đại lý
 * - Vị trí làm việc của bạn
 * - Mã số nhân viên của bạn:
 * - Họ tên đầy đủ của bạn:
 * - Số điện thoại của bạn:
 * - Sitecode của bạn:
 * - Bạn đang làm việc tại chuỗi hệ thống bán lẻ nào? -> Customer học viên nhập
 * - Mã số nhân viên của bạn: 2 -> ID Number (Nhân viên Đại Lý)
 * - Họ tên đầy đủ của bạn: 2 -> Name (Nhân viên Đại Lý)
 * - Số điện thoại của bạn: 2 -> Phone (Nhân viên Đại Lý)
 * - Mã siêu thị của bạn: -> Học Viên Nhập / Input Site Code
 * - Tên siêu thị của bạn: -> Input Site Name
 */
export function parseInputWorkbook(
  workbook: XLSX.WorkBook,
  fileName: string
): {
  meta: ParsedFileMeta;
  data: InputRecord[];
} {
  const { sheetName, originalHeaders, normalizedHeaders, rawRows } =
    extractSheetData(workbook);

  // Cột phân nhánh nhân viên (Samsung hay Đại lý)
  const branchIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Bạn là Nhân viên Samsung hay Nhân viên Đại lý",
      "Internal/ External",
      "Internal/External",
    ],
    ["nhân viên samsung hay nhân viên đại lý", "internal/ external"]
  );

  const positionIdx = findColumnIndex(
    normalizedHeaders,
    ["Vị trí làm việc của bạn", "Trainee Type", "Vị trí làm việc"],
    ["vị trí làm việc", "trainee type"]
  );

  // Cột của Nhân viên Đại Lý (: 2)
  const dealerIdIdx = findColumnIndex(normalizedHeaders, [
    "Mã số nhân viên của bạn: 2",
    "Mã số nhân viên của bạn 2",
    "Mã số nhân viên của bạn_1",
  ]);

  const dealerNameIdx = findColumnIndex(normalizedHeaders, [
    "Họ tên đầy đủ của bạn: 2",
    "Họ tên đầy đủ của bạn 2",
    "Họ tên đầy đủ của bạn_1",
  ]);

  const dealerPhoneIdx = findColumnIndex(normalizedHeaders, [
    "Số điện thoại của bạn: 2",
    "Số điện thoại của bạn 2",
    "Số điện thoại của bạn_1",
  ]);

  // Cột của Nhân viên Samsung hoặc cột chuẩn chung
  const primaryIdIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Mã số nhân viên của bạn",
      "ID Number",
      "ID number",
      "IDNumber",
      "Mã số nhân viên",
      "Mã nhân viên",
      "MSNV",
    ],
    ["id number", "mã số nhân viên", "mã nhân viên"],
    dealerIdIdx !== -1 ? [dealerIdIdx] : []
  );

  const primaryNameIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Họ tên đầy đủ của bạn",
      "Name",
      "Họ và tên",
      "Họ tên",
      "Full Name",
    ],
    ["họ tên đầy đủ", "name", "họ tên", "họ và tên"],
    [dealerNameIdx, dealerIdIdx, primaryIdIdx].filter((x) => x !== -1)
  );

  const primaryPhoneIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Số điện thoại của bạn",
      "Phone",
      "Số điện thoại",
      "Phone Number",
      "SĐT",
      "SDT",
    ],
    ["số điện thoại", "phone"],
    dealerPhoneIdx !== -1 ? [dealerPhoneIdx] : []
  );

  // Mã siêu thị của bạn -> Học Viên Nhập / Input Site Code
  const dealerSiteCodeIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Mã siêu thị của bạn",
      "Học Viên Nhập",
      "Input Site Code",
      "Mã siêu thị",
    ],
    ["mã siêu thị của bạn", "học viên nhập", "mã siêu thị"]
  );

  // Sitecode của bạn (cột của nhánh Samsung hoặc Site Code chung)
  const secondarySiteCodeIdx = findColumnIndex(
    normalizedHeaders,
    ["Sitecode của bạn", "Site Code", "Site code", "Sitecode"],
    ["sitecode của bạn", "site code", "sitecode"],
    dealerSiteCodeIdx !== -1 ? [dealerSiteCodeIdx] : []
  );

  // Tên siêu thị của bạn -> Input Site Name
  const inputSiteNameIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Tên siêu thị của bạn",
      "Tên siêu thị",
      "Site Name",
      "Site name",
      "Sitename",
    ],
    ["tên siêu thị của bạn", "tên siêu thị", "site name"]
  );

  // Điểm số -> Score
  const scoreIdx = findColumnIndex(
    normalizedHeaders,
    ["Điểm số", "Score", "Điểm", "Điểm thi", "Tổng điểm", "Kết quả"],
    ["điểm số", "score", "điểm thi"]
  );

  // Bạn đang làm việc tại chuỗi hệ thống bán lẻ nào? -> Customer học viên nhập
  const inputCustomerIdx = findColumnIndex(
    normalizedHeaders,
    [
      "Bạn đang làm việc tại chuỗi hệ thống bán lẻ nào?",
      "Bạn đang làm việc tại chuỗi hệ thống bán lẻ nào",
      "Customer",
      "Customer - Merge",
    ],
    ["chuỗi hệ thống bán lẻ", "customer"]
  );

  const getVal = (row: string[], idx: number): string => {
    if (idx < 0 || idx >= row.length) return "";
    return toTextString(row[idx]);
  };

  const parseScoreValue = (rawScore: string): number | string => {
    if (!rawScore) return "";
    // Hỗ trợ định dạng "85 / 100" hoặc "85" hoặc "85,5"
    const cleaned = rawScore.split("/")[0].trim().replace(",", ".");
    const num = Number(cleaned);
    if (!isNaN(num) && cleaned !== "") {
      return num;
    }
    const floatVal = parseFloat(cleaned);
    if (!isNaN(floatVal)) {
      return floatVal;
    }
    return rawScore;
  };

  const data: InputRecord[] = rawRows.map((row, idx) => {
    const rawRowObj: Record<string, string> = {};
    for (let c = 0; c < originalHeaders.length; c++) {
      const key = normalizedHeaders[c] || originalHeaders[c] || `Col_${c + 1}`;
      rawRowObj[key] = toTextString(row[c]);
    }

    const branchVal = getVal(row, branchIdx);
    const isDealerRow =
      branchVal.toLowerCase().includes("đại lý") ||
      branchVal.toLowerCase().includes("dai ly") ||
      branchVal.toLowerCase().includes("external");
    const isSamsungRow =
      branchVal.toLowerCase().includes("samsung") && !isDealerRow;

    // Mapping theo đúng quy tắc "Nhân viên Đại Lý":
    // Mã số nhân viên của bạn: 2 -> ID Number
    // Họ tên đầy đủ của bạn: 2 -> Name
    // Số điện thoại của bạn: 2 -> Phone
    // Mã siêu thị của bạn: -> Học Viên Nhập / Input Site Code
    // Tên siêu thị của bạn: -> Input Site Name
    // Điểm số -> Score
    // Bạn đang làm việc tại chuỗi hệ thống bán lẻ nào? -> Customer học viên nhập
    let idVal = "";
    let nameVal = "";
    let phoneVal = "";
    let inputSiteCodeVal = "";

    if (dealerIdIdx !== -1 || dealerNameIdx !== -1 || dealerPhoneIdx !== -1) {
      if (isSamsungRow) {
        idVal = getVal(row, primaryIdIdx) || getVal(row, dealerIdIdx);
        nameVal = getVal(row, primaryNameIdx) || getVal(row, dealerNameIdx);
        phoneVal = getVal(row, primaryPhoneIdx) || getVal(row, dealerPhoneIdx);
        inputSiteCodeVal =
          getVal(row, secondarySiteCodeIdx) || getVal(row, dealerSiteCodeIdx);
      } else {
        // Mặc định hoặc Nhân viên Đại Lý: lấy từ các cột : 2 và Mã siêu thị của bạn:
        idVal =
          dealerIdIdx !== -1
            ? getVal(row, dealerIdIdx) || (!isDealerRow ? getVal(row, primaryIdIdx) : "")
            : getVal(row, primaryIdIdx);
        nameVal =
          dealerNameIdx !== -1
            ? getVal(row, dealerNameIdx) || (!isDealerRow ? getVal(row, primaryNameIdx) : "")
            : getVal(row, primaryNameIdx);
        phoneVal =
          dealerPhoneIdx !== -1
            ? getVal(row, dealerPhoneIdx) || (!isDealerRow ? getVal(row, primaryPhoneIdx) : "")
            : getVal(row, primaryPhoneIdx);
        inputSiteCodeVal =
          dealerSiteCodeIdx !== -1
            ? getVal(row, dealerSiteCodeIdx) || (!isDealerRow ? getVal(row, secondarySiteCodeIdx) : "")
            : getVal(row, secondarySiteCodeIdx);
      }
    } else {
      // File có cấu trúc bảng phẳng thông thường
      idVal = getVal(row, primaryIdIdx);
      nameVal = getVal(row, primaryNameIdx);
      phoneVal = getVal(row, primaryPhoneIdx);
      inputSiteCodeVal =
        dealerSiteCodeIdx !== -1
          ? getVal(row, dealerSiteCodeIdx)
          : getVal(row, secondarySiteCodeIdx);
    }

    const inputSiteNameVal = getVal(row, inputSiteNameIdx);
    const inputCustomerVal = getVal(row, inputCustomerIdx);
    const rawScoreStr = getVal(row, scoreIdx);
    const scoreVal = parseScoreValue(rawScoreStr);
    const traineeTypeVal = getVal(row, positionIdx);

    return {
      stt: idx + 1,
      id: idVal,
      IDNumber: idVal,
      name: nameVal,
      Name: nameVal,
      phone: phoneVal,
      Phone: phoneVal,
      inputSiteCode: inputSiteCodeVal,
      inputSiteName: inputSiteNameVal,
      inputCustomer: inputCustomerVal,
      score: scoreVal,
      employeeBranch: branchVal,
      internalExternal: branchVal,
      traineeType: traineeTypeVal,
      rawRow: rawRowObj,
    };
  });

  return {
    meta: {
      fileName,
      sheetName,
      headers: originalHeaders,
      normalizedHeaders,
      rowCount: data.length,
      colCount: originalHeaders.length,
    },
    data,
  };
}
