/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Database, Layers, ShieldCheck, Cpu } from 'lucide-react';

interface BackendCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendCodeModal: React.FC<BackendCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'controller' | 'service' | 'entity' | 'repo' | 'cors' | 'sql'>('controller');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, tabKey: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTab(tabKey);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const codeSnippets = {
    controller: `package com.fpt.license.controller;

import com.fpt.license.dto.LicenseResponseDTO;
import com.fpt.license.dto.PayOSWebhookRequestDTO;
import com.fpt.license.dto.WebhookResponseDTO;
import com.fpt.license.service.LicenseService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý bản quyền Extension và nhận Webhook thanh toán từ PayOS
 */
@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*") // Cho phép Frontend gọi API mượt mà không bị chặn CORS
@RequiredArgsConstructor
@Validated
@Slf4j
public class LicenseController {

    private final LicenseService licenseService;

    /**
     * Endpoint 1: Kiểm tra bản quyền Extension FPT
     * URL: GET http://localhost:8080/api/v1/license?email={email}
     *
     * - Nếu email KHÔNG tồn tại: Tạo user mới với status = TRIAL, hạn 7 ngày.
     * - Nếu email ĐÃ tồn tại: Cập nhật status = EXPIRED nếu quá hạn và trả về số ngày còn lại.
     */
    @GetMapping("/license")
    public ResponseEntity<LicenseResponseDTO> getLicense(
            @RequestParam("email") @NotBlank(message = "Email không được để trống") 
            @Email(message = "Email không đúng định dạng") String email) {
        
        log.info("[GET /api/v1/license] Request kiểm tra bản quyền cho email: {}", email);
        LicenseResponseDTO response = licenseService.getOrCreateLicense(email);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint 2: Nhận Webhook từ cổng thanh toán PayOS
     * URL: POST http://localhost:8080/api/v1/webhook/payos
     *
     * - Nhận JSON chứa dữ liệu giao dịch từ PayOS.
     * - Dùng Regex trích xuất PayCode "GH..." trong description.
     * - Gọi Stored Procedure sp_HandlePayment qua Spring Data JPA.
     * - Trả về HTTP 200 để PayOS xác nhận đã nhận tin thành công.
     */
    @PostMapping("/webhook/payos")
    public ResponseEntity<WebhookResponseDTO> handlePayOSWebhook(
            @Valid @RequestBody PayOSWebhookRequestDTO webhookPayload) {
        
        log.info("[POST /api/v1/webhook/payos] Nhận webhook từ PayOS: {}", webhookPayload);
        licenseService.processPayOSWebhook(webhookPayload);
        
        // Trả về response chuẩn mã lỗi 0 (Thành công) theo tài liệu PayOS
        return ResponseEntity.ok(WebhookResponseDTO.builder()
                .error(0)
                .message("Webhook processed successfully")
                .data(null)
                .build());
    }
}`,

