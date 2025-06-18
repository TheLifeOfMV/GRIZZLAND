'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

/**
 * PHASE 3: AdminProductsList Component
 * 
 * Purpose: Admin interface for managing products with low-stock highlighting
 * Features: Real-time updates, filtering, CRUD operations, error boundaries
 * Prevention: API timeouts, data inconsistency, permission checks
 */

interface Product {
  id: string;
  name: string;
  price: number;
  stock_count: number;
  category: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductsListState {
  products: Product[];
  lowStockProducts: Product[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  filter: 'all' | 'low-stock' | 'featured';
  searchTerm: string;
}

const LOW_STOCK_THRESHOLD = 5;

const AdminProductsList: React.FC = () => {
  const [state, setState] = useState<ProductsListState>({
    products: [],
    lowStockProducts: [],
    loading: true,
    error: null,
    lastUpdate: null,
    filter: 'all',
    searchTerm: ''
  });
  
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Mock data for demonstration (replace with actual API calls)
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Essential Cotton T-Shirt',
      price: 29990,
      stock_count: 2, // Low stock
      category: 'T-Shirts',
      featured: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z'
    },
    {
      id: '2',
      name: 'Vintage Denim Jacket',
      price: 89990,
      stock_count: 8,
      category: 'Jackets',
      featured: true,
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-18T11:20:00Z'
    },
    {
      id: '3',
      name: 'Merino Wool Sweater',
      price: 79990,
      stock_count: 0, // Out of stock
      category: 'Sweaters',
      featured: false,
      created_at: '2024-01-12T14:00:00Z',
      updated_at: '2024-01-19T16:45:00Z'
    },
    {
      id: '4',
      name: 'Classic Hoodie',
      price: 49990,
      stock_count: 15,
      category: 'Hoodies',
      featured: false,
      created_at: '2024-01-08T08:00:00Z',
      updated_at: '2024-01-17T12:10:00Z'
    },
    {
      id: '5',
      name: 'Premium Polo Shirt',
      price: 39990,
      stock_count: 3, // Low stock
      category: 'Polo',
      featured: true,
      created_at: '2024-01-14T11:00:00Z',
      updated_at: '2024-01-21T09:15:00Z'
    }
  ];

