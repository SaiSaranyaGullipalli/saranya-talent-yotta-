
import {
  Menu,
  Search,
  Bell,
  LogOut
} from "lucide-react";

export default function Header({
  title,
  onMenuClick,
  currentUser,
  onLogout
}) {

  return (
    <header className="top-header">

      <div className="header-left">

        <button
          className="mobile-menu"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </button>

        <div>
          <h2>{title}</h2>
          <p>Manage your recruitment activities</p>
        </div>

      </div>

      <div className="header-actions">

        <div className="header-search">
          <Search size={17} />
          <span>Recruitment workspace</span>
        </div>

        <button
          className="notification-button"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="user-profile">
          <div className="header-avatar">
            {currentUser?.username?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="user-info">
            <strong>{currentUser?.username}</strong>
            <span>{currentUser?.role}</span>
          </div>
        </div>

        <button
          className="logout-button"
          onClick={onLogout}
          title="Logout"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

      </div>

    </header>
  );
}
