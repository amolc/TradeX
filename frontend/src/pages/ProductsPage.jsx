import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { getProducts } from '../services/api'

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
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
          err.response?.data?.detail || 'Could not load products right now.',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return products
    }

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.supplier?.name,
        product.supplier?.email,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [products, searchTerm])

  return (
    <section className="page-card marketplace-shell">
      <div className="marketplace-hero">
        <p className="eyebrow">Trade Listings</p>
        <h2 className="page-title">Marketplace Products</h2>
        <p className="page-text">
          Browse trusted supplier listings, compare availability, and open a
          product page when you are ready to enquire or place an order.
        </p>
        <div className="marketplace-summary">
          <div className="marketplace-summary-card">
            <span className="marketplace-summary-value">{products.length}</span>
            <span className="marketplace-summary-label">Live Listings</span>
          </div>
          <div className="marketplace-summary-card">
            <span className="marketplace-summary-value">{filteredProducts.length}</span>
            <span className="marketplace-summary-label">Matching Results</span>
          </div>
        </div>
      </div>

      <div className="section-gap marketplace-toolbar">
        <label className="field-label" htmlFor="search">
          Search Products
        </label>
        <input
          className="input"
          id="search"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by product or supplier"
          type="search"
          value={searchTerm}
        />
      </div>

      {loading ? <Spinner label="Loading products..." /> : null}
      {error ? <div className="error-box">{error}</div> : null}

      {!loading && !error && filteredProducts.length === 0 ? (
        <div className="empty-state">No products found.</div>
      ) : null}

      {!loading && !error && filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="list-item product-card" key={product.id}>
              <div className="product-card-top">
                <div>
                  <p className="product-card-kicker">Industrial Supply</p>
                  <h3>{product.name}</h3>
                </div>
                <span className="product-pill">Ready</span>
              </div>

              <div className="product-meta">
                <p className="product-price">Price: Rs. {product.price}</p>
                <p>Available Quantity: {product.quantity}</p>
                <p>
                  Supplier: {product.supplier?.name || product.supplier?.email || 'N/A'}
                </p>
              </div>

              <div className="product-card-footer">
                <Link className="button product-link-button" to={`/products/${product.id}`}>
                  Open Product Page
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default ProductsPage
