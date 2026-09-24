# Đất Việt — Brand DNA & Design System Specification

> **Phiên bản:** 2.0.0 — Rustic Vietnamese Farming Aesthetic  
> **Áp dụng cho:** Tất cả ứng dụng (`apps/web`, `apps/admin`, mobile) và các AI Agents  
> **Nguyên tắc cốt lõi:** Loại bỏ hoàn toàn "mùi AI" — không glass morphism vô hồn, không gradient tím hồng, không shadow đen thuần

---

## 1. Bản sắc Thương hiệu (Brand Essence)

**Đất Việt** = Đất đỏ bazan + Bàn tay nông dân + Minh bạch từ nông trại tới bàn ăn

### Visual Direction:
- **Rustic & Earthy**: Giấy kraft, đất nung, gỗ thông, tre, non lá
- **Story-First**: Chân dung nông dân, khoảnh khắc thu hoạch, tọa độ GPS, mã lô truy xuất
- **Vietnamese Heritage Palette**: Đất đỏ bazan `#A84534`, lúa non `#7FB069`, nắng cao nguyên `#F4B860`
- **Selective Blur**: CHỈ modal/nav — card sản phẩm KHÔNG dùng blur

### Tham chiếu thiết kế:
- **Floret Flower Farm** (rustic authenticity, farmer portraits)
- **Holmes Brothers Farms** (story-first, focused imagery)
- **Garden Sweet** (benefit-led, natural light photography)

---

## 2. Color Tokens

### Light Theme — "Sương mai cao nguyên"
```css
:root, [data-theme="light"] {
  /* Canvas */
  --color-bg: #F5F3E8;
  --color-card: #FFFFFF;
  --color-panel: #FBF9F2;
  
  /* Text */
  --color-text-primary: #2D2419;
  --color-text-secondary: #6B5D4F;
  --color-text-muted: #8B7F72;
  
  /* Brand */
  --color-earth: #A84534;        /* Primary CTA */
  --color-earth-hover: #8B3626;
  --color-rice: #7FB069;         /* Success */
  --color-sun: #F4B860;          /* Warning */
  --color-pine: #5B8A72;         /* Info */
  --color-danger: #C84B31;
  
  /* Neutral */
  --color-border: #E0D5C7;
  --color-divider: #D4C4B0;
  
  /* Shadows (earth-toned) */
  --shadow-card: 0 8px 30px rgb(134, 110, 90, 0.12);
  --shadow-hover: 0 12px 40px rgb(134, 110, 90, 0.16);
  --shadow-modal: 0 20px 60px rgb(134, 110, 90, 0.20);
}
```

### Dark Theme — "Đêm nông trại"
```css
[data-theme="dark"], .dark {
  /* Canvas */
  --color-bg: #1A1512;
  --color-card: #2D2419;
  --color-panel: #3A2F23;
  
  /* Text */
  --color-text-primary: #F5F3E8;
  --color-text-secondary: #C4B5A0;
  --color-text-muted: #8B7F72;
  
  /* Brand (luminous) */
  --color-earth: #E87461;
  --color-earth-hover: #D9624F;
  --color-rice: #9FD683;
  --color-sun: #FFD17A;
  --color-pine: #7BB098;
  --color-danger: #FF6F59;
  
  /* Neutral */
  --color-border: #4A3F32;
  --color-divider: #3A2F23;
  
  /* Shadows (firelight glow) */
  --shadow-card: 0 8px 30px rgb(232, 116, 97, 0.15);
  --shadow-hover: 0 12px 40px rgb(232, 116, 97, 0.20);
  --shadow-modal: 0 20px 60px rgb(232, 116, 97, 0.25);
}
```

### Anti-Patterns (FORBIDDEN):
```css
/* ❌ NEVER USE THESE */
--ai-purple: #A855F7;
--ai-pink: #EC4899;
--pure-black: #000000;
--neon-green: #00FF00;

/* ❌ FORBIDDEN GRADIENTS */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background: linear-gradient(135deg, #A855F7, #EC4899);

/* ❌ FORBIDDEN SHADOWS */
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); /* Pure black shadow */
```

---

## 3. Typography

### Font Stack:
```css
--font-serif: 'Noto Serif', 'Noto Serif Vietnamese', Georgia, serif;
--font-mono: 'IBM Plex Mono', 'Courier New', monospace;
--font-sans: 'Be Vietnam Pro', -apple-system, sans-serif;
```

### Usage:
| Element | Font | Size | Weight |
|---|---|---|---|
| Hero | Noto Serif | 36-48px | 700 |
| Page Title | Noto Serif | 28-32px | 700 |
| Product Name | Noto Serif | 18-20px | 600 |
| Body | Be Vietnam Pro | 15-16px | 400 |
| Data Label | IBM Plex Mono | 13-14px | 500 |
| Price | Noto Serif | 20-24px | 700 |
| Button | Be Vietnam Pro | 14-15px | 600 |
| Badge | Be Vietnam Pro | 11-12px | 600 |

---

## 4. Component Patterns

