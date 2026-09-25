/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// =================================================================================================
// ⭐️⭐️⭐️ CẤU HÌNH THÔNG TIN TÀI KHOẢN NGÂN HÀNG THỰC TẾ (VIETQR) ⭐️⭐️⭐️
// 
// HÃY ĐIỀN THÔNG TIN THỰC TẾ CỦA BẠN VÀO ĐÂY:
// 1. BANK_ID:      Mã ngân hàng theo chuẩn VietQR (ví dụ: 'MB', 'VCB', 'ACB', 'TPB', 'TCB', 'BIDV',...)
// 2. ACCOUNT_NO:   Số tài khoản ngân hàng thực tế của bạn (ví dụ: '0388888888')
// 3. ACCOUNT_NAME: Tên chủ tài khoản viết HOA KHÔNG DẤU (ví dụ: 'NGUYEN VAN A')
// 4. AMOUNT:       Số tiền cần thanh toán theo yêu cầu (mặc định: 10000 VNĐ)
// =================================================================================================

export const VIETQR_CONFIG = {
  // 👉 1. MÃ NGÂN HÀNG / VÍ:
  BANK_ID: 'MOMO', // Ví điện tử MoMo

  // 👉 2. SỐ TÀI KHOẢN / SỐ ĐIỆN THOẠI VÍ:
  ACCOUNT_NO: '0825566455', // Số điện thoại ví MoMo của bạn

  // 👉 3. TÊN CHỦ TÀI KHOẢN VIẾT HOA KHÔNG DẤU:
  ACCOUNT_NAME: 'BUI DANG KHOI', // Chủ tài khoản BÙI ĐĂNG KHỞI

  // 👉 4. SỐ TIỀN THANH TOÁN (VNĐ):
  DEFAULT_AMOUNT: 10000, // 10,000 VNĐ theo yêu cầu
};

// URL Backend API mặc định theo Yêu cầu 2:
export const DEFAULT_BACKEND_API = 'http://localhost:8080/api/v1/license';

// Google OAuth Client ID của bạn (Google Identity Services)
export const DEFAULT_GOOGLE_CLIENT_ID = '232537070629-akec4s2vt55va8ukc8rn0spt9qhiohtc.apps.googleusercontent.com';

// Danh sách các ngân hàng & ví điện tử phổ biến:
export const POPULAR_BANKS = [
  { code: 'MOMO', name: 'Ví điện tử MoMo (MoMo Wallet)', shortName: 'MoMo' },
  { code: 'MB', name: 'MBBank (Quân Đội)', shortName: 'MB' },
  { code: 'VCB', name: 'Vietcombank', shortName: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank', shortName: 'Techcombank' },
  { code: 'ACB', name: 'ACB (Á Châu)', shortName: 'ACB' },
  { code: 'TPB', name: 'TPBank (Tiên Phong)', shortName: 'TPBank' },
  { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)', shortName: 'VPBank' },
  { code: 'BIDV', name: 'BIDV (Đầu tư và Phát triển)', shortName: 'BIDV' },
  { code: 'ICB', name: 'VietinBank (Công Thương)', shortName: 'VietinBank' },
  { code: 'STB', name: 'Sacombank', shortName: 'Sacombank' },
  { code: 'VIB', name: 'VIB (Quốc Tế)', shortName: 'VIB' },
];

/**
 * Hàm sinh URL VietQR động theo chuẩn yêu cầu:
 * https://img.vietqr.io/image/<MÃ_NGÂN_HÀNG>-<SỐ_TÀI_KHOẢN>-compact2.png?amount=10000&addInfo={payCode}&accountName=<TÊN_CHỦ_TÀI_KHOẢN>
 *
 * @param bankId        Mã ngân hàng (ví dụ: MB, VCB, ACB)
 * @param accountNo     Số tài khoản ngân hàng thực tế
 * @param accountName   Tên chủ tài khoản (in hoa không dấu)
 * @param amount        Số tiền (mặc định: 10000)
 * @param payCode       Mã thanh toán từ API (ví dụ: "GH1000")
 * @returns Đường link URL ảnh VietQR hoàn chỉnh
 */
export function buildVietQRUrl(
  bankId: string,
  accountNo: string,
  accountName: string,
  amount: number,
  payCode: string
): string {
  // Chuẩn hóa tên tài khoản (bỏ khoảng trắng thừa, encode URL an toàn)
  const cleanBankId = encodeURIComponent(bankId.trim());
  const cleanAccountNo = encodeURIComponent(accountNo.trim());
  const cleanAccountName = encodeURIComponent(accountName.trim());
  const cleanPayCode = encodeURIComponent(payCode.trim());

  return `https://img.vietqr.io/image/${cleanBankId}-${cleanAccountNo}-compact2.png?amount=${amount}&addInfo=${cleanPayCode}&accountName=${cleanAccountName}`;
}
