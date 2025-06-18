"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIPPING_CONFIG = exports.calculateShippingProgress = exports.validateShippingAddress = exports.calculateShippingWithRules = exports.shippingFee = void 0;
const config_1 = require("../config/config");
const shippingFee = (context) => {
    try {
        const fee = config_1.config.shipping?.defaultFee;
        if (fee === undefined || fee === null) {
            console.error('SHIPPING_CONFIG_ERROR: Default shipping fee not configured', {
                timestamp: new Date().toISOString(),
                context: context || {},
                fallback: 0
            });
            return 0;
        }
        console.log('SHIPPING_CALCULATION', {
            timestamp: new Date().toISOString(),
            fee,
            context: context || {},
            configSource: 'config.shipping.defaultFee'
        });
        return fee;
    }
    catch (error) {
        console.error('SHIPPING_CALCULATION_ERROR', {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            context: context || {},
            fallback: 0
        });
        return 0;
    }
};
exports.shippingFee = shippingFee;
const calculateShippingWithRules = (context) => {
    const startTime = Date.now();
    try {
        const baseFee = (0, exports.shippingFee)(context);
        const freeShippingThreshold = 200000;
        const { subtotal = 0, destination } = context;
        const isEligibleForFreeShipping = subtotal >= freeShippingThreshold;
        const remainingForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);
        let finalFee = baseFee;
        let method = 'standard';
        let estimatedDelivery = '3-5 días hábiles';
        if (isEligibleForFreeShipping) {
            finalFee = 0;
            method = 'free';
        }
        if (destination?.department) {
            const regionMultiplier = getRegionMultiplier(destination.department);
            if (!isEligibleForFreeShipping) {
                finalFee = Math.round(baseFee * regionMultiplier);
            }
        }
        const calculation = {
            fee: finalFee,
            freeShippingThreshold,
            isEligibleForFreeShipping,
            remainingForFreeShipping,
            region: destination?.department,
            estimatedDelivery,
            method
        };
        const duration = Date.now() - startTime;
        console.log('SHIPPING_RULES_CALCULATION', {
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
            input: context,
            output: calculation,
            performance: duration < 50 ? 'GOOD' : duration < 100 ? 'ACCEPTABLE' : 'SLOW'
        });
        return calculation;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        console.error('SHIPPING_RULES_ERROR', {
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
            error: error instanceof Error ? error.message : 'Unknown error',
            context,
            fallback: {
                fee: 0,
                freeShippingThreshold: 200000,
                isEligibleForFreeShipping: false,
                remainingForFreeShipping: 200000,
                estimatedDelivery: '3-5 días hábiles',
                method: 'standard'
            }
        });
        return {
            fee: 0,
            freeShippingThreshold: 200000,
            isEligibleForFreeShipping: false,
            remainingForFreeShipping: 200000,
            estimatedDelivery: '3-5 días hábiles',
            method: 'standard'
        };
    }
};
exports.calculateShippingWithRules = calculateShippingWithRules;
const getRegionMultiplier = (department) => {
    const regionMap = {
        'Bogotá': 1.0,
        'Cundinamarca': 1.0,
        'Antioquia': 1.1,
        'Valle del Cauca': 1.1,
        'Atlántico': 1.2,
        'Santander': 1.1,
        'Amazonas': 1.5,
        'Guainía': 1.5,
        'Vaupés': 1.5,
        'Vichada': 1.5
    };
    return regionMap[department] || 1.2;
};
const validateShippingAddress = (address) => {
    const errors = [];
    const warnings = [];
    try {
        if (!address.city?.trim()) {
            errors.push('City is required');
        }
        if (!address.address?.trim()) {
            errors.push('Street address is required');
        }
        if (address.postalCode) {
            const postalCodeRegex = /^\d{6}$/;
            if (!postalCodeRegex.test(address.postalCode)) {
                warnings.push('Postal code should be 6 digits (optional but recommended)');
            }
        }
        if (address.department) {
            const validDepartments = [
                'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
                'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
                'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
                'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
                'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
                'Vaupés', 'Vichada', 'Bogotá'
            ];
            if (!validDepartments.includes(address.department)) {
                warnings.push(`Department '${address.department}' not recognized. Shipping may require manual verification.`);
            }
        }
        const result = {
            valid: errors.length === 0,
            errors,
            warnings
        };
        console.log('SHIPPING_ADDRESS_VALIDATION', {
            timestamp: new Date().toISOString(),
            address: {
                city: address.city,
                department: address.department,
                hasPostalCode: !!address.postalCode
            },
            result
        });
        return result;
    }
    catch (error) {
        console.error('SHIPPING_VALIDATION_ERROR', {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            address
        });
        return {
            valid: false,
            errors: ['Validation failed due to system error'],
            warnings: []
        };
    }
};
exports.validateShippingAddress = validateShippingAddress;
const calculateShippingProgress = (subtotal) => {
    const threshold = 200000;
    const progress = Math.min((subtotal / threshold) * 100, 100);
    const remaining = Math.max(threshold - subtotal, 0);
    const isEligible = subtotal >= threshold;
    console.log('SHIPPING_PROGRESS_CALCULATION', {
        timestamp: new Date().toISOString(),
        subtotal,
        progress: `${progress.toFixed(1)}%`,
        remaining,
        isEligible
    });
    return {
        progress,
        remaining,
        threshold,
        isEligible
    };
};
exports.calculateShippingProgress = calculateShippingProgress;
exports.SHIPPING_CONFIG = {
    DEFAULT_FEE: 15000,
    FREE_SHIPPING_THRESHOLD: 200000,
    STANDARD_DELIVERY: '3-5 días hábiles',
    EXPRESS_DELIVERY: '1-2 días hábiles',
    COVERAGE: 'Todo Colombia'
};
//# sourceMappingURL=shippingUtils.js.map