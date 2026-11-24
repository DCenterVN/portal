import { fold } from "@/components/patterns/entity-picker";

const MAX = 8;
const SUGGESTED = 5;
const RESERVED = ["vegetarian", "vegan"];
const PADS = ["mon-an", "suat-an", "bua-chinh"];

export const tagOf = (text: string) => fold(text).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const usable = (tag: string) => tag !== "" && !RESERVED.includes(tag);

export function suggestTags(name: string, ingredientNames: string[]): string[] {
  const whole = tagOf(name);
  if (!whole) return [];
  const words = whole.split("-").filter(word => word.length > 1);
  const found = [whole, ...ingredientNames.map(tagOf), ...words, ...PADS].filter(usable);
  const unique = [...new Set(found)];
  return unique.slice(0, SUGGESTED);
}

export function addTag(tags: string[], text: string): string[] {
  const tag = tagOf(text);
  return !usable(tag) || tags.includes(tag) || tags.length >= MAX ? tags : [...tags, tag];
}
