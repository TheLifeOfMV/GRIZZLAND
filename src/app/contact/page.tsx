'use client';

import React, { useEffect } from 'react';
import { Metadata } from 'next';
import ContactForm from '@/components/features/ContactForm';
import { ContactFormData } from '@/lib/validations/contact';

// Simplified Contact page component with GRIZZLAND styling - Form only
const ContactPage = () => {
  // Observable Implementation - Page load tracking
  useEffect(() => {
    console.log('CONTACT_PAGE_LOADED', {
      timestamp: new Date().toISOString(),
      page: '/contact',
      userAgent: navigator.userAgent,
      layout: 'simplified_form_only',
    });
  }, []);

  // Handle successful form submission
  const handleFormSuccess = (data: ContactFormData) => {
    console.log('CONTACT_FORM_SUCCESS_PAGE', {
      timestamp: new Date().toISOString(),
      submittedBy: data.name,
      email: data.email,
      layout: 'simplified',
    });
    
    // Additional success handling if needed
    // Could trigger analytics, show additional confirmation, etc.
  };

  // Handle form submission errors
  const handleFormError = (error: string) => {
    console.error('CONTACT_FORM_ERROR_PAGE', {
      timestamp: new Date().toISOString(),
      error,
      layout: 'simplified',
    });
    
    // Additional error handling if needed
    // Could trigger error reporting, show fallback contact info, etc.
  };

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Contact Form Section - Centered and prominently displayed */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm 
            onSuccess={handleFormSuccess}
            onError={handleFormError}
            className="w-full"
          />
        </div>
      </section>
    </div>
  );
};

export default ContactPage; 