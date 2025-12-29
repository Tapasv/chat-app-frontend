import { useState, useEffect, useContext } from "react";
import { apiadmin } from "../apiadmin";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Authcntxt } from "../context/authcontext";
import { LogOut, MessageCircle, Trash2, Settings } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const Adminpanel = () => {
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { logout } = useContext(Authcntxt);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
    if (!window.confirm(`Are you sure you want to delete user: ${username}?`))
      return;

    try {
      await apiadmin.delete(`/user/${id}`);
      getuser();
      toast.success(`User ${username} deleted successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    }
  };

  useEffect(() => {
    getuser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <ToastContainer />

      {/* Header */}
      <div className="max-w-md mx-auto mb-5 flex items-center justify-between md:max-w-6xl">
        <div className="flex items-center gap-2">
          <Settings size={20} />
          <h1 className="text-xl font-semibold text-gray-800">
            User Management
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-black text-white text-sm"
          >
            <MessageCircle size={14} />
            Chat
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-md mx-auto mb-4 text-sm text-gray-600 md:max-w-6xl">
        Total Users:{" "}
        <span className="font-semibold text-black">{user.length}</span>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto md:max-w-6xl">
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            Loading users...
          </div>
        ) : user.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            No users found
          </div>
        ) : (
          <>
            {/* 📱 PHONE VIEW — CENTERED USER CARDS (MATCHING YOUR SCREENSHOT) */}
            <div className="md:hidden space-y-4">
              {user.map((u) => (
                <div
                  key={u._id}
                  className="bg-white rounded-xl shadow-md p-4"
                >
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-500">Username</p>
                    <p className="font-semibold text-blue-600">
                      {u.Username}
                    </p>

                    <p className="text-gray-500 mt-2">Role</p>
                    <p className="font-medium text-gray-800">
                      {u.role}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteuser(u._id, u.Username)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {/* 💻 DESKTOP VIEW — TABLE (UNCHANGED) */}
            <table className="hidden md:table w-full bg-white rounded-xl shadow-md overflow-hidden">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                    Username
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                    Role
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {user.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b last:border-none hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {u.Username}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                        {u.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          deleteuser(u._id, u.Username)
                        }
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default Adminpanel;
