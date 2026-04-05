const { execFile } = require('child_process')
const { promisify } = require('util')
const constants = require('../../config/constants')
const { DEFAULT_SOQL_LIMIT, MAX_SOQL_LIMIT } = constants

const execFileAsync = promisify(execFile)

const BASE_SELECT = 'SELECT Id, ApexClassId, ApexClass.Name, CreatedDate, CreatedById, CompletedDate, JobType, Status, ExtendedStatus, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, LastProcessed, LastProcessedOffset, ParentJobId FROM AsyncApexJob'
const CRON_SELECT = 'SELECT Id, CronExpression, NextFireTime, PreviousFireTime, State, TimesTriggered, TimeZoneSidKey, CronJobDetailId, CronJobDetail.Name, CronJobDetail.JobType FROM CronTrigger'
const ASYNC_APEX_BY_CRON_SELECT = 'SELECT CronTriggerId, ApexClassId, ApexClass.Name, CreatedDate FROM AsyncApexJob'
/** Max CronTrigger Ids per SOQL IN clause (stay under binding limits). */
const CRON_TRIGGER_IN_CHUNK = 70
const DEFAULT_STATUSES = ['Processing', 'Preparing', 'Queued', 'Failed']

const TARGET_ORG_REGEX = /^[a-zA-Z0-9_.@-]+$/
const JOB_ID_REGEX = /^[a-zA-Z0-9]{15,18}$/

function validateTargetOrg (targetOrg) {
  if (typeof targetOrg !== 'string' || !targetOrg.trim()) return false
  return TARGET_ORG_REGEX.test(targetOrg.trim())
}

function validateJobId (jobId) {
  if (!jobId || typeof jobId !== 'string') return false
  return JOB_ID_REGEX.test(jobId.trim())
}

function escapeSoqlLike (str) {
  return String(str).replace(/'/g, '\'\'')
}

function buildBatchJobsSoql (options) {
  const conditions = ["JobType = 'BatchApex'"]
  if (options.jobId && validateJobId(options.jobId)) {
    conditions.push("Id = '" + options.jobId.trim() + "'")
  }
  if (options.apexClassNameSearch && typeof options.apexClassNameSearch === 'string' && options.apexClassNameSearch.trim()) {
    const escaped = escapeSoqlLike(options.apexClassNameSearch.trim())
    conditions.push("ApexClass.Name LIKE '%" + escaped + "%'")
  }
  if (!options.jobId || !validateJobId(options.jobId)) {
    const raw = options.statuses
    const statuses = (raw === undefined || raw === null)
      ? DEFAULT_STATUSES
      : (Array.isArray(raw) ? raw : []).map(s => String(s).trim()).filter(Boolean)
    if (statuses.length > 0) {
      const statusListSoql = statuses.map(s => "'" + String(s).replace(/'/g, '\'\'') + "'").join(',')
      conditions.push('Status IN (' + statusListSoql + ')')
    }
  }
  const where = conditions.join(' AND ')
  let limit = options.limit
  if (limit === undefined || limit === null) limit = DEFAULT_SOQL_LIMIT
  const n = parseInt(limit, 10)
  const clamped = Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_SOQL_LIMIT) : DEFAULT_SOQL_LIMIT
  return BASE_SELECT + ' WHERE ' + where + ' ORDER BY CreatedDate DESC LIMIT ' + clamped
}

function buildScheduledCronSoql (options) {
  const where = "CronJobDetail.JobType = '7'"
  let limit = options.limit
  if (limit === undefined || limit === null) limit = DEFAULT_SOQL_LIMIT
  const n = parseInt(limit, 10)
  const clamped = Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_SOQL_LIMIT) : DEFAULT_SOQL_LIMIT
  return CRON_SELECT + ' WHERE ' + where + ' ORDER BY NextFireTime ASC NULLS LAST LIMIT ' + clamped
}

function getChildEnv () {
  const env = { ...process.env }
  delete env.NODE_OPTIONS
  delete env.NODE_INSPECT_RESUME_ON_START
  return env
}

function sanitizeSfError (msg) {
  if (typeof msg !== 'string') return msg
  if (/debugger attached|waiting for the debugger/i.test(msg)) {
    return 'sf command failed. If the server is running under a debugger, try running without it (e.g. npm start).'
  }
  return msg
}

function runSf (args) {
  return execFileAsync('sf', args, {
    maxBuffer: constants.SF_CLI_MAX_BUFFER,
    timeout: constants.SF_CLI_TIMEOUT_MS,
    env: getChildEnv()
  })
}

/** Prefer non-empty trimmed stdout; avoids parsing whitespace-only stdout and ignoring stderr. */
function sfCliTextOutput (stdout, stderr) {
  const out = String(stdout ?? '').trim()
  const err = String(stderr ?? '').trim()
  return out || err
}

/**
 * Slice from s[start] through the matching top-level `}` for that `{`, respecting
 * JSON string rules (so `{`/`}` inside strings are ignored).
 */
