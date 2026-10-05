export enum UserRole {
  ADMIN = "ADMIN",
  QUALITY_OFFICER = "QUALITY_OFFICER",
  SUPERVISOR = "SUPERVISOR",
}

export interface MasterRecord {
  stt: number;
  id: string; // ID Number (string, giữ số 0 đầu)
  IDNumber: string;
  name: string; // Name
  Name: string;
  phone: string; // Phone (string, giữ số 0 đầu)
  Phone: string;
  siteCode: string; // Site code (string, giữ số 0 đầu)
  siteName: string; // Site name
  district: string; // District
  city: string; // City
  address: string; // Địa chỉ / Detail Address
  detailAddress: string;
  customer: string; // Customer
  customerMerge: string; // Customer - Merge
  sellInType: string; // Sell In Type
  salesRegion: string; // Sales Region
  region2: string; // Region2 / Region
  region: string;
  shopGrade: string; // Shop Grade
  internalExternal: string; // Internal/ External
  traineeType: string; // Trainee Type
  surveyCode?: string;
  department?: string;
  rawRow: Record<string, string>;
}

export interface InputRecord {
  stt: number;
  id: string; // ID Number học viên
  IDNumber: string;
  name: string; // Name học viên
  Name: string;
  phone: string; // Phone học viên (string, giữ số 0 đầu)
  Phone: string;
  inputSiteCode: string; // Mã siêu thị của bạn / Học Viên Nhập
  inputSiteName: string; // Tên siêu thị của bạn
  inputCustomer: string; // Bạn đang làm việc tại chuỗi hệ thống bán lẻ nào?
  score: number | string; // Điểm số
  employeeBranch: string; // Bạn là Nhân viên Samsung hay Nhân viên Đại lý
  internalExternal: string;
  traineeType: string; // Vị trí làm việc của bạn
  surveyCode?: string;
  department?: string;
  rawRow: Record<string, string>;
}

export type DataRow = MasterRecord | InputRecord;

export interface ParsedFileMeta {
  fileName: string;
  sheetName: string;
  headers: string[];
  normalizedHeaders: string[];
  rowCount: number;
  colCount: number;
}

export interface MatchingResult {
  rowNum: number;
  STT: number;

  // Dữ liệu học viên từ inputData
  IDNumber: string;
  Name: string;
  Phone: string;

  // Dữ liệu học viên nhập (giữ riêng, không ghi đè)
  HocVienNhap: string;
  inputSiteCode: string;
  inputSiteName: string;
  inputCustomer: string;

  // Dữ liệu chuẩn từ Master Database (giữ riêng)
  masterSiteCode: string;
  masterSiteName: string;
  SiteCode: string;
  SiteName: string;
  District: string;
  City: string;
  DetailAddress: string;
  ShopGrade: string;
  Customer: string;
  CustomerMerge: string;
  SellInType: string;
  SalesRegion: string;
  Region: string;
  InternalExternal: string;
  TraineeType: string;

  Score: number | string;

  // Các trường phục vụ đối chiếu chi tiết và hiển thị trạng thái
  originalStt?: number;
  originalId: string;
  originalName: string;
  originalPhone: string;
  originalInternalExternal?: string;
  originalTraineeType?: string;
  originalCustomerMerge?: string;
  originalStudentInput?: string;
  originalSiteCode?: string;
  originalSiteName?: string;
  originalDistrict?: string;
  originalCity?: string;
  originalDetailAddress?: string;
  originalShopGrade?: string;
  originalCustomer?: string;
  originalSellInType?: string;
  originalSalesRegion?: string;
  originalRegion?: string;
  originalScore: number;
  originalSurveyCode?: string;
  originalDept?: string;

  correctedStt?: number;
  correctedId: string;
  correctedName: string;
  correctedPhone: string;
  correctedInternalExternal?: string;
  correctedTraineeType?: string;
  correctedCustomerMerge?: string;
  correctedStudentInput?: string;
  correctedSiteCode?: string;
  correctedSiteName?: string;
  correctedDistrict?: string;
  correctedCity?: string;
  correctedDetailAddress?: string;
  correctedShopGrade?: string;
  correctedCustomer?: string;
  correctedSellInType?: string;
  correctedSalesRegion?: string;
  correctedRegion?: string;
  correctedScore: number;
  correctedSurveyCode?: string;
  correctedDept?: string;

  matchedMaster: boolean;
  isChanged: boolean;
  errors: {
    idError: boolean;
    nameError: boolean;
    phoneError: boolean;
    phoneExcessError?: boolean;
    phoneMissingError?: boolean;
    scoreWarning: boolean;
    siteError: boolean;
    deptError: boolean;
    surveyError: boolean;
  };
  nameSimilarityScore?: number;
  reconciliationStatus: "corrected" | "safe" | "cannot_resolve" | "warning";
  explanation: string;
}

export interface MatchingSession {
  id: string;
  timestamp: string;
  originalFileName: string;
  masterFileName: string;
  totalRows: number;
  cleanRows: number;
  correctedRows: number;
  warningRows: number;
  unresolvedRows: number;
  results: MatchingResult[];
  operator: string;
}

export interface MatchingCriteria {
  minScoreThreshold: number;
  strictPhoneFormatting: boolean;
  autoReconcileNames: boolean;
  autoReconcileIds: boolean;
  deduplicateByNameHighestScore: boolean;
  onlyFixNameTypos: boolean;
  maxPhoneDigits: number;
  minNameSimilarityThreshold: number;
}