    service: `package com.fpt.license.service.impl;

import com.fpt.license.dto.LicenseResponseDTO;
import com.fpt.license.dto.PayOSWebhookRequestDTO;
import com.fpt.license.entity.LicenseStatus;
import com.fpt.license.entity.User;
import com.fpt.license.repository.TransactionRepository;
import com.fpt.license.repository.UserRepository;
import com.fpt.license.service.LicenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class LicenseServiceImpl implements LicenseService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    /**
     * REGEX GIẢI THÍCH CHI TIẾT:
     * 1. (?i)          : Case-insensitive (khớp cả "GH", "gh", "Gh").
     * 2. \\bGH         : Bắt đầu bằng chữ "GH" tại ranh giới từ (word boundary).
     * 3. \\s*          : Phòng trường hợp ngân hàng tự thêm dấu cách, ví dụ "GH 1000".
     * 4. (\\d{3,10})   : Nhóm bắt (Capture Group 1) gồm từ 3 đến 10 chữ số tiếp theo.
     * 5. \\b           : Kết thúc số tại ranh giới từ, tránh nuốt ký tự khác.
     *
     * Ví dụ khớp thành công:
     * - "MBVCB.12345.GH1000 chuyen tien hoc phi" -> trích xuất: "GH1000"
     * - "gh1050 ung ho ung dung"                 -> trích xuất: "GH1050"
     * - "NAP TIEN GH 2000 GD T9"                 -> trích xuất: "GH2000"
     */
    private static final Pattern PAYCODE_REGEX_PATTERN = 
            Pattern.compile("(?i)\\\\bGH\\\\s*(\\\\d{3,10})\\\\b");

    @Override
    @Transactional
    public LicenseResponseDTO getOrCreateLicense(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        LocalDateTime now = LocalDateTime.now();

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            // [TRƯỜNG HỢP 1]: User chưa tồn tại -> Tạo mới với trạng thái TRIAL (7 ngày)
            log.info("Chưa có user với email {}, tiến hành tạo mới TRIAL 7 ngày", email);

            User newUser = User.builder()
                    .email(email)
                    .status(LicenseStatus.TRIAL)
                    .expirationDate(now.plusDays(7))
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            // Lưu vào SQL Server để DB kích hoạt IDENTITY và cột sinh PayCode tự động
            User savedUser = userRepository.saveAndFlush(newUser);
            // Refresh lại entity để nạp giá trị payCode do DB tự sinh (Computed Column)
            savedUser = userRepository.findById(savedUser.getId()).orElse(savedUser);

            return mapToDTO(savedUser, now);
        }

        // [TRƯỜNG HỢP 2]: User đã tồn tại -> Kiểm tra hạn dùng
        User existingUser = userOpt.get();

        if (existingUser.getExpirationDate() != null && existingUser.getExpirationDate().isBefore(now)) {
            // Quá hạn -> cập nhật thành EXPIRED nếu trước đó chưa phải EXPIRED
            if (existingUser.getStatus() != LicenseStatus.EXPIRED) {
                existingUser.setStatus(LicenseStatus.EXPIRED);
                existingUser.setUpdatedAt(now);
                existingUser = userRepository.save(existingUser);
                log.warn("User {} đã hết hạn sử dụng, chuyển trạng thái sang EXPIRED", email);
            }
        }

        return mapToDTO(existingUser, now);
    }

    @Override
    @Transactional
    public void processPayOSWebhook(PayOSWebhookRequestDTO request) {
        if (request == null || request.getData() == null) {
            log.warn("Payload Webhook rỗng hoặc thiếu trường 'data'");
            return;
        }

        PayOSWebhookRequestDTO.WebhookData data = request.getData();
        String description = data.getDescription();
        Long amount = data.getAmount();

        if (description == null || description.isBlank()) {
            log.warn("Mô tả giao dịch (description) rỗng, không thể trích xuất PayCode");
            return;
        }

        // =========================================================================
        // TRÍCH XUẤT PAYCODE BẰNG REGEX (Xử lý chuỗi nhiễu từ ngân hàng)
        // =========================================================================
        String extractedPayCode = extractPayCodeFromDescription(description);

        if (extractedPayCode == null) {
            log.warn("Không tìm thấy mã PayCode dạng 'GHxxxx' trong nội dung: '{}'. Bỏ qua xử lý.", description);
            // Không ném Exception để PayOS vẫn nhận được 200 OK, tránh bắn lại webhook liên tục
            return;
        }

        log.info("Trích xuất thành công PayCode: '{}', Số tiền: {} VNĐ, Nội dung gốc: '{}'", 
                extractedPayCode, amount, description);

        // =========================================================================
        // GỌI STORED PROCEDURE: sp_HandlePayment QUA SPRING DATA JPA
        // =========================================================================
        try {
            transactionRepository.executeHandlePaymentProcedure(
                    extractedPayCode,
                    amount != null ? amount : 0L,
                    description
            );
            log.info("Đã thực thi thành công Stored Procedure sp_HandlePayment cho mã {}", extractedPayCode);
        } catch (Exception e) {
            log.error("Lỗi khi gọi Stored Procedure sp_HandlePayment cho mã {}: {}", extractedPayCode, e.getMessage(), e);
            throw new RuntimeException("Lỗi xử lý thanh toán cơ sở dữ liệu: " + e.getMessage(), e);
        }
    }

    /**
     * Hàm trích xuất PayCode chuẩn hóa từ nội dung chuyển khoản
     */
    public static String extractPayCodeFromDescription(String description) {
        if (description == null) return null;
        
        Matcher matcher = PAYCODE_REGEX_PATTERN.matcher(description);
        if (matcher.find()) {
            // Chuẩn hóa: ghép chữ hoa 'GH' với chuỗi số bắt được ở Group 1
            String digits = matcher.group(1);
            return "GH" + digits;
        }
        return null;
    }

    private LicenseResponseDTO mapToDTO(User user, LocalDateTime now) {
        long daysLeft = 0;
        if (user.getExpirationDate() != null && user.getExpirationDate().isAfter(now)) {
            daysLeft = ChronoUnit.DAYS.between(now.toLocalDate(), user.getExpirationDate().toLocalDate());
            // Làm tròn nếu còn trong cùng 1 ngày
            if (daysLeft == 0 && user.getExpirationDate().isAfter(now)) {
                daysLeft = 1;
            }
        }

        return LicenseResponseDTO.builder()
                .email(user.getEmail())
                .payCode(user.getPayCode() != null ? user.getPayCode() : "GH" + user.getId())
                .status(user.getStatus().name())
                .daysLeft(Math.max(0, daysLeft))
                .daysRemaining(Math.max(0, daysLeft))
                .build();
    }
}`,

