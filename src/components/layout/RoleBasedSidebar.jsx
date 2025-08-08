import React, { useContext } from 'react';
import { SidebarContext } from '../../contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';

const navigationItems = [
  {
    label: 'Panel Principal',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['admin', 'operator', 'farmer'],
    badge: null,
    tooltip: 'Vista general del sistema'
  },
  {
    label: 'Agricultores',
    path: '/farmers',
    icon: 'Users',
    roles: ['admin', 'operator'],
    badge: null,
    tooltip: 'Gestionar registros de agricultores'
  },
  {
    label: 'Parcelas',
    path: '/parcels',
    icon: 'MapPin',
    roles: ['admin', 'operator', 'farmer'],
    badge: null,
    tooltip: 'Administrar parcelas agrícolas'
  },
  {
    label: 'Inspecciones',
    path: '/inspections',
    icon: 'ClipboardCheck',
    roles: ['admin', 'operator'],
    badge: null,
    tooltip: 'Flujo de trabajo de inspecciones'
  },
  {
    label: 'Financiamiento',
    path: '/financing',
    icon: 'DollarSign',
    roles: ['admin', 'operator', 'farmer'],
    badge: null,
    tooltip: 'Gestión de créditos y pagos'
  }
];

const RoleBasedSidebar = ({ userRole = 'admin' }) => {
  const { collapsed, toggleSidebar } = useContext(SidebarContext);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="sidebar-header flex items-center justify-between p-4 border-b">
        {!collapsed && <span className="font-bold text-lg">Siembra País</span>}
        <button 
          onClick={toggleSidebar} 
          className={`${collapsed ? 'mx-auto' : 'ml-2'}`}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} />
        </button>
      </div>
      <nav className="sidebar-menu p-4">
        <ul className="space-y-2">
          {navigationItems.filter(item => item.roles.includes(userRole)).map(item => (
            <li key={item.path}>
              <button
                className={`flex items-center w-full px-3 py-2 rounded hover:bg-green-100 transition-colors ${location.pathname === item.path ? 'bg-green-200 font-semibold' : ''}`}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.tooltip : ''}
              >
                <Icon name={item.icon} className={`${collapsed ? 'mx-auto' : 'mr-3'} w-6 h-6`} />
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && <span className="ml-auto bg-green-500 text-white rounded-full px-2 text-xs">{item.badge}</span>}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default RoleBasedSidebar;