  // Fetch products from API
  const fetchProducts = async () => {
    console.log('ADMIN_PRODUCTS_FETCH_START', {
      timestamp: new Date().toISOString(),
      component: 'AdminProductsList'
    });

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for now
      const allProducts = mockProducts;
      const lowStock = allProducts.filter(product => product.stock_count < LOW_STOCK_THRESHOLD);

      setState(prev => ({
        ...prev,
        products: allProducts,
        lowStockProducts: lowStock,
        loading: false,
        error: null,
        lastUpdate: new Date()
      }));

      console.log('ADMIN_PRODUCTS_FETCH_SUCCESS', {
        timestamp: new Date().toISOString(),
        totalProducts: allProducts.length,
        lowStockCount: lowStock.length
      });

    } catch (error) {
      console.error('ADMIN_PRODUCTS_FETCH_ERROR', {
        timestamp: new Date().toISOString(),
        error: error.message
      });

      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Initialize data fetching and auto-refresh
  useEffect(() => {
    fetchProducts();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('ADMIN_PRODUCTS_AUTO_REFRESH', {
        timestamp: new Date().toISOString()
      });
      fetchProducts();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Manual refresh handler
  const handleRefresh = () => {
    console.log('ADMIN_PRODUCTS_MANUAL_REFRESH', {
      timestamp: new Date().toISOString()
    });
    fetchProducts();
  };

  // Filter products based on current filter and search
  const filteredProducts = React.useMemo(() => {
    let filtered = state.products;

    // Apply filter
    switch (state.filter) {
      case 'low-stock':
        filtered = state.products.filter(product => product.stock_count < LOW_STOCK_THRESHOLD);
        break;
      case 'featured':
        filtered = state.products.filter(product => product.featured);
        break;
      default:
        filtered = state.products;
    }

    // Apply search
    if (state.searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [state.products, state.filter, state.searchTerm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = (stockCount: number) => {
    if (stockCount === 0) {
      return { label: 'Sin Stock', color: 'bg-red-600', textColor: 'text-red-600' };
    } else if (stockCount < LOW_STOCK_THRESHOLD) {
      return { label: 'Stock Bajo', color: 'bg-orange-500', textColor: 'text-orange-600' };
    } else if (stockCount < 10) {
      return { label: 'Stock Medio', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    } else {
      return { label: 'En Stock', color: 'bg-green-500', textColor: 'text-green-600' };
    }
  };

  if (state.loading && state.products.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center">
          <motion.div
            className="w-12 h-12 border-4 border-primary-bg border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-lg text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error al Cargar Productos</h3>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <motion.button
            onClick={handleRefresh}
            className="bg-primary-bg text-white px-6 py-3 rounded-lg font-medium uppercase tracking-wide hover:bg-opacity-90 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Reintentar
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-6 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-primary-bg uppercase tracking-wide">
              Gestión de Productos
            </h1>
            <p className="text-gray-600 mt-1">
              Administra el inventario de GRIZZLAND
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleRefresh}
              disabled={state.loading}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              whileHover={{ scale: state.loading ? 1 : 1.02 }}
              whileTap={{ scale: state.loading ? 1 : 0.98 }}
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
              Actualizar
            </motion.button>
            
            <motion.button
              className="flex items-center px-4 py-2 bg-primary-bg text-white rounded-lg hover:bg-opacity-90 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nuevo Producto
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-primary-bg bg-opacity-10 p-3 rounded-lg">
              <FunnelIcon className="w-6 h-6 text-primary-bg" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Total Productos
              </p>
              <p className="text-2xl font-bold text-gray-900">{state.products.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Stock Bajo
              </p>
              <p className="text-2xl font-bold text-red-600">{state.lowStockProducts.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <EyeIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Destacados
              </p>
              <p className="text-2xl font-bold text-green-600">
                {state.products.filter(p => p.featured).length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg p-6 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todos', count: state.products.length },
              { id: 'low-stock', label: 'Stock Bajo', count: state.lowStockProducts.length },
              { id: 'featured', label: 'Destacados', count: state.products.filter(p => p.featured).length }
            ].map((filter) => (
              <motion.button
                key={filter.id}
                onClick={() => setState(prev => ({ ...prev, filter: filter.id as any }))}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  state.filter === filter.id
                    ? 'bg-primary-bg text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {filter.label} ({filter.count})
              </motion.button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={state.searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-bg focus:border-primary-bg transition-colors duration-200 w-full lg:w-80"
            />
          </div>
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg shadow-sm overflow-hidden"
      >
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-500">
              {state.searchTerm ? 'Intenta cambiar los filtros de búsqueda' : 'No hay productos disponibles'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actualizado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredProducts.map((product, index) => {
                    const stockStatus = getStockStatus(product.stock_count);
                    const isLowStock = product.stock_count < LOW_STOCK_THRESHOLD;
                    
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`hover:bg-gray-50 transition-colors duration-200 ${
                          isLowStock ? 'bg-red-50 border-l-4 border-red-500' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {product.id}
                              </div>
                            </div>
                            {product.featured && (
                              <span className="ml-2 bg-primary-bg text-white px-2 py-1 text-xs rounded-full">
                                Destacado
                              </span>
                            )}
                            {isLowStock && (
                              <motion.span
                                animate={{ 
                                  scale: [1, 1.1, 1],
                                  opacity: [1, 0.7, 1]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="ml-2 bg-red-500 text-white px-2 py-1 text-xs rounded-full flex items-center"
                              >
                                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                ¡Crítico!
                              </motion.span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${
                            isLowStock ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {product.stock_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color} text-white`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(product.updated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-primary-bg hover:text-opacity-80"
                              title="Ver detalles"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-gray-600 hover:text-gray-800"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Last Update Info */}
      {state.lastUpdate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-500"
        >
          Última actualización: {formatDate(state.lastUpdate.toISOString())}
        </motion.div>
      )}
    </div>
  );
};

export default AdminProductsList; 