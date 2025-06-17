'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ProductCategoriesSection() {
  const [activeCategory, setActiveCategory] = useState('tshirts');
  
  const categories = {
    tshirts: {
      title: 'T-SHIRTS',
      placeholder: 'T-SHIRTS IMAGE',
      link: '/products?category=T-SHIRTS'
    },
    hoodies: {
      title: 'HOODIES', 
      placeholder: 'HOODIES IMAGE',
      link: '/products?category=HOODIES'
    },
    longsleeves: {
      title: 'LONG SLEEVES',
      placeholder: 'LONG SLEEVES IMAGE', 
      link: '/products?category=LONG+SLEEVES'
    }
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden bg-gray-200 aspect-[16/9] lg:aspect-[21/9] rounded-lg">
          {/* Background Image Area */}
          <div className="absolute inset-0 bg-gray-300 flex items-center justify-center transition-all duration-700">
            <span className="text-gray-500 font-medium text-lg">
              {categories[activeCategory].placeholder}
            </span>
          </div>
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-bg via-transparent to-primary-bg opacity-60 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-bg via-transparent to-transparent opacity-40 z-10"></div>
          
          {/* Navigation Titles - Responsive Layout */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            {/* Mobile Layout - Vertical Stack */}
            <div className="flex flex-col gap-8 lg:hidden">
              {Object.entries(categories).map(([key, category]) => (
                <Link
                  key={key}
                  href={category.link}
                  className={`group relative cursor-pointer transition-all duration-500 ${
                    activeCategory === key ? 'scale-110' : 'hover:scale-105'
                  }`}
                  onMouseEnter={() => setActiveCategory(key)}
                >
                  <h3 className={`text-3xl md:text-4xl font-bold uppercase tracking-widest text-center transition-all duration-500 ${
                    activeCategory === key 
                      ? 'text-white drop-shadow-2xl' 
                      : 'text-white opacity-70 hover:opacity-100'
                  }`}>
                    {category.title}
                  </h3>
                  
                  {/* Active Indicator */}
                  <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-1 bg-white transition-all duration-500 ${
                    activeCategory === key ? 'w-full opacity-100' : 'w-0 opacity-0'
                  }`}></div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300 -m-4 rounded-lg"></div>
                </Link>
              ))}
            </div>

            {/* Desktop Layout - Triangle Formation */}
            <div className="relative w-full max-w-4xl h-80 lg:h-96 hidden lg:block">
              {/* T-SHIRTS - Top Center */}
              <Link
                href={categories.tshirts.link}
                className={`absolute top-0 left-1/2 transform -translate-x-1/2 group cursor-pointer transition-all duration-500 ${
                  activeCategory === 'tshirts' ? 'scale-110' : 'hover:scale-105'
                }`}
                onMouseEnter={() => setActiveCategory('tshirts')}
              >
                <h3 className={`text-4xl lg:text-5xl xl:text-6xl font-bold uppercase tracking-widest text-center transition-all duration-500 ${
                  activeCategory === 'tshirts' 
                    ? 'text-white drop-shadow-2xl' 
                    : 'text-white opacity-70 hover:opacity-100'
                }`}>
                  {categories.tshirts.title}
                </h3>
                {/* Active Indicator */}
                <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-1 bg-white transition-all duration-500 ${
                  activeCategory === 'tshirts' ? 'w-full opacity-100' : 'w-0 opacity-0'
                }`}></div>
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300 -m-4 rounded-lg"></div>
              </Link>

              {/* HOODIES - Bottom Left */}
              <Link
                href={categories.hoodies.link}
                className={`absolute bottom-0 left-1/4 transform -translate-x-1/2 group cursor-pointer transition-all duration-500 ${
                  activeCategory === 'hoodies' ? 'scale-110' : 'hover:scale-105'
                }`}
                onMouseEnter={() => setActiveCategory('hoodies')}
              >
                <h3 className={`text-4xl lg:text-5xl xl:text-6xl font-bold uppercase tracking-widest text-center transition-all duration-500 ${
                  activeCategory === 'hoodies' 
                    ? 'text-white drop-shadow-2xl' 
                    : 'text-white opacity-70 hover:opacity-100'
                }`}>
                  {categories.hoodies.title}
                </h3>
                {/* Active Indicator */}
                <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-1 bg-white transition-all duration-500 ${
                  activeCategory === 'hoodies' ? 'w-full opacity-100' : 'w-0 opacity-0'
                }`}></div>
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300 -m-4 rounded-lg"></div>
              </Link>

              {/* LONG SLEEVES - Bottom Right */}
              <Link
                href={categories.longsleeves.link}
                className={`absolute bottom-0 right-1/4 transform translate-x-1/2 group cursor-pointer transition-all duration-500 ${
                  activeCategory === 'longsleeves' ? 'scale-110' : 'hover:scale-105'
                }`}
                onMouseEnter={() => setActiveCategory('longsleeves')}
              >
                <h3 className={`text-3xl lg:text-4xl xl:text-5xl font-bold uppercase tracking-widest text-center transition-all duration-500 ${
                  activeCategory === 'longsleeves' 
                    ? 'text-white drop-shadow-2xl' 
                    : 'text-white opacity-70 hover:opacity-100'
                }`}>
                  {categories.longsleeves.title}
                </h3>
                {/* Active Indicator */}
                <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-1 bg-white transition-all duration-500 ${
                  activeCategory === 'longsleeves' ? 'w-full opacity-100' : 'w-0 opacity-0'
                }`}></div>
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300 -m-4 rounded-lg"></div>
              </Link>
            </div>
          </div>
          
          {/* Click Instruction */}
          <div className="absolute bottom-6 right-6 z-20">
            <p className="text-white opacity-60 text-sm uppercase tracking-wide">
              Click to explore
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 