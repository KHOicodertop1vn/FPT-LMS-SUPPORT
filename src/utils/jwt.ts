/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';

/**
 * Hàm giải mã (decode) JWT credential token nhận từ Google Identity Services
 * Cấu trúc JWT gồm 3 phần phân tách bởi dấu chấm: Header.Payload.Signature
 * Phần Payload (phần thứ 2) chứa thông tin người dùng được mã hóa Base64URL.
 *
 * @param token Chuỗi JWT token trả về từ `credential` của Google Identity Services
 * @returns Object thông tin người dùng (UserProfile)
 */
export function decodeJwtResponse(token: string): UserProfile {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      throw new Error('Định dạng token không hợp lệ (thiếu phần payload).');
    }

    // Chuyển đổi từ Base64URL sang Base64 tiêu chuẩn
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Giải mã Base64 sang chuỗi nhị phân và parse UTF-8 an toàn để không bị lỗi tiếng Việt có dấu
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const parsed = JSON.parse(jsonPayload);

    return {
      name: parsed.name || 'Sinh viên FPT',
      email: parsed.email || '',
      picture: parsed.picture,
      sub: parsed.sub,
      hd: parsed.hd,
    };
  } catch (error) {
    console.error('Lỗi khi giải mã JWT token:', error);
    throw new Error('Không thể giải mã token đăng nhập Google.');
  }
}

/**
 * Hàm kiểm tra định dạng email chuẩn RFC (chấp nhận mọi email hợp lệ: @gmail.com, @fpt.edu.vn, @outlook.com...)
 *
 * @param email Địa chỉ email cần kiểm tra
 * @returns boolean true nếu định dạng hợp lệ
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(cleanEmail);
}

/**
 * Hàm kiểm tra xem email có thuộc tên miền @fpt.edu.vn hay không
 */
export function isFptEmail(email: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return cleanEmail.endsWith('@fpt.edu.vn');
}
