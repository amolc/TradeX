import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { createOrder, getProducts } from '../services/api'

function ProductDetailsPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const { role } = useAuth()
  const [products, setProducts] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [shippingMode, setShippingMode] = useState('air')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getProducts()
        setProducts(response.data)
      } catch (err) {
        setError(
          err.response?.data?.detail || 'Could not load product details.',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const product = useMemo(
    () => products.find((item) => String(item.id) === String(productId)),
    [productId, products],
  )

  const handleSubmit = async (event, requestType) => {
    event.preventDefault()
    setSubmitting(requestType)
    setError('')

    try {
      const response = await createOrder({
        product_id: Number(productId),
        quantity: Number(quantity),
        order_type: requestType,
        shipping_mode: requestType === 'order' ? shippingMode : '',
      })

      if (requestType === 'enquiry' && response.data?.conversation_id) {
        navigate(`/conversations/${response.data.conversation_id}`)
      } else {
        navigate('/orders')
      }
    } catch (err) {
      const data = err.response?.data
      const detail =
        data?.detail ||
        data?.non_field_errors?.[0] ||
        (typeof data === 'string' ? data : null)

      setError(detail || 'Could not submit the request.')
    } finally {
      setSubmitting('')
    }
  }

  return (
    <section className="page-card">
      <h2 className="page-title">Product Details</h2>

      {loading ? <Spinner label="Loading product..." /> : null}
      {error ? <div className="error-box">{error}</div> : null}

      {!loading && !product ? (
        <div className="empty-state">Product not found.</div>
      ) : null}

      {!loading && product ? (
        <div className="details-grid">
          <div className="details-panel">
            <h3>{product.name}</h3>
            <p>Price: Rs. {product.price}</p>
            <p>Available Quantity: {product.quantity}</p>
            <p>Supplier: {product.supplier?.name || product.supplier?.email || 'N/A'}</p>
          </div>

          {role === 'buyer' ? (
            <form className="details-panel form-grid">
              <div>
                <label className="field-label" htmlFor="quantity">
                  Request Quantity
                </label>
                <input
                  className="input"
                  id="quantity"
                  max={product.quantity}
                  min="1"
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                  type="number"
                  value={quantity}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="shippingMode">
                  Shipping Mode for Orders
                </label>
                <select
                  className="input"
                  id="shippingMode"
                  onChange={(event) => setShippingMode(event.target.value)}
                  value={shippingMode}
                >
                  <option value="air">Air</option>
                  <option value="sea">Sea</option>
                </select>
              </div>

              <div className="button-row">
                <button
                  className="button secondary"
                  disabled={Boolean(submitting)}
                  onClick={(event) => handleSubmit(event, 'enquiry')}
                  type="button"
                >
                  {submitting === 'enquiry' ? 'Sending Enquiry...' : 'Enquire'}
                </button>
                <button
                  className="button"
                  disabled={Boolean(submitting)}
                  onClick={(event) => handleSubmit(event, 'order')}
                  type="button"
                >
                  {submitting === 'order' ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          ) : (
            <div className="info-box">
              Buyers can create enquiries or orders here. Suppliers can review
              the listing details and then manage incoming requests from the
              dashboard.
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

export default ProductDetailsPage
