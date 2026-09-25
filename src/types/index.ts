/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LicenseStatus = 'Trial' | 'Active' | 'Expired';

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
  sub?: string;
  hd?: string; // Hosted Domain (e.g. fpt.edu.vn)
}

export interface LicenseResponse {
  email?: string;
  status: LicenseStatus;
  daysRemaining: number;
  payCode: string; // Ví dụ: "GH1000"
  planName?: string;
  amount?: number;
  expiresAt?: string;
  updatedAt?: string;
  notes?: string;
}

export interface BankInfo {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
}
