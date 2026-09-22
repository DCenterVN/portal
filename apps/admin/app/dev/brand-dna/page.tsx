"use client";

import Link from "next/link";
import { Badge, Button, Card, useTheme } from "@dcentervn/ui";

export default function BrandDnaPage() {
  const { setTheme, resolved } = useTheme();

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)]/85 p-6 backdrop-blur-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="forest">Bản sắc thương hiệu</Badge>
            <Badge variant="cold" pulse={true}>
              DNA v1.0.0
            </Badge>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[var(--color-ink)]">
            Việt Sạch — Brand DNA & Cẩm nang thiết kế
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Chuẩn mực thẩm mỹ, ngôn từ và kiến trúc giao diện cho toàn bộ hệ sinh thái.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
            className="text-xs font-semibold"
          >
            {resolved === "dark" ? "Giao diện sáng" : "Giao diện tối"}
          </Button>
          <Link href="/dev/components">
            <Button variant="primary" size="sm" className="text-xs">
              Thư viện UI →
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Brand Core & Story */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[var(--color-ink)]">
          1. Triết lý thẩm mỹ (Aesthetic Philosophy)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="glass" className="space-y-2 p-5">
            <Badge variant="primary">Phong cách tạp chí ẩm thực</Badge>
            <h3 className="font-serif text-lg font-bold text-[var(--color-ink)]">
              Premium Editorial
            </h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Sử dụng font có chân cổ điển <strong>Noto Serif</strong> để tạo cảm giác tinh hoa ẩm thực,
              tin cậy và minh bạch. Kết hợp với ảnh chụp sản phẩm chân thực, góc chụp cận cảnh giàu cảm xúc.
            </p>
          </Card>
          <Card variant="glass" className="space-y-2 p-5">
            <Badge variant="cold">Kính mờ & Chiều sâu</Badge>
            <h3 className="font-serif text-lg font-bold text-[var(--color-ink)]">
              Frosted Glass Layering
            </h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Bề mặt kính mờ (Backdrop Blur), viền siêu mảnh và bóng đổ màu tự nhiên. Loại bỏ hoàn toàn
              khối hộp AI thô cứng để tạo chiều sâu thị giác thanh lịch và công nghệ cao.
            </p>
          </Card>
        </div>
      </section>

      {/* 2. Color Swatches */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[var(--color-ink)]">
          2. Hệ màu Semantic 5 tông có chủ đích (Domain Semantic Palette)
        </h2>
        <Card variant="default" className="space-y-4 p-5">
          <p className="text-xs text-[var(--color-muted)]">
            Thay vì phối màu tùy hứng, 5 tông màu semantic được chuẩn hóa xuyên suốt theo nghiệp vụ chuỗi lạnh nông sản:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-[var(--color-line)] p-3 space-y-2 bg-[var(--color-panel)]">
              <div className="h-10 rounded-lg bg-[var(--color-fresh)]" />
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink)]">Tươi sạch (Fresh)</p>
                <p className="text-[11px] text-[var(--color-muted)]">VietGAP, Hữu cơ</p>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] p-3 space-y-2 bg-[var(--color-panel)]">
              <div className="h-10 rounded-lg bg-[var(--color-cold)]" />
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink)]">Chuỗi Lạnh (Cold)</p>
                <p className="text-[11px] text-[var(--color-muted)]">-18,5°C, Sensor IoT</p>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] p-3 space-y-2 bg-[var(--color-panel)]">
              <div className="h-10 rounded-lg bg-[var(--color-alert)]" />
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink)]">Cảnh báo (Alert)</p>
                <p className="text-[11px] text-[var(--color-muted)]">Dao động nhiệt QC</p>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] p-3 space-y-2 bg-[var(--color-panel)]">
              <div className="h-10 rounded-lg bg-[var(--color-danger)]" />
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink)]">Khẩn cấp (Danger)</p>
                <p className="text-[11px] text-[var(--color-muted)]">Quá nhiệt, lỗi trạm</p>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] p-3 space-y-2 bg-[var(--color-panel)]">
              <div className="h-10 rounded-lg bg-[var(--color-neutral)]" />
              <div>
                <p className="text-xs font-semibold text-[var(--color-ink)]">Kỹ thuật (Neutral)</p>
                <p className="text-[11px] text-[var(--color-muted)]">Mã lô, giờ hái</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Typography Specimen */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[var(--color-ink)]">
          3. Cặp Font chữ độc bản (Typography Pair)
        </h2>
        <Card variant="glass" className="space-y-4 p-6">
          <div className="border-b border-[var(--color-line)] pb-4 space-y-1">
            <span className="text-xs font-semibold text-[var(--color-leaf)]">Tiêu đề & Nghệ thuật</span>
            <h3 className="font-serif text-2xl font-bold text-[var(--color-ink)]">
              Noto Serif — Nông trại hữu cơ cao cấp Đà Lạt
            </h3>
            <p className="text-xs text-[var(--color-muted)]">
              Tôn vinh dấu thanh tiếng Việt với đường nét có chân thanh lịch, uyển chuyển.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--color-leaf)]">Nội dung & Dữ liệu</span>
            <p className="font-sans text-sm text-[var(--color-ink)] leading-relaxed">
              <strong>Be Vietnam Pro</strong> — Thiết kế chuyên biệt cho hệ thống ngôn ngữ Việt Nam.
              Chống hiện tượng cắt dấu thanh, tối ưu khả năng đọc trên màn hình điện thoại và máy trạm.
            </p>
          </div>
        </Card>
      </section>

      {/* 4. Golden Rules & Guardrails */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[var(--color-ink)]">
          4. Quy tắc bất biến (Golden Guardrails)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h4 className="font-serif text-base font-bold text-emerald-800 dark:text-emerald-300">
                Bắt buộc tuân thủ (Do)
              </h4>
            </div>
            <ul className="text-xs space-y-2 text-[var(--color-ink)] leading-relaxed list-disc list-inside">
              <li>Dùng từ: <strong>chi nhánh</strong>, <strong>kho lạnh</strong>, <strong>hub tổng kho</strong>.</li>
              <li>Tuân thủ <strong>100% Sentence case</strong> (không viết hoa cả chữ).</li>
              <li>Định dạng tiền tệ chuẩn: <code>35.000 ₫</code> (dấu chấm phân cách hàng nghìn).</li>
              <li>Nhiệt độ có dấu phẩy thập phân: <code>-18,5 °C</code>.</li>
              <li>Badges trên ảnh dùng <strong>Frosted Glass Pill</strong> đặt ở góc.</li>
            </ul>
          </div>

          <div className="rounded-2xl border-rose-500/30 bg-rose-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <h4 className="font-serif text-base font-bold text-rose-800 dark:text-rose-300">
                Tuyệt đối cấm (Don&apos;t)
              </h4>
            </div>
            <ul className="text-xs space-y-2 text-[var(--color-ink)] leading-relaxed list-disc list-inside">
              <li><strong>CẤM dùng từ &ldquo;resort&rdquo;</strong> ở mọi nơi (code, UI, tài liệu).</li>
              <li><strong>CẤM viết ALL CAPS</strong>: <code>STITCH DESIGN SYSTEM</code>.</li>
              <li>CẤM đè badge màu camouflage lên giữa đĩa thức ăn.</li>
              <li>CẤM dùng nút hình khối màu nâu bùn đất xỉn.</li>
              <li>CẤM viết mã màu hex cứng trực tiếp vào component.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
