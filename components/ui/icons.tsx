import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ChevronDown(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}><path d="m6 9 6 6 6-6" /></svg>;
}

export function Check(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}><path d="m5 12 4 4L19 6" /></svg>;
}

export function Loader2(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}><path d="M21 12a9 9 0 1 1-9-9" /></svg>;
}
