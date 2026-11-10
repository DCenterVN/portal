import { Drumstick, Fish, Leaf, Package, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogArtwork } from "./catalog-artwork";
import type { useProductDetail } from "./use-product-detail";
import styles from "./product-orbit.module.css";

function compartmentIcon(name: string, productName: string) {
  if (/gia vị|gói|nước chấm|cốt/i.test(name) && !/đạm/i.test(name)) return Package;
  if (/rau/i.test(name)) return Leaf;
  if (/tinh bột/i.test(name)) return Wheat;
  return /cá|tôm|mực/i.test(`${name} ${productName}`) ? Fish : Drumstick;
}

export function ProductOrbit({ detail }: { detail: ReturnType<typeof useProductDetail> }) {
  const { product, components, selectedComponent, selected, selectComponent, resetComponent, dishRef, cover, onImageError } = detail;
  return <section className={styles.visual} aria-labelledby="orbit-heading">
    <p className="text-xs font-medium uppercase tracking-widest text-primary">Từ nguyên liệu đến bữa ăn</p>
    <h2 id="orbit-heading" className="mt-3 text-2xl font-medium tracking-tight">Biết mình đang ăn gì.</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Chọn từng ngăn để khám phá dinh dưỡng mỗi người.</p>
    <div className={styles.stage} data-selected={false} role="group" aria-label="Món ăn và các ngăn dinh dưỡng">
      <div className={styles.orbitLine} aria-hidden="true" />
      <Button variant="ghost" size="content" ref={dishRef} type="button" className={styles.dish} onClick={resetComponent} aria-label={`${product.name}, trở về thông tin món`}>
        <span className={styles.dishArt}>{cover ? <img src={cover} alt={product.name} className="size-full object-cover" onError={onImageError} /> : <CatalogArtwork name={product.name} />}</span>
        <strong>{product.name}</strong>
        <small>{product.portion_count ? `Cho ${product.portion_count.toLocaleString("vi-VN")} người` : "Thông tin món"}</small>
      </Button>
      <div className={styles.ring}>
        {components.map((component, index) => {
          const Icon = compartmentIcon(component.name, product.name);
          return <div key={index} className={styles.slot} style={component.position} data-active={selectedComponent === index}>
          <div className={styles.upright}>
            <div className={styles.arrival} style={component.arrival}>
              <Button variant="ghost" size="content" type="button" className={styles.component} aria-label={`Ngăn ${component.name}, ${component.grams} g/người, xem dinh dưỡng`} aria-pressed={selectedComponent === index} aria-haspopup="dialog" aria-controls={selectedComponent === index ? "selected-compartment" : undefined} onClick={event => selectComponent(index, event.currentTarget)}>
                <span className={styles.componentArt} aria-hidden="true"><Icon size={24} strokeWidth={1.75} /></span>
                <span className={styles.componentName}>{component.name}</span><span className={styles.grams}>{component.grams} g/người</span>
              </Button>
            </div>
          </div>
        </div>; })}
      </div>
    </div>
    {!components.length && <p className="py-4 text-sm text-muted-foreground">Thành phần món đang được cập nhật.</p>}
    <p className={styles.caption} aria-live="polite"><span>{selected ? `Đang xem ngăn ${selected.name}` : `${components.length.toLocaleString("vi-VN")} ngăn · Lượng cho 1 người`}</span><span>{selected ? "Đóng khung để trở về" : "Chạm để khám phá"}</span></p>
  </section>;
}