### Product Card
```tsx
<div className="group rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all duration-300">
  {/* Image: aspect-[4/3] with subtle gradient overlay */}
  <div className="relative aspect-[4/3] overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/10 z-10" />
    <img 
      src="..." 
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
    />
    
    {/* Top-left: Certification badge with selective blur */}
    <div className="absolute top-2.5 left-2.5 z-20 backdrop-blur-sm bg-black/75 border border-white/20 text-white text-xs font-semibold rounded-full px-2.5 py-1 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-rice)] animate-pulse" />
      VietGAP
    </div>
    
    {/* Top-right: Temperature */}
    <div className="absolute top-2.5 right-2.5 z-20 backdrop-blur-sm bg-[var(--color-pine)]/80 border border-white/15 text-white text-xs font-semibold rounded-full px-2.5 py-1">
      4–8 °C
    </div>
  </div>
  
  {/* Content: NO BLUR HERE */}
  <div className="p-4 space-y-2">
    <h3 className="font-serif text-lg font-semibold text-[var(--color-text-primary)]">
      Cà rốt hữu cơ Đà Lạt
    </h3>
    <p className="text-sm text-[var(--color-text-secondary)]">
      Từ nông dân Nguyễn Văn Tuấn, thu hoạch lúc 5h sáng
    </p>
    <div className="flex items-center gap-3 text-xs font-mono text-[var(--color-text-muted)]">
      <span>Lô #ATK-2026-09-15</span>
      <span>•</span>
      <span>1,2 kg</span>
    </div>
    <div className="flex items-center justify-between pt-2">
      <span className="font-serif text-2xl font-bold text-[var(--color-earth)]">
        35.000 ₫
      </span>
      <button className="rounded-xl bg-[var(--color-earth)] hover:bg-[var(--color-earth-hover)] text-white px-4 py-2 text-sm font-semibold active:scale-95 transition-all">
        + Giỏ
      </button>
    </div>
  </div>
</div>
```

**RULES:**
- ✅ Card surface: NO BLUR (solid `bg-[var(--color-card)]`)
- ✅ Shadow: Earth-toned `rgb(134, 110, 90, 0.12)` NOT pure black
- ✅ Badge on image: `backdrop-blur-sm` ONLY
- ✅ Image overlay: subtle gradient for badge contrast
- ✅ Aspect ratio: 4:3 (not 16:9)
- ❌ NO: `backdrop-blur-xl` on card surface
- ❌ NO: `rounded-3xl` (overly round)
- ❌ NO: flat shadow `rgba(0,0,0,0.1)`

### Button Variants
```tsx
// Primary — Đất đỏ bazan
<button className="rounded-xl bg-[var(--color-earth)] hover:bg-[var(--color-earth-hover)] text-white px-6 py-2.5 font-semibold shadow-[var(--shadow-card)] active:scale-[0.98] transition-all">
  Mua ngay
</button>

// Secondary — Outline
<button className="rounded-xl border-2 border-[var(--color-earth)] text-[var(--color-earth)] hover:bg-[var(--color-earth)] hover:text-white px-6 py-2.5 font-semibold active:scale-[0.98] transition-all">
  Xem chi tiết
</button>

// Ghost
<button className="rounded-xl text-[var(--color-earth)] hover:bg-[var(--color-earth)]/10 px-6 py-2.5 font-semibold active:scale-[0.98] transition-all">
  Tìm hiểu thêm
</button>
```

**RULES:**
- ✅ Min height: 44px (touch target)
- ✅ Border radius: `rounded-xl` (12px)
- ❌ NO: `rounded-none` (too sharp)
- ❌ NO: `rounded-full` for primary CTA (only for badges)

### Modal (Selective Blur)
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop: THIS is where we use blur */}
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
  
  {/* Modal: NO blur on content area */}
  <div className="relative z-10 w-full max-w-lg mx-4 bg-[var(--color-card)] rounded-2xl shadow-[var(--shadow-modal)] border border-[var(--color-border)]">
    {/* Header */}
    <div className="px-6 py-4 border-b border-[var(--color-border)]">
      <h2 className="font-serif text-2xl font-bold text-[var(--color-text-primary)]">
        Chi tiết sản phẩm
      </h2>
    </div>
    
    {/* Body */}
    <div className="px-6 py-4">
      {/* Content */}
    </div>
    
    {/* Footer */}
    <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-end gap-3">
      <button className="rounded-xl border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-panel)] px-6 py-2.5 font-semibold">
        Đóng
      </button>
      <button className="rounded-xl bg-[var(--color-earth)] hover:bg-[var(--color-earth-hover)] text-white px-6 py-2.5 font-semibold">
        Xác nhận
      </button>
    </div>
  </div>
