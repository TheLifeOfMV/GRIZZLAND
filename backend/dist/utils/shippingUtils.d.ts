export interface ShippingCalculation {
    fee: number;
    freeShippingThreshold: number;
    isEligibleForFreeShipping: boolean;
    remainingForFreeShipping: number;
    region?: string;
    estimatedDelivery: string;
    method: 'standard' | 'express' | 'free';
}
export interface ShippingContext {
    subtotal: number;
    destination?: {
        city: string;
        department?: string;
        postalCode?: string;
    };
    items?: Array<{
        weight?: number;
        dimensions?: {
            length: number;
            width: number;
            height: number;
        };
    }>;
    userId?: string;
    timestamp?: string;
}
export declare const shippingFee: (context?: ShippingContext) => number;
export declare const calculateShippingWithRules: (context: ShippingContext) => ShippingCalculation;
export declare const validateShippingAddress: (address: {
    city: string;
    department?: string;
    postalCode?: string;
    address: string;
}) => {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
export declare const calculateShippingProgress: (subtotal: number) => {
    progress: number;
    remaining: number;
    threshold: number;
    isEligible: boolean;
};
export declare const SHIPPING_CONFIG: {
    readonly DEFAULT_FEE: 15000;
    readonly FREE_SHIPPING_THRESHOLD: 200000;
    readonly STANDARD_DELIVERY: "3-5 días hábiles";
    readonly EXPRESS_DELIVERY: "1-2 días hábiles";
    readonly COVERAGE: "Todo Colombia";
};
//# sourceMappingURL=shippingUtils.d.ts.map