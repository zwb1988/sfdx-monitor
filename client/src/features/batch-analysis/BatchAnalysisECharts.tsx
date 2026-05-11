import type { EChartsOption } from 'echarts'
import { useMemo, type JSX } from 'react'
import ReactECharts from 'echarts-for-react'
import type { ChartColors } from './useChartTheme'
import type {
  ApexClassHourRank,
  ChartTimeZone,
  DailyVolumeRow,
  DayHourHeatmap
} from '../../utils/batchAnalysisBuckets'
import { buildTopApexClassesForDayHour } from '../../utils/batchAnalysisBuckets'

function heatmapOption (
  heatmap: DayHourHeatmap,
  colors: ChartColors,
  jobStarts: Array<{ startedAt: string; apexClassName: string }>,
  zone: ChartTimeZone
): EChartsOption {
  const hourLabels = Array.from({ length: 24 }, (_, i) => String(i))
  const data = heatmap.counts.flatMap((row, di) =>
    row.map((c, hi) => [hi, di, c] as [number, number, number])
  )
  const vmax = Math.max(1, heatmap.maxCount)

  return {
    backgroundColor: 'transparent',
    textStyle: { color: colors.text },
    tooltip: {
      position: 'top',
      confine: true,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      textStyle: { color: colors.text },
      extraCssText: 'max-width:26rem;white-space:normal',
      formatter (params: unknown): string {
        const p = params as { value?: [number, number, number] }
        const v = p.value
        if (!v || !Array.isArray(v)) return ''
        const [h, d, n] = v
        const day = heatmap.days[d]
        if (day == null) return ''
        let html = `<div><strong>${escapeTooltipHtml(day)}</strong><br/>${h}:00 — ${n} start${n === 1 ? '' : 's'}</div>`
        const top = buildTopApexClassesForDayHour(jobStarts, zone, day, h, 20)
        if (top.length > 0) {
          html +=
            '<div style="margin-top:6px;font-size:12px;opacity:0.92">Top Apex classes (up to 20):</div><ol style="margin:4px 0 0 18px;padding:0">'
          for (const row of top) {
            html += `<li style="margin:2px 0">${escapeTooltipHtml(row.apexClassName)} — ${row.count}</li>`
          }
          html += '</ol>'
        }
        return html
      }
    },
    grid: { left: 72, right: 16, top: 16, bottom: 72, containLabel: false },
    xAxis: {
      type: 'category',
      data: hourLabels,
      name: 'Hour',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: colors.textMuted },
      axisLabel: { color: colors.textMuted, fontSize: 10 },
      axisLine: { lineStyle: { color: colors.border } },
      splitArea: { show: true, areaStyle: { color: ['transparent', 'rgba(128,128,128,0.04)'] } }
    },
    yAxis: {
      type: 'category',
      data: heatmap.days,
      axisLabel: { color: colors.textMuted, fontSize: 11 },
      axisLine: { lineStyle: { color: colors.border } },
      splitArea: { show: true, areaStyle: { color: ['transparent', 'rgba(128,128,128,0.04)'] } }
    },
    visualMap: {
      min: 0,
      max: vmax,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 12,
      itemWidth: 14,
      itemHeight: 120,
      inRange: {
        color: ['#fffde7', '#fff176', '#ffeb3b', '#ff9800', '#f44336', '#b71c1c']
      },
      textStyle: { color: colors.textMuted },
      text: ['High', 'Low']
    },
    series: [
      {
        type: 'heatmap',
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: colors.accent
          }
        },
        progressive: 0,
        animation: false
      }
    ]
  }
}

function escapeTooltipHtml (s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hourlyLineOption (
  counts: number[],
  dayLabel: string,
  zoneLabel: string,
  colors: ChartColors,
  apexByHour: Map<number, ApexClassHourRank[]>
): EChartsOption {
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}`)
  return {
    backgroundColor: 'transparent',
    title: {
      text: `${dayLabel} (${zoneLabel})`,
      left: 0,
      top: 0,
      textStyle: { color: colors.textMuted, fontSize: 12, fontWeight: 'normal' }
    },
    textStyle: { color: colors.text },
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      textStyle: { color: colors.text },
      extraCssText: 'max-width:24rem;white-space:normal',
      formatter (params: unknown): string {
        const arr = params as Array<{ axisValue: string; data: number }>
        const first = arr[0]
        if (!first) return ''
        const hour = parseInt(first.axisValue, 10)
        const total = first.data
        const top = Number.isFinite(hour) ? apexByHour.get(hour) ?? [] : []
        let html =
          `<div><strong>${first.axisValue}:00</strong> — ${total} start${total === 1 ? '' : 's'}</div>`
        if (top.length > 0) {
          html += `<div style="margin-top:6px;opacity:0.92;font-size:12px">Most starts by Apex class (top 20):</div>`
          html += '<ol style="margin:4px 0 0 18px;padding:0">'
          for (const row of top) {
            html += `<li style="margin:2px 0">${escapeTooltipHtml(row.apexClassName)} — ${row.count}</li>`
          }
          html += '</ol>'
        }
        return html
      }
    },
    grid: { left: 44, right: 20, top: 40, bottom: 28 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hourLabels,
      name: 'Hour',
      nameLocation: 'middle',
      nameGap: 22,
      nameTextStyle: { color: colors.textMuted },
      axisLabel: { color: colors.textMuted, fontSize: 10 },
      axisLine: { lineStyle: { color: colors.border } }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: colors.border, type: 'dashed' } },
      axisLabel: { color: colors.textMuted },
      axisLine: { lineStyle: { color: colors.border } }
    },
    series: [
      {
        type: 'line',
        data: counts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2.5, color: colors.accent },
        itemStyle: { color: colors.accent, borderColor: colors.surface, borderWidth: 1 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: hexWithAlpha(colors.accent, 0.35) },
              { offset: 1, color: hexWithAlpha(colors.accent, 0.03) }
            ]
          }
        }
      }
    ]
  }
}

/** Rough alpha overlay for area fill when accent is hex or rgb. */
function hexWithAlpha (color: string, alpha: number): string {
  const c = color.trim()
  if (c.startsWith('#') && (c.length === 7 || c.length === 4)) {
    if (c.length === 7) {
      const r = parseInt(c.slice(1, 3), 16)
      const g = parseInt(c.slice(3, 5), 16)
      const b = parseInt(c.slice(5, 7), 16)
      return `rgba(${r},${g},${b},${alpha})`
    }
  }
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`
  return color
}

