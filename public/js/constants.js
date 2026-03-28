/** Application constants. */

export const THEME_STORAGE_KEY = 'sf-batch-monitor-theme'
export const MIN_INTERVAL = 1
export const DEFAULT_LIMIT = 100
export const MIN_LIMIT = 1
export const MAX_LIMIT = 2000
export const STATUS_OPTIONS = ['Queued', 'Preparing', 'Processing', 'Completed', 'Failed', 'Aborted', 'Holding']
export const DEFAULT_STATUSES = ['Processing', 'Preparing', 'Queued', 'Failed']

export const BATCH_DETAIL_LABELS = {
  id: 'Batch ID',
  apexClassName: 'Apex Class Name',
  apexClassId: 'Apex Class ID',
  jobType: 'Job Type',
  status: 'Status',
  jobItemsProcessed: 'Job Items Processed',
  totalJobItems: 'Total Job Items',
  startedAt: 'Started',
  completedAt: 'Completed',
  createdById: 'Created By ID',
  extendedStatus: 'Extended Status',
  methodName: 'Method Name',
  numberOfErrors: 'Number Of Errors',
  lastProcessed: 'Last Processed',
  lastProcessedOffset: 'Last Processed Offset',
  parentJobId: 'Parent Job ID'
}

export const BATCH_DETAIL_ORDER = [
  'id', 'apexClassName', 'apexClassId', 'jobType', 'status', 'extendedStatus',
  'jobItemsProcessed', 'totalJobItems', 'numberOfErrors', 'lastProcessed', 'lastProcessedOffset',
  'methodName', 'startedAt', 'completedAt', 'createdById', 'parentJobId'
]

export const SCHEDULE_DETAIL_LABELS = {
  name: 'Name',
  state: 'State',
  cronExpression: 'Cron expression',
  nextFireTime: 'Next fire',
  previousFireTime: 'Previous fire',
  timesTriggered: 'Times triggered',
  timeZoneSidKey: 'Time zone',
  apexClassName: 'Apex class name',
  apexClassId: 'Apex class ID',
  id: 'CronTrigger ID',
  cronJobDetailId: 'CronJobDetail ID',
  jobType: 'Job type'
}

export const SCHEDULE_DETAIL_ORDER = [
  'name', 'state', 'cronExpression', 'nextFireTime', 'previousFireTime',
  'timesTriggered', 'timeZoneSidKey', 'apexClassName', 'apexClassId', 'id', 'cronJobDetailId', 'jobType'
]

/** CronTrigger.State values (Salesforce API); same labels as the Batch schedule table. */
export const CRON_TRIGGER_STATE_REFERENCE = [
  {
    code: 'WAITING',
    description: 'The job is scheduled and idle until the next fire time.'
  },
  {
    code: 'ACQUIRED',
    description: 'The scheduler has selected the job and it is about to start running.'
  },
  {
    code: 'EXECUTING',
    description: 'The job is running right now.'
  },
  {
    code: 'COMPLETE',
    description: 'This run finished successfully (or the execution cycle completed).'
  },
  {
    code: 'ERROR',
    description: 'The run failed; check Apex debug logs, email logs, or your monitoring for details.'
  },
  {
    code: 'DELETED',
    description: 'The schedule was removed or the job was aborted.'
  },
  {
    code: 'PAUSED',
    description: 'Execution is paused; the job will not run until it is resumed.'
  },
  {
    code: 'BLOCKED',
    description: 'The job cannot run at the moment (for example, scheduling limits or conflicts).'
  }
]
