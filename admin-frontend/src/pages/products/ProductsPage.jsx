import { useEffect, useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import { deleteAdminProduct, getAdminProducts } from '../../services/productService'
import { formatCurrency } from '../../utils/formatters'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadProducts = async () => {
    setError('')

    try {
      const response = await getAdminProducts()
      setProducts(response)
    } catch {
      setError('Could not load product listings.')
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const columns = [
    { key: 'name', title: 'Product' },
    {
      key: 'price',
      title: 'Price',
      render: (row) => formatCurrency(row.price),
    },
    { key: 'quantity', title: 'Quantity' },
    {
      key: 'supplier',
      title: 'Supplier',
      render: (row) => row.supplier?.name || row.supplier?.email || 'N/A',
    },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        description="Review shared catalog listings and remove unsafe or invalid supplier products without touching supplier inventory screens."
        eyebrow="Catalog"
        title="Product Moderation"
      />

      {error ? <div className="alert error">{error}</div> : null}

      {products.length ? (
        <DataTable
          actions={(row) => (
            <div className="table-actions">
              <button
                className="button button-danger"
                disabled={deletingId === row.id}
                onClick={async () => {
                  setDeletingId(row.id)

                  try {
                    await deleteAdminProduct(row.id)
                    loadProducts()
                  } catch {
                    setError('Could not remove the product listing.')
                  } finally {
                    setDeletingId(null)
                  }
                }}
                type="button"
              >
                {deletingId === row.id ? 'Removing...' : 'Remove Listing'}
              </button>
            </div>
          )}
          columns={columns}
          rows={products}
        />
      ) : (
        <EmptyState
          description="Products from the shared backend will appear here for admin review."
          title="No listings found"
        />
      )}
    </div>
  )
}
