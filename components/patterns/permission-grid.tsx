"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VERBS } from "@/lib/access";

type Props = {
  actions: string[];
  resources: string[];
  catalog?: Set<string>;
  disabled?: boolean;
  onToggle?: (key: string, on: boolean) => void;
};

export function PermissionGrid({ actions, resources, catalog, disabled, onToggle }: Props) {
  const locked = (key: string) => !onToggle || !!disabled || (!!catalog && !catalog.has(key));
  const othersOf = (resource: string) =>
    actions.filter((act) => act.startsWith(`${resource}:`) && !(VERBS as readonly string[]).includes(act.slice(resource.length + 1)));

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Tài nguyên</TableHead>
              {VERBS.map((verb) => (
                <TableHead key={verb} className="text-center font-medium" title={verb}>
                  {verb[0].toUpperCase()}
                </TableHead>
              ))}
              <TableHead className="text-center font-medium">Khác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => {
              const others = othersOf(resource);
              return (
                <TableRow key={resource} className="transition-colors duration-100 hover:bg-muted">
                  <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-foreground">{resource}</TableCell>
                  {VERBS.map((verb) => {
                    const key = `${resource}:${verb}`;
                    return (
                      <TableCell key={verb} className="text-center">
                        <Checkbox
                          checked={actions.includes(key)}
                          disabled={locked(key)}
                          onCheckedChange={(on) => onToggle?.(key, on === true)}
                          aria-label={key}
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    {others.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-1">
                        {others.map((act) => (
                          <Badge key={act} variant="outline" className="font-mono" title={act}>
                            {act.slice(resource.length + 1)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Tài nguyên</span>
          <span className="font-mono">C · R · U · D · I · E</span>
        </div>
        {resources.map((resource) => {
          const others = othersOf(resource);
          return (
            <div key={resource} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium text-foreground break-all">{resource}</span>
                {others.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {others.map((act) => (
                      <Badge key={act} variant="outline" className="font-mono" title={act}>
                        {act.slice(resource.length + 1)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {VERBS.map((verb) => {
                  const key = `${resource}:${verb}`;
                  const checked = actions.includes(key);
                  return (
                    <Button
                      key={verb}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={key}
                      variant={checked ? "default" : "outline"}
                      size="sm"
                      disabled={locked(key)}
                      onClick={() => onToggle?.(key, !checked)}
                      className="text-xs font-medium"
                      title={verb}
                    >
                      {verb[0].toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
