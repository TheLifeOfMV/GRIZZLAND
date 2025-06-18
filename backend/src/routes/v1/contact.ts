import { Router, Request, Response } from 'express';
import { ContactService, ContactSubmissionRequest } from '../../services/ContactService';
import { AuthenticatedRequest, ApiResponse } from '../../types';
import { asyncHandler, ApplicationError } from '../../middleware/errorHandler';

const router = Router();
const contactService = new ContactService();

/**
 * GRIZZLAND Contact API Routes
 * Following MONOCODE principles: Observable, Explicit Error Handling, Dependency Transparency
 */

// ========================================
// PUBLIC CONTACT FORM SUBMISSION
// ========================================

/**
 * POST /api/v1/contact
 * Submit contact form (Public endpoint - no authentication required)
 * Observable Implementation: Structured logging
 * Explicit Error Handling: Input validation and error responses
 */
router.post('/', asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
  const startTime = Date.now();
  
  // Observable Implementation - Log request
  console.log('CONTACT_API_SUBMIT_START', {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    hasBody: !!req.body
  });

  try {
    // Extract client information for tracking
    const clientInfo = {
      ip_address: req.ip,
      user_agent: req.get('User-Agent') || 'Unknown'
    };

    // Validate required fields
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !phone || !message) {
      throw new ApplicationError(
        'Missing required fields: name, email, phone, and message are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    // Prepare submission data
    const submissionData: ContactSubmissionRequest = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject?.trim(),
      message: message.trim(),
      ...clientInfo
    };

    // Submit contact form
    const submission = await contactService.submitContactForm(submissionData);

    // Observable Implementation - Log success
    console.log('CONTACT_API_SUBMIT_SUCCESS', {
      timestamp: new Date().toISOString(),
      submissionId: submission.id,
      email: submission.email,
      duration: Date.now() - startTime
    });

    res.status(201).json({
      success: true,
      data: {
        id: submission.id,
        name: submission.name,
        email: submission.email,
        status: submission.status,
        created_at: submission.created_at
      },
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
    });

  } catch (error) {
    // Observable Implementation - Log error
    console.error('CONTACT_API_SUBMIT_ERROR', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      ip: req.ip
    });

    // Explicit Error Handling - Rethrow for middleware
    throw error;
  }
}));

// ========================================
// ADMIN CONTACT MANAGEMENT ENDPOINTS
// ========================================

/**
 * GET /api/v1/contact/admin/submissions
 * Get all contact submissions (Admin only)
 * Requires admin authentication middleware
 */
router.get('/admin/submissions', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  console.log('CONTACT_API_ADMIN_LIST_START', {
    timestamp: new Date().toISOString(),
    adminUserId: req.user?.id
  });

  try {
    // Parse query parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const status = req.query.status as string;

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      throw new ApplicationError('Limit must be between 1 and 100', 400, 'VALIDATION_ERROR');
    }

    if (offset < 0) {
      throw new ApplicationError('Offset must be non-negative', 400, 'VALIDATION_ERROR');
    }

    // Get contact submissions
    const submissions = await contactService.getContactSubmissions(limit, offset, status);

    console.log('CONTACT_API_ADMIN_LIST_SUCCESS', {
      timestamp: new Date().toISOString(),
      count: submissions.length,
      status
    });

    res.json({
      success: true,
      data: submissions,
      message: `Found ${submissions.length} contact submissions`
    });

  } catch (error) {
    console.error('CONTACT_API_ADMIN_LIST_ERROR', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}));

/**
 * GET /api/v1/contact/admin/stats
 * Get contact submission statistics (Admin only)
 */
router.get('/admin/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  console.log('CONTACT_API_ADMIN_STATS_START', {
    timestamp: new Date().toISOString(),
    adminUserId: req.user?.id
  });

  try {
    const stats = await contactService.getContactStats();

    console.log('CONTACT_API_ADMIN_STATS_SUCCESS', {
      timestamp: new Date().toISOString(),
      totalSubmissions: stats.total_submissions
    });

    res.json({
      success: true,
      data: stats,
      message: 'Contact statistics retrieved successfully'
    });

  } catch (error) {
    console.error('CONTACT_API_ADMIN_STATS_ERROR', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}));

/**
 * PUT /api/v1/contact/admin/submissions/:id/status
 * Update contact submission status (Admin only)
 */
