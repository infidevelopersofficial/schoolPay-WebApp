"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useDebounce } from "@/hooks/use-debounce"

export type AsyncSearchOption = {
  value: string
  label: string
  subLabel?: string
}

interface AsyncComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  searchAction: (query: string) => Promise<AsyncSearchOption[]>
  placeholder?: string
  emptyText?: string
  defaultOptions?: AsyncSearchOption[]
  disabled?: boolean
  className?: string
}

export function AsyncCombobox({
  value,
  onValueChange,
  searchAction,
  placeholder = "Search...",
  emptyText = "No results found.",
  defaultOptions = [],
  disabled = false,
  className,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [options, setOptions] = React.useState<AsyncSearchOption[]>(defaultOptions)
  const [loading, setLoading] = React.useState(false)

  const debouncedQuery = useDebounce(query, 300)

  React.useEffect(() => {
    let active = true

    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setOptions(defaultOptions)
        return
      }

      setLoading(true)
      try {
        const results = await searchAction(debouncedQuery)
        if (active) {
          // Merge with selected value to always keep it in the list
          const selectedOption = options.find(o => o.value === value) || defaultOptions.find(o => o.value === value)
          const merged = [...results]
          if (selectedOption && !merged.find(o => o.value === selectedOption.value)) {
            merged.push(selectedOption)
          }
          setOptions(merged)
        }
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        if (active) setLoading(false)
      }
    }

    search()

    return () => {
      active = false
    }
  }, [debouncedQuery, searchAction, defaultOptions, value]) // options is excluded to avoid loop

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder} 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.subLabel && (
                      <span className="text-xs text-muted-foreground">{option.subLabel}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
