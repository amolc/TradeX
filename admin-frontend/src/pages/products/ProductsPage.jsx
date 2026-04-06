import { useEffect, useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
import { getAdminProducts } from '../../services/productService'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      setError('')

      try {
        const response = await getAdminProducts()
        setProducts(response)
      } catch {
        setError('Could not load product listings.')
      }
    }

    loadProducts()
  }, [])

  const columns = [
    { key: 'name', title: 'Product' },
    { key: 'price', title: 'Price' },
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
        description="Review active listings and prepare this module for approval workflows later."
        eyebrow="Catalog"
        title="Product / Service Management"
      />

      {error ? <div className="alert error">{error}</div> : null}

      {products.length ? (
        <DataTable columns={columns} rows={products} />
      ) : (
        <EmptyState
          description="Products from the shared backend will appear here for admin review."
          title="No listings found"
        />
      )}
    </div>
  )
}