    entity: `package com.fpt.license.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email", unique = true),
    @Index(name = "idx_users_pay_code", columnList = "pay_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LicenseStatus status;

    @Column(name = "expiration_date", nullable = false)
    private LocalDateTime expirationDate;

    /**
     * Cột pay_code do SQL Server tự sinh (Computed Column hoặc Sequence):
     * AS ('GH' + RIGHT('0000' + CAST(id AS VARCHAR(10)), 4)) PERSISTED
     * Chỉ đọc (insertable = false, updatable = false) để Hibernate không ghi đè giá trị DB
     */
    @Column(name = "pay_code", insertable = false, updatable = false, length = 30)
    @Generated(event = EventType.INSERT)
    private String payCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

// -------------------------------------------------------------
// Transaction Entity (Lưu lịch sử Webhook giao dịch)
// -------------------------------------------------------------
@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pay_code", length = 30, nullable = false)
    private String payCode;

    @Column(nullable = false)
    private Long amount;

    @Column(name = "raw_description", length = 500)
    private String rawDescription;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}

// -------------------------------------------------------------
// LicenseStatus Enum
// -------------------------------------------------------------
public enum LicenseStatus {
    TRIAL,
    ACTIVE,
    EXPIRED
}`,

    repo: `package com.fpt.license.repository;

import com.fpt.license.entity.User;
import com.fpt.license.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPayCode(String payCode);
}

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * Gọi Stored Procedure sp_HandlePayment trên SQL Server qua Spring Data JPA @Query
     * 
     * @param payCode         Mã thanh toán trích xuất từ Regex (ví dụ: 'GH1000')
     * @param amount          Số tiền nhận được từ PayOS (ví dụ: 10000)
     * @param rawDescription  Nội dung chuyển khoản gốc do ngân hàng gửi
     */
    @Modifying
    @Query(value = "EXEC sp_HandlePayment :payCode, :amount, :rawDescription", nativeQuery = true)
    void executeHandlePaymentProcedure(
            @Param("payCode") String payCode,
            @Param("amount") Long amount,
            @Param("rawDescription") String rawDescription
    );
}`,

    cors: `package com.fpt.license.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cấu hình CORS theo Yêu cầu 1:
 * Cho phép https://lms.fpt.edu.vn và Frontend gọi API mượt mà không bị chặn trình duyệt
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("\${app.cors.allowed-origins:https://lms.fpt.edu.vn,http://localhost:3000,http://localhost:5173}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Cho phép domain LMS FPT và frontend của bạn
                .allowedOrigins(
                        "https://lms.fpt.edu.vn",
                        "http://localhost:3000",
                        "http://localhost:5173"
                )
                // Cho phép pattern nguồn mở rộng (các subdomain fpt.edu.vn và Cloud Run/Vercel)
                .allowedOriginPatterns(
                        "https://*.fpt.edu.vn",
                        "https://*.run.app",
                        "https://*.vercel.app"
                )
                // Cho phép đầy đủ các phương thức HTTP
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                // Cho phép mọi Headers thông dụng (Authorization, Content-Type, Accept...)
                .allowedHeaders("*")
                // Cho phép gửi kèm cookie/credentials nếu cần
                .allowCredentials(true)
                // Cache kết quả Preflight request trong 3600 giây (1 giờ) để tối ưu hiệu năng
                .maxAge(3600);
    }
}`,

