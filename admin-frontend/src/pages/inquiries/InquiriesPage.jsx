import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { getAdminInquiries } from '../../services/inquiryService'
import { formatDateTime } from '../../utils/formatters'

export default function InquiriesPage() {
  const navigate = useNavigate()
  const [inquiries, setInquiries] = useState([])
  const [error, setError] = useState('')

  const loadInquiries = async () => {
    setError('')

    try {
      const response = await getAdminInquiries()
      setInquiries(response)
    } catch {
      setError('Could not load inquiries.')
    }
  }

  useEffect(() => {
    loadInquiries()
  }, [])

  const columns = [
    { key: 'id', title: 'ID' },
    {
      key: 'user',
      title: 'Buyer',
      render: (row) => row.user?.name || 'Unknown',
    },
    {
      key: 'product',
      title: 'Product',
      render: (row) => row.product?.name || 'N/A',
    },
    { key: 'quantity', title: 'Quantity' },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'order_date',
      title: 'Created',
      render: (row) => formatDateTime(row.order_date),
    },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        description="Monitor all buyer enquiries, then jump into linked conversations or the broader orders queue for escalation."
        eyebrow="Workflow"
        title="Inquiry Management"
      />

      {error ? <div className="alert error">{error}</div> : null}

      <DataTable
        actions={(row) => (
          <div className="table-actions">
            {row.conversation_id ? (
              <button
                className="button button-primary"
                onClick={() => navigate(`/conversations?conversation=${row.conversation_id}`)}
                type="button"
              >
                Open Chat
              </button>
            ) : null}
            <button
              className="button button-secondary"
              onClick={() => navigate('/orders')}
              type="button"
            >
              Review Orders
            </button>
          </div>
        )}
        columns={columns}
        rows={inquiries}
      />
    </div>
  )
}
