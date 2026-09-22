/**
 * @dcentervn/design-tokens
 * Việt Sạch semantic tokens & system constants
 */

export const BRAND_COLORS = {
  forest: "#2D5A27",
  leaf: "#4A7C44",
  cold: "#0EA5E9",
  amber: "#D97706",
  clay: "#A64D32",
} as const;

/**
 * 4-5 Semantic Core Tones (Chất liệu Nông sản Chuỗi lạnh)
 */
export const SEMANTIC_COLORS = {
  fresh: "#1e5e23",   // Nông sản tươi sạch, chuẩn VietGAP, canh tác hữu cơ
  cold: "#0284c7",    // Chuỗi lạnh, bảo quản âm độ, cảm biến IoT
  alert: "#d97706",   // Cảnh báo dao động nhiệt, cần kiểm tra QC
  danger: "#dc2626",  // Quá nhiệt, thiết bị lỗi, đứt gãy chuỗi lạnh
  neutral: "#59655e", // Mã lô, ngày thu hoạch, thông số kỹ thuật phụ
} as const;

export const BREAKPOINTS = {
  mobile: "390px",
  tablet: "768px",
  desktop: "1440px",
} as const;

export const Z_INDEX = {
  base: 0,
  header: 30,
  sidebar: 40,
  popover: 50,
  drawer: 60,
  modal: 70,
  block: 80,
  lock: 90,
  toast: 100,
} as const;
