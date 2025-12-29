'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type Option = {
    value: string
    label: string
}

interface AsyncMultiSelectProps {
    placeholder?: string
    initialSelected?: Option[]
    onSearch: (query: string) => Promise<Option[]>
    onChange: (selected: Option[]) => void
}

export function AsyncMultiSelect({
    placeholder = 'Select...',
    initialSelected = [],
    onSearch,
    onChange,
}: AsyncMultiSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [selected, setSelected] = React.useState<Option[]>(initialSelected)
    const [options, setOptions] = React.useState<Option[]>([])
    const [loading, setLoading] = React.useState(false)
    const [query, setQuery] = React.useState('')

    React.useEffect(() => {
        const fetchOptions = async () => {
            setLoading(true)
            try {
                const results = await onSearch(query)
                setOptions(results)
            } catch (error) {
                console.error('Failed to fetch options', error)
                setOptions([])
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(() => {
            if (query.length >= 2 || query.length === 0) {
                // Fetch if query is meaningful or maybe empty to show default?
                // Actually API expects query. let's fetch only if query >= 2
                if (query.length >= 2) {
                    fetchOptions()
                } else {
                    setOptions([])
                }
            }
        }, 300)

        return () => clearTimeout(debounce)
    }, [query, onSearch])

    const handleSelect = (option: Option) => {
        if (selected.some((item) => item.value === option.value)) {
            // already selected, do nothing or remove? 
            // usually dropdown select adds. chips remove.
            // let's prevent duplicate select here, user removes via chips
        } else {
            const newSelected = [...selected, option]
            setSelected(newSelected)
            onChange(newSelected)
        }
    }

    const handleRemove = (value: string) => {
        const newSelected = selected.filter((item) => item.value !== value)
        setSelected(newSelected)
        onChange(newSelected)
    }

    return (
        <div className="flex flex-col gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <span className="truncate">{placeholder}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] max-w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {loading && <div className="py-6 text-center text-sm">Loading...</div>}
                            {!loading && options.length === 0 && query.length >= 2 && (
                                <CommandEmpty>No results found.</CommandEmpty>
                            )}
                            {!loading && query.length < 2 && (
                                <div className="py-6 text-center text-sm text-gray-500">
                                    Type at least 2 characters to search...
                                </div>
                            )}

                            <CommandGroup>
                                {options.map((option) => {
                                    const isSelected = selected.some(s => s.value === option.value)
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            onSelect={() => {
                                                handleSelect(option)
                                            }}
                                            className={cn(isSelected && "opacity-50 cursor-not-allowed")}
                                            disabled={isSelected}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <div className="flex flex-wrap gap-2">
                {selected.map((option) => (
                    <Badge key={option.value} variant="secondary">
                        {option.label}
                        <button
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRemove(option.value)
                                }
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            onClick={() => handleRemove(option.value)}
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}
