import { useEffect, useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { getAdminOrders, updateAdminOrder } from '../../services/orderService'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [statusValue, setStatusValue] = useState('pending')
  const [shippingModeValue, setShippingModeValue] = useState('')
  const [responseText, setResponseText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadOrders = async () => {
    setError('')

    try {
      const response = await getAdminOrders()
      setOrders(response)
    } catch {
      setError('Could not load orders.')
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const columns = [
    { key: 'id', title: 'Order ID' },
    {
      key: 'order_type',
      title: 'Type',
      render: (row) => <StatusBadge label={row.order_type} />,
    },
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
      key: 'total_amount',
      title: 'Total',
      render: (row) => formatCurrency(row.total_amount),
    },
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
        description="Review every enquiry and order, then apply admin workflow corrections without touching buyer and supplier dashboards."
        eyebrow="Operations"
        title="Orders Oversight"
      />

      {error ? <div className="alert error">{error}</div> : null}

      <DataTable
        actions={(row) => (
          <div className="table-actions">
            <button
              className="button button-primary"
              onClick={() => {
                setEditingOrderId((current) => (current === row.id ? null : row.id))
                setStatusValue(row.status || 'pending')
                setShippingModeValue(row.shipping_mode || '')
                setResponseText(row.supplier_response || '')
              }}
              type="button"
            >
              {editingOrderId === row.id ? 'Close' : 'Update Order'}
            </button>
          </div>
        )}
        columns={columns}
        rows={orders}
      />

      {editingOrderId ? (
        <section className="panel form-panel">
          <h3 className="panel-title">Update Order #{editingOrderId}</h3>
          <div className="form-grid">
            <label className="field">
              <span>Status</span>
              <select className="input" onChange={(event) => setStatusValue(event.target.value)} value={statusValue}>
                <option value="pending">Pending</option>
                <option value="responded">Responded</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </label>

            <label className="field">
              <span>Shipping Mode</span>
              <select className="input" onChange={(event) => setShippingModeValue(event.target.value)} value={shippingModeValue}>
                <option value="">Not Selected</option>
                <option value="air">Air</option>
                <option value="sea">Sea</option>
              </select>
            </label>

            <label className="field field-full">
              <span>Supplier Response / Admin Note</span>
              <textarea
                className="input textarea"
                onChange={(event) => setResponseText(event.target.value)}
                rows={4}
                value={responseText}
              />
            </label>
          </div>

          <div className="table-actions">
            <button
              className="button button-primary"
              disabled={saving}
              onClick={async () => {
                setSaving(true)

                try {
                  await updateAdminOrder(editingOrderId, {
                    status: statusValue,
                    shipping_mode: shippingModeValue,
                    supplier_response: responseText,
                  })
                  setEditingOrderId(null)
                  loadOrders()
                } catch {
                  setError('Could not update the order.')
                } finally {
                  setSaving(false)
                }
              }}
              type="button"
            >
              {saving ? 'Saving...' : 'Save Order'}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
