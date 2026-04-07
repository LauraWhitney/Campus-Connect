import { useEffect, useState, useMemo } from 'react'
import { Users, Trash2, Shield, Search } from 'lucide-react'
import { usersAPI } from '../../api/admin'
import type { User } from '../../types'
import { PageHeader, Table, TableSkeleton, EmptyState, Pagination, ConfirmDialog, Modal } from '../../components/ui/index'
import toast from 'react-hot-toast'

const ROLE_BADGE: Record<string, string> = {
  admin: 'badge-brand', lecturer: 'badge-blue', student: 'badge-surface',
}

// Gradient index per role for avatar — borrows student palette
const ROLE_GRADIENT: Record<string, string> = {
  admin:    'linear-gradient(135deg, #6366f1, #8b5cf6)',
  lecturer: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  student:  'linear-gradient(135deg, #8b5cf6, #a855f7)',
}

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [pages, setPages]     = useState(1)
  const [total, setTotal]     = useState(0)
  const [query, setQuery]     = useState('')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [roleTarget, setRoleTarget]     = useState<User | null>(null)
  const [newRole, setNewRole]           = useState('')

  const load = async (p = page) => {
    setLoading(true)
    try {
      const res = await usersAPI.getAll(p)
      setUsers(res.data); setPages(res.pages); setTotal(res.total)
    } catch { toast.error('Unable to load users.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load(page) }, [page])

  const results = useMemo(() => {
    if (!query.trim()) return users
    const q = query.toLowerCase()
    return users.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) || u.faculty?.toLowerCase().includes(q)
    )
  }, [users, query])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await usersAPI.delete(deleteTarget.id); toast.success('User deleted'); load(page) }
    catch { toast.error('Failed to delete user') }
  }

  const handleRoleChange = async () => {
    if (!roleTarget || !newRole) return
    try { await usersAPI.updateRole(roleTarget.id, newRole); toast.success('Role updated'); setRoleTarget(null); load(page) }
    catch { toast.error('Failed to update role') }
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="User Management" subtitle={`${total} registered user${total !== 1 ? 's' : ''}`} />

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input className="input pl-10" placeholder="Search by name, email, role or faculty…"
          value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {loading ? <TableSkeleton cols={6} rows={8} /> : results.length === 0 ? (
        <EmptyState icon={Users} title={query ? `No results for "${query}"` : 'No users found'}
          subtitle={query ? 'Try a different search term.' : 'Registered users will appear here.'} />
      ) : (
        <>
          <Table>
            <thead>
              <tr className="border-b border-slate-100">
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
              {results.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="td font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: ROLE_GRADIENT[u.role] ?? ROLE_GRADIENT.student }}>
                        <span className="text-white text-[10px] font-bold">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="truncate max-w-[120px]">{u.name}</span>
                    </div>
                  </td>
                  <td className="td text-slate-500 truncate max-w-[160px]">{u.email}</td>
                  <td className="td"><span className={ROLE_BADGE[u.role] ?? 'badge-surface'}>{u.role}</span></td>
                  <td className="td text-slate-500 hidden sm:table-cell max-w-[140px] truncate">{u.faculty ?? '—'}</td>
                  <td className="td text-slate-500 hidden md:table-cell">{u.year_of_study ? `Year ${u.year_of_study}` : '—'}</td>
                  <td className="td text-slate-400 hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setRoleTarget(u); setNewRole(u.role) }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Change role" aria-label={`Change role for ${u.name}`}>
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete user" aria-label={`Delete ${u.name}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {!query && <Pagination page={page} pages={pages} onChange={setPage} />}
        </>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete User" message={`Permanently delete "${deleteTarget?.name}" (${deleteTarget?.email})? This cannot be undone.`} danger />

      <Modal open={!!roleTarget} onClose={() => setRoleTarget(null)} title="Change User Role" size="sm">
        <p className="text-slate-600 text-sm mb-4">
          Update role for <span className="text-slate-900 font-medium">{roleTarget?.name}</span>
        </p>
        <select className="input mb-5" value={newRole} onChange={e => setNewRole(e.target.value)}
          aria-label={`New role for ${roleTarget?.name}`}>
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex gap-3">
          <button onClick={() => setRoleTarget(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleRoleChange} className="btn-primary flex-1">Update Role</button>
        </div>
      </Modal>
    </div>
  )
}
