import { useEffect, useState } from 'react'
import { Users, Trash2, Shield } from 'lucide-react'
import { usersAPI } from '../../api/admin'
import type { User } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'

const ROLE_BADGE: Record<string, string> = {
  admin:    'badge-gold',
  lecturer: 'badge-blue',
  student:  'badge-navy',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [roleTarget, setRoleTarget] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await usersAPI.getAll(p)
      setUsers(res.data)
      setPages(res.pages)
      setTotal(res.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await usersAPI.delete(deleteTarget.id)
      toast.success('User deleted')
      load(page)
    } catch { toast.error('Failed to delete user') }
  }

  const handleRoleChange = async () => {
    if (!roleTarget || !newRole) return
    try {
      await usersAPI.updateRole(roleTarget.id, newRole)
      toast.success('Role updated')
      load(page)
    } catch { toast.error('Failed to update role') }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${total} registered user${total !== 1 ? 's' : ''}`}
      />

      {loading ? <TableSkeleton cols={5} rows={8} /> : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-navy-700/40">
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th hidden sm:table-cell">Faculty</th>
                <th className="th hidden md:table-cell">Year</th>
                <th className="th hidden lg:table-cell">Joined</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="td font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-navy-700 border border-navy-600/40 flex items-center justify-center shrink-0">
                        <span className="text-gold-400 text-[10px] font-bold">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="truncate max-w-[120px]">{u.name}</span>
                    </div>
                  </td>
                  <td className="td text-navy-400 truncate max-w-[160px]">{u.email}</td>
                  <td className="td">
                    <span className={ROLE_BADGE[u.role] ?? 'badge-navy'}>{u.role}</span>
                  </td>
                  <td className="td text-navy-400 hidden sm:table-cell max-w-[140px] truncate">{u.faculty ?? '—'}</td>
                  <td className="td text-navy-400 hidden md:table-cell">{u.year_of_study ? `Year ${u.year_of_study}` : '—'}</td>
                  <td className="td text-navy-500 hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setRoleTarget(u); setNewRole(u.role) }}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors" title="Change role">
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete user">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete User" message={`Permanently delete "${deleteTarget?.name}"? This cannot be undone.`}
        danger
      />

      {/* Role change modal */}
      <Modal open={!!roleTarget} onClose={() => setRoleTarget(null)} title="Change User Role" size="sm">
        <p className="text-navy-300 text-sm mb-4">
          Update role for <span className="text-white font-medium">{roleTarget?.name}</span>
        </p>
        <select
          className="input mb-5"
          value={newRole}
          onChange={e => setNewRole(e.target.value)}
          aria-label={`Update role for ${roleTarget?.name}`} // <-- Accessibility fix
        >
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex gap-3">
          <button onClick={() => setRoleTarget(null)} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => { handleRoleChange(); setRoleTarget(null) }}
            className="btn-primary flex-1"
            style={{ background: 'linear-gradient(90deg,#c9a84c,#f0c040,#d4af37)' }}
          >
            Update Role
          </button>
        </div>
      </Modal>
    </div>
  )
}