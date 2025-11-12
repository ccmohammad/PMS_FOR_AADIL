'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  FaHome, 
  FaPills, 
  FaBoxes, 
  FaShoppingCart, 
  FaChartLine, 
  FaUsers, 
  FaCog, 
  FaSignOutAlt,
  FaArrowLeft,
  FaArrowRight,
  FaHistory,
  FaBars,
  FaUser,
  FaRobot,
  FaBell,
  FaAddressBook
} from 'react-icons/fa';
import { useSettings } from '@/lib/hooks/useSettings';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCollapsed: boolean;
  onlyAdmin?: boolean;
  userRole?: string;
}

const NavItem = ({ href, label, icon, isActive, isCollapsed, onlyAdmin, userRole }: NavItemProps) => {
  // Don't show if admin-only and user is not admin
  if (onlyAdmin && userRole !== 'admin') return null;

  return (
    <Link
      href={href}
      className={`flex items-center p-3 ${isCollapsed ? 'justify-center' : 'px-4'} rounded-xl ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20 hover:text-white'
          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
      } transition-all duration-300 ease-in-out ${!isActive ? 'transform hover:scale-[1.02]' : ''}`}
    >
      <span className={`text-xl transition-transform duration-300 ${isActive ? 'transform scale-110' : ''}`}>{icon}</span>
      {!isCollapsed && <span className="ml-3 font-medium">{label}</span>}
    </Link>
  );
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { settings, isLoading } = useSettings();
  
  const userRole = session?.user?.role || 'staff';

  // Automatically collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  const navItems = [
    // CORE OPERATIONS - Most frequently used
    { href: '/dashboard', label: 'Overview', icon: <FaHome />, adminOnly: false },
    { href: '/dashboard/sales', label: 'Point of Sale', icon: <FaShoppingCart />, adminOnly: false },
    { href: '/dashboard/customers', label: 'Customer', icon: <FaAddressBook />, adminOnly: false },
    
    // INVENTORY MANAGEMENT - Critical for pharmacy operations
    { href: '/dashboard/inventory', label: 'Stock Management', icon: <FaBoxes />, adminOnly: false },
    { href: '/dashboard/products', label: 'Product Catalog', icon: <FaPills />, adminOnly: false },
    { href: '/dashboard/stock-alerts', label: 'Stock Alerts', icon: <FaBell />, adminOnly: false },
    
    // AI & ANALYTICS - Modern pharmacy features
    { href: '/dashboard/ai', label: 'AI Analytics', icon: <FaRobot />, adminOnly: false },
    { href: '/dashboard/reports', label: 'Analytics & Reports', icon: <FaChartLine />, adminOnly: false },
    { href: '/dashboard/sales/history', label: 'Transaction History', icon: <FaHistory />, adminOnly: false },
    
    // ADMINISTRATION - Less frequent but important
    { href: '/dashboard/ai-settings', label: 'AI Configuration', icon: <FaCog />, adminOnly: true },
    { href: '/dashboard/profile', label: 'User Profile', icon: <FaUser />, adminOnly: false },
    { href: '/dashboard/settings', label: 'System Settings', icon: <FaCog />, adminOnly: false },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
  };

  return (
    <>
      {/* Mobile menu button - only shows on small screens */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/80 backdrop-blur-lg shadow-lg text-blue-600 hover:bg-blue-50 transition-colors duration-200"
        onClick={toggleMobileMenu}
      >
        <FaBars size={24} />
      </button>
      
      {/* Mobile overlay */}
      {showMobileMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
      
      <aside 
        className={`bg-white/80 backdrop-blur-lg min-h-screen shadow-xl flex flex-col transition-all duration-300 ease-in-out fixed md:static z-40
          ${collapsed ? 'w-20' : 'w-64'} 
          ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {isLoading ? 'Loading...' : settings?.business?.pharmacyName || 'Pharmacy MS'}
            </h1>
          )}
          <button 
            onClick={toggleSidebar} 
            className="p-2 rounded-lg hover:bg-blue-50 text-gray-500 transition-colors duration-200 hidden md:block"
          >
            {collapsed ? <FaArrowRight className="text-blue-600" /> : <FaArrowLeft className="text-blue-600" />}
          </button>
        </div>

        <div className="flex-1 px-3 py-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={pathname === item.href}
              isCollapsed={collapsed}
              onlyAdmin={item.adminOnly}
              userRole={userRole}
            />
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className={`flex items-center p-3 ${collapsed ? 'justify-center' : 'px-4'} w-full rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300 ease-in-out transform hover:scale-[1.02]`}
          >
            <span className="text-xl"><FaSignOutAlt /></span>
            {!collapsed && <span className="ml-3 font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
} 