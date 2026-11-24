"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { vi } from "date-fns/locale/vi"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"

const ISO = "yyyy-MM-dd"

const yearsAgo = (years: number) => new Date(new Date().getFullYear() - years, 0, 1)
const yearsAhead = (years: number) => new Date(new Date().getFullYear() + years, 11, 31)

function toDate(iso?: string) {
  if (!iso) return undefined
  const date = parse(iso, ISO, new Date())
  return Number.isNaN(date.getTime()) ? undefined : date
}

type DatePickerProps = Omit<React.ComponentProps<typeof Button>, "value" | "onChange"> & {
  value: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  placeholder?: string
}

function DatePicker({ value, onChange, min, max, placeholder = "Chọn ngày", className, disabled, ...props }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = toDate(value)
  const from = toDate(min)
  const to = toDate(max)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-slot="date-picker"
          data-empty={!selected}
          disabled={disabled}
          className={cn("w-full justify-start font-normal data-[empty=true]:text-muted-foreground", className)}
          {...props}
        >
          <CalendarIcon />
          {selected ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={vi}
          weekStartsOn={1}
          captionLayout="dropdown"
          startMonth={from ?? yearsAgo(20)}
          endMonth={to ?? yearsAhead(10)}
          selected={selected}
          defaultMonth={selected ?? from}
          disabled={[...(from ? [{ before: from }] : []), ...(to ? [{ after: to }] : [])]}
          onSelect={date => {
            if (!date) return
            onChange(format(date, ISO))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

type DateRangePickerProps = Omit<React.ComponentProps<typeof Button>, "value" | "onChange"> & {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  placeholder?: string
}

function DateRangePicker({ from, to, onChange, placeholder = "Chọn khoảng ngày", className, disabled, ...props }: DateRangePickerProps) {
  const start = toDate(from)
  const end = toDate(to)
  const label = start ? `${formatDate(from)} – ${end ? formatDate(to) : "..."}` : placeholder

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-slot="date-range-picker"
          data-empty={!start}
          disabled={disabled}
          className={cn("justify-start font-normal data-[empty=true]:text-muted-foreground", className)}
          {...props}
        >
          <CalendarIcon />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          locale={vi}
          weekStartsOn={1}
          captionLayout="dropdown"
          startMonth={yearsAgo(20)}
          endMonth={yearsAhead(10)}
          numberOfMonths={1}
          selected={start ? { from: start, to: end } : undefined}
          defaultMonth={start}
          onSelect={range => onChange({ from: range?.from ? format(range.from, ISO) : "", to: range?.to ? format(range.to, ISO) : "" })}
        />
        {start && <div className="border-t p-2"><Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onChange({ from: "", to: "" })}>Bỏ chọn ngày</Button></div>}
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DateRangePicker }
