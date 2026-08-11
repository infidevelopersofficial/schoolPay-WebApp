"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { AsyncSearchOption } from "./async-combobox"

interface AsyncMultiSelectProps {
  value?: string[]
  onValueChange: (value: string[]) => void
  searchAction: (query: string) => Promise<AsyncSearchOption[]>
  placeholder?: string
  emptyText?: string
  defaultOptions?: AsyncSearchOption[]
  disabled?: boolean
  className?: string
}

export function AsyncMultiSelect({
  value = [],
  onValueChange,
  searchAction,
  placeholder = "Search...",
  emptyText = "No results found.",
  defaultOptions = [],
  disabled = false,
  className,
}: AsyncMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<AsyncSearchOption[]>([])
  const [loading, setLoading] = React.useState(false)

  // Cache options we have seen so we can display their labels even if not in current search
  const [optionCache, setOptionCache] = React.useState<Map<string, AsyncSearchOption>>(() => {
    const map = new Map<string, AsyncSearchOption>()
    defaultOptions.forEach(opt => map.set(opt.value, opt))
    return map
  })

  const debouncedQuery = useDebounce(query, 300)

  React.useEffect(() => {
    let active = true

    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSearchResults([])
        return
      }

      setLoading(true)
      try {
        const results = await searchAction(debouncedQuery)
        if (active) {
          setSearchResults(results)
          // Update cache with new results
          setOptionCache(prev => {
            const next = new Map(prev)
            results.forEach(r => next.set(r.value, r))
            return next
          })
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
  }, [debouncedQuery, searchAction])

  const toggleOption = (optionValue: string) => {
    const newValues = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onValueChange(newValues)
  }

  // Combine search results with currently selected items so they always appear in the list
  const displayOptions = React.useMemo(() => {
    const map = new Map<string, AsyncSearchOption>()
    
    // Add selected items first
    value.forEach(v => {
      const cached = optionCache.get(v)
      if (cached) map.set(v, cached)
    })
    
    // Add search results
    searchResults.forEach(r => {
      map.set(r.value, r)
    })
    
    return Array.from(map.values())
  }, [value, searchResults, optionCache])

  const selectedOptions = value.map(v => optionCache.get(v)).filter(Boolean) as AsyncSearchOption[]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-[40px] px-3 py-2", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
            {selectedOptions.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selectedOptions.map((opt) => (
              <Badge 
                key={opt.value} 
                variant="secondary"
                className="mr-1 mb-1"
              >
                {opt.label}
                <button
                  type="button"
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted-foreground/20 p-0.5"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      toggleOption(opt.value);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleOption(opt.value);
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
          </div>
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
              ) : debouncedQuery.length < 2 ? (
                <div className="text-sm text-center py-4 text-muted-foreground">Type at least 2 characters to search...</div>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {displayOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => toggleOption(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option.value) ? "opacity-100" : "opacity-0"
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
