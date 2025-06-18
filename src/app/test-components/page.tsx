'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SilhouetteSelector from '@/components/features/SilhouetteSelector';
import DiscountModal from '@/components/features/DiscountModal';
import PromoInput from '@/components/features/PromoInput';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Test Components Page
 * 
 * Purpose: Showcase all implemented Phase 1-4 components
 * Components: SilhouetteSelector, DiscountModal, PromoInput, AdminProductsList
 */

const TestComponentsPage: React.FC = () => {
  const [selectedSilhouette, setSelectedSilhouette] = useState<'male' | 'female'>('male');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);

  const mockProduct = {
    id: 'test-product-1',
    name: 'Essential Cotton T-Shirt',
    images: {
      male: ['/images/tshirt-male-1.jpg', '/images/tshirt-male-2.jpg'],
      female: ['/images/tshirt-female-1.jpg', '/images/tshirt-female-2.jpg']
    },
    price: 29990,
    description: 'Premium cotton t-shirt for testing components'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-primary-bg hover:text-opacity-80 transition-colors duration-200"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Volver al Inicio
              </Link>
              <h1 className="text-2xl font-bold text-primary-bg uppercase tracking-wide">
                Test Components
              </h1>
            </div>
            
            <Link
              href="/admin/dashboard"
              className="bg-primary-bg text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          
          {/* Page Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              GRIZZLAND Components Showcase
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Demonstración de todos los componentes implementados en las Fases 1-4 del plan de desarrollo, 
              siguiendo los principios MONOCODE y las mejores prácticas de diseño.
            </p>
          </motion.div>

          {/* Phase 1: Enhanced SilhouetteSelector */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-8 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-primary-bg uppercase tracking-wide mb-2">
                Fase 1: SilhouetteSelector Mejorado
              </h3>
              <p className="text-gray-600">
                Selector de silueta con animaciones fluidas, transiciones mejoradas y soporte para movimiento reducido.
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <SilhouetteSelector
                productName={mockProduct.name}
                maleImageUrl="/images/placeholder-male.jpg"
                femaleImageUrl="/images/placeholder-female.jpg"
                selectedSilhouette={selectedSilhouette}
                onSilhouetteChange={setSelectedSilhouette}
              />
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Silueta seleccionada: <span className="font-medium text-primary-bg">{selectedSilhouette}</span></p>
              <p className="mt-1">
                ✨ Incluye animaciones con framer-motion, transiciones suaves y indicadores visuales
              </p>
            </div>
          </motion.section>

          {/* Phase 2: DiscountModal */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-8 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-primary-bg uppercase tracking-wide mb-2">
                Fase 2: Modal de Descuento de Primera Visita
              </h3>
              <p className="text-gray-600">
                Modal automático para nuevos visitantes con seguimiento localStorage y diseño responsive.
              </p>
            </div>
            
            <div className="text-center">
              <motion.button
                onClick={() => setShowDiscountModal(true)}
                className="bg-primary-bg text-white px-6 py-3 rounded-lg font-medium uppercase tracking-wide hover:bg-opacity-90 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Mostrar Modal de Descuento
              </motion.button>
              
              <p className="mt-4 text-sm text-gray-500">
                ✨ Modal inteligente que solo aparece en la primera visita con animaciones elegantes
              </p>
            </div>

            {showDiscountModal && (
              <DiscountModal
                isOpen={showDiscountModal}
                onClose={() => setShowDiscountModal(false)}
                discount="15%"
                promoCode="WELCOME15"
                delayMs={0}
              />
            )}
          </motion.section>

          {/* Phase 4: PromoInput */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-8 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-primary-bg uppercase tracking-wide mb-2">
                Fase 4: Input de Código Promocional
              </h3>
              <p className="text-gray-600">
                Validación en tiempo real de códigos promocionales con cálculo de descuentos y manejo de errores.
              </p>
            </div>
            
            <div className="max-w-lg mx-auto">
              <PromoInput
                subtotal={75000}
                onPromoApplied={(promo) => setAppliedPromo(promo)}
                onPromoRemoved={() => setAppliedPromo(null)}
                appliedPromo={appliedPromo}
              />
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Subtotal de prueba: <span className="font-medium">$75,000 COP</span></p>
              <p className="mt-1">
                ✨ Validación debounced, feedback visual en tiempo real y cálculos automáticos de descuento
              </p>
            </div>
          </motion.section>

          {/* Phase 3: Admin Dashboard Link */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg p-8 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-primary-bg uppercase tracking-wide mb-2">
                Fase 3: Dashboard Administrativo
              </h3>
              <p className="text-gray-600">
                Interface administrativa completa con gestión de productos y alertas de stock bajo.
              </p>
            </div>
            
            <div className="text-center">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center bg-primary-bg text-white px-6 py-3 rounded-lg font-medium uppercase tracking-wide hover:bg-opacity-90 transition-all duration-200"
              >
                Abrir Dashboard Admin
              </Link>
              
              <p className="mt-4 text-sm text-gray-500">
                ✨ Tabla de productos con highlighting de stock bajo, filtros en tiempo real y actualizaciones automáticas
              </p>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Productos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">127</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-red-600">12</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Destacados</p>
                  <p className="text-2xl font-bold text-green-600">24</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Implementation Details */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-primary-bg text-white rounded-lg p-8"
          >
            <h3 className="text-2xl font-bold uppercase tracking-wide mb-6 text-center">
              Detalles de Implementación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4 uppercase tracking-wide">
                  Tecnologías Utilizadas
                </h4>
                <ul className="space-y-2 text-sm opacity-90">
                  <li>• Next.js 14 con App Router</li>
                  <li>• TypeScript para type safety</li>
                  <li>• Framer Motion para animaciones</li>
                  <li>• Tailwind CSS para styling</li>
                  <li>• Heroicons para iconografía</li>
                  <li>• LocalStorage para persistencia</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4 uppercase tracking-wide">
                  Principios MONOCODE
                </h4>
                <ul className="space-y-2 text-sm opacity-90">
                  <li>• Observabilidad con structured logging</li>
                  <li>• Error boundaries y fallback states</li>
                  <li>• Debouncing y performance optimization</li>
                  <li>• Responsive design mobile-first</li>
                  <li>• Accessibility con ARIA labels</li>
                  <li>• Prevention-first architecture</li>
                </ul>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default TestComponentsPage; 