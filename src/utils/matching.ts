import {
  InputRecord,
  MasterRecord,
  MatchingCriteria,
  MatchingResult,
} from "../types";

/**
 * Chuẩn hóa ID:
 * - Convert về string
 * - Trim nhưng giữ nguyên số 0 ở đầu (ví dụ "04521" giữ nguyên "04521")
 */
export function normalizeID(id: any): string {
  if (id === null || id === undefined) return "";
  return String(id)
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .trim();
}

/**
 * Chuẩn hóa Phone:
 * - Convert về string
 * - Trim
 * - Loại bỏ khoảng trắng và dấu phân cách không cần thiết
 * - Giữ nguyên số 0 ở đầu (ví dụ "0972147072" giữ nguyên "0972147072")
 */
export function normalizePhone(phone: any): string {
  if (phone === null || phone === undefined) return "";
  let cleaned = String(phone)
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .trim()
    .replace(/[\s\.\-\(\)]+/g, "");

  if (cleaned.startsWith("+84") && cleaned.length > 9) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("84") && cleaned.length === 11) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Chuẩn hóa Name:
 * - Trim
 * - Lowercase
 * - Normalize Unicode (NFC)
 * - Loại bỏ khoảng trắng dư
 */
export function normalizeName(name: any): string {
  if (name === null || name === undefined) return "";
  return String(name)
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Chuẩn hóa Site Code:
 * - Convert về string
 * - Trim, giữ nguyên số 0 đầu
 * - Uppercase để đối chiếu
 */
export function normalizeSiteCode(siteCode: any): string {
  if (siteCode === null || siteCode === undefined) return "";
  return String(siteCode)
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .trim()
    .toUpperCase();
}

/**
 * Bỏ dấu tiếng Việt phục vụ tính độ tương đồng tên khi kiểm tra lỗi chính tả
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  let result = str.normalize("NFC");
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  result = result.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  result = result.replace(/Ỳ|Ý|Y|Ỷ|Ỹ/g, "Y");
  result = result.replace(/Đ/g, "D");
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return result;
}

export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export function getSimilarityRatio(str1: string, str2: string): number {
  const s1 = removeVietnameseTones(normalizeName(str1));
  const s2 = removeVietnameseTones(normalizeName(str2));
  if (s1 === s2) return 1.0;
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - distance / maxLen;
}

export function cleanPhoneNumber(phone: string): string {
  return normalizePhone(phone);
}

export function inspectPhoneNumber(phone: string, maxDigits: number = 10) {
  const raw = normalizePhone(phone);
  if (!raw) {
    return {
      raw: "",
      digits: "",
      digitCount: 0,
      isExcess: false,
      isMissing: false,
      isEmpty: true,
      message: "Trống số điện thoại",
    };
  }

  const digits = raw.replace(/\D/g, "");
  const digitCount = digits.length;
  const isExcess = digitCount > maxDigits;
  const isMissing = digitCount > 0 && digitCount < maxDigits;
  const isEmpty = digitCount === 0;

  let message = "";
  if (isExcess) {
    message = `Thừa số ĐT (${digitCount} chữ số > tối đa ${maxDigits} số)`;
  } else if (isMissing) {
    message = `Thiếu số ĐT (${digitCount} chữ số < chuẩn ${maxDigits} số)`;
  } else if (isEmpty) {
    message = "Trống số điện thoại";
  } else {
    message = `Số ĐT chuẩn (${digitCount} số)`;
  }

  return {
    raw,
    digits,
    digitCount,
    isExcess,
    isMissing,
    isEmpty,
    message,
  };
}

/**
 * Tìm bản ghi tương ứng trong masterData cho 1 dòng của inputData.
 * Ưu tiên:
 * 1. ID Number
 * 2. Phone
 * 3. Name
 */
export function findMatchingMasterRecord(
  inputRow: InputRecord,
  masterData: MasterRecord[],
  minNameSimRatio: number = 0.8
): {
  record: MasterRecord | null;
  matchedBy: "id" | "phone" | "name" | null;
} {
  if (!masterData || masterData.length === 0) {
    return { record: null, matchedBy: null };
  }

  const inputId = normalizeID(inputRow.IDNumber ?? inputRow.id);
  const inputPhone = normalizePhone(inputRow.Phone ?? inputRow.phone);
  const inputName = normalizeName(inputRow.Name ?? inputRow.name);

  // 1. Ưu tiên 1: Tìm theo ID Number (giữ số 0 đầu)
  if (inputId !== "") {
    const exactIdMatch = masterData.find(
      (m) =>
        normalizeID(m.IDNumber ?? m.id).toUpperCase() === inputId.toUpperCase()
    );
    if (exactIdMatch) {
      return { record: exactIdMatch, matchedBy: "id" };
    }
  }

  // 2. Ưu tiên 2: Tìm theo Phone (giữ số 0 đầu)
  if (inputPhone !== "") {
    const exactPhoneMatch = masterData.find(
      (m) => normalizePhone(m.Phone ?? m.phone) === inputPhone
    );
    if (exactPhoneMatch) {
      return { record: exactPhoneMatch, matchedBy: "phone" };
    }

    // Trường hợp 1 bên bị mất số 0 ở đầu trong file gốc
    const inputPhoneWithZero = inputPhone.startsWith("0")
      ? inputPhone
      : "0" + inputPhone;
    const altPhoneMatch = masterData.find((m) => {
      const mp = normalizePhone(m.Phone ?? m.phone);
      if (!mp) return false;
      const mpWithZero = mp.startsWith("0") ? mp : "0" + mp;
      return mpWithZero === inputPhoneWithZero;
    });
    if (altPhoneMatch) {
      return { record: altPhoneMatch, matchedBy: "phone" };
    }
  }

  // 3. Ưu tiên 3: Tìm theo Name (sau khi normalize Unicode + lowercase)
  if (inputName !== "") {
    const exactNameMatch = masterData.find(
      (m) => normalizeName(m.Name ?? m.name) === inputName
    );
    if (exactNameMatch) {
      return { record: exactNameMatch, matchedBy: "name" };
    }

    // Tìm theo tên tương đồng (fuzzy match >= minNameSimRatio)
    let bestScore = 0;
    let bestRecord: MasterRecord | null = null;
    for (const m of masterData) {
      const mName = m.Name ?? m.name;
      if (!mName) continue;
      const ratio = getSimilarityRatio(inputName, mName);
      if (ratio > bestScore) {
        bestScore = ratio;
        bestRecord = m;
      }
    }
    if (bestRecord && bestScore >= minNameSimRatio) {
      return { record: bestRecord, matchedBy: "name" };
    }
  }

  return { record: null, matchedBy: null };
}

/**
 * TẠO RESULT DATA ĐÚNG LOGIC:
 * - Được tạo từ inputData.map(...)
 * - Tuyệt đối KHÔNG sửa inputData trước khi matching
 * - Tuyệt đối KHÔNG dùng masterData.map(...)
 * - Số dòng resultData luôn bằng số dòng inputData
 * - Giữ riêng inputSiteCode / inputSiteName và masterSiteCode / masterSiteName
 */
export function matchDatasets(
  inputData: InputRecord[],
  masterData: MasterRecord[],
  criteria: MatchingCriteria
): MatchingResult[] {
  const minNameSimRatio = (criteria.minNameSimilarityThreshold ?? 80) / 100;

  return inputData.map((inputRow, index) => {
    const stt = index + 1;
    const { record: masterRecord, matchedBy } = findMatchingMasterRecord(
      inputRow,
      masterData,
      minNameSimRatio
    );

    const rawInputId = String(inputRow.IDNumber ?? inputRow.id ?? "");
    const rawInputName = String(inputRow.Name ?? inputRow.name ?? "");
    const rawInputPhone = String(inputRow.Phone ?? inputRow.phone ?? "");
    const rawInputSiteCode = String(inputRow.inputSiteCode ?? "");
    const rawInputSiteName = String(inputRow.inputSiteName ?? "");
    const rawInputCustomer = String(inputRow.inputCustomer ?? "");

    const masterSiteCode = masterRecord?.siteCode || "";
    const masterSiteName = masterRecord?.siteName || "";
    const masterDistrict = masterRecord?.district || "";
    const masterCity = masterRecord?.city || "";
    const masterAddress = masterRecord?.address || masterRecord?.detailAddress || "";
    const masterCustomer = masterRecord?.customer || "";
    const masterCustomerMerge =
      masterRecord?.customerMerge || masterRecord?.customer || "";
    const masterSellInType = masterRecord?.sellInType || "";
    const masterSalesRegion = masterRecord?.salesRegion || "";
    const masterRegion = masterRecord?.region2 || masterRecord?.region || "";
    const masterShopGrade = masterRecord?.shopGrade || "";
    const masterInternalExternal =
      masterRecord?.internalExternal || inputRow.internalExternal || "";
    const masterTraineeType =
      masterRecord?.traineeType || inputRow.traineeType || "";

    const numericScore =
      typeof inputRow.score === "number"
        ? inputRow.score
        : Number(String(inputRow.score).replace(",", ".")) || 0;

    // Kiểm tra các cảnh báo và sai lệch giữa dữ liệu học viên nhập và dữ liệu chuẩn Master
    const explanationParts: string[] = [];
    let idError = false;
    let nameError = false;
    let phoneError = false;
    let siteError = false;
    let isChanged = false;
    let nameSimilarityScore = 100;

    let displayId = rawInputId;
    let displayName = rawInputName;
    let displayPhone = rawInputPhone;

    const phoneInspection = inspectPhoneNumber(
      rawInputPhone,
      criteria.maxPhoneDigits || 10
    );
    const phoneExcessError = phoneInspection.isExcess;
    const phoneMissingError = phoneInspection.isMissing;
    phoneError =
      phoneExcessError || phoneMissingError || phoneInspection.isEmpty;

    if (phoneExcessError) {
      explanationParts.push(
        `Thừa số điện thoại: "${rawInputPhone}" (${phoneInspection.digitCount} số)`
      );
    } else if (phoneMissingError) {
      explanationParts.push(
        `Thiếu số điện thoại: "${rawInputPhone}" (${phoneInspection.digitCount} số)`
      );
    } else if (phoneInspection.isEmpty) {
      explanationParts.push("Trống số điện thoại");
    }

    if (masterRecord) {
      // Kiểm tra ID
      const normInputId = normalizeID(rawInputId).toUpperCase();
      const normMasterId = normalizeID(masterRecord.id).toUpperCase();
      if (normInputId !== normMasterId) {
        idError = true;
        if (!rawInputId) {
          explanationParts.push(
            `Trống ID Number (Tìm thấy qua ${matchedBy === "phone" ? "SĐT" : "Họ tên"}, ID chuẩn: ${masterRecord.id})`
          );
        } else {
          explanationParts.push(
            `Lệch ID Number: Học viên nhập "${rawInputId}" vs Chuẩn "${masterRecord.id}"`
          );
        }
        if (!criteria.onlyFixNameTypos && criteria.autoReconcileIds && masterRecord.id) {
          displayId = masterRecord.id;
          isChanged = true;
        }
      }

      // Kiểm tra Name
      const normInputName = normalizeName(rawInputName);
      const normMasterName = normalizeName(masterRecord.name);
      const ratio = getSimilarityRatio(rawInputName, masterRecord.name);
      nameSimilarityScore = Math.round(ratio * 100);

      if (normInputName !== normMasterName && masterRecord.name) {
        nameError = true;
        if (ratio >= minNameSimRatio && criteria.autoReconcileNames) {
          displayName = masterRecord.name;
          isChanged = true;
          explanationParts.push(
            `Đã sửa lỗi đánh máy tên: "${rawInputName}" -> "${masterRecord.name}" (${nameSimilarityScore}%)`
          );
        } else {
          explanationParts.push(
            `Lệch họ tên: Học viên nhập "${rawInputName}" vs Chuẩn "${masterRecord.name}" (${nameSimilarityScore}%)`
          );
        }
      }

      // Kiểm tra Phone
      const normInputP = normalizePhone(rawInputPhone);
      const normMasterP = normalizePhone(masterRecord.phone);
      if (normInputP && normMasterP && normInputP !== normMasterP) {
        phoneError = true;
        explanationParts.push(
          `Lệch SĐT: Học viên nhập "${rawInputPhone}" vs Chuẩn "${masterRecord.phone}"`
        );
      }

      // Kiểm tra Site Code học viên nhập vs Site Code chuẩn từ Master Database
      // Giữ riêng cả 2 giá trị (ví dụ Học viên nhập: BDU002, Database chuẩn: C137023)
      const normInputSite = normalizeSiteCode(rawInputSiteCode);
      const normMasterSite = normalizeSiteCode(masterSiteCode);
      if (normInputSite !== normMasterSite) {
        siteError = true;
        if (rawInputSiteCode && masterSiteCode) {
          explanationParts.push(
            `Lệch Site Code: Học viên nhập "${rawInputSiteCode}" vs Chuẩn "${masterSiteCode}"`
          );
        } else if (!rawInputSiteCode && masterSiteCode) {
          explanationParts.push(
            `Học viên không nhập Site Code (Chuẩn: "${masterSiteCode}")`
          );
        }
      }
    } else if (masterData.length > 0) {
      explanationParts.push("Không tìm thấy hồ sơ khớp trong CSDL gốc");
    } else {
      explanationParts.push("Chưa tải Tệp Cơ Sở Dữ Liệu Gốc");
    }

    const scoreWarning = numericScore < (criteria.minScoreThreshold || 80);
    if (scoreWarning) {
      explanationParts.push(
        `Điểm số dưới ngưỡng (${inputRow.score} < ${criteria.minScoreThreshold || 80})`
      );
    }

    let status: "corrected" | "safe" | "cannot_resolve" | "warning" = "safe";
    if (!masterRecord) {
      status = "cannot_resolve";
    } else if (isChanged) {
      status = "corrected";
    } else if (
      idError ||
      nameError ||
      phoneError ||
      siteError ||
      scoreWarning
    ) {
      status = "warning";
    }

    return {
      rowNum: stt,
      STT: stt,

      // Dữ liệu học viên
      IDNumber: displayId,
      Name: displayName,
      Phone: displayPhone,

      // Dữ liệu học viên nhập (giữ nguyên, tuyệt đối không bị ghi đè bởi masterSiteCode)
      HocVienNhap: rawInputSiteCode,
      inputSiteCode: rawInputSiteCode,
      inputSiteName: rawInputSiteName,
      inputCustomer: rawInputCustomer,

      // Dữ liệu chuẩn từ Master Database
      masterSiteCode,
      masterSiteName,
      SiteCode: masterSiteCode,
      SiteName: masterSiteName,
      District: masterDistrict,
      City: masterCity,
      DetailAddress: masterAddress,
      ShopGrade: masterShopGrade,
      Customer: masterCustomer || rawInputCustomer,
      CustomerMerge: masterCustomerMerge,
      SellInType: masterSellInType,
      SalesRegion: masterSalesRegion,
      Region: masterRegion,
      InternalExternal: masterInternalExternal,
      TraineeType: masterTraineeType,

      Score: inputRow.score,

      // Các trường tương thích chi tiết
      originalStt: stt,
      originalId: rawInputId,
      originalName: rawInputName,
      originalPhone: rawInputPhone,
      originalInternalExternal: inputRow.internalExternal || "",
      originalTraineeType: inputRow.traineeType || "",
      originalCustomerMerge: rawInputCustomer,
      originalStudentInput: rawInputSiteCode,
      originalSiteCode: rawInputSiteCode,
      originalSiteName: rawInputSiteName,
      originalDistrict: "",
      originalCity: "",
      originalDetailAddress: "",
      originalShopGrade: "",
      originalCustomer: rawInputCustomer,
      originalSellInType: "",
      originalSalesRegion: "",
      originalRegion: "",
      originalScore: numericScore,

      correctedStt: stt,
      correctedId: displayId,
      correctedName: displayName,
      correctedPhone: displayPhone,
      correctedInternalExternal: masterInternalExternal,
      correctedTraineeType: masterTraineeType,
      correctedCustomerMerge: masterCustomerMerge,
      correctedStudentInput: rawInputSiteCode,
      correctedSiteCode: masterSiteCode,
      correctedSiteName: masterSiteName,
      correctedDistrict: masterDistrict,
      correctedCity: masterCity,
      correctedDetailAddress: masterAddress,
      correctedShopGrade: masterShopGrade,
      correctedCustomer: masterCustomer || rawInputCustomer,
      correctedSellInType: masterSellInType,
      correctedSalesRegion: masterSalesRegion,
      correctedRegion: masterRegion,
      correctedScore: numericScore,

      matchedMaster: !!masterRecord,
      isChanged,
      errors: {
        idError,
        nameError,
        phoneError,
        phoneExcessError,
        phoneMissingError,
        scoreWarning,
        siteError,
        deptError: false,
        surveyError: false,
      },
      nameSimilarityScore,
      reconciliationStatus: status,
      explanation:
        explanationParts.length > 0
          ? explanationParts.join(" | ")
          : "Dữ liệu khớp chuẩn hoàn toàn",
    };
  });
}
