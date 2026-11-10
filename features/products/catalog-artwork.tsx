export function CatalogArtwork({ name }: { name: string }) {
  const group = /canh|súp|cháo/i.test(name) ? "soup" : /^(rau|cải|nấm|đậu|salad)|xào chay/i.test(name) ? "vegetable" : /cá|tôm|mực/i.test(name) ? "fish" : "meat";
  return <div role="img" aria-label={name} className={`catalog-artwork catalog-artwork-${group} flex size-full flex-col items-center justify-center gap-3 overflow-hidden p-4`}>
    <div aria-hidden="true" className="catalog-plate"><i /><i /><i /><b /><b /><b /></div>
    <span className="sr-only">Minh hoạ món, hình món đang cập nhật</span>
  </div>;
}
