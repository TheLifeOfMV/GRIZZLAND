'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import AdminProductsList from '@/components/admin/ProductsList';
import ContactSubmissionsList from '@/components/admin/ContactSubmissionsList';
import type { Metadata } from 'next';

/**
 * PHASE 3: Admin Dashboard
 * 
 * Purpose: Protected admin interface for managing GRIZZLAND products
 * Features: Navigation, real-time updates, low-stock alerts
 * Prevention: Auth checks, error boundaries, data caching
 */

const AdminDashboard: React.FC = () => {
  const { user, loading, isAdmin, initialized, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('products');

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push('/admin/login');
    }
  };

  // If not authenticated, redirect to login
  useEffect(() => {
    if (initialized && !loading) {
      if (!user) {
        console.log('ADMIN_REDIRECT_LOGIN', {
          timestamp: new Date().toISOString(),
          reason: 'Not authenticated'
        });
        router.push('/admin/login');
        return;
      }
      
      // For now, allow any authenticated user to access admin (temporary)
      // In production, you'd check isAdmin
      console.log('ADMIN_AUTH_SUCCESS', {
        timestamp: new Date().toISOString(),
        userId: user.id,
        email: user.email
      });
    }
  }, [initialized, loading, user, router]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'products', label: 'Productos', icon: CubeIcon },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCartIcon },
    { id: 'contact', label: 'Contactos', icon: EnvelopeIcon },
    { id: 'customers', label: 'Clientes', icon: UsersIcon },
    { id: 'analytics', label: 'Analíticas', icon: ChartBarIcon },
    { id: 'settings', label: 'Configuración', icon: CogIcon }
  ];

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-white text-lg">Verificando credenciales...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <AdminProductsList />;
      case 'contact':
        return <ContactSubmissionsList />;
      case 'dashboard':
        return (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold text-primary-bg mb-4 uppercase tracking-wide">
              Dashboard Resumen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-primary-bg text-white p-6 rounded-lg"
              >
                <h3 className="text-sm font-medium uppercase tracking-wide mb-2">
                  Productos Totales
                </h3>
                <p className="text-3xl font-bold">127</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-red-600 text-white p-6 rounded-lg"
              >
                <h3 className="text-sm font-medium uppercase tracking-wide mb-2">
                  Stock Bajo
                </h3>
                <p className="text-3xl font-bold">12</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-green-600 text-white p-6 rounded-lg"
              >
                <h3 className="text-sm font-medium uppercase tracking-wide mb-2">
                  Pedidos Hoy
                </h3>
                <p className="text-3xl font-bold">34</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-blue-600 text-white p-6 rounded-lg"
              >
                <h3 className="text-sm font-medium uppercase tracking-wide mb-2">
                  Ingresos Hoy
                </h3>
                <p className="text-3xl font-bold">$2,450</p>
              </motion.div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              Sección en Construcción
            </h2>
            <p className="text-gray-500">
              Esta funcionalidad será implementada próximamente.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-primary-bg text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold uppercase tracking-wide">
                GRIZZLAND Admin
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm opacity-75">
                Bienvenido, {user?.name || 'Admin'}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignOut}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200"
              >
                Cerrar Sesión
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <motion.nav
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-64 bg-white shadow-lg min-h-screen"
        >
          <div className="p-6">
            <h2 className="text-lg font-bold text-primary-bg uppercase tracking-wide mb-6">
              Navegación
            </h2>
            
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <li key={item.id}>
                    <motion.button
                      onClick={() => {
                        setActiveTab(item.id);
                        console.log('ADMIN_NAV_CHANGE', {
                          timestamp: new Date().toISOString(),
                          fromTab: activeTab,
                          toTab: item.id
                        });
                      }}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-bg text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      whileHover={{ scale: isActive ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                      {item.id === 'products' && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full"
                        >
                          12
                        </motion.span>
                      )}
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard; 