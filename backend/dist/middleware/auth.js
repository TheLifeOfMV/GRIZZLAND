"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.adminAuthMiddleware = exports.supabaseAuthMiddleware = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config/config");
const supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceKey);
const supabaseAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No authorization token provided'
            });
            return;
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            console.error('Authentication error:', error?.message);
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
            return;
        }
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
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication service error'
        });
    }
};
exports.supabaseAuthMiddleware = supabaseAuthMiddleware;
const adminAuthMiddleware = async (req, res, next) => {
    await (0, exports.supabaseAuthMiddleware)(req, res, () => {
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
exports.adminAuthMiddleware = adminAuthMiddleware;
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
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
    }
    catch (error) {
        console.error('Optional auth middleware error:', error);
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=auth.js.map