/**
 * @dcentervn/design-tokens
 * Đất Việt Design System — Revision 2.0
 *
 * Vietnamese Heritage Color Palette:
 * - Đất đỏ bazan (basalt red)
 * - Xanh lúa non (rice green)
 * - Vàng nắng (highland sun)
 * - Xanh đá (pine green)
 */

export const DESIGN_TOKENS = {
  // Light theme — Sương mai cao nguyên
  light: {
    bg: '#F5F3E8',
    card: '#FFFFFF',
    panel: '#FBF9F2',
    textPrimary: '#2D2419',
    textSecondary: '#6B5D4F',
    textMuted: '#8B7F72',
    border: '#E0D5C7',
    
    earth: '#A84534',          // Primary CTA
    earthHover: '#8B3626',
    rice: '#7FB069',           // Success
    sun: '#F4B860',            // Warning
    pine: '#5B8A72',           // Info
    danger: '#C84B31',
    
    shadowCard: '0 8px 30px rgb(134, 110, 90, 0.12)',
    shadowHover: '0 12px 40px rgb(134, 110, 90, 0.16)',
    shadowModal: '0 20px 60px rgb(134, 110, 90, 0.20)',
  },
  
  // Dark theme — Đêm nông trại
  dark: {
    bg: '#1A1512',
    card: '#2D2419',
    panel: '#3A2F23',
    textPrimary: '#F5F3E8',
    textSecondary: '#C4B5A0',
    textMuted: '#8B7F72',
    border: '#4A3F32',
    
    earth: '#E87461',          // Glowing ember
    earthHover: '#D9624F',
    rice: '#9FD683',
    sun: '#FFD17A',
    pine: '#7BB098',
    danger: '#FF6F59',
    
    shadowCard: '0 8px 30px rgb(232, 116, 97, 0.15)',
    shadowHover: '0 12px 40px rgb(232, 116, 97, 0.20)',
    shadowModal: '0 20px 60px rgb(232, 116, 97, 0.25)',
  },
} as const;

/**
 * Semantic color names (use CSS variables in components)
 */
export const SEMANTIC_COLORS = {
  // Brand colors
  EARTH: 'var(--color-earth)',              // Primary CTA — Đất đỏ bazan
  RICE: 'var(--color-rice)',                // Success/Fresh — Xanh lúa non
  SUN: 'var(--color-sun)',                  // Warning — Vàng nắng
  PINE: 'var(--color-pine)',                // Info/Cold-chain — Xanh đá
  DANGER: 'var(--color-danger)',            // Alert — Đỏ gạch nung
  
  // Aliases (backward compatibility)
  FRESH: 'var(--color-rice)',
  COLD: 'var(--color-pine)',
  ALERT: 'var(--color-sun)',
  TEAL: 'var(--color-rice)',
  GOLD: 'var(--color-sun)',
  SUCCESS: 'var(--color-rice)',
} as const;

/**
 * Legacy BRAND_COLORS (deprecated, use SEMANTIC_COLORS instead)
 * @deprecated Use SEMANTIC_COLORS.EARTH, RICE, SUN, PINE instead
 */
export const BRAND_COLORS = {
  forest: "#7FB069",  // → SEMANTIC_COLORS.RICE
  leaf: "#7FB069",
  cold: "#5B8A72",    // → SEMANTIC_COLORS.PINE
  amber: "#F4B860",   // → SEMANTIC_COLORS.SUN
  clay: "#A84534",    // → SEMANTIC_COLORS.EARTH
} as const;

/**
 * Font families
 */
export const FONTS = {
  SERIF: 'var(--font-serif)',               // Noto Serif — Storytelling
  SANS: 'var(--font-sans)',                 // Be Vietnam Pro — UI
  MONO: 'var(--font-mono)',                 // IBM Plex Mono — Data/traceability
} as const;

/**
 * Spacing scale (px)
 */
export const SPACING = {
  1: '4px',     // tight
  2: '8px',     // compact
  3: '12px',    // base
  4: '16px',    // comfortable
  6: '24px',    // spacious
  8: '32px',    // section
  12: '48px',   // large
  16: '64px',   // hero
} as const;

/**
 * Border radius
 */
export const RADIUS = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  full: '9999px',   // pill/circle
} as const;

/**
 * Shadow tokens (use these instead of hardcoding)
 */
export const SHADOWS = {
  CARD: 'var(--shadow-card)',
  HOVER: 'var(--shadow-hover)',
  MODAL: 'var(--shadow-modal)',
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

/**
 * Anti-patterns — NEVER USE THESE
 */
export const FORBIDDEN = {
  // Forbidden colors
  AI_PURPLE: '#A855F7',
  AI_PINK: '#EC4899',
  PURE_BLACK: '#000000',
  NEON_GREEN: '#00FF00',
  
  // Forbidden gradients
  AI_GRADIENT_1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  AI_GRADIENT_2: 'linear-gradient(135deg, #A855F7, #EC4899)',
  
  // Forbidden shadow
  PURE_BLACK_SHADOW: '0 10px 40px rgba(0, 0, 0, 0.2)',
  
  // Forbidden words
  RESORT: 'resort',  // Use: nông trại, trạm thu mua, kho bảo quản
  CENTER: 'center',  // Too industrial
  STATION: 'station', // Too industrial
} as const;