function dailyVolumeBarOption (
  rows: DailyVolumeRow[],
  colors: ChartColors,
  selectedDay: string | null
): EChartsOption {
  const dates = rows.map((r) => r.date)
  const maxVal = Math.max(1, ...rows.map((r) => r.count))

  return {
    backgroundColor: 'transparent',
    textStyle: { color: colors.text },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: colors.surface,
      borderColor: colors.border,
      textStyle: { color: colors.text }
    },
    grid: { left: 92, right: 28, top: 16, bottom: 24 },
    xAxis: {
      type: 'value',
      max: maxVal,
      splitLine: { lineStyle: { color: colors.border } },
      axisLabel: { color: colors.textMuted },
      axisLine: { lineStyle: { color: colors.border } }
    },
    yAxis: {
      type: 'category',
      data: dates,
      inverse: true,
      axisLabel: { color: colors.textMuted, fontSize: 11 },
      axisLine: { lineStyle: { color: colors.border } }
    },
    series: [
      {
        type: 'bar',
        data: rows.map((r) => ({
          value: r.count,
          itemStyle:
            r.date === selectedDay
              ? {
                  color: colors.accent,
                  borderColor: colors.accent,
                  borderWidth: 1,
                  shadowBlur: 10,
                  shadowColor: colors.accent
                }
              : {
                  color: colors.accent,
                  opacity: 0.82,
                  borderRadius: [0, 4, 4, 0]
                }
        })),
        barMaxWidth: 22
      }
    ]
  }
}

export function BatchHeatmapChart ({
  heatmap,
  colors,
  jobStarts,
  chartZone,
  onSelectDay
}: {
  heatmap: DayHourHeatmap
  colors: ChartColors
  jobStarts: Array<{ startedAt: string; apexClassName: string }>
  chartZone: ChartTimeZone
  onSelectDay: (day: string) => void
}): JSX.Element {
  const option = useMemo(
    () => heatmapOption(heatmap, colors, jobStarts, chartZone),
    [heatmap, colors, jobStarts, chartZone]
  )
  const height = Math.min(640, Math.max(300, heatmap.days.length * 26 + 160))

  const onEvents = useMemo(
    () => ({
      click (params: unknown): void {
        const p = params as { componentType?: string; seriesType?: string; value?: [number, number, number] }
        if (p.componentType !== 'series' || p.seriesType !== 'heatmap') return
        const v = p.value
        if (!v || !Array.isArray(v)) return
        const dayIdx = v[1]
        const day = heatmap.days[dayIdx]
        if (day != null) onSelectDay(day)
      }
    }),
    [heatmap.days, onSelectDay]
  )

  if (heatmap.days.length === 0) {
    return <p className="batch-analysis-muted">No job starts in range.</p>
  }

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%', minHeight: 280 }}
      opts={{ renderer: 'canvas' }}
      notMerge
      lazyUpdate
      onEvents={onEvents}
    />
  )
}

export function BatchHourlyLineChart ({
  counts,
  dayLabel,
  zoneLabel,
  colors,
  apexByHour
}: {
  counts: number[]
  dayLabel: string
  zoneLabel: string
  colors: ChartColors
  apexByHour: Map<number, ApexClassHourRank[]>
}): JSX.Element {
  const option = useMemo(
    () => hourlyLineOption(counts, dayLabel, zoneLabel, colors, apexByHour),
    [counts, dayLabel, zoneLabel, colors, apexByHour]
  )

  return (
    <ReactECharts
      option={option}
      style={{ height: 260, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
      lazyUpdate
    />
  )
}

export function BatchDailyVolumeChart ({
  rows,
  colors,
  onSelectDay,
  selectedDay
}: {
  rows: DailyVolumeRow[]
  colors: ChartColors
  onSelectDay: (day: string) => void
  selectedDay: string | null
}): JSX.Element {
  const option = useMemo(
    () => dailyVolumeBarOption(rows, colors, selectedDay),
    [rows, colors, selectedDay]
  )

  const onEvents = useMemo(
    () => ({
      click (params: unknown): void {
        const p = params as { componentType?: string; seriesType?: string; dataIndex?: number }
        if (p.componentType !== 'series' || p.seriesType !== 'bar') return
        const idx = p.dataIndex
        if (typeof idx !== 'number' || idx < 0 || idx >= rows.length) return
        onSelectDay(rows[idx].date)
      }
    }),
    [rows, onSelectDay]
  )

  if (rows.length === 0) {
    return <p className="batch-analysis-muted">No job starts in range.</p>
  }

  const height = Math.min(520, Math.max(220, rows.length * 28 + 80))

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%', minHeight: 200 }}
      opts={{ renderer: 'canvas' }}
      notMerge
      lazyUpdate
      onEvents={onEvents}
    />
  )
}
