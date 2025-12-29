import { Authcntxt } from "../context/authcontext";
import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Settings,
  UserPlus,
  LogIn,
  LogOut,
} from "lucide-react";

const Navbar = () => {
  const { logout, user } = useContext(Authcntxt);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isAdminOnChat =
    user?.role === "Admin" && location.pathname === "/chat";

  return (
    <nav className="sticky top-0 z-50 bg-black text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LEFT — Brand */}
        <div className="flex items-center gap-2 text-xl font-semibold">
          {user?.role === "Admin" && !isAdminOnChat ? (
            <>
              <Settings size={22} />
              <span>Admin Panel</span>
            </>
          ) : (
            <>
              <MessageCircle size={24} />
              <span className="text-white">
                Chat<span className="text-red-500">ify</span>
              </span>
            </>
          )}
        </div>

        {/* RIGHT — Actions */}
        {user ? (
          <div className="flex items-center gap-6">
            {/* Role badge */}
            <span className="text-sm px-3 py-1 rounded-full bg-white/10">
              {user.role}
            </span>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login">
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-white/30 hover:bg-white hover:text-black transition">
                <LogIn size={16} />
                Login
              </button>
            </Link>

            <Link to="/register">
              <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 transition">
                <UserPlus size={16} />
                Register
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