router.put('/admin/submissions/:id/status', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  console.log('CONTACT_API_ADMIN_UPDATE_START', {
    timestamp: new Date().toISOString(),
    submissionId: id,
    newStatus: status,
    adminUserId: req.user?.id
  });

  try {
    // Validate submission ID
    if (!id) {
      throw new ApplicationError('Submission ID is required', 400, 'VALIDATION_ERROR');
    }

    // Validate status
    const validStatuses = ['new', 'read', 'responded', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      throw new ApplicationError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    // Update submission status
    const updatedSubmission = await contactService.updateContactSubmissionStatus(
      id,
      status,
      req.user?.id,
      admin_notes
    );

    console.log('CONTACT_API_ADMIN_UPDATE_SUCCESS', {
      timestamp: new Date().toISOString(),
      submissionId: id,
      newStatus: status
    });

    res.json({
      success: true,
      data: updatedSubmission,
      message: `Contact submission status updated to ${status}`
    });

  } catch (error) {
    console.error('CONTACT_API_ADMIN_UPDATE_ERROR', {
      timestamp: new Date().toISOString(),
      submissionId: id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}));

/**
 * GET /api/v1/contact/admin/submissions/:id
 * Get specific contact submission details (Admin only)
 */
router.get('/admin/submissions/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
  const { id } = req.params;

  console.log('CONTACT_API_ADMIN_GET_START', {
    timestamp: new Date().toISOString(),
    submissionId: id,
    adminUserId: req.user?.id
  });

  try {
    if (!id) {
      throw new ApplicationError('Submission ID is required', 400, 'VALIDATION_ERROR');
    }

    // Get single submission
    const submissions = await contactService.getContactSubmissions(1, 0);
    const submission = submissions.find(s => s.id === id);

    if (!submission) {
      throw new ApplicationError('Contact submission not found', 404, 'NOT_FOUND');
    }

    // Auto-mark as read if it was new
    if (submission.status === 'new') {
      await contactService.updateContactSubmissionStatus(id, 'read', req.user?.id);
      submission.status = 'read';
    }

    console.log('CONTACT_API_ADMIN_GET_SUCCESS', {
      timestamp: new Date().toISOString(),
      submissionId: id
    });

    res.json({
      success: true,
      data: submission,
      message: 'Contact submission retrieved successfully'
    });

  } catch (error) {
    console.error('CONTACT_API_ADMIN_GET_ERROR', {
      timestamp: new Date().toISOString(),
      submissionId: id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}));

// ========================================
// HEALTH CHECK & DOCUMENTATION
// ========================================

/**
 * GET /api/v1/contact/health
 * Contact service health check
 */
router.get('/health', asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    // Quick health check - get stats to verify database connectivity
    const stats = await contactService.getContactStats();
    
    res.json({
      success: true,
      data: {
        service: 'ContactService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database_connected: true,
        total_submissions: stats.total_submissions
      },
      message: 'Contact service is operational'
    });

  } catch (error) {
    console.error('CONTACT_API_HEALTH_ERROR', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(503).json({
      success: false,
      data: {
        service: 'ContactService',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database_connected: false
      },
      message: 'Contact service is not operational'
    });
  }
}));

/**
 * GET /api/v1/contact/docs
 * Contact API documentation
 */
router.get('/docs', (req: Request, res: Response<ApiResponse<any>>) => {
  res.json({
    success: true,
    data: {
      service: 'GRIZZLAND Contact API',
      version: '1.0.0',
      endpoints: {
        public: {
          'POST /contact': 'Submit contact form (no authentication required)',
          'GET /contact/health': 'Service health check',
          'GET /contact/docs': 'API documentation'
        },
        admin: {
          'GET /contact/admin/submissions': 'Get all contact submissions (admin auth required)',
          'GET /contact/admin/submissions/:id': 'Get specific contact submission (admin auth required)',
          'PUT /contact/admin/submissions/:id/status': 'Update submission status (admin auth required)',
          'GET /contact/admin/stats': 'Get contact statistics (admin auth required)'
        }
      },
      submission_schema: {
        name: 'string (required, 2-50 chars)',
        email: 'string (required, valid email format)',
        phone: 'string (required, Colombian format +57XXXXXXXXXX)',
        subject: 'string (optional, 5-100 chars)',
        message: 'string (required, 10-500 chars)'
      },
      status_values: ['new', 'read', 'responded', 'closed'],
      features: [
        'Public contact form submission',
        'Admin dashboard integration',
        'Email notifications (admin + user confirmation)',
        'Contact status management',
        'Real-time statistics',
        'IP tracking and user agent logging',
        'Circuit breaker for reliability',
        'Structured logging for observability'
      ]
    },
    message: 'GRIZZLAND Contact API Documentation'
  });
});

export default router; 