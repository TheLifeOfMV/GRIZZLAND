"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseCircuitBreakers = exports.SupabaseCircuitBreaker = exports.ApplicationError = exports.CircuitState = void 0;
exports.executeWithCircuitBreaker = executeWithCircuitBreaker;
exports.getCircuitBreakerHealth = getCircuitBreakerHealth;
const logger_1 = require("./logger");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class ApplicationError extends Error {
    constructor(message, status = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'ApplicationError';
    }
}
exports.ApplicationError = ApplicationError;
class SupabaseCircuitBreaker {
    constructor(name = 'default', customConfig) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.totalCalls = 0;
        this.lastFailureTime = null;
        this.lastSuccessTime = null;
        this.stateChangedAt = Date.now();
        this.callsInHalfOpen = 0;
        this.successesInHalfOpen = 0;
        this.config = {
            failureThreshold: 5,
            recoveryTimeout: 60000,
            monitoringPeriod: 300000,
            halfOpenMaxCalls: 3,
            successThreshold: 2
        };
        this.instanceId = `circuit_breaker_${name}_${Date.now()}`;
        this.config = { ...this.config, ...customConfig };
        (0, logger_1.logInfo)('Circuit breaker initialized', {
            action: 'CIRCUIT_BREAKER_INIT',
            resource: 'supabase',
            metadata: {
                instanceId: this.instanceId,
                name,
                config: this.config
            }
        });
    }
    async execute(operation, operationName = 'unknown') {
        const callId = `${this.instanceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        if (!this.shouldAllowCall()) {
            const error = new ApplicationError('Service temporarily unavailable - Circuit breaker is OPEN', 503, 'CIRCUIT_OPEN');
            (0, logger_1.logWarning)('Circuit breaker rejected call', {
                action: 'CIRCUIT_BREAKER_REJECT',
                resource: 'supabase',
                metadata: {
                    instanceId: this.instanceId,
                    callId,
                    operationName,
                    state: this.state,
                    metrics: this.getMetrics()
                }
            });
            throw error;
        }
        this.totalCalls++;
        if (this.state === CircuitState.HALF_OPEN) {
            this.callsInHalfOpen++;
        }
        try {
            const result = await operation();
            this.onSuccess(callId, operationName, Date.now() - startTime);
            return result;
        }
        catch (error) {
            this.onFailure(error, callId, operationName, Date.now() - startTime);
            throw error;
        }
    }
    shouldAllowCall() {
        const now = Date.now();
        switch (this.state) {
            case CircuitState.CLOSED:
                return true;
            case CircuitState.OPEN:
                if (this.lastFailureTime && (now - this.lastFailureTime) >= this.config.recoveryTimeout) {
                    this.transitionToHalfOpen();
                    return true;
                }
                return false;
            case CircuitState.HALF_OPEN:
                return this.callsInHalfOpen < this.config.halfOpenMaxCalls;
            default:
                return false;
        }
    }
    onSuccess(callId, operationName, duration) {
        const now = Date.now();
        this.successes++;
        this.lastSuccessTime = now;
        this.cleanupOldFailures();
        if (this.state === CircuitState.HALF_OPEN) {
            this.successesInHalfOpen++;
            if (this.successesInHalfOpen >= this.config.successThreshold) {
                this.transitionToClosed();
            }
        }
        logger_1.Logger.debug('Circuit breaker operation succeeded', {
            action: 'CIRCUIT_BREAKER_SUCCESS',
            resource: 'supabase',
            duration: `${duration}ms`,
            metadata: {
                instanceId: this.instanceId,
                callId,
                operationName,
                state: this.state,
                successCount: this.successes,
                metrics: this.getMetrics()
            }
        });
    }
    onFailure(error, callId, operationName, duration) {
        const now = Date.now();
        this.failures++;
        this.lastFailureTime = now;
        this.cleanupOldFailures();
        (0, logger_1.logError)('Circuit breaker operation failed', error, {
            action: 'CIRCUIT_BREAKER_FAILURE',
            resource: 'supabase',
            duration: `${duration}ms`,
            metadata: {
                instanceId: this.instanceId,
                callId,
                operationName,
                state: this.state,
                failureCount: this.failures,
                errorName: error.name,
                errorMessage: error.message,
                metrics: this.getMetrics()
            }
        });
        if (this.state === CircuitState.CLOSED && this.failures >= this.config.failureThreshold) {
            this.transitionToOpen();
        }
        else if (this.state === CircuitState.HALF_OPEN) {
            this.transitionToOpen();
        }
    }
    transitionToOpen() {
        const previousState = this.state;
        this.state = CircuitState.OPEN;
        this.stateChangedAt = Date.now();
        this.callsInHalfOpen = 0;
        this.successesInHalfOpen = 0;
        (0, logger_1.logWarning)('Circuit breaker opened - Service degraded', {
            action: 'CIRCUIT_BREAKER_OPEN',
            resource: 'supabase',
            metadata: {
                instanceId: this.instanceId,
                previousState,
                newState: this.state,
                failureThreshold: this.config.failureThreshold,
                failures: this.failures,
                recoveryTimeout: this.config.recoveryTimeout,
                metrics: this.getMetrics()
            }
        });
    }
    transitionToHalfOpen() {
        const previousState = this.state;
        this.state = CircuitState.HALF_OPEN;
        this.stateChangedAt = Date.now();
        this.callsInHalfOpen = 0;
        this.successesInHalfOpen = 0;
        (0, logger_1.logInfo)('Circuit breaker testing recovery - Half-open state', {
            action: 'CIRCUIT_BREAKER_HALF_OPEN',
            resource: 'supabase',
            metadata: {
                instanceId: this.instanceId,
                previousState,
                newState: this.state,
                maxTestCalls: this.config.halfOpenMaxCalls,
                successThreshold: this.config.successThreshold,
                metrics: this.getMetrics()
            }
        });
    }
    transitionToClosed() {
        const previousState = this.state;
        this.state = CircuitState.CLOSED;
        this.stateChangedAt = Date.now();
        this.callsInHalfOpen = 0;
        this.successesInHalfOpen = 0;
        this.failures = 0;
        (0, logger_1.logInfo)('Circuit breaker closed - Service recovered', {
            action: 'CIRCUIT_BREAKER_CLOSED',
            resource: 'supabase',
            metadata: {
                instanceId: this.instanceId,
                previousState,
                newState: this.state,
                successesRequired: this.config.successThreshold,
                successesAchieved: this.successesInHalfOpen,
                metrics: this.getMetrics()
            }
        });
    }
    cleanupOldFailures() {
        const now = Date.now();
        const cutoffTime = now - this.config.monitoringPeriod;
        if (this.lastFailureTime && this.lastFailureTime < cutoffTime) {
            const previousFailures = this.failures;
            this.failures = 0;
            logger_1.Logger.debug('Circuit breaker failure count reset', {
                action: 'CIRCUIT_BREAKER_RESET',
                resource: 'supabase',
                metadata: {
                    instanceId: this.instanceId,
                    previousFailures,
                    monitoringPeriod: this.config.monitoringPeriod,
                    lastFailureAge: now - this.lastFailureTime
                }
            });
        }
    }
    getMetrics() {
        return {
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            totalCalls: this.totalCalls,
            lastFailureTime: this.lastFailureTime,
            lastSuccessTime: this.lastSuccessTime,
            stateChangedAt: this.stateChangedAt,
            callsInHalfOpen: this.callsInHalfOpen,
            successesInHalfOpen: this.successesInHalfOpen
        };
    }
    getState() {
        return this.state;
    }
    isHealthy() {
        return this.state === CircuitState.CLOSED;
    }
    forceState(newState, reason = 'Manual override') {
        const previousState = this.state;
        this.state = newState;
        this.stateChangedAt = Date.now();
        if (newState === CircuitState.CLOSED) {
            this.failures = 0;
            this.callsInHalfOpen = 0;
            this.successesInHalfOpen = 0;
        }
        (0, logger_1.logWarning)('Circuit breaker state forced', {
            action: 'CIRCUIT_BREAKER_FORCE_STATE',
            resource: 'supabase',
            metadata: {
                instanceId: this.instanceId,
                previousState,
                newState,
                reason,
                metrics: this.getMetrics()
            }
        });
    }
    reset() {
        const previousMetrics = this.getMetrics();
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.totalCalls = 0;
        this.lastFailureTime = null;
        this.lastSuccessTime = null;
        this.stateChangedAt = Date.now();
        this.callsInHalfOpen = 0;
        this.successesInHalfOpen = 0;
        (0, logger_1.logInfo)('Circuit breaker reset', {
            action: 'CIRCUIT_BREAKER_RESET',
            resource: 'supabase',
            metadata: {
                instanceId: this.instanceId,
                previousMetrics,
                newMetrics: this.getMetrics()
            }
        });
    }
}
exports.SupabaseCircuitBreaker = SupabaseCircuitBreaker;
exports.supabaseCircuitBreakers = {
    database: new SupabaseCircuitBreaker('database', {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 300000,
        halfOpenMaxCalls: 3,
        successThreshold: 2
    }),
    auth: new SupabaseCircuitBreaker('auth', {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        monitoringPeriod: 180000,
        halfOpenMaxCalls: 2,
        successThreshold: 2
    }),
    critical: new SupabaseCircuitBreaker('critical', {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        monitoringPeriod: 180000,
        halfOpenMaxCalls: 2,
        successThreshold: 3
    })
};
async function executeWithCircuitBreaker(operation, circuitBreaker, operationName) {
    return circuitBreaker.execute(operation, operationName);
}
function getCircuitBreakerHealth() {
    const circuits = {};
    let healthyCount = 0;
    let openCount = 0;
    let halfOpenCount = 0;
    Object.entries(exports.supabaseCircuitBreakers).forEach(([name, breaker]) => {
        const metrics = breaker.getMetrics();
        circuits[name] = metrics;
        switch (metrics.state) {
            case CircuitState.CLOSED:
                healthyCount++;
                break;
            case CircuitState.OPEN:
                openCount++;
                break;
            case CircuitState.HALF_OPEN:
                halfOpenCount++;
                break;
        }
    });
    const totalCircuits = Object.keys(exports.supabaseCircuitBreakers).length;
    const healthy = openCount === 0;
    return {
        healthy,
        circuits,
        summary: {
            totalCircuits,
            healthyCircuits: healthyCount,
            openCircuits: openCount,
            halfOpenCircuits: halfOpenCount
        }
    };
}
//# sourceMappingURL=circuitBreaker.js.map