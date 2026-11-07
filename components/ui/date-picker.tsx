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

function DatePicker({ value, onChange, min, max, placeholder = "dd/mm/yyyy", className, disabled, ...props }: DatePickerProps) {
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

export { DatePicker }
