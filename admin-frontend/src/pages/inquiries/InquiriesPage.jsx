import { useEffect, useState } from 'react'
import InquiryReplyForm from '../../components/forms/InquiryReplyForm'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { getAdminInquiries, respondToInquiry } from '../../services/inquiryService'
import { formatDateTime } from '../../utils/formatters'

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([])
  const [replyingId, setReplyingId] = useState(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

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
        description="Monitor all buyer inquiries, open response flows, and keep supplier follow-up moving."
        eyebrow="Workflow"
        title="Inquiry Management"
      />

      {error ? <div className="alert error">{error}</div> : null}

      <DataTable
        actions={(row) => (
          <button
            className="button button-primary"
            onClick={() => setReplyingId((current) => (current === row.id ? null : row.id))}
            type="button"
          >
            {replyingId === row.id ? 'Close' : 'Respond'}
          </button>
        )}
        columns={columns}
        rows={inquiries}
      />

      {replyingId ? (
        <section className="panel">
          <h3 className="panel-title">Respond to Inquiry #{replyingId}</h3>
          <InquiryReplyForm
            loading={sending}
            onSubmit={async (payload) => {
              setSending(true)

              try {
                await respondToInquiry(replyingId, payload)
                setReplyingId(null)
                loadInquiries()
              } catch {
                setError('Could not send the response.')
              } finally {
                setSending(false)
              }
            }}
          />
        </section>
      ) : null}
    </div>
  )
}
