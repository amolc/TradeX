import { useEffect, useMemo, useState } from 'react'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { getLogistics, getOrders, updateLogistics } from '../services/api'

const shipmentStages = [
  {
    value: 'order_placed',
    label: 'Order Placed',
    payload: { status: 'pending', tracking_stage: 'supplier' },
  },
  {
    value: 'dispatched',
    label: 'Dispatched',
    payload: { status: 'shipped', tracking_stage: 'warehouse' },
  },
  {
    value: 'in_transit',
    label: 'In Transit',
    payload: { status: 'in_transit', tracking_stage: 'transport' },
  },
  {
    value: 'delivered',
    label: 'Delivered',
    payload: { status: 'delivered', tracking_stage: 'final_destination' },
  },
]

function formatDate(value) {
  if (!value) return 'No date available'
  return new Date(value).toLocaleString()
}

function getShipmentStage(shipment) {
  if (shipment.status === 'delivered' || shipment.tracking_stage === 'final_destination') {
    return 'delivered'
  }

  if (shipment.status === 'in_transit' || shipment.tracking_stage === 'transport') {
    return 'in_transit'
  }

  if (shipment.status === 'shipped') return 'dispatched'
  return 'order_placed'
}

function Shipments() {
  const { role } = useAuth()
  const [shipments, setShipments] = useState([])
  const [orders, setOrders] = useState([])
  const [locations, setLocations] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadShipments()
  }, [])

  async function loadShipments() {
    setLoading(true)
    setError('')

    try {
      const [shipmentsResponse, ordersResponse] = await Promise.all([getLogistics(), getOrders()])
      const shipmentItems = Array.isArray(shipmentsResponse.data) ? shipmentsResponse.data : []
      setShipments(shipmentItems)
      setOrders(
        (Array.isArray(ordersResponse.data) ? ordersResponse.data : []).filter(
          (item) => item.order_type === 'order',
        ),
      )
      setLocations(
        shipmentItems.reduce((map, shipment) => {
          map[shipment.id] = shipment.location || ''
          return map
        }, {}),
      )
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load supplier shipments.')
    } finally {
      setLoading(false)
    }
  }

  const orderById = useMemo(
    () =>
      orders.reduce((map, order) => {
        map[order.id] = order
        return map
      }, {}),
    [orders],
  )

  async function handleShipmentStageUpdate(shipment, nextStageValue) {
    const nextStage = shipmentStages.find((item) => item.value === nextStageValue)
    if (!nextStage) return

    setSavingId(shipment.id)
    setError('')
    setSuccess('')

    try {
      await updateLogistics(shipment.id, {
        ...nextStage.payload,
        location: locations[shipment.id] || shipment.location || 'Supplier',
      })
      await loadShipments()
      setSuccess('Shipment updated successfully.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update the shipment.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleLocationSave(shipment) {
    setSavingId(shipment.id)
    setError('')
    setSuccess('')

    try {
      await updateLogistics(shipment.id, {
        location: locations[shipment.id] || '',
      })
      await loadShipments()
      setSuccess('Shipment location updated successfully.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update the shipment location.')
    } finally {
      setSavingId(null)
    }
  }

  if (role !== 'supplier') {
    return (
      <section className="page-card">
        <h2 className="page-title">Supplier Shipments</h2>
        <div className="info-box">This workspace is available for supplier accounts only.</div>
      </section>
    )
  }

  return (
    <section className="supplier-shell">
      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="success-box">{success}</div> : null}

      <div className="supplier-panel">
        <div className="supplier-section-head">
          <div>
            <p className="eyebrow">Shipments</p>
            <h2 className="page-title">Shipment execution and status control</h2>
            <p className="page-text">
              Keep buyer-visible logistics progress updated from order placed through delivery.
            </p>
          </div>
        </div>

        {loading ? <Spinner label="Loading shipments..." /> : null}

        {!loading && !shipments.length ? (
          <div className="empty-state">No supplier shipments found.</div>
        ) : null}

        {!loading && shipments.length ? (
          <div className="supplier-cards">
            {shipments.map((shipment) => {
              const order = orderById[shipment.order]

              return (
                <article className="supplier-entity-card" key={shipment.id}>
                  <div className="supplier-entity-head">
                    <div>
                      <h4>Shipment #{shipment.id}</h4>
                      <p>Order ID: #{shipment.order}</p>
                      <p>Product: {order?.product?.name || 'Unknown product'}</p>
                      <p>Buyer: {order?.user?.name || order?.user?.email || 'Unknown buyer'}</p>
                      <p>Order Date: {formatDate(order?.order_date)}</p>
                    </div>
                    <span className="status-pill neutral">
                      {shipment.status?.replaceAll('_', ' ') || 'pending'}
                    </span>
                  </div>

                  <div className="tracking-grid">
                    <div>
                      <label className="field-label" htmlFor={`shipment-stage-${shipment.id}`}>
                        Shipment Stage
                      </label>
                      <select
                        className="input"
                        defaultValue={getShipmentStage(shipment)}
                        id={`shipment-stage-${shipment.id}`}
                        onChange={(event) =>
                          handleShipmentStageUpdate(shipment, event.target.value)
                        }
                      >
                        {shipmentStages.map((stage) => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="field-label" htmlFor={`shipment-location-${shipment.id}`}>
                        Current Location
                      </label>
                      <input
                        className="input"
                        id={`shipment-location-${shipment.id}`}
                        onChange={(event) =>
                          setLocations((current) => ({
                            ...current,
                            [shipment.id]: event.target.value,
                          }))
                        }
                        type="text"
                        value={locations[shipment.id] ?? ''}
                      />
                    </div>
                  </div>

                  <div className="supplier-action-row">
                    <button
                      className="button secondary"
                      disabled={savingId === shipment.id}
                      onClick={() => handleLocationSave(shipment)}
                      type="button"
                    >
                      {savingId === shipment.id ? 'Saving...' : 'Save Location'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default Shipments
