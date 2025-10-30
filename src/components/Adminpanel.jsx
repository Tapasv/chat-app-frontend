import { useState, useEffect } from "react";
import { apiadmin } from "../apiadmin";
import { ToastContainer, toast } from "react-toastify";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Authcntxt } from "../context/authcontext";
import { LogOut, MessageCircle } from "lucide-react";
import 'react-toastify/dist/ReactToastify.css';

const Adminpanel = () => {
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { logout } = useContext(Authcntxt);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getuser = async () => {
    try {
      setLoading(true);
      const res = await apiadmin.get("/user");
      setUser(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const deleteuser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user: ${username}?`)) {
      return;
    }

    try {
      await apiadmin.delete(`/user/${id}`);
      getuser();
      toast.success(`User: ${username} deleted successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    }
  };

  useEffect(() => {
    getuser();
  }, []);

  return (
    <div className="Admin-div">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>⚙️ User Management</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => navigate('/chat')}
            className="admin-chat"
          >
            <MessageCircle size={18} />
            Chat
          </button>
          <button
            className="admin-logout"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Total Users: <strong style={{ color: 'var(--primary)' }}>{user.length}</strong>
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading users...</p>
        </div>
      ) : user.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No users found</p>
        </div>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th className="action">Actions</th>
            </tr>
          </thead>
          <tbody className="user-table-body">
            {user.map((u) => (
              <tr key={u._id}>
                <td data-label="Username">
                  <strong>{u.Username}</strong>
                </td>
                <td data-label="Role">
                  <span>{u.role}</span>
                </td>
                <td className="action">
                  <button
                    className="dlt-btn"
                    type="button"
                    onClick={() => deleteuser(u._id, u.Username)}
                    style={{
                      background: 'linear-gradient(135deg, #dc3545, #a02834)'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ToastContainer />
    </div>
  );
};

export default Adminpanel;