    sql: `-- =========================================================================
-- KỊCH BẢN TẠO CƠ SỞ DỮ LIỆU SQL SERVER
-- Tự sinh PayCode dạng "GH" + ID và Stored Procedure sp_HandlePayment
-- =========================================================================

-- 1. BẢNG USERS
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL 
    DROP TABLE dbo.users;
GO

CREATE TABLE dbo.users (
    id BIGINT IDENTITY(1000, 1) NOT NULL PRIMARY KEY,
    email NVARCHAR(150) NOT NULL CONSTRAINT UQ_users_email UNIQUE,
    status NVARCHAR(20) NOT NULL CONSTRAINT DF_users_status DEFAULT 'TRIAL',
    expiration_date DATETIME2 NOT NULL,
    
    -- Tự sinh PayCode: 'GH' + id (Ví dụ: ID=1000 -> 'GH1000', ID=1001 -> 'GH1001')
    pay_code AS ('GH' + CAST(id AS VARCHAR(20))) PERSISTED,
    
    created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME()
);
GO

CREATE NONCLUSTERED INDEX IX_users_pay_code ON dbo.users (pay_code);
CREATE NONCLUSTERED INDEX IX_users_email ON dbo.users (email);
GO

-- 2. BẢNG PAYMENT_TRANSACTIONS (Lưu vết giao dịch)
IF OBJECT_ID('dbo.payment_transactions', 'U') IS NOT NULL 
    DROP TABLE dbo.payment_transactions;
GO

CREATE TABLE dbo.payment_transactions (
    id BIGINT IDENTITY(1, 1) NOT NULL PRIMARY KEY,
    pay_code VARCHAR(30) NOT NULL,
    amount BIGINT NOT NULL,
    raw_description NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_payment_transactions_created_at DEFAULT SYSUTCDATETIME()
);
GO

-- 3. STORED PROCEDURE XỬ LÝ THANH TOÁN: sp_HandlePayment
IF OBJECT_ID('dbo.sp_HandlePayment', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_HandlePayment;
GO

CREATE PROCEDURE dbo.sp_HandlePayment
    @payCode VARCHAR(30),
    @amount BIGINT,
    @rawDescription NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Tìm user tương ứng với payCode
        DECLARE @userId BIGINT, @currentStatus NVARCHAR(20), @currentExp DATETIME2;

        SELECT TOP 1 
            @userId = id,
            @currentStatus = status,
            @currentExp = expiration_date
        FROM dbo.users
        WHERE pay_code = @payCode;

        IF @userId IS NULL
        BEGIN
            -- Nếu không tìm thấy user thì chỉ log vào bảng transaction và commit
            INSERT INTO dbo.payment_transactions (pay_code, amount, raw_description, created_at)
            VALUES (@payCode, @amount, N'[Chưa gắn User] ' + ISNULL(@rawDescription, ''), SYSUTCDATETIME());

            COMMIT TRANSACTION;
            RETURN;
        END

        -- 2. Tính ngày hết hạn mới (+30 ngày)
        -- Nếu còn hạn thì cộng dồn từ ngày hiện tại, nếu đã hết hạn thì cộng từ hôm nay
        DECLARE @now DATETIME2 = SYSUTCDATETIME();
        DECLARE @newExp DATETIME2;

        IF @currentExp > @now
            SET @newExp = DATEADD(DAY, 30, @currentExp); -- Gia hạn cộng dồn thêm 30 ngày
        ELSE
            SET @newExp = DATEADD(DAY, 30, @now);        -- Kích hoạt mới 30 ngày từ hôm nay

        -- 3. Cập nhật trạng thái User thành ACTIVE
        UPDATE dbo.users
        SET status = 'ACTIVE',
            expiration_date = @newExp,
            updated_at = @now
        WHERE id = @userId;

        -- 4. Ghi nhận lịch sử giao dịch
        INSERT INTO dbo.payment_transactions (pay_code, amount, raw_description, created_at)
        VALUES (@payCode, @amount, @rawDescription, @now);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrSeverity INT = ERROR_SEVERITY();
        RAISERROR(@ErrMsg, @ErrSeverity, 1);
    END CATCH
END;
GO`
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Spring Boot 3.x Backend & SQL Server Code
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Java 17+
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Toàn bộ mã nguồn Controller, Service (Regex PayCode), Entity, CORS và Stored Procedure
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('controller')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'controller'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            LicenseController.java
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'service'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            LicenseServiceImpl.java (Regex)
          </button>
          <button
            onClick={() => setActiveTab('entity')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'entity'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Entity & Enum
          </button>
          <button
            onClick={() => setActiveTab('repo')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'repo'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Repositories (@Query SP)
          </button>
          <button
            onClick={() => setActiveTab('cors')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'cors'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            CorsConfig.java (LMS FPT)
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'sql'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            schema.sql (sp_HandlePayment)
          </button>
        </div>

        {/* Code Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-900/90 font-mono text-xs text-slate-200 relative">
          <button
            onClick={() => copyCode(codeSnippets[activeTab], activeTab)}
            className="absolute top-6 right-8 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-lg transition-all"
          >
            {copiedTab === activeTab ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép mã</span>
              </>
            )}
          </button>

          <pre className="overflow-x-auto p-4 rounded-2xl bg-slate-950 border border-slate-800/80 leading-relaxed">
            <code>{codeSnippets[activeTab]}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Spring Boot 3.3+ • Java 17+ • Spring Data JPA • Microsoft SQL Server</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
