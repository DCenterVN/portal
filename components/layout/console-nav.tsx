"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, Circle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar,
} from "@/components/ui/sidebar";
import { isActive, openGroups, type NavGroup, type NavItem } from "@/lib/navigation";

const STORAGE_KEY = "sunny.nav.open";
const iconClass = "[&>svg]:text-muted-foreground data-[active=true]:[&>svg]:text-sidebar-accent-foreground";

function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function writeSaved(titles: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(titles));
  } catch {
    return;
  }
}

function ItemLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.match);
  const Icon = item.icon ?? Circle;
  return (
    <SidebarMenuButton asChild isActive={active} tooltip={item.label} className={iconClass}>
      <Link href={item.href as Route} aria-current={active ? "page" : undefined}>
        <Icon aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    </SidebarMenuButton>
  );
}

function GroupFlyout({ group, pathname }: { group: NavGroup; pathname: string }) {
  const Icon = group.icon ?? Circle;
  const active = group.items.some((item) => isActive(pathname, item.match));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton isActive={active} tooltip={group.title} className={iconClass}>
          <Icon aria-hidden="true" />
          <span>{group.title}</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={4} className="min-w-48">
        {group.items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href as Route} aria-current={isActive(pathname, item.match) ? "page" : undefined}>
              {item.icon && <item.icon aria-hidden="true" />}
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type SubListProps = { group: NavGroup; pathname: string };

function SubList({ group, pathname }: SubListProps) {
  return (
    <SidebarMenuSub className="border-l-0">
      {group.items.map((item) => (
        <SidebarMenuSubItem key={item.href}>
          <SidebarMenuSubButton asChild isActive={isActive(pathname, item.match)}>
            <Link href={item.href as Route} aria-current={isActive(pathname, item.match) ? "page" : undefined}>
              <span>{item.label}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

function GroupEntry({ group, pathname, open, fixed, onToggle }: SubListProps & { open: boolean; fixed: boolean; onToggle: (open: boolean) => void }) {
  const { state, isMobile } = useSidebar();
  const Icon = group.icon ?? Circle;
  const active = group.items.some((item) => isActive(pathname, item.match));
  if (group.items.length === 1) return <ItemLink item={group.items[0]} pathname={pathname} />;
  if (state === "collapsed" && !isMobile) return <GroupFlyout group={group} pathname={pathname} />;
  if (fixed) {
    return (
      <>
        <SidebarMenuButton isActive={active} className={`cursor-default ${iconClass}`} asChild>
          <div>
            <Icon aria-hidden="true" />
            <span>{group.title}</span>
          </div>
        </SidebarMenuButton>
        <SubList group={group} pathname={pathname} />
      </>
    );
  }
  return (
    <Collapsible open={open} onOpenChange={onToggle} className="group/collapsible">
      <CollapsibleTrigger asChild>
        <SidebarMenuButton tooltip={group.title} className={iconClass}>
          <Icon aria-hidden="true" />
          <span>{group.title}</span>
          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" aria-hidden="true" />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SubList group={group} pathname={pathname} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ConsoleNav({ nav, pathname }: { nav: NavGroup[]; pathname: string }) {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => setSaved(readSaved()), []);
  const open = openGroups(nav, pathname, saved);
  const toggle = (title: string, value: boolean) => {
    const next = value ? [...saved, title] : saved.filter((entry) => entry !== title);
    setSaved(next);
    writeSaved(next);
  };
  return (
    <SidebarGroup>
      <SidebarMenu>
        {nav.map((group) => (
          <SidebarMenuItem key={group.title}>
            <GroupEntry group={group} pathname={pathname} open={open.includes(group.title)} fixed={nav.length <= 2} onToggle={(value) => toggle(group.title, value)} />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
