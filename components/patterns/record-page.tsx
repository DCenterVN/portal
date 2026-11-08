"use client";

import { useId, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRecordTab } from "@/lib/use-record-tab";

type HeaderProps = {
  name: string;
  image?: string;
  avatar?: ReactNode;
  contacts?: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
};

export function RecordHeader({ name, image, avatar, contacts, meta, badges, actions }: HeaderProps) {
  const initials = name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0)).join("").toUpperCase();
  return <Card className="rounded-lg shadow-none">
    <CardContent className="flex flex-wrap items-start gap-6">
      <div className="shrink-0">{avatar ?? <Avatar className="size-28 rounded-lg"><AvatarImage src={image} alt={name} /><AvatarFallback className="rounded-lg text-2xl">{initials}</AvatarFallback></Avatar>}</div>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3"><h1 className="break-words text-2xl font-semibold">{name}</h1>{contacts}</div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">{meta}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs">{badges}</div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </CardContent>
  </Card>;
}

export function RecordUpdated({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-3 text-xs text-muted-foreground"><Separator className="flex-1" /><p className="text-center">{children}</p><Separator className="flex-1" /></div>;
}

export function RecordTabs({ tabs }: { tabs: readonly { value: string; label: string; content: ReactNode }[] }) {
  const tab = useRecordTab(tabs.map((item) => item.value));
  return <Tabs value={tab.value} onValueChange={tab.select} className="gap-6">
    <div className="overflow-x-auto"><TabsList className="h-auto gap-1 rounded-lg bg-muted p-1">
      {tabs.map((item) => <TabsTrigger key={item.value} value={item.value} className="rounded-lg px-4 py-2 data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-none">{item.label}</TabsTrigger>)}
    </TabsList></div>
    {tabs.map((item) => <TabsContent key={item.value} value={item.value}>{item.content}</TabsContent>)}
  </Tabs>;
}

export function RecordSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return <section aria-labelledby={id} className="min-w-0"><Card className="h-full rounded-lg shadow-none">
    <CardHeader><h2 id={id} className="text-base font-semibold">{title}</h2></CardHeader>
    <CardContent className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">{children}</CardContent>
  </Card></section>;
}
