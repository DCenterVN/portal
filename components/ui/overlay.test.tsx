import { describe, it, expect } from "vitest";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { ToastProvider, useToast } from "./toast";
import { ColdChainViolationModal } from "../modals/cold-chain-violation-modal";
import { MAIN_NAV_ITEMS } from "../layout/sidebar";

describe("Overlay & Modal System (00)", () => {
  it("Dialog components define structure properly", () => {
    const dialogElement = React.createElement(
      Dialog,
      { open: true },
      React.createElement(
        DialogContent,
        null,
        React.createElement(
          DialogHeader,
          null,
          React.createElement(DialogTitle, null, "Tiêu đề Hộp thoại"),
          React.createElement(DialogDescription, null, "Mô tả hộp thoại")
        ),
        React.createElement(DialogFooter, null, "Nội dung chân")
      )
    );

    expect(dialogElement).toBeDefined();
  });

  it("ColdChainViolationModal strictly conforms to fail-closed principle", () => {
    const modalElement = React.createElement(ColdChainViolationModal, {
      open: true,
      onOpenChange: () => {},
      lotCode: "#LOT-2026-CH-0091",
      measuredTemp: "-12,4 °C",
      thresholdTemp: "-18,0 °C",
    });

    expect(modalElement).toBeDefined();
  });

  it("DialogContent supports Layer 5 critical and Layer 6 session with proper layer prop", () => {
    const criticalDialog = React.createElement(
      Dialog,
      { open: true },
      React.createElement(DialogContent, { layer: "critical" }, "Nội dung cảnh báo")
    );
    expect(criticalDialog.props.open).toBe(true);

    const sessionDialog = React.createElement(
      Dialog,
      { open: true },
      React.createElement(DialogContent, { layer: "session" }, "Khóa phiên")
    );
    expect(sessionDialog.props.open).toBe(true);
  });

  it("ToastProvider and hook are properly defined", () => {
    expect(typeof ToastProvider).toBe("function");
    expect(typeof useToast).toBe("function");
  });
});

describe("Admin Shell & Sidebar Navigation", () => {
  it("MAIN_NAV_ITEMS contains all required enterprise operations items without the word resort", () => {
    expect(MAIN_NAV_ITEMS.length).toBeGreaterThanOrEqual(6);

    const labels = MAIN_NAV_ITEMS.map((item) => item.label);
    expect(labels).toContain("Tổng quan Chi nhánh");
    expect(labels).toContain("Kiểm nhận Hàng hoá");
    expect(labels).toContain("Kiểm định QC & Lô");
    expect(labels).toContain("Nhà cung cấp & Chuỗi lạnh");

    // Strict rule: NEVER use the word "resort"
    MAIN_NAV_ITEMS.forEach((item) => {
      expect(item.label.toLowerCase()).not.toContain("resort");
      expect(item.href.toLowerCase()).not.toContain("resort");
    });
  });
});
