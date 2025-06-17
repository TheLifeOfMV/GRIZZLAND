import { Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { AuthenticatedRequest, ApiResponse } from '../types';

// Create Supabase client for server-side authentication
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

/**
 * Middleware to authenticate requests using Supabase JWT tokens
 */
export const supabaseAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Authentication error:', error?.message);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'customer',
      aud: user.aud,
      iat: 0, // Will be set from JWT
      exp: 0  // Will be set from JWT
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service error'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const adminAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): Promise<void> => {
  // First run the standard auth middleware
  await supabaseAuthMiddleware(req, res, () => {
    // Check if user has admin role
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }
    
    next();
  });
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<any>>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user context
      next();
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      req.user = {
        id: user.id,
        email: user.email,
        role: profile?.role || 'customer',
        aud: user.aud,
        iat: 0,
        exp: 0
      };
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue without authentication on error
    next();
  }
}; 