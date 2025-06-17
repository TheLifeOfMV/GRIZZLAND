export declare const config: {
    port: string | number;
    nodeEnv: string;
    frontendUrl: string;
    supabase: {
        url: string;
        anonKey: string;
        serviceKey: string;
    };
    payment: {
        bankAccountNumber: string;
        bankName: string;
        bankAccountType: string;
        nequiPhone: string;
    };
    shipping: {
        defaultFee: number;
    };
    security: {
        jwtSecret: string;
        apiRateLimit: number;
        requestTimeout: number;
    };
};
//# sourceMappingURL=config.d.ts.map