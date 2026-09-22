"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  ProductCard,
  QuantityPicker,
  OrgSwitcher,
  useTheme,
  type BranchOption,
} from "@dcentervn/ui";

import { MOCK_BRANCHES } from "@/features/operations/data";
import { OverlayShowcase } from "./overlay-showcase";

type CategoryFilter = "all" | "badges" | "actions" | "products" | "overlays";

export default function ComponentGalleryPage() {
  const { setTheme, resolved } = useTheme();
  const [activeTab, setActiveTab] = useState<CategoryFilter>("all");
  const [quantity, setQuantity] = useState(2);
  const [currentBranch, setCurrentBranch] = useState<BranchOption>(
    MOCK_BRANCHES[0] ?? {
      id: "hub-long-hau",
      name: "Hub Tổng Kho Long Hậu",
      type: "cold_hub",
      status: "active",
    },
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6 px-4 sm:px-6">
      {/* Header & Controls */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)]/85 backdrop-blur-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="fresh">Hệ màu semantic chuẩn</Badge>
            <Badge variant="cold" pulse={true}>
              Chuỗi lạnh Việt Sạch
            </Badge>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[var(--color-ink)]">
            Thư viện thành phần UI chuỗi lạnh nông sản
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Thiết kế theo chất liệu ngành: Phân cấp thị giác rõ nét, truy xuất nguồn gốc, dải nhiệt độ IoT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dev/brand-dna">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              Brand DNA
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
            className="text-xs font-semibold"
          >
            {resolved === "dark" ? "Giao diện sáng" : "Giao diện tối"}
          </Button>
          <OrgSwitcher
            currentBranch={currentBranch}
            branches={MOCK_BRANCHES}
            onSelectBranch={setCurrentBranch}
          />
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] pb-3">
        {[
          { id: "all", label: "Tất cả thành phần" },
          { id: "badges", label: "Trạng thái & Nhãn" },
          { id: "actions", label: "Hành động & Điều khiển" },
          { id: "products", label: "Thẻ nông sản & Truy xuất" },
          { id: "overlays", label: "Lớp phủ & Thông báo" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as CategoryFilter)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-[var(--color-fresh)] text-white shadow-none"
                : "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-panel-strong)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Nhãn trạng thái & Chuỗi lạnh */}
      {(activeTab === "all" || activeTab === "badges") && (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[var(--color-ink)]">
            Trạng thái & Nhãn chuỗi lạnh (Semantic Badges & Indicators)
          </h2>
          <Card variant="default" className="space-y-4 p-5">
            <div>
              <span className="text-xs font-semibold text-[var(--color-muted)] block mb-2">
                Chứng nhận chất lượng nông sản (Semantic: Fresh)
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="fresh">Chuẩn VietGAP</Badge>
                <Badge variant="fresh">GlobalGAP Quốc tế</Badge>
                <Badge variant="fresh">OCOP 4 sao Bến Tre</Badge>
                <Badge variant="fresh">Canh tác hữu cơ</Badge>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-[var(--color-muted)] block mb-2">
                Cảm biến nhiệt độ & Chuỗi lạnh IoT (Semantic: Cold)
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="cold" pulse={true}>
                  -18,5 °C Kho lạnh âm sâu
                </Badge>
                <Badge variant="cold">2°C ~ 4°C Kho bảo quản mát</Badge>
                <Badge variant="cold">IQF Cấp đông siêu tốc</Badge>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-[var(--color-muted)] block mb-2">
                Cảnh báo vận hành & Thiết bị (Semantic: Alert & Danger)
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="alert">Cảnh báo dao động nhiệt</Badge>
                <Badge variant="alert">Cần kiểm tra QC lô hàng</Badge>
                <Badge variant="danger">Đứt gãy chuỗi lạnh</Badge>
                <Badge variant="danger">Mất kết nối cảm biến RFID</Badge>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-[var(--color-muted)] block mb-2">
                Thông số kỹ thuật & Truy xuất (Semantic: Neutral)
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="neutral">Lô VN-DL-26-09</Badge>
                <Badge variant="neutral">Thu hoạch 05:00 hôm nay</Badge>
                <Badge variant="neutral">Độ tươi sensor 99.4%</Badge>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Hành động & Điều khiển */}
      {(activeTab === "all" || activeTab === "actions") && (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[var(--color-ink)]">
            Hành động & Phân cấp điều khiển (Action Hierarchy)
          </h2>
          <Card variant="default" className="space-y-5 p-5">
            <div>
              <span className="text-xs font-semibold text-[var(--color-muted)] block mb-2">
                Trọng số thị giác (Nút chính đậm nét, nút phụ nhẹ nhàng)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Chọn lô hàng (Primary CTA)</Button>
                <Button variant="cold">Kích hoạt cấp đông</Button>
                <Button variant="secondary">Cấu hình thông số</Button>
                <Button variant="outline">Xem chi tiết</Button>
                <Button variant="ghost">Bỏ qua</Button>
                <Button variant="danger">Dừng khẩn cấp</Button>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-[var(--color-muted)] block mb-2">
                Quy chuẩn kích thước theo tiêu chuẩn vùng chạm cảm ứng
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">Nhỏ — 36px (Bảng biểu)</Button>
                <Button variant="primary" size="md">Vừa — 44px (Chuẩn chạm)</Button>
                <Button variant="primary" size="lg">Lớn — 50px (Hành động chính)</Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Thẻ nông sản & Truy xuất nguồn gốc */}
      {(activeTab === "all" || activeTab === "products") && (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[var(--color-ink)]">
            Thẻ nông sản & Truy xuất nguồn gốc (Cold-Chain Agricultural Cards)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProductCard
              id="prod-1"
              title="Xà lách thủy canh Lollo Bionda Đà Lạt"
              price={35000}
              unit="búp (300g)"
              origin="Đà Lạt — Nông trại hữu cơ Farm A2"
              imageUrl="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"
              badgeText="VietGAP"
              temperature="4°C Mát"
              lotCode="VN-DL-26-09"
              harvestDate="05:00 Hôm nay"
              freshnessScore="99.4%"
            />
            <ProductCard
              id="prod-2"
              title="Cá hồi Na Uy phi-lê cấp đông sâu IQF"
              price={185000}
              unit="khay 500g"
              origin="Nhập khẩu chính ngạch kho Long Hậu"
              imageUrl="https://images.unsplash.com/photo-1499125562588-29fb8a56b5d5?auto=format&fit=crop&w=600&q=80"
              badgeText="GlobalGAP"
              temperature="-18,5°C Sâu"
              lotCode="NO-LH-88-01"
              harvestDate="22/09/2026"
              freshnessScore="98.8%"
            />
            <Card variant="glass" className="flex flex-col justify-between p-6">
              <div>
                <span className="text-xs font-semibold tracking-wider text-[var(--color-fresh)]">
                  Tiếp cận trên thiết bị cảm ứng kho
                </span>
                <h4 className="mt-1 font-serif text-base font-bold text-[var(--color-ink)]">
                  Bộ chọn số lượng (Quantity Picker)
                </h4>
                <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
                  Thiết kế vùng chạm tối thiểu 44px chống bấm nhầm cho nhân viên vận hành mang găng tay kho lạnh.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--color-line)] flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  Số lượng kiện:
                </span>
                <QuantityPicker value={quantity} onChange={setQuantity} min={1} max={15} />
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Lớp phủ, Hộp thoại & Toasts */}
      <OverlayShowcase filterCategory={activeTab} />
    </div>
  );
}
