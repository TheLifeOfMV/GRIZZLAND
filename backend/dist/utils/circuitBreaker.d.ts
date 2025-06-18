export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    halfOpenMaxCalls: number;
    successThreshold: number;
}
export interface CircuitBreakerMetrics {
    state: CircuitState;
    failures: number;
    successes: number;
    totalCalls: number;
    lastFailureTime: number | null;
    lastSuccessTime: number | null;
    stateChangedAt: number;
    callsInHalfOpen: number;
    successesInHalfOpen: number;
}
export declare class ApplicationError extends Error {
    status: number;
    code: string;
    constructor(message: string, status?: number, code?: string);
}
export declare class SupabaseCircuitBreaker {
    private state;
    private failures;
    private successes;
    private totalCalls;
    private lastFailureTime;
    private lastSuccessTime;
    private stateChangedAt;
    private callsInHalfOpen;
    private successesInHalfOpen;
    private readonly instanceId;
    private readonly config;
    constructor(name?: string, customConfig?: Partial<CircuitBreakerConfig>);
    execute<T>(operation: () => Promise<T>, operationName?: string): Promise<T>;
    private shouldAllowCall;
    private onSuccess;
    private onFailure;
    private transitionToOpen;
    private transitionToHalfOpen;
    private transitionToClosed;
    private cleanupOldFailures;
    getMetrics(): CircuitBreakerMetrics;
    getState(): CircuitState;
    isHealthy(): boolean;
    forceState(newState: CircuitState, reason?: string): void;
    reset(): void;
}
export declare const supabaseCircuitBreakers: {
    database: SupabaseCircuitBreaker;
    auth: SupabaseCircuitBreaker;
    critical: SupabaseCircuitBreaker;
};
export declare function executeWithCircuitBreaker<T>(operation: () => Promise<T>, circuitBreaker: SupabaseCircuitBreaker, operationName: string): Promise<T>;
export declare function getCircuitBreakerHealth(): {
    healthy: boolean;
    circuits: Record<string, CircuitBreakerMetrics>;
    summary: {
        totalCircuits: number;
        healthyCircuits: number;
        openCircuits: number;
        halfOpenCircuits: number;
    };
};
//# sourceMappingURL=circuitBreaker.d.ts.map