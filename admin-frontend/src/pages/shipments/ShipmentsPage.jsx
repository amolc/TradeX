import { useEffect, useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { getAdminShipments, updateAdminShipment } from '../../services/shipmentService'

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([])
  const [editingShipmentId, setEditingShipmentId] = useState(null)
  const [statusValue, setStatusValue] = useState('pending')
  const [trackingStageValue, setTrackingStageValue] = useState('supplier')
  const [locationValue, setLocationValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadShipments = async () => {
    setError('')

    try {
      const response = await getAdminShipments()
      setShipments(response)
    } catch {
      setError('Could not load shipments.')
    }
  }

  useEffect(() => {
    loadShipments()
  }, [])

  const columns = [
    { key: 'id', title: 'Shipment ID' },
    {
      key: 'order',
      title: 'Order ID',
      render: (row) => row.order || 'N/A',
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'tracking_stage',
      title: 'Stage',
      render: (row) => <StatusBadge label={row.tracking_stage} />,
    },
    { key: 'location', title: 'Location' },
    {
      key: 'shipping_mode',
      title: 'Mode',
      render: (row) => row.shipping_mode || 'N/A',
    },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        description="Track every shipment record and correct delivery workflow centrally when supplier-side progress stalls."
        eyebrow="Fulfilment"
        title="Shipment Oversight"
      />

      {error ? <div className="alert error">{error}</div> : null}

      <DataTable
        actions={(row) => (
          <div className="table-actions">
            <button
              className="button button-primary"
              onClick={() => {
                setEditingShipmentId((current) => (current === row.id ? null : row.id))
                setStatusValue(row.status || 'pending')
                setTrackingStageValue(row.tracking_stage || 'supplier')
                setLocationValue(row.location || '')
              }}
              type="button"
            >
              {editingShipmentId === row.id ? 'Close' : 'Update Shipment'}
            </button>
          </div>
        )}
        columns={columns}
        rows={shipments}
      />

      {editingShipmentId ? (
        <section className="panel form-panel">
          <h3 className="panel-title">Update Shipment #{editingShipmentId}</h3>
          <div className="form-grid">
            <label className="field">
              <span>Status</span>
              <select className="input" onChange={(event) => setStatusValue(event.target.value)} value={statusValue}>
                <option value="pending">Pending</option>
                <option value="shipped">Dispatched</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </label>

            <label className="field">
              <span>Tracking Stage</span>
              <select className="input" onChange={(event) => setTrackingStageValue(event.target.value)} value={trackingStageValue}>
                <option value="supplier">Order Placed</option>
                <option value="warehouse">Dispatched</option>
                <option value="transport">In Transit</option>
                <option value="delivery">Out for Delivery</option>
                <option value="final_destination">Delivered</option>
              </select>
            </label>

            <label className="field field-full">
              <span>Current Location</span>
              <input className="input" onChange={(event) => setLocationValue(event.target.value)} value={locationValue} />
            </label>
          </div>

          <div className="table-actions">
            <button
              className="button button-primary"
              disabled={saving}
              onClick={async () => {
                setSaving(true)

                try {
                  await updateAdminShipment(editingShipmentId, {
                    status: statusValue,
                    tracking_stage: trackingStageValue,
                    location: locationValue,
                  })
                  setEditingShipmentId(null)
                  loadShipments()
                } catch {
                  setError('Could not update the shipment.')
                } finally {
                  setSaving(false)
                }
              }}
              type="button"
            >
              {saving ? 'Saving...' : 'Save Shipment'}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
