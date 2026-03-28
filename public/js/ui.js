/** UI helpers: status message, enable/disable controls, timezone display. */

import { getTimezoneOffsetString } from './format.js'

export function setStatus (text, type, refs) {
  const el = refs?.statusMessage
  if (!el) return
  el.textContent = text
  el.className = 'status-message status-message--tabs' + (type ? ' ' + type : '')
}

export function setIntervalControlEnabled (enabled, refs) {
  const r = refs || {}
  if (r.intervalInput) r.intervalInput.disabled = !enabled
}

export function setBatchTabControlsEnabled (enabled, refs) {
  const r = refs || {}
  if (r.jobIdInput) r.jobIdInput.disabled = !enabled
  if (r.searchInput) r.searchInput.disabled = !enabled
  if (r.statusFilters) r.statusFilters.disabled = !enabled
  if (r.showLocalTzCheckbox) r.showLocalTzCheckbox.disabled = !enabled
  if (r.limitInput) r.limitInput.disabled = !enabled
}

export function setBatchRefreshEnabled (enabled, refs) {
  if (refs?.refreshNowBtn) refs.refreshNowBtn.disabled = !enabled
  if (refs?.batchExportCsvBtn) refs.batchExportCsvBtn.disabled = !enabled
}

export function setScheduleTabControlsEnabled (enabled, refs) {
  if (refs?.scheduleRefreshBtn) refs.scheduleRefreshBtn.disabled = !enabled
  if (refs?.scheduleExportCsvBtn) refs.scheduleExportCsvBtn.disabled = !enabled
  if (refs?.scheduleShowLocalTzCheckbox) refs.scheduleShowLocalTzCheckbox.disabled = !enabled
}

export function updateScheduleTimezoneDisplay (refs) {
  const timezoneDisplay = refs?.scheduleTimezoneDisplay
  const showLocalTzCheckbox = refs?.scheduleShowLocalTzCheckbox
  if (!timezoneDisplay) return
  const useUtc = !showLocalTzCheckbox?.checked
  timezoneDisplay.textContent = useUtc ? 'UTC' : getTimezoneOffsetString()
}

export function setOrgSelectEnabled (enabled, refs) {
  if (refs?.orgSelect) refs.orgSelect.disabled = !enabled
}

export function updateTimezoneDisplay (refs) {
  const timezoneDisplay = refs?.timezoneDisplay
  const showLocalTzCheckbox = refs?.showLocalTzCheckbox
  if (!timezoneDisplay) return
  const useUtc = !showLocalTzCheckbox?.checked
  timezoneDisplay.textContent = useUtc ? 'UTC' : getTimezoneOffsetString()
}
