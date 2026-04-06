import { useEffect, useState } from 'react'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import { deleteUser, getAdminUsers, updateUserRole } from '../../services/userService'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  const loadUsers = async () => {
    setError('')

    try {
      const response = await getAdminUsers()
      setUsers(response)
    } catch {
      setError('Could not load users.')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    {
      key: 'role',
      title: 'Role',
      render: (row) => <StatusBadge label={row.role} />,
    },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        description="Review user accounts, adjust roles, and remove invalid profiles."
        eyebrow="Control"
        title="User Management"
      />

      {error ? <div className="alert error">{error}</div> : null}

      <DataTable
        actions={(row) => (
          <div className="table-actions">
            <button
              className="button button-secondary"
              onClick={async () => {
                await updateUserRole(row.id, row.role === 'buyer' ? 'supplier' : 'buyer')
                loadUsers()
              }}
              type="button"
            >
              Switch Role
            </button>
            <button
              className="button button-danger"
              onClick={async () => {
                await deleteUser(row.id)
                loadUsers()
              }}
              type="button"
            >
              Delete
            </button>
          </div>
        )}
        columns={columns}
        rows={users}
      />
    </div>
  )
}
