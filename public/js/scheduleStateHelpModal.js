/** Reference modal: CronTrigger.State meanings for the Batch schedule tab. */

import { CRON_TRIGGER_STATE_REFERENCE } from './constants.js'
import { escapeHtml } from './format.js'

function buildContentHtml () {
  const intro =
    '<p class="cron-state-help-intro">These are the usual values for <code>CronTrigger.State</code> in Salesforce—the same field shown in the <strong>State</strong> column. Your org may occasionally show other or legacy values.</p>'
  let rows = ''
  for (const row of CRON_TRIGGER_STATE_REFERENCE) {
    rows +=
      '<dt><code>' + escapeHtml(row.code) + '</code></dt>' +
      '<dd>' + escapeHtml(row.description) + '</dd>'
  }
  return intro + '<dl class="cron-state-help-list">' + rows + '</dl>'
}

export function openScheduleStateHelpModal (refs) {
  const overlay = refs?.scheduleStateHelpOverlay
  const content = refs?.scheduleStateHelpContent
  if (!overlay || !content) return
  if (!content.dataset.filled) {
    content.innerHTML = buildContentHtml()
    content.dataset.filled = '1'
  }
  overlay.classList.add('is-open')
  overlay.setAttribute('aria-hidden', 'false')
  refs.scheduleStateHelpCloseBtn?.focus()
}

export function closeScheduleStateHelpModal (refs) {
  const overlay = refs?.scheduleStateHelpOverlay
  if (!overlay) return
  overlay.classList.remove('is-open')
  overlay.setAttribute('aria-hidden', 'true')
  refs?.scheduleStateInfoBtn?.focus()
}
