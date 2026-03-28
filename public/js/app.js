/**
 * Main entry: init DOM refs, theme, API, table, modal, polling; bind events.
 */

import { initDOM } from './dom.js'
import { state } from './state.js'
import { MIN_INTERVAL, MIN_LIMIT, DEFAULT_LIMIT } from './constants.js'
import { getTheme, applyTheme, updateThemeButton, toggleTheme } from './theme.js'
import {
  setStatus,
  setIntervalControlEnabled,
  setBatchTabControlsEnabled,
  setBatchRefreshEnabled,
  setScheduleTabControlsEnabled,
  setOrgSelectEnabled,
  updateTimezoneDisplay,
  updateScheduleTimezoneDisplay
} from './ui.js'
import { clampInterval, clampLimit } from './filters.js'
import { fetchOrgs, fetchBatchJobs, fetchScheduledJobs } from './api.js'
import { renderJobs, onSort } from './table.js'
import { renderScheduledJobs, onScheduleSort } from './scheduleTable.js'
import { exportBatchJobsCsv, exportScheduledJobsCsv } from './csvExport.js'
import { openBatchDetailModal, openScheduleDetailModal, closeBatchDetailModal } from './modal.js'
import { openScheduleStateHelpModal, closeScheduleStateHelpModal } from './scheduleStateHelpModal.js'
import { stopPolling, pollOnce, startPolling } from './polling.js'
import { buildStatusCheckboxes } from './statusCheckboxes.js'

function loadScheduledJobs (targetOrg, state, refs, deps) {
  const { setStatus: setStatusFn } = deps
  if (state.scheduleRequestInFlight) return Promise.resolve()
  state.scheduleRequestInFlight = true
  if (refs.scheduleRefreshBtn) refs.scheduleRefreshBtn.disabled = true
  if (refs.scheduleExportCsvBtn) refs.scheduleExportCsvBtn.disabled = true
  setStatusFn('Loading scheduled jobs…', 'loading', refs)
  const limit = clampLimit(refs?.limitInput?.value ?? DEFAULT_LIMIT)
  return fetchScheduledJobs(targetOrg, limit)
    .then(({ scheduledJobs }) => {
      renderScheduledJobs(scheduledJobs, state, refs)
      const n = scheduledJobs.length
      setStatusFn('Loaded ' + n + ' scheduled job' + (n === 1 ? '' : 's') + '.', null, refs)
    })
    .catch((err) => {
      setStatusFn(err.message || 'Error loading scheduled jobs', 'error', refs)
      renderScheduledJobs([], state, refs)
    })
    .finally(() => {
      state.scheduleRequestInFlight = false
      const orgOk = !!(refs.orgSelect?.value?.trim())
      if (refs.scheduleRefreshBtn) refs.scheduleRefreshBtn.disabled = !orgOk
      if (refs.scheduleExportCsvBtn) refs.scheduleExportCsvBtn.disabled = !orgOk
    })
}

function activateTab (tabId, state, refs, deps) {
  state.activeTab = tabId
  const isBatch = tabId === 'batch-monitor'
  if (refs.tabBatchMonitor) {
    refs.tabBatchMonitor.setAttribute('aria-selected', isBatch ? 'true' : 'false')
    refs.tabBatchMonitor.tabIndex = isBatch ? 0 : -1
  }
  if (refs.tabBatchSchedule) {
    refs.tabBatchSchedule.setAttribute('aria-selected', (!isBatch) ? 'true' : 'false')
    refs.tabBatchSchedule.tabIndex = isBatch ? -1 : 0
  }
  if (refs.panelBatchMonitor) refs.panelBatchMonitor.hidden = !isBatch
  if (refs.panelBatchSchedule) refs.panelBatchSchedule.hidden = isBatch

  const org = refs.orgSelect?.value?.trim()
  if (!org) return

  setBatchRefreshEnabled(isBatch, refs)

  if (isBatch) {
    startPolling(state, refs, deps)
  } else {
    stopPolling(state)
    loadScheduledJobs(org, state, refs, deps)
  }
}

