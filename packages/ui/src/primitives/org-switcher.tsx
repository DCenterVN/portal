"use client";

import React, { useState, useRef, useEffect } from "react";
import { Badge } from "./badge";

export interface BranchOption {
  id: string;
  name: string;
  type: "cold_hub" | "distribution" | "store" | "farm";
  status: "active" | "standby";
  location?: string;
}

export interface OrgSwitcherProps {
  currentBranch: BranchOption;
  branches: BranchOption[];
  userRole?: string;
  onSelectBranch?: (branch: BranchOption) => void;
  className?: string;
}

export function OrgSwitcher({
  currentBranch,
  branches,
  userRole = "Quản lý Vận hành",
  onSelectBranch,
  className = "",
}: OrgSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3.5 py-2 text-left transition-all hover:bg-[var(--color-panel-strong)]"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-semibold text-[var(--color-ink)]">
              {currentBranch.name}
            </span>
            <Badge variant="forest" pulse={true}>
              Hoạt động
            </Badge>
          </div>
          {userRole && (
            <span className="text-[11px] text-[var(--color-muted)]">
              {userRole}
            </span>
          )}
        </div>

        <svg
          className={`h-4 w-4 text-[var(--color-muted)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-xl border border-[var(--color-line)] bg-[var(--color-panel-strong)]/95 p-1.5 shadow-2xl backdrop-blur-md z-50">
          <div className="px-3 py-2 border-b border-[var(--color-line)]">
            <p className="text-xs font-semibold tracking-wider text-[var(--color-muted)]">
              Chọn chi nhánh điều phối
            </p>
          </div>

          <div className="mt-1 space-y-1 max-h-60 overflow-y-auto">
            {branches.map((branch) => {
              const isSelected = branch.id === currentBranch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => {
                    onSelectBranch?.(branch);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-[var(--color-leaf)]/10 text-[var(--color-leaf)] font-semibold"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-panel)]"
                  }`}
                >
                  <div>
                    <p className="font-medium">{branch.name}</p>
                    {branch.location && (
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        {branch.location}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <svg
                      className="h-4 w-4 text-[var(--color-leaf)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
