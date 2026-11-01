
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  FileText,
  CalendarDays,
  FileCheck,
  UsersRound,
  X
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Candidates", icon: Users },
  { name: "Jobs", icon: BriefcaseBusiness },
  { name: "Applications", icon: FileText },
  { name: "Interviews", icon: CalendarDays },
  { name: "Offers", icon: FileCheck },
];

export default function Sidebar({
  activePage,
  setActivePage,
  open,
  setOpen
}) {
  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <UsersRound size={23} />
          </div>
          <div>
            <h2>TalentFlow</h2>
            <span>Recruitment Platform</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">TF</div>
          <div>
            <strong>TalentFlow Admin</strong>
            <span>Administrator</span>
          </div>
        </div>
      </aside>
    </>
  );
}
