import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { BranchFormDialog } from "./branch-form-dialog";

type SurfaceProps = { children?: ReactNode; open?: boolean };
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: SurfaceProps) => open ? children : null,
  DialogContent: ({ children }: SurfaceProps) => <section>{children}</section>,
  DialogHeader: ({ children }: SurfaceProps) => <header>{children}</header>,
  DialogFooter: ({ children }: SurfaceProps) => <footer>{children}</footer>,
  DialogTitle: ({ children }: SurfaceProps) => <h2>{children}</h2>,
  DialogDescription: ({ children }: SurfaceProps) => <p>{children}</p>,
}));

it("form tạo có chọn loại chi nhánh, mặc định Cửa hàng", () => {
  const html = renderToStaticMarkup(<BranchFormDialog open onOpenChange={() => {}} onCreated={async () => {}} />);
  expect(html).toContain("Loại chi nhánh");
  expect(html).toContain('value="STORE"');
  expect(html).toContain('value="CENTRAL_KITCHEN"');
  expect(html).toContain("Bếp trung tâm");
});
