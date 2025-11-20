import React, { useMemo } from 'react'

import { cn } from '@/lib/utils'

const INTENSITY_BUCKETS = [
    { min: 0, max: 0, color: '#e5e7eb', label: '0' },
    { min: 1, max: 1, color: '#dcfce7', label: '1-2' },
    { min: 2, max: 3, color: '#bbf7d0', label: '3-5' },
    { min: 4, max: 6, color: '#86efac', label: '6-9' },
    { min: 7, max: 19, color: '#4ade80', label: '10-14' },
    { min: 10, max: Infinity, color: '#166534', label: '15+' }
]
const DAY_LABELS = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat']

const parseDate = (dateString = '') => {
    const [year, month, day] = dateString.split('-').map(Number)

    return new Date(year, (month || 1) - 1, day || 1)
}

const formatTooltip = (date) => {
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const ActivityHeatmap = ({
    contributions = [],
    totalBlogs = 0,
    range,
    __testWeeks,
}) => {
    const normalized = useMemo(() => {
        if (!Array.isArray(contributions)) {
            return []
        }

        return contributions
            .map((entry) => {
                const parsedDate = parseDate(entry.date)
                if (Number.isNaN(parsedDate.getTime())) {
                    return null
                }

                return {
                    date: parsedDate,
                    dateString: entry.date,
                    count: Number(entry.count) || 0,
                }
            })
            .filter(Boolean)
            .sort((a, b) => a.date - b.date)
    }, [contributions])

    const resolveBucket = useMemo(() => {
        return (count = 0) => {
            return INTENSITY_BUCKETS.find((bucket) => count >= bucket.min && count <= bucket.max)
                || INTENSITY_BUCKETS[INTENSITY_BUCKETS.length - 1]
        }
    }, [])

    const weeks = useMemo(() => {
        if (Array.isArray(__testWeeks)) {
            return __testWeeks
        }

        if (!normalized.length) {
            return []
        }

        const cells = []
        const firstWeekOffset = normalized[0].date.getDay()

        for (let index = 0; index < firstWeekOffset; index += 1) {
            cells.push({ isPadding: true })
        }

        normalized.forEach((entry) => {
            const bucket = resolveBucket(entry.count)
            cells.push({
                ...entry,
                isPadding: false,
                bucket,
            })
        })

        while (cells.length % 7 !== 0) {
            cells.push({ isPadding: true })
        }

        const chunked = []
        for (let index = 0; index < cells.length; index += 7) {
            chunked.push(cells.slice(index, index + 7))
        }

        return chunked
    }, [normalized, resolveBucket, __testWeeks])

    const monthLabels = useMemo(() => {
        let lastRenderedMonth = ''

        return weeks.map((week) => {
            const activeDate = week.find((day) => !day.isPadding)?.date
            const monthLabel = activeDate
                ? activeDate.toLocaleString(undefined, { month: 'short' })
                : ''

            if (monthLabel && monthLabel !== lastRenderedMonth) {
                lastRenderedMonth = monthLabel
                return monthLabel
            }

            return ''
        })
    }, [weeks])

    const rangeLabel = (() => {
        if (!range?.start || !range?.end) {
            return ''
        }

        try {
            const startDate = new Date(range.start)
            const endDate = new Date(range.end)

            const formatterOptions = { month: 'short', day: 'numeric' }
            const startLabel = startDate.toLocaleDateString(undefined, formatterOptions)
            const endLabel = endDate.toLocaleDateString(undefined, {
                ...formatterOptions,
                year: 'numeric',
            })

            return `${startLabel} - ${endLabel}`
        } catch (error) {
            return ''
        }
    })()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
                <div>
                    <p className="text-sm font-medium">Blog activity</p>
                    <p className="text-xs text-muted-foreground">
                        {rangeLabel || 'Activity in the selected range'}
                    </p>
                </div>
                <div className="text-xs text-muted-foreground">
                    Total posts: <span className="font-medium text-foreground">{totalBlogs}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-flex flex-col gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <div className="w-6 shrink-0" />
                        {monthLabels.map((label, index) => (
                            <div key={`month-${index}`} className="flex h-4 w-3 shrink-0 items-center justify-center">
                                {label}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-1">
                        <div className="flex flex-col justify-between py-1 text-[10px] text-muted-foreground">
                            {DAY_LABELS.map((label, index) => (
                                <span key={`day-label-${index}`} className="h-3 w-6">
                                    {label}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-1">
                            {weeks.map((week, weekIndex) => (
                                <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                                    {week.map((day, dayIndex) => {
                                        if (day.isPadding) {
                                            return (
                                                <div
                                                    key={`day-${weekIndex}-${dayIndex}`}
                                                    className="h-3 w-3 rounded-[2px]"
                                                />
                                            )
                                        }

                                        return (
                                            <div
                                                key={`day-${day.dateString}`}
                                                className={cn(
                                                    'h-3 w-3 rounded-[2px] border border-border/40',
                                                    day.count === 0 && 'border-transparent'
                                                )}
                                                style={{ backgroundColor: day.bucket.color }}
                                                title={`${formatTooltip(day.date)} - ${day.count} post${day.count === 1 ? '' : 's'}`}
                                            />
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
                <span>Less</span>
                <div className="flex items-center gap-[3px]">
                    {INTENSITY_BUCKETS.map((bucket, index) => (
                        <span
                            key={`legend-${index}`}
                            className="h-3 w-3 rounded-[2px] border border-border/40"
                            style={{ backgroundColor: bucket.color }}
                            title={bucket.label}
                        />
                    ))}
                </div>
                <span>More</span>
            </div>
        </div>
    )
}

export default ActivityHeatmap