function init () {
  const refs = initDOM()
  applyTheme(getTheme())
  updateThemeButton(refs.themeToggle)
  if (refs.themeToggle) refs.themeToggle.addEventListener('click', () => toggleTheme(refs.themeToggle))
  updateTimezoneDisplay(refs)
  updateScheduleTimezoneDisplay(refs)

  setOrgSelectEnabled(false, refs)
  setIntervalControlEnabled(false, refs)
  setBatchTabControlsEnabled(false, refs)
  setBatchRefreshEnabled(false, refs)
  setScheduleTabControlsEnabled(false, refs)
  setStatus('Loading orgs…', 'loading', refs)

  const deps = {
    fetchBatchJobs,
    renderJobs,
    setStatus,
    clampInterval
  }

  buildStatusCheckboxes(refs, () => {
    if (state.activeTab !== 'batch-monitor') return
    startPolling(state, refs, deps)
  })

  fetchOrgs()
    .then(orgs => {
      refs.orgSelect.innerHTML = '<option value="">Select an org</option>'
      for (const org of orgs) {
        const opt = document.createElement('option')
        opt.value = org.alias || org.username
        opt.textContent = org.alias || org.username
        refs.orgSelect.appendChild(opt)
      }
      setStatus('Select an org', null, refs)
      setOrgSelectEnabled(true, refs)
      setIntervalControlEnabled(false, refs)
      setBatchTabControlsEnabled(false, refs)
      setBatchRefreshEnabled(false, refs)
      setScheduleTabControlsEnabled(false, refs)

      refs.orgSelect.addEventListener('change', () => {
        const org = refs.orgSelect.value?.trim()
        setIntervalControlEnabled(!!org, refs)
        setBatchTabControlsEnabled(!!org, refs)
        setBatchRefreshEnabled(!!org && state.activeTab === 'batch-monitor', refs)
        setScheduleTabControlsEnabled(!!org, refs)
        if (!org) {
          stopPolling(state)
          renderJobs([], state, refs)
          renderScheduledJobs([], state, refs)
          setStatus('Select an org', null, refs)
          return
        }
        if (state.activeTab === 'batch-monitor') {
          startPolling(state, refs, deps)
        } else {
          stopPolling(state)
          loadScheduledJobs(org, state, refs, deps)
        }
      })

      if (refs.refreshNowBtn) {
        refs.refreshNowBtn.addEventListener('click', () => {
          const org = refs.orgSelect?.value?.trim()
          if (org && state.activeTab === 'batch-monitor') pollOnce(org, state, refs, deps)
        })
      }

      refs.batchExportCsvBtn?.addEventListener('click', () => {
        if (refs.orgSelect?.value?.trim() && state.activeTab === 'batch-monitor') {
          exportBatchJobsCsv(state, refs)
        }
      })

      if (refs.scheduleRefreshBtn) {
        refs.scheduleRefreshBtn.addEventListener('click', () => {
          const org = refs.orgSelect?.value?.trim()
          if (org) loadScheduledJobs(org, state, refs, deps)
        })
      }

      refs.scheduleExportCsvBtn?.addEventListener('click', () => {
        if (refs.orgSelect?.value?.trim()) {
          exportScheduledJobsCsv(state, refs)
        }
      })

      if (refs.tabBatchMonitor) {
        refs.tabBatchMonitor.addEventListener('click', () => {
          if (state.activeTab !== 'batch-monitor') activateTab('batch-monitor', state, refs, deps)
        })
      }
      if (refs.tabBatchSchedule) {
        refs.tabBatchSchedule.addEventListener('click', () => {
          if (state.activeTab !== 'batch-schedule') activateTab('batch-schedule', state, refs, deps)
        })
      }

      refs.intervalInput.addEventListener('change', () => {
        refs.intervalInput.value = String(clampInterval(refs.intervalInput.value))
        if (state.activeTab === 'batch-monitor') startPolling(state, refs, deps)
      })
      refs.intervalInput.addEventListener('input', () => {
        const v = clampInterval(refs.intervalInput.value)
        if (refs.intervalInput.value !== '' && v < MIN_INTERVAL) {
          refs.intervalInput.value = String(MIN_INTERVAL)
        }
      })

      refs.jobIdInput.addEventListener('change', () => {
        if (state.activeTab === 'batch-monitor') startPolling(state, refs, deps)
      })
      refs.searchInput.addEventListener('change', () => {
        if (state.activeTab === 'batch-monitor') startPolling(state, refs, deps)
      })
      refs.searchInput.addEventListener('input', () => {
        clearTimeout(refs.searchInput._searchTimer)
        refs.searchInput._searchTimer = setTimeout(() => {
          if (state.activeTab === 'batch-monitor') startPolling(state, refs, deps)
        }, 300)
      })

      refs.jobsTable?.querySelector('thead')?.addEventListener('click', (e) => {
        onSort(e, state, refs, renderJobs)
      })

      refs.scheduleJobsTable?.querySelector('thead')?.addEventListener('click', (e) => {
        onScheduleSort(e, state, refs, renderScheduledJobs)
      })

      refs.jobsTbody?.addEventListener('click', (e) => {
        const trigger = e.target.closest('.batch-id-trigger')
        if (!trigger) return
        const jobId = trigger.getAttribute('data-job-id')
        if (!jobId) return
        const job = state.jobsCache.find((j) => j.id === jobId)
        if (job) openBatchDetailModal(job, refs, state)
      })

      refs.scheduledTbody?.addEventListener('click', (e) => {
        const trigger = e.target.closest('.schedule-name-trigger')
        if (!trigger) return
        const sid = trigger.getAttribute('data-schedule-id')
        if (!sid) return
        const row = state.scheduledJobsCache.find((j) => j.id === sid)
        if (row) openScheduleDetailModal(row, refs, state)
      })

      if (refs.modalCloseBtn) refs.modalCloseBtn.addEventListener('click', () => closeBatchDetailModal(refs, state))
      refs.batchDetailOverlay?.addEventListener('click', (e) => {
        if (e.target === refs.batchDetailOverlay) closeBatchDetailModal(refs, state)
      })

      refs.scheduleStateInfoBtn?.addEventListener('click', () => openScheduleStateHelpModal(refs))
      if (refs.scheduleStateHelpCloseBtn) {
        refs.scheduleStateHelpCloseBtn.addEventListener('click', () => closeScheduleStateHelpModal(refs))
      }
      refs.scheduleStateHelpOverlay?.addEventListener('click', (e) => {
        if (e.target === refs.scheduleStateHelpOverlay) closeScheduleStateHelpModal(refs)
      })

      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return
        if (refs.scheduleStateHelpOverlay?.classList.contains('is-open')) {
          closeScheduleStateHelpModal(refs)
          return
        }
        if (refs.batchDetailOverlay?.classList.contains('is-open')) {
          closeBatchDetailModal(refs, state)
        }
      })

      refs.showLocalTzCheckbox?.addEventListener('change', () => {
        updateTimezoneDisplay(refs)
        renderJobs(state.jobsCache, state, refs)
        if (state.currentBatchDetailJob) openBatchDetailModal(state.currentBatchDetailJob, refs, state)
      })

      refs.scheduleShowLocalTzCheckbox?.addEventListener('change', () => {
        updateScheduleTimezoneDisplay(refs)
        renderScheduledJobs(state.scheduledJobsCache, state, refs)
        if (state.currentScheduleDetailJob) openScheduleDetailModal(state.currentScheduleDetailJob, refs, state)
      })

      if (refs.limitInput) {
        refs.limitInput.addEventListener('change', () => {
          refs.limitInput.value = String(clampLimit(refs.limitInput.value))
          if (state.activeTab === 'batch-monitor') startPolling(state, refs, deps)
        })
        refs.limitInput.addEventListener('input', () => {
          const v = clampLimit(refs.limitInput.value)
          if (refs.limitInput.value !== '' && v < MIN_LIMIT) {
            refs.limitInput.value = String(MIN_LIMIT)
          }
        })
      }
    })
    .catch(err => {
      setStatus(err.message || 'Failed to load orgs', 'error', refs)
    })
}

init()
