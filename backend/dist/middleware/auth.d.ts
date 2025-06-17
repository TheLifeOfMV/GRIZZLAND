import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
export declare const supabaseAuthMiddleware: (req: AuthenticatedRequest, res: Response<ApiResponse<any>>, next: NextFunction) => Promise<void>;
export declare const adminAuthMiddleware: (req: AuthenticatedRequest, res: Response<ApiResponse<any>>, next: NextFunction) => Promise<void>;
export declare const optionalAuthMiddleware: (req: AuthenticatedRequest, res: Response<ApiResponse<any>>, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map