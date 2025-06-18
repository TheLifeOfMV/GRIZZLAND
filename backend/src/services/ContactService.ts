import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { ApplicationError } from '../middleware/errorHandler';

// Contact submission interfaces
export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'responded' | 'closed';
  admin_notes?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
  read_at?: string;
  responded_at?: string;
  admin_user_id?: string;
}

export interface ContactSubmissionRequest {
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ContactStats {
  total_submissions: number;
  new_submissions: number;
  read_submissions: number;
  responded_submissions: number;
  closed_submissions: number;
  submissions_24h: number;
  submissions_7d: number;
  avg_response_time_hours: number;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * ContactService - Handles contact form submissions, email notifications, and admin management
 * Implements MONOCODE principles: Observable, Explicit Error Handling, Dependency Transparency
 */
export class ContactService {
  private supabase: SupabaseClient;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second base delay

  constructor() {
    // Dependency Transparency - Clear Supabase dependency
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    
    // Observable Implementation - Service initialization
    console.log('CONTACT_SERVICE_INITIALIZED', {
      timestamp: new Date().toISOString(),
      supabaseUrl: config.supabaseUrl ? 'configured' : 'missing',
      service: 'ContactService'
    });
  }

  /**
   * Submit a new contact form
   * Observable Implementation: Structured logging
   * Explicit Error Handling: Circuit breaker with retry
   */
  async submitContactForm(submissionData: ContactSubmissionRequest): Promise<ContactSubmission> {
    const startTime = Date.now();
    
    // Observable Implementation - Log submission attempt
    console.log('CONTACT_SUBMISSION_START', {
      timestamp: new Date().toISOString(),
      email: submissionData.email,
      name: submissionData.name,
      hasSubject: !!submissionData.subject,
      messageLength: submissionData.message.length,
      ipAddress: submissionData.ip_address
    });

    try {
      // Validate input data
      this.validateSubmissionData(submissionData);

      // Create submission with retry logic
      const submission = await this.withRetry(async () => {
        const { data, error } = await this.supabase
          .from('contact_submissions')
          .insert([{
            name: submissionData.name.trim(),
            email: submissionData.email.toLowerCase().trim(),
            phone: submissionData.phone.trim(),
            subject: submissionData.subject?.trim() || null,
            message: submissionData.message.trim(),
            ip_address: submissionData.ip_address,
            user_agent: submissionData.user_agent,
            status: 'new'
          }])
          .select()
          .single();

        if (error) {
          throw new ApplicationError(
            `Failed to create contact submission: ${error.message}`,
            500,
            'DATABASE_ERROR'
          );
        }

        return data as ContactSubmission;
      }, 'CONTACT_SUBMISSION_CREATE');

      // Send notification emails (non-blocking)
      this.sendNotificationEmails(submission).catch(error => {
        console.error('EMAIL_NOTIFICATION_ERROR', {
          timestamp: new Date().toISOString(),
          submissionId: submission.id,
          error: error.message
        });
      });

      // Observable Implementation - Log success
      console.log('CONTACT_SUBMISSION_SUCCESS', {
        timestamp: new Date().toISOString(),
        submissionId: submission.id,
        email: submission.email,
        duration: Date.now() - startTime
      });

      return submission;

    } catch (error) {
      // Observable Implementation - Log error
      console.error('CONTACT_SUBMISSION_ERROR', {
        timestamp: new Date().toISOString(),
        email: submissionData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Get all contact submissions (admin only)
   */
  async getContactSubmissions(
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<ContactSubmission[]> {
    try {
      console.log('CONTACT_SUBMISSIONS_FETCH_START', {
        timestamp: new Date().toISOString(),
        limit,
        offset,
        status
      });

      let query = this.supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new ApplicationError(
          `Failed to fetch contact submissions: ${error.message}`,
          500,
          'DATABASE_ERROR'
        );
      }

      console.log('CONTACT_SUBMISSIONS_FETCH_SUCCESS', {
        timestamp: new Date().toISOString(),
        count: data?.length || 0,
        status
      });

      return data || [];

    } catch (error) {
      console.error('CONTACT_SUBMISSIONS_FETCH_ERROR', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update contact submission status
   */
  async updateContactSubmissionStatus(
    id: string,
    status: ContactSubmission['status'],
    adminUserId?: string,
    adminNotes?: string
  ): Promise<ContactSubmission> {
    try {
      console.log('CONTACT_SUBMISSION_UPDATE_START', {
        timestamp: new Date().toISOString(),
        submissionId: id,
        newStatus: status,
        adminUserId
      });

      const updateData: any = {
        status,
        admin_user_id: adminUserId,
        admin_notes: adminNotes
      };

      // Set timestamp fields based on status
      if (status === 'read' && !updateData.read_at) {
        updateData.read_at = new Date().toISOString();
      } else if (status === 'responded' && !updateData.responded_at) {
        updateData.responded_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('contact_submissions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new ApplicationError(
          `Failed to update contact submission: ${error.message}`,
          500,
          'DATABASE_ERROR'
        );
      }

      console.log('CONTACT_SUBMISSION_UPDATE_SUCCESS', {
        timestamp: new Date().toISOString(),
        submissionId: id,
        newStatus: status
      });

      return data as ContactSubmission;

    } catch (error) {
      console.error('CONTACT_SUBMISSION_UPDATE_ERROR', {
        timestamp: new Date().toISOString(),
        submissionId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get contact submission statistics
   */
  async getContactStats(): Promise<ContactStats> {
    try {
      console.log('CONTACT_STATS_FETCH_START', {
        timestamp: new Date().toISOString()
      });

      const { data, error } = await this.supabase
        .from('contact_submissions_stats')
        .select('*')
        .single();

      if (error) {
        throw new ApplicationError(
          `Failed to fetch contact statistics: ${error.message}`,
          500,
          'DATABASE_ERROR'
        );
      }

      console.log('CONTACT_STATS_FETCH_SUCCESS', {
        timestamp: new Date().toISOString(),
        totalSubmissions: data.total_submissions
      });

      return data as ContactStats;

    } catch (error) {
      console.error('CONTACT_STATS_FETCH_ERROR', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Send notification emails (admin notification + user confirmation)
   * Graceful Fallbacks: Email failure doesn't break contact submission
   */
  private async sendNotificationEmails(submission: ContactSubmission): Promise<void> {
    try {
      // Admin notification email
      const adminEmail = this.createAdminNotificationEmail(submission);
      
      // User confirmation email
      const userEmail = this.createUserConfirmationEmail(submission);

      // TODO: Implement actual email sending (Supabase Edge Functions, SendGrid, etc.)
      // For now, we'll log the email templates
      console.log('EMAIL_ADMIN_NOTIFICATION', {
        timestamp: new Date().toISOString(),
        submissionId: submission.id,
        adminEmail: adminEmail.to,
        subject: adminEmail.subject
      });

      console.log('EMAIL_USER_CONFIRMATION', {
        timestamp: new Date().toISOString(),
        submissionId: submission.id,
        userEmail: userEmail.to,
        subject: userEmail.subject
      });

    } catch (error) {
      // Graceful Fallbacks - Email failure doesn't break the flow
      console.warn('EMAIL_NOTIFICATION_FALLBACK', {
        timestamp: new Date().toISOString(),
        submissionId: submission.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create admin notification email template
   */
  private createAdminNotificationEmail(submission: ContactSubmission): EmailTemplate {
    const subject = `New Contact Form Submission - ${submission.subject || 'General Inquiry'}`;
    
    const html = `
      <h2>New Contact Form Submission</h2>
      <h3>Submission Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${submission.name}</li>
        <li><strong>Email:</strong> ${submission.email}</li>
        <li><strong>Phone:</strong> ${submission.phone}</li>
        <li><strong>Subject:</strong> ${submission.subject || 'No subject'}</li>
        <li><strong>Submitted:</strong> ${submission.created_at}</li>
      </ul>
      <h3>Message:</h3>
      <p>${submission.message.replace(/\n/g, '<br>')}</p>
      <p><a href="${config.frontendUrl}/admin/contact/${submission.id}">View in Admin Dashboard</a></p>
    `;

    const text = `
      New Contact Form Submission
      
      Name: ${submission.name}
      Email: ${submission.email}
      Phone: ${submission.phone}
      Subject: ${submission.subject || 'No subject'}
      Submitted: ${submission.created_at}
      
      Message:
      ${submission.message}
    `;

    return {
      to: 'admin@grizzland.com',
      subject,
      html,
      text
    };
  }

  /**
   * Create user confirmation email template
   */
  private createUserConfirmationEmail(submission: ContactSubmission): EmailTemplate {
    const subject = 'Thank you for contacting GRIZZLAND - We\'ll be in touch soon!';
    
    const html = `
      <h2>Thank You for Contacting GRIZZLAND</h2>
      <p>Hi ${submission.name},</p>
      <p>We've received your message and our team will get back to you within 24 hours.</p>
      <h3>Your Message:</h3>
      <p><strong>Subject:</strong> ${submission.subject || 'General Inquiry'}</p>
      <p>${submission.message.replace(/\n/g, '<br>')}</p>
      <p>If you have any urgent questions, feel free to call us at +57 (1) 234-5678.</p>
      <p>Best regards,<br>GRIZZLAND Team</p>
    `;

    const text = `
      Thank You for Contacting GRIZZLAND
      
      Hi ${submission.name},
      
      We've received your message and our team will get back to you within 24 hours.
      
      Your Message:
      Subject: ${submission.subject || 'General Inquiry'}
      ${submission.message}
      
      If you have any urgent questions, feel free to call us at +57 (1) 234-5678.
      
      Best regards,
      GRIZZLAND Team
    `;

    return {
      to: submission.email,
      subject,
      html,
      text
    };
  }

  /**
   * Validate submission data
   * Fail Fast, Fail Loud principle
   */
  private validateSubmissionData(data: ContactSubmissionRequest): void {
    if (!data.name || data.name.trim().length < 2) {
      throw new ApplicationError('Name must be at least 2 characters', 400, 'VALIDATION_ERROR');
    }

    if (!data.email || !data.email.includes('@')) {
      throw new ApplicationError('Valid email address is required', 400, 'VALIDATION_ERROR');
    }

    if (!data.phone || data.phone.trim().length < 10) {
      throw new ApplicationError('Valid phone number is required', 400, 'VALIDATION_ERROR');
    }

    if (!data.message || data.message.trim().length < 10) {
      throw new ApplicationError('Message must be at least 10 characters', 400, 'VALIDATION_ERROR');
    }

    if (data.message.length > 500) {
      throw new ApplicationError('Message cannot exceed 500 characters', 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * Circuit breaker implementation with retry logic
   * Explicit Error Handling principle
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: Error;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`${operationName}_RETRY_SUCCESS`, {
            timestamp: new Date().toISOString(),
            attempt,
            duration: Date.now() - startTime
          });
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.warn(`${operationName}_RETRY_ATTEMPT`, {
          timestamp: new Date().toISOString(),
          attempt,
          maxRetries,
          error: lastError.message
        });
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`${operationName}_RETRY_FAILED`, {
      timestamp: new Date().toISOString(),
      attempts: maxRetries,
      duration: Date.now() - startTime,
      finalError: lastError!.message
    });
    
    throw new ApplicationError(
      `${operationName} failed after ${maxRetries} attempts: ${lastError!.message}`,
      500,
      'SERVICE_ERROR'
    );
  }
} 