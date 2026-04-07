import { useEffect, useMemo, useState } from 'react'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { addProduct, deleteProduct, getProducts, updateProduct } from '../services/api'

const emptyForm = {
  name: '',
  price: '',
  quantity: '',
}

function Products() {
  const { role } = useAuth()
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    setError('')

    try {
      const response = await getProducts()
      setProducts(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load supplier products.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleEdit(product) {
    setEditingId(product.id)
    setFormData({
      name: product.name || '',
      price: String(product.price ?? ''),
      quantity: String(product.quantity ?? ''),
    })
    setError('')
    setSuccess('')
  }

  function handleReset() {
    setEditingId(null)
    setFormData(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
      }

      if (editingId) {
        await updateProduct(editingId, payload)
        setSuccess('Product updated successfully.')
      } else {
        await addProduct(payload)
        setSuccess('Product added successfully.')
      }

      handleReset()
      await loadProducts()
    } catch (err) {
      const data = err.response?.data
      setError(data?.detail || data?.name?.[0] || 'Could not save the product.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(productId) {
    setDeletingId(productId)
    setError('')
    setSuccess('')

    try {
      await deleteProduct(productId)
      setProducts((current) => current.filter((item) => item.id !== productId))
      if (editingId === productId) {
        handleReset()
      }
      setSuccess('Product deleted successfully.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete the product.')
    } finally {
      setDeletingId(null)
    }
  }

  const inventoryValue = useMemo(
    () =>
      products.reduce(
        (sum, product) => sum + Number(product.price || 0) * Number(product.quantity || 0),
        0,
      ),
    [products],
  )

  if (role !== 'supplier') {
    return (
      <section className="page-card">
        <h2 className="page-title">Supplier Products</h2>
        <div className="info-box">This workspace is available for supplier accounts only.</div>
      </section>
    )
  }

  return (
    <section className="supplier-shell">
      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="success-box">{success}</div> : null}

      <div className="supplier-hero compact-hero">
        <div>
          <p className="eyebrow supplier-hero-eyebrow">Product Operations</p>
          <h2 className="supplier-hero-title">Manage supplier inventory and listing quality</h2>
          <p className="supplier-hero-text">
            This page now owns supplier product management so the dashboard can stay focused on
            operations.
          </p>
        </div>
        <div className="supplier-summary-grid tight-grid">
          <article className="supplier-summary-card">
            <span className="supplier-summary-label">Listed products</span>
            <strong className="supplier-summary-value">{products.length}</strong>
          </article>
          <article className="supplier-summary-card">
            <span className="supplier-summary-label">Inventory value</span>
            <strong className="supplier-summary-value">{inventoryValue.toFixed(0)}</strong>
          </article>
        </div>
      </div>

      <div className="supplier-detail-grid">
        <article className="supplier-panel">
          <p className="eyebrow">{editingId ? 'Edit Product' : 'Add Product'}</p>
          <h3 className="section-title">
            {editingId ? 'Update an existing listing' : 'Create a new supplier listing'}
          </h3>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="name">
                Product Name
              </label>
              <input
                className="input"
                id="name"
                name="name"
                onChange={handleChange}
                required
                type="text"
                value={formData.name}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="price">
                Price
              </label>
              <input
                className="input"
                id="price"
                min="0"
                name="price"
                onChange={handleChange}
                required
                step="0.01"
                type="number"
                value={formData.price}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="quantity">
                Quantity
              </label>
              <input
                className="input"
                id="quantity"
                min="0"
                name="quantity"
                onChange={handleChange}
                required
                type="number"
                value={formData.quantity}
              />
            </div>

            <div className="button-row">
              <button className="button" disabled={saving} type="submit">
                {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
              </button>
              {editingId ? (
                <button className="button secondary" onClick={handleReset} type="button">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="supplier-panel">
          <p className="eyebrow">Listings</p>
          <h3 className="section-title">Current supplier products</h3>

          {loading ? <Spinner label="Loading products..." /> : null}

          {!loading && !products.length ? (
            <div className="empty-state">No supplier products found.</div>
          ) : null}

          {!loading && products.length ? (
            <div className="supplier-cards">
              {products.map((product) => (
                <article className="supplier-entity-card" key={product.id}>
                  <div className="supplier-entity-head">
                    <div>
                      <h4>{product.name}</h4>
                      <p>Price: {product.price}</p>
                      <p>Quantity: {product.quantity}</p>
                    </div>
                    <span className="status-pill neutral">Live</span>
                  </div>
                  <div className="supplier-action-row">
                    <button className="button secondary" onClick={() => handleEdit(product)} type="button">
                      Edit
                    </button>
                    <button
                      className="button danger-button"
                      disabled={deletingId === product.id}
                      onClick={() => handleDelete(product.id)}
                      type="button"
                    >
                      {deletingId === product.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </article>
      </div>
    </section>
  )
}

export default Products
