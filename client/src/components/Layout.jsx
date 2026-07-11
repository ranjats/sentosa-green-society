import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, Calendar, DollarSign, Package, LogOut, LayoutDashboard, Receipt } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Sentosa Green</h1>
          <p className="text-sm text-gray-500 mt-1">Society Management</p>
        </div>
        
        <nav className="px-4 space-y-2 flex-1">
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/residents" className={navClass}>
            <Users size={20} />
            <span>Residents</span>
          </NavLink>
          <NavLink to="/events" className={navClass}>
            <Calendar size={20} />
            <span>Events</span>
          </NavLink>
          <NavLink to="/contributions" className={navClass}>
            <DollarSign size={20} />
            <span>Contributions</span>
          </NavLink>
          <NavLink to="/event-contributions" className={navClass}>
            <Receipt size={20} />
            <span>Event Contributions</span>
          </NavLink>
          <NavLink to="/amenities" className={navClass}>
            <Package size={20} />
            <span>Amenities</span>
          </NavLink>
        </nav>
        
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500">House: {user?.house_no}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 w-full">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
