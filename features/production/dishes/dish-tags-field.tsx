import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tip } from "@/components/patterns/tip";
import { addTag, suggestTags } from "@/lib/dishes/tags";

export function DishTagsField({ name, ingredientNames, tags, readOnly, error, onChange }: {
  name: string; ingredientNames: string[]; tags: string[]; readOnly: boolean; error: string; onChange: (tags: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const manual = useRef(tags.length > 0);
  const latest = useRef({ tags, onChange });
  latest.current = { tags, onChange };
  const names = ingredientNames.join("|");
  useEffect(() => {
    if (readOnly || manual.current) return;
    const next = suggestTags(name, names ? names.split("|") : []);
    if (next.join() !== latest.current.tags.join()) latest.current.onChange(next);
  }, [name, names, readOnly]);
  const edit = (next: string[]) => { manual.current = true; onChange(next); };
  const commit = () => { if (text.trim()) edit(addTag(tags, text)); setText(""); setAdding(false); };
  return <div className="space-y-1"><ul aria-label="Hashtag" className="flex flex-wrap items-center gap-2">
    {tags.map(tag => <li key={tag}><Badge variant="secondary" className="gap-1 pr-0.5 font-normal">#{tag}
      {!readOnly && <Tip label="Bỏ hashtag"><Button type="button" variant="ghost" size="icon-xs" aria-label={`Bỏ hashtag ${tag}`} onClick={() => edit(tags.filter(item => item !== tag))}><X aria-hidden="true" /></Button></Tip>}
    </Badge></li>)}
    {!readOnly && <li>{adding
      ? <Input autoFocus aria-label="Hashtag mới" className="h-8 w-40" value={text} onChange={event => setText(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commit(); } if (event.key === "Escape") { setText(""); setAdding(false); } }} />
      : <Tip label="Thêm hashtag"><Button type="button" variant="outline" size="icon-sm" aria-label="Thêm hashtag" disabled={tags.length >= 8} onClick={() => setAdding(true)}><Plus aria-hidden="true" /></Button></Tip>}</li>}
  </ul>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}
