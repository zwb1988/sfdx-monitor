/** DOM element references. Call initDOM() once after DOM is ready. */

const refs = {}

export function initDOM () {
  refs.orgSelect = document.getElementById('org-select')
  refs.intervalInput = document.getElementById('interval-input')
  refs.tabBatchMonitor = document.getElementById('tab-batch-monitor')
  refs.tabBatchSchedule = document.getElementById('tab-batch-schedule')
  refs.panelBatchMonitor = document.getElementById('tab-panel-batch-monitor')
  refs.panelBatchSchedule = document.getElementById('tab-panel-batch-schedule')
  refs.refreshNowBtn = document.getElementById('refresh-now-btn')
  refs.batchExportCsvBtn = document.getElementById('batch-export-csv-btn')
  refs.scheduleRefreshBtn = document.getElementById('schedule-refresh-btn')
  refs.scheduleExportCsvBtn = document.getElementById('schedule-export-csv-btn')
  refs.scheduleStateInfoBtn = document.getElementById('schedule-state-info-btn')
  refs.scheduleStateHelpOverlay = document.getElementById('schedule-state-help-overlay')
  refs.scheduleStateHelpContent = document.getElementById('schedule-state-help-content')
  refs.scheduleStateHelpCloseBtn = refs.scheduleStateHelpOverlay?.querySelector('.modal-close')
  refs.scheduledTbody = document.getElementById('scheduled-tbody')
  refs.jobIdInput = document.getElementById('job-id-input')
  refs.searchInput = document.getElementById('search-input')
  refs.statusCheckboxes = document.getElementById('status-checkboxes')
  refs.statusFilters = document.getElementById('status-filters')
  refs.statusMessage = document.getElementById('status-message')
  refs.jobsTbody = document.getElementById('jobs-tbody')
  refs.jobsTable = document.getElementById('batch-jobs-table')
  refs.scheduleJobsTable = document.getElementById('schedule-jobs-table')
  refs.themeToggle = document.getElementById('theme-toggle')
  refs.showLocalTzCheckbox = document.getElementById('show-local-tz')
  refs.timezoneDisplay = document.getElementById('timezone-display')
  refs.scheduleShowLocalTzCheckbox = document.getElementById('schedule-show-local-tz')
  refs.scheduleTimezoneDisplay = document.getElementById('schedule-timezone-display')
  refs.limitInput = document.getElementById('limit-input')
  refs.batchDetailOverlay = document.getElementById('batch-detail-overlay')
  refs.batchDetailContent = document.getElementById('batch-detail-content')
  refs.batchDetailTitle = document.getElementById('batch-detail-title')
  refs.modalCloseBtn = refs.batchDetailOverlay?.querySelector('.modal-close')
  return refs
}

export function getRefs () {
  return refs
}
