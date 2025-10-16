import { useState, useEffect } from "react";
import { apiadmin } from "../apiadmin";
import { ToastContainer, toast } from "react-toastify";
import { useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useNavigate } from "react-router-dom";
import { Authcntxt } from "../context/authcontext";
import { LogOut } from "lucide-react";
import Chat from "./chat";
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
        <button
          onClick={handleLogout}
          style={{
            background: 'linear-gradient(135deg, #dc3545, #a02834)',
            padding: '0.6rem 1.2rem',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
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
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th className="action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {user.map((u) => (
              <tr key={u._id}>
                <td>
                  <strong>{u.Username}</strong>
                </td>
                <td>
                  <span style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '20px',
                    background: u.role === 'Admin'
                      ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                      : 'rgba(255, 255, 255, 0.1)',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {u.role}
                  </span>
                </td>
                <td className="action">
                  <button
                    className="dlt-btn"
                    type="button"
                    onClick={() => deleteuser(u._id, u.Username)}
                    style={{
                      background: 'linear-gradient(135deg, #dc3545, #a02834)',
                      padding: '0.5rem 1.2rem',
                      fontSize: '0.9rem'
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

      <Routes>
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </div>


  );
};

export default Adminpanel;