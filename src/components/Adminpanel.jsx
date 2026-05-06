import { useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Authcntxt } from '../context/authcontext';
import api from '../lib/axios';
import Spinner from './ui/Spinner';

const Adminpanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
    });

    const navigate = useNavigate();
    const { logout } = useContext(Authcntxt);

    const fetchUsers = async (page = 1) => {
        console.log('Fetching page:', page); // ADD THIS
        try {
            setLoading(true);
            const data = await api.get(`/api/admin/user?page=${page}&limit=10`);
            console.log('Got users:', data.users?.map(u => u.Username)); // ADD THIS
            setUsers(Array.isArray(data.users) ? data.users : []);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1);
    }, []);

    const handleDelete = async (id, username) => {
        if (!window.confirm(`Delete user: ${username}?`)) return;
        try {
            await api.delete(`/api/admin/user/${id}`);
            toast.success(`User ${username} deleted`);
            // If last user on page, go back one page
            const newPage = users.length === 1 && pagination.page > 1
                ? pagination.page - 1
                : pagination.page;
            fetchUsers(newPage);
        } catch {
            toast.error('Failed to delete user');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-base px-4 py-6 text-text-primary">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold">User Management</h1>
                    <p className="text-xs text-text-secondary mt-0.5">
                        {pagination.total} total users
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/chat')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-elevated border border-border text-sm hover:bg-overlay transition-colors"
                    >
                        <MessageCircle size={14} /> Chat
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-status-error/10 border border-status-error/20 text-status-error text-sm hover:bg-status-error/20 transition-colors"
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-5xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Spinner size="md" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-20 text-text-secondary text-sm">
                        No users found
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block bg-surface border border-border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-elevated">
                                        <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Username
                                        </th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="text-left px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="text-right px-5 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-elevated/50 transition-colors">
                                            <td className="px-5 py-3.5 text-sm font-medium">
                                                {u.Username}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-text-secondary">
                                                {u.Email}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-xs px-2 py-0.5 rounded-sm border font-medium ${u.role === 'Admin'
                                                        ? 'bg-accent/10 text-accent border-accent/20'
                                                        : 'bg-elevated text-text-secondary border-border'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => handleDelete(u._id, u.Username)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-status-error/10 text-status-error border border-status-error/20 hover:bg-status-error/20 transition-colors"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-3">
                            {users.map((u) => (
                                <div key={u._id} className="bg-surface border border-border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-sm">{u.Username}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-sm border ${u.role === 'Admin'
                                                ? 'bg-accent/10 text-accent border-accent/20'
                                                : 'bg-elevated text-text-secondary border-border'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-secondary mb-3">{u.Email}</p>
                                    <button
                                        onClick={() => handleDelete(u._id, u.Username)}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md bg-status-error/10 text-status-error border border-status-error/20"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination controls */}
                        <div className="flex items-center justify-between mt-4 px-1">
                            <p className="text-xs text-text-secondary">
                                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                            </p>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => fetchUsers(pagination.page - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="p-1.5 rounded-md border border-border hover:bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={15} />
                                </button>

                                {/* Page numbers */}
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                                    .reduce((acc, p, idx, arr) => {
                                        if (idx > 0 && p - arr[idx - 1] > 1) {
                                            acc.push('...');
                                        }
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((item, idx) => (
                                        item === '...' ? (
                                            <span key={`ellipsis-${idx}`} className="px-1 text-text-muted text-xs">...</span>
                                        ) : (
                                            <button
                                                key={item}
                                                onClick={() => fetchUsers(item)}
                                                className={`w-7 h-7 text-xs rounded-md border transition-colors ${item === pagination.page
                                                        ? 'bg-accent border-accent text-white'
                                                        : 'border-border hover:bg-elevated text-text-secondary'
                                                    }`}
                                            >
                                                {item}
                                            </button>
                                        )
                                    ))
                                }

                                <button
                                    onClick={() => fetchUsers(pagination.page + 1)}
                                    disabled={!pagination.hasNext}
                                    className="p-1.5 rounded-md border border-border hover:bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Adminpanel;