function sliceBalancedJsonObject (s, start) {
  if (s[start] !== '{') return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (inString) {
      if (escape) {
        escape = false
      } else if (c === '\\') {
        escape = true
      } else if (c === '"') {
        inString = false
      }
      continue
    }
    if (c === '"') {
      inString = true
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        return s.slice(start, i + 1)
      }
    }
  }
  return null
}

/**
 * Parse CLI stdout/stderr that should be one JSON object. Strips BOM and ANSI
 * color codes, then tries the full string. If that fails, tries each `{` in
 * order — the first `{` is often a false start (e.g. `.../path/{id}/...` in a
 * URL printed before the real JSON).
 */
function parseSfJsonOutput (raw, contextLabel) {
  let s = raw == null ? '' : String(raw)
  s = s.replace(/^\uFEFF/, '').replace(/\x1b\[[0-9;]*m/g, '').trim()
  if (!s) {
    throw new Error(`Invalid JSON from ${contextLabel}: empty output`)
  }
  const tryCandidates = () => {
    try {
      return JSON.parse(s)
    } catch (_) {
      let idx = 0
      while (idx < s.length) {
        const start = s.indexOf('{', idx)
        if (start < 0) break
        const slice = sliceBalancedJsonObject(s, start)
        if (slice) {
          try {
            return JSON.parse(slice)
          } catch (_) {
            idx = start + 1
            continue
          }
        }
        idx = start + 1
      }
      return null
    }
  }
  const parsed = tryCandidates()
  if (parsed !== null) {
    return parsed
  }
  let firstErrMsg = 'could not parse JSON'
  try {
    JSON.parse(s)
  } catch (e) {
    firstErrMsg = e.message
  }
  const preview = s.length > 280 ? s.slice(0, 280) + '…' : s
  throw new Error(`Invalid JSON from ${contextLabel}: ${firstErrMsg}. Output preview: ${preview}`)
}

const ORG_LIST_RESULT_KEYS = ['nonScratchOrgs', 'scratchOrgs', 'other', 'sandboxes', 'devHubs']

function parseOrgList (stdout) {
  const data = parseSfJsonOutput(stdout, 'sf org list')
  const result = data.result || data
  const orgs = []
  const seen = new Set()
  const addOrg = (entry) => {
    if (!entry || typeof entry !== 'object') return
    const alias = entry.alias || entry.username
    const username = entry.username
    if (!alias && !username) return
    const key = String(username || alias)
    if (seen.has(key)) return
    seen.add(key)
    orgs.push({ alias: alias || username, username: username || alias })
  }
  const addGroup = (group) => {
    if (!group) return
    const list = Array.isArray(group) ? group : Object.values(group)
    for (const entry of list) {
      addOrg(entry)
    }
  }
  for (const key of ORG_LIST_RESULT_KEYS) {
    addGroup(result[key])
  }
  return { orgs }
}

function toCamelCase (str) {
  if (typeof str !== 'string' || !str) return str
  return str.charAt(0).toLowerCase() + str.slice(1).replace(/_(.)/g, (_, c) => c.toUpperCase())
}

function normalizeBatchJob (record) {
  const apexClass = record.ApexClass || {}
  const base = {
    id: record.Id || null,
    apexClassName: apexClass.Name || record.ApexClassName || '—',
    jobType: record.JobType || '—',
    jobItemsProcessed: record.JobItemsProcessed ?? '—',
    totalJobItems: record.TotalJobItems ?? '—',
    status: record.Status || '—',
    startedAt: record.CreatedDate || null,
    completedAt: record.CompletedDate || null
  }
  const passthrough = {
    apexClassId: record.ApexClassId,
    createdById: record.CreatedById,
    extendedStatus: record.ExtendedStatus,
    methodName: record.MethodName,
    numberOfErrors: record.NumberOfErrors,
    lastProcessed: record.LastProcessed,
    lastProcessedOffset: record.LastProcessedOffset,
    parentJobId: record.ParentJobId
  }
  const result = { ...base, ...passthrough }
  for (const key of Object.keys(record)) {
    if (key === 'attributes' || key === 'ApexClass') continue
    const camel = toCamelCase(key)
    if (!(camel in result) && record[key] !== undefined) result[camel] = record[key]
  }
  return result
}

function normalizeCronTrigger (record) {
  const detail = record.CronJobDetail || {}
  const base = {
    id: record.Id || null,
    name: detail.Name || '—',
    cronJobDetailId: record.CronJobDetailId || null,
    jobType: detail.JobType != null ? String(detail.JobType) : '—',
    cronExpression: record.CronExpression || '—',
    nextFireTime: record.NextFireTime || null,
    previousFireTime: record.PreviousFireTime || null,
    state: record.State || '—',
    timesTriggered: record.TimesTriggered ?? '—',
    timeZoneSidKey: record.TimeZoneSidKey || '—',
    apexClassName: '—',
    apexClassId: null
  }
  const result = { ...base }
  for (const key of Object.keys(record)) {
    if (key === 'attributes' || key === 'CronJobDetail') continue
    const camel = toCamelCase(key)
    if (!(camel in result) && record[key] !== undefined) result[camel] = record[key]
  }
  return result
}

function parseScheduledCronResult (stdout) {
  const data = parseSfJsonOutput(stdout, 'sf data query')
  const result = data.result || data
  const records = result.records || []
  return records.map(normalizeCronTrigger)
}

function parseQueryRecords (stdout) {
  const data = parseSfJsonOutput(stdout, 'sf data query')
  const result = data.result || data
  return result.records || []
}

/**
 * Latest ScheduledApex AsyncApexJob per CronTriggerId (name + class id), via CronTriggerId filter.
 */
async function fetchApexClassByCronTriggerIds (targetOrg, cronTriggerIds) {
  const map = new Map()
  const unique = [...new Set((cronTriggerIds || []).filter(Boolean))]
  if (!unique.length) return map

  for (let i = 0; i < unique.length; i += CRON_TRIGGER_IN_CHUNK) {
    const chunk = unique.slice(i, i + CRON_TRIGGER_IN_CHUNK)
    const inList = chunk.map(id => "'" + String(id).replace(/'/g, '\'\'') + "'").join(',')
    const soql =
      ASYNC_APEX_BY_CRON_SELECT +
      " WHERE JobType = 'ScheduledApex' AND CronTriggerId IN (" +
      inList +
      ') ORDER BY CreatedDate DESC LIMIT 2000'
    const args = [
      'data', 'query',
      '--query', soql,
      '--target-org', targetOrg.trim(),
      '--json'
    ]
    const { stdout, stderr } = await runSf(args).catch((err) => {
      const raw = err.stderr || err.stdout || err.message
      const msg = sanitizeSfError(String(raw))
      throw new Error(`sf data query failed: ${msg}`)
    })
    const output = sfCliTextOutput(stdout, stderr)
    const records = parseQueryRecords(output)
    for (const rec of records) {
      const ctid = rec.CronTriggerId
      if (!ctid || map.has(ctid)) continue
      const apex = rec.ApexClass || {}
      const name = apex.Name ? String(apex.Name) : null
      map.set(ctid, {
        apexClassName: name || '—',
        apexClassId: rec.ApexClassId || null
      })
    }
  }
  return map
}

function parseBatchJobsResult (stdout) {
  const data = parseSfJsonOutput(stdout, 'sf data query')
  const result = data.result || data
  const records = result.records || []
  return records.map(normalizeBatchJob)
}

async function listOrgs () {
  const { stdout, stderr } = await runSf(['org', 'list', '--json']).catch((err) => {
    const raw = err.stderr || err.stdout || err.message
    const msg = sanitizeSfError(String(raw))
    throw new Error(`sf org list failed: ${msg}`)
  })
  return parseOrgList(sfCliTextOutput(stdout, stderr))
}

async function getOrgInstanceUrl (targetOrg) {
  if (!validateTargetOrg(targetOrg)) {
    return null
  }
  const args = ['org', 'display', '--target-org', targetOrg.trim(), '--json']
  try {
    const { stdout, stderr } = await runSf(args)
    const data = parseSfJsonOutput(sfCliTextOutput(stdout, stderr), 'sf org display')
    const result = data.result || data
    const url = result.instanceUrl || result.instance_url
    return typeof url === 'string' && url.trim() ? url.trim().replace(/\/+$/, '') : null
  } catch (_) {
    return null
  }
}

async function getBatchJobs (targetOrg, options = {}) {
  if (!validateTargetOrg(targetOrg)) {
    throw new Error('Invalid targetOrg')
  }
  const soql = buildBatchJobsSoql(options)
  const args = [
    'data', 'query',
    '--query', soql,
    '--target-org', targetOrg.trim(),
    '--json'
  ]
  const { stdout, stderr } = await runSf(args).catch((err) => {
    const raw = err.stderr || err.stdout || err.message
    const msg = sanitizeSfError(String(raw))
    throw new Error(`sf data query failed: ${msg}`)
  })
  return parseBatchJobsResult(sfCliTextOutput(stdout, stderr))
}

async function getScheduledApexCronTriggers (targetOrg, options = {}) {
  if (!validateTargetOrg(targetOrg)) {
    throw new Error('Invalid targetOrg')
  }
  const soql = buildScheduledCronSoql(options)
  const args = [
    'data', 'query',
    '--query', soql,
    '--target-org', targetOrg.trim(),
    '--json'
  ]
  const { stdout, stderr } = await runSf(args).catch((err) => {
    const raw = err.stderr || err.stdout || err.message
    const msg = sanitizeSfError(String(raw))
    throw new Error(`sf data query failed: ${msg}`)
  })
  const triggers = parseScheduledCronResult(sfCliTextOutput(stdout, stderr))
  const ids = triggers.map((t) => t.id).filter(Boolean)
  const apexByCron = await fetchApexClassByCronTriggerIds(targetOrg, ids)
  return triggers.map((t) => {
    const info = apexByCron.get(t.id)
    return {
      ...t,
      apexClassName: info ? info.apexClassName : '—',
      apexClassId: info ? info.apexClassId : null
    }
  })
}

module.exports = {
  listOrgs,
  getBatchJobs,
  getScheduledApexCronTriggers,
  getOrgInstanceUrl,
  validateTargetOrg,
  validateJobId
}
