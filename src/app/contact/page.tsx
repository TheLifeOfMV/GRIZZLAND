'use client';

import React, { useEffect } from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import ContactForm from '@/components/features/ContactForm';
import { ContactFormData } from '@/lib/validations/contact';

// Contact page component with GRIZZLAND styling
const ContactPage = () => {
  // Observable Implementation - Page load tracking
  useEffect(() => {
    console.log('CONTACT_PAGE_LOADED', {
      timestamp: new Date().toISOString(),
      page: '/contact',
      userAgent: navigator.userAgent,
    });
  }, []);

  // Handle successful form submission
  const handleFormSuccess = (data: ContactFormData) => {
    console.log('CONTACT_FORM_SUCCESS_PAGE', {
      timestamp: new Date().toISOString(),
      submittedBy: data.name,
      email: data.email,
    });
    
    // Additional success handling if needed
    // Could trigger analytics, show additional confirmation, etc.
  };

  // Handle form submission errors
  const handleFormError = (error: string) => {
    console.error('CONTACT_FORM_ERROR_PAGE', {
      timestamp: new Date().toISOString(),
      error,
    });
    
    // Additional error handling if needed
    // Could trigger error reporting, show fallback contact info, etc.
  };

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* GRIZZLAND Logo */}
            <div className="flex items-center justify-center space-x-3 mb-8">
              <Image
                src="/images/LOGO.png"
                alt="GRIZZLAND Logo"
                width={60}
                height={60}
                className="object-contain"
                priority
              />
              <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-widest">
                GRIZZLAND
              </h1>
            </div>
            
            {/* Page Title */}
            <h2 className="text-2xl md:text-3xl font-semibold text-white uppercase tracking-wide mb-4">
              Get in Touch
            </h2>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white opacity-75 max-w-3xl mx-auto leading-relaxed">
              We're here to help with any questions about our outdoor signature collection. 
              Whether you need assistance with an order, product information, or just want to share feedback, 
              our team is ready to assist you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm 
            onSuccess={handleFormSuccess}
            onError={handleFormError}
            className="mb-16"
          />
        </div>
      </section>

      {/* Contact Information Grid */}
      <section className="py-16 border-t border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-4">
              Contact Information
            </h3>
            <p className="text-white opacity-75 text-lg">
              Multiple ways to reach our customer support team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Email Support */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8 text-center border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.94a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white uppercase tracking-wide mb-3">
                Email Support
              </h4>
              <p className="text-white opacity-75 mb-4">
                Get detailed help with your inquiries
              </p>
              <p className="text-white font-medium">
                support@grizzland.com
              </p>
              <p className="text-white opacity-60 text-sm mt-2">
                Response within 24 hours
              </p>
            </div>

            {/* Phone Support */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8 text-center border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white uppercase tracking-wide mb-3">
                Phone Support
              </h4>
              <p className="text-white opacity-75 mb-4">
                Speak directly with our team
              </p>
              <p className="text-white font-medium">
                +57 (1) 234-5678
              </p>
              <p className="text-white opacity-60 text-sm mt-2">
                Mon-Fri 9:00 AM - 6:00 PM (COT)
              </p>
            </div>

            {/* Store Location */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8 text-center border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 md:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white uppercase tracking-wide mb-3">
                Headquarters
              </h4>
              <p className="text-white opacity-75 mb-4">
                Visit our flagship location
              </p>
              <p className="text-white font-medium">
                Bogotá, Colombia
              </p>
              <p className="text-white opacity-60 text-sm mt-2">
                Zona Rosa District
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 border-t border-white border-opacity-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-4">
              Frequently Asked Questions
            </h3>
            <p className="text-white opacity-75 text-lg">
              Quick answers to common inquiries
            </p>
          </div>

          <div className="space-y-6">
            {/* FAQ Item 1 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
              <h4 className="text-lg font-semibold text-white uppercase tracking-wide mb-3">
                How long does shipping take?
              </h4>
              <p className="text-white opacity-75 leading-relaxed">
                We offer free standard shipping on orders over $75. Standard shipping typically takes 3-5 business days within Colombia. 
                Express shipping is available for next-day delivery in major cities.
              </p>
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
              <h4 className="text-lg font-semibold text-white uppercase tracking-wide mb-3">
                What is your return policy?
              </h4>
              <p className="text-white opacity-75 leading-relaxed">
                We accept returns within 30 days of purchase for unworn items with original tags. 
                Returns are free for defective items, and we offer exchanges for different sizes or colors.
              </p>
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
              <h4 className="text-lg font-semibold text-white uppercase tracking-wide mb-3">
                How do I track my order?
              </h4>
              <p className="text-white opacity-75 leading-relaxed">
                Once your order ships, you'll receive a tracking number via email. 
                You can also track your order status by logging into your account or contacting our support team.
              </p>
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
              <h4 className="text-lg font-semibold text-white uppercase tracking-wide mb-3">
                Do you offer international shipping?
              </h4>
              <p className="text-white opacity-75 leading-relaxed">
                Currently, we ship within Colombia only. We're working on expanding international shipping options. 
                Sign up for our newsletter to be notified when international shipping becomes available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 border-t border-white border-opacity-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-4">
            Still Have Questions?
          </h3>
          <p className="text-white opacity-75 text-lg mb-8">
            Our customer support team is here to help with any additional inquiries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@grizzland.com"
              className="button button-primary button-large"
            >
              Email Us Directly
            </a>
            <a 
              href="/products"
              className="button button-secondary button-large"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage; 