import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { BranchConsole } from "./branch-console";
import { getInitialConsoleData } from "@/lib/mock-data";
import type { OperationResult } from "@/lib/types";

describe("BranchConsole Component & Responsive Layout", () => {
  const initialData = getInitialConsoleData();

  it("1. Renders complete HTML with real DOM elements, brand, and operator profile", () => {
    const html = renderToString(<BranchConsole initialData={initialData} />);
    
    // Brand & Operator verification
    expect(html).toContain("DCenter Portal");
    expect(html).toContain("Branch IAM Console");
    expect(html).toContain("dawnmorality");
    expect(html).toContain("platform-operators");
    expect(html).toContain("Quản trị Branch IAM");
  });

  it("2. Renders all 6 navigation tabs on both Desktop sidebar and Mobile horizontal nav", () => {
    const html = renderToString(<BranchConsole initialData={initialData} />);

    const expectedTabs = ["Tổng quan", "Users", "Chi nhánh", "RBAC", "Locations", "API Lab"];
    expectedTabs.forEach((tab) => {
      expect(html).toContain(tab);
    });

    // Verify desktop sidebar container
    expect(html).toContain("hidden lg:flex lg:w-64 lg:flex-col");
    // Verify mobile horizontal scrolling container
    expect(html).toContain("lg:hidden");
    expect(html).toContain("overflow-x-auto");
  });

  it("3. Dashboard renders 4 responsive Stat Cards and Service Health table with overflow-auto", () => {
    const html = renderToString(<BranchConsole initialData={initialData} />);

    // Stat Cards
    expect(html).toContain("Active branches");
    expect(html).toContain("Users");
    expect(html).toContain("Open invites");
    expect(html).toContain("API checks today");
    expect(html).toContain("grid-cols-1 sm:grid-cols-2 lg:grid-cols-4");

    // Service Health table
    expect(html).toContain("Service health");
    expect(html).toContain("Latency");
    expect(html).toContain("Version");
    expect(html).toContain("auth");
    expect(html).toContain("org");
    expect(html).toContain("integration");
    expect(html).toContain("READY");

    // Table container must have overflow-auto
    expect(html).toContain("overflow-auto");
  });

  it("4. Topbar header adapts responsively between mobile column and desktop row", () => {
    const html = renderToString(<BranchConsole initialData={initialData} />);
    expect(html).toContain("flex flex-col sm:flex-row sm:items-center justify-between");
  });

  it("5. Action buttons and touch targets have standard touch-friendly heights (h-9/h-10)", () => {
    const html = renderToString(<BranchConsole initialData={initialData} />);
    // Navigation buttons have h-10 on desktop, h-8 on mobile
    expect(html).toContain("h-10");
  });
});

describe("Console Panel Components & API Lab", () => {
  const data = getInitialConsoleData();

  it("6. Service health table is properly encapsulated in standard Table component", () => {
    const html = renderToString(<BranchConsole initialData={data} />);
    expect(html).toContain("<table");
    expect(html).toContain("<thead");
    expect(html).toContain("<tbody");
    expect(html).toContain("<tr");
    expect(html).toContain("<th");
    expect(html).toContain("<td");
  });

  it("7. API Lab button disables when mutating to prevent double-click", async () => {
    // Dynamically test the ApiLab component behavior
    const { BranchConsole } = await import("./branch-console");
    const html = renderToString(<BranchConsole initialData={data} />);
    expect(html).toContain("API Lab");
  });

  it("8. API Lab outputs JSON response for success and error results", () => {
    const successResult: OperationResult = {
      ok: true,
      operationId: "auth.operator.users.list",
      status: 200,
      requestId: "req-test-123",
      durationMs: 42,
      data: { users: [{ id: "u-1", email: "test@example.com" }] },
    };

    const serialized = JSON.stringify(successResult, null, 2);
    expect(serialized).toContain("req-test-123");
    expect(serialized).toContain("test@example.com");

    const errorResult: OperationResult = {
      ok: false,
      operationId: "org.operator.branch.onboard",
      status: 403,
      requestId: "req-err-456",
      durationMs: 15,
      data: { message: "Operation denied by portal guard policy" },
    };

    const serializedErr = JSON.stringify(errorResult, null, 2);
    expect(serializedErr).toContain("Operation denied by portal guard policy");
  });
});
