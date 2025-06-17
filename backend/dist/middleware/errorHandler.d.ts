import { Request, Response, NextFunction } from 'express';
import { AppError, ApiResponse } from '../types';
export declare class ApplicationError extends Error implements AppError {
    status: number;
    code: string;
    constructor(message: string, status?: number, code?: string);
}
export declare const logError: (error: any, req: Request, userId?: string) => void;
export declare const errorHandler: (error: any, req: Request, res: Response<ApiResponse<any>>, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response<ApiResponse<any>>, next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const timeoutHandler: (timeout?: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map