</div>
```

**RULES:**
- ✅ Blur on backdrop: `backdrop-blur-sm` or `backdrop-blur-md`
- ✅ NO blur on modal content area
- ✅ Earth-toned shadow for depth

---

## 5. Blur Usage Matrix

| Element | Blur | Reason |
|---|---|---|
| **Card surface** | ❌ NO | Solid surface with earth-toned shadow |
| **Badge on image** | ✅ YES (`backdrop-blur-sm`) | Legibility over varied backgrounds |
| **Modal backdrop** | ✅ YES (`backdrop-blur-sm`) | Focus on modal content |
| **Navigation (sticky)** | ✅ YES (`backdrop-blur-md`) | Floats over content |
| **Dropdown menu** | ✅ YES (`backdrop-blur-sm`) | Overlay element |
| **Toast notification** | ✅ YES (`backdrop-blur-md`) | Temporary overlay |
| **Button** | ❌ NO | Solid interactive element |
| **Badge in content** | ❌ NO | Solid semantic indicator |

---

## 6. Photography Guidelines

### DO (Nên làm):
✅ Natural light (ánh sáng tự nhiên)
✅ Farmer portraits (chân dung nông dân)
✅ Field shots (cảnh đồng, vườn)
✅ Harvest moments (thu hoạch 5h sáng)
✅ Texture close-ups (đất đỏ, lá cây)
✅ Vietnamese context (non lá, giỏ tre, xe máy)

### DON'T (Không nên):
❌ Studio white background
❌ Stock photo models
❌ Overly saturated colors
❌ Floating products
❌ AI-generated imagery
❌ Generic farm photos from abroad

---

## 7. Voice & Terminology

### BẮT BUỘC:
- ✅ `Nông trại`, `Trạm thu mua`, `Kho bảo quản`
- ✅ Sentence case: *Nông dân Nguyễn Văn A*
- ✅ Currency: `35.000 ₫`
- ✅ Temperature: `-18,5 °C`
- ✅ Tone: Ấm áp, chân thực — *"Từ bàn tay nông dân Đà Lạt"*

### CẤM:
- ❌ `Resort`, `Center`, `Station`
- ❌ ALL CAPS: `ORGANIC CERTIFIED`
- ❌ Marketing fluff: *"Premium quality"*, *"AI-powered"*

---

## 8. Spacing Scale

```
1  = 4px    (tight)
2  = 8px    (compact)
3  = 12px   (base)
4  = 16px   (comfortable)
6  = 24px   (spacious)
8  = 32px   (section)
12 = 48px   (large)
16 = 64px   (hero)
```

---

## 9. Responsive Breakpoints

```
sm:  640px  (mobile landscape)
md:  768px  (tablet)
lg:  1024px (desktop)
xl:  1280px (large desktop)
2xl: 1536px (ultra-wide)
```

---

## 10. Animation Timing

```
duration-150  (hover feedback)
duration-300  (default)
duration-700  (image zoom)
```

```
ease-out      (natural deceleration)
ease-in-out   (spring-like)
```

---

## 11. Developer Checklist

Trước khi commit:
- [ ] Test cả Light và Dark mode?
- [ ] Dùng CSS variables (`var(--color-earth)`) thay vì hardcode hex?
- [ ] Card không dùng blur?
- [ ] Shadow dùng earth-toned color?
- [ ] Font: Noto Serif (headings), IBM Plex Mono (data), Be Vietnam Pro (body)?
- [ ] Không có từ "Resort"?
- [ ] Không có ALL CAPS?
- [ ] Touch target ≥ 44px?
- [ ] File ≤ 300 dòng?
- [ ] Responsive trên 375px?

---

## 12. Agent Rules

### MUST (BẮT BUỘC):
✅ Import từ `@dcentervn/design-tokens` và `@dcentervn/ui`
✅ Dùng CSS variables
✅ Test Light + Dark mode
✅ File ≤ 300 dòng

### MUST NOT (CẤM):
❌ Hardcode màu hex: `bg-[#A84534]` → dùng `bg-[var(--color-earth)]`
❌ Tự chế component
❌ Copy Shadcn/V0 mà không adapt
❌ Dùng AI purple/pink gradient
❌ Blur everywhere (glass morphism abuse)
❌ Pure black shadow
❌ Từ "Resort"
❌ ALL CAPS

---

## 13. Examples

### Hero Section
```tsx
<section className="relative min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
  <div className="absolute inset-0">
    <img src="/dalat-farm.jpg" className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
  </div>
  
  <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
    <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight mb-6">
      Từ đất đỏ bazan Đà Lạt <br/>
      tới bàn ăn gia đình bạn
    </h1>
    <p className="text-xl md:text-2xl text-white/90 mb-8">
      Nông sản hữu cơ minh bạch, truy xuất từng bước
    </p>
    <button className="rounded-xl bg-[var(--color-earth)] hover:bg-[var(--color-earth-hover)] text-white px-8 py-4 text-lg font-semibold shadow-2xl active:scale-95 transition-all">
      Khám phá nông trại
    </button>
  </div>
</section>
```

---

**Kết luận:**
DNA này loại bỏ hoàn toàn "mùi AI" bằng:
1. **Từ chối glass morphism** (chỉ blur có chọn lọc)
2. **Bảng màu đất Việt** (đất đỏ bazan, lúa non, nắng)
3. **Shadow màu đất nung** (không đen thuần)
4. **Font storytelling** (Noto Serif + IBM Plex Mono)
5. **Ảnh nông dân thật** (không stock photo)
6. **Tone rustic** (không "premium quality")
