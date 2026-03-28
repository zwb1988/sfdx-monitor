/** Scheduled CronTrigger table: render, sort, sort indicators. */

import { formatDate, escapeHtml, escapeHtmlAttr } from './format.js'
import { compareScheduled } from './jobUtils.js'

export function getSortedScheduledJobs (jobs, state) {
  const arr = (jobs || []).slice()
  arr.sort((a, b) => {
    const c = compareScheduled(a, b, state.scheduleSortKey)
    return state.scheduleSortDir === 'asc' ? c : -c
  })
  return arr
}

export function renderScheduledJobs (jobs, state, refs) {
  state.scheduledJobsCache = jobs || []
  if (state.scheduleSortKey === 'timesTriggered') {
    state.scheduleSortKey = 'nextFireTime'
    state.scheduleSortDir = 'asc'
  }
  const sorted = getSortedScheduledJobs(state.scheduledJobsCache, state)
  const tbody = refs?.scheduledTbody
  const scheduleTz = refs?.scheduleShowLocalTzCheckbox
  if (!tbody) return
  tbody.innerHTML = ''
  const useUtc = !scheduleTz?.checked
  if (!sorted.length) {
    const tr = document.createElement('tr')
    tr.innerHTML = '<td colspan="6">No scheduled Apex jobs</td>'
    tbody.appendChild(tr)
    updateScheduleSortIndicators(state, refs)
    return
  }
  for (const row of sorted) {
    const tr = document.createElement('tr')
    const displayName = String(row.name ?? '—')
    const nameTitle = escapeHtmlAttr(displayName)
    const nameCell = row.id
      ? '<button type="button" class="schedule-name-trigger" data-schedule-id="' + escapeHtml(row.id) + '" title="' + nameTitle + '">' + escapeHtml(displayName) + '</button>'
      : '<span class="schedule-name-plain" title="' + nameTitle + '">' + escapeHtml(displayName) + '</span>'
    tr.innerHTML =
      '<td>' + nameCell + '</td>' +
      '<td>' + escapeHtml(String(row.state ?? '—')) + '</td>' +
      '<td>' + escapeHtml(String(row.cronExpression ?? '—')) + '</td>' +
      '<td>' + escapeHtml(formatDate(row.nextFireTime, useUtc)) + '</td>' +
      '<td>' + escapeHtml(formatDate(row.previousFireTime, useUtc)) + '</td>' +
      '<td>' + escapeHtml(String(row.apexClassName ?? '—')) + '</td>'
    tbody.appendChild(tr)
  }
  updateScheduleSortIndicators(state, refs)
}

export function updateScheduleSortIndicators (state, refs) {
  const table = refs?.scheduleJobsTable
  const headers = table?.querySelectorAll('th[data-sort]')
  if (!headers) return
  headers.forEach(th => {
    const key = th.getAttribute('data-sort')
    th.classList.remove('sort-asc', 'sort-desc')
    if (key === state.scheduleSortKey) {
      th.classList.add(state.scheduleSortDir === 'asc' ? 'sort-asc' : 'sort-desc')
    }
  })
}

export function onScheduleSort (e, state, refs, renderScheduledJobsFn) {
  const th = e.target.closest('th[data-sort]')
  if (!th) return
  const key = th.getAttribute('data-sort')
  if (!key) return
  if (state.scheduleSortKey === key) {
    state.scheduleSortDir = state.scheduleSortDir === 'asc' ? 'desc' : 'asc'
  } else {
    state.scheduleSortKey = key
    state.scheduleSortDir = 'asc'
  }
  renderScheduledJobsFn(state.scheduledJobsCache, state, refs)
}
