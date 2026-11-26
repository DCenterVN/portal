import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { useProductDetail } from "./use-product-detail";

export function ProductCompartmentDrawer({ detail }: { detail: ReturnType<typeof useProductDetail> }) {
  const { selected, selectedComponent, onDrawerOpenChange, restoreComponentFocus, failedComponentImages, onComponentImageError } = detail;
  const showPhoto = Boolean(selected?.imageUrl) && selectedComponent !== null && !failedComponentImages[selectedComponent];

  return (
    <Drawer direction="right" open={selected !== undefined} onOpenChange={onDrawerOpenChange}>
      <DrawerContent id="selected-compartment" onCloseAutoFocus={restoreComponentFocus} className="after:hidden data-[vaul-drawer-direction=right]:inset-y-2 data-[vaul-drawer-direction=right]:right-2 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[90vw] data-[vaul-drawer-direction=right]:rounded-lg data-[vaul-drawer-direction=right]:border data-[vaul-drawer-direction=right]:sm:max-w-[400px]">
        <DrawerHeader className="p-5 text-left">
          <div className="flex items-center gap-3.5">
            {showPhoto && (
              <span className="size-13 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                <img
                  src={selected?.imageUrl}
                  alt={selected?.name ?? ""}
                  className="size-full object-cover"
                  onError={() => {
                    if (selectedComponent !== null) onComponentImageError(selectedComponent);
                  }}
                />
              </span>
            )}
            <div className="min-w-0">
              <DrawerTitle>
                {selected?.slotLabel ? `Ngăn ${selected.slotLabel}: ${selected.name}` : `Ngăn ${selected?.name}`}
              </DrawerTitle>
              <DrawerDescription>{selected?.grams} g/người · {selected?.share}</DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {selected && selected.ingredients.length > 0 && (
            <p className="mb-3 rounded-[var(--r-6)] bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Nguyên liệu: </span>
              {selected.ingredients.join(", ")}
            </p>
          )}
          <dl className="grid grid-cols-2 gap-3">
            {selected?.nutrients.map(nutrient => (
              <div key={nutrient.key} className="rounded-[var(--r-6)] border p-4">
                <dt className="text-xs text-muted-foreground">{nutrient.label}</dt>
                <dd className="mt-2 text-lg font-medium tabular-nums">{nutrient.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <DrawerFooter className="p-5">
          <DrawerClose asChild><Button variant="outline" size="touch">Đóng</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
