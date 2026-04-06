import { useEffect, useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import { getActivityLogs } from '../../services/activityService'
import { formatDateTime } from '../../utils/formatters'

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadLogs = async () => {
      setError('')

      try {
        const response = await getActivityLogs()
        setLogs(response)
      } catch {
        setError('Could not load activity logs.')
      }
    }

    loadLogs()
  }, [])

  return (
    <div className="page-stack">
      <PageHeader
        description="Follow the most important order and logistics events happening across the platform."
        eyebrow="Audit"
        title="Logs & Activity Tracking"
      />

      {error ? <div className="alert error">{error}</div> : null}

      <DataTable
        columns={[
          { key: 'actor', title: 'Actor' },
          { key: 'action', title: 'Action' },
          { key: 'target', title: 'Target' },
          {
            key: 'created_at',
            title: 'When',
            render: (row) => formatDateTime(row.created_at),
          },
        ]}
        rows={logs}
      />
    </div>
  )
}
