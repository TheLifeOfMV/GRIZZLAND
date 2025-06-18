import { Logger, logError, logWarning, logInfo } from './logger';

/**
 * GRIZZLAND Circuit Breaker for Supabase Operations
 * Implements circuit breaker pattern to handle database failures gracefully
 * Following MONOCODE principles: Observable, Explicit Error Handling, Dependency Transparency
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, rejecting requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service is recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening circuit
  recoveryTimeout: number;       // Time to wait before trying again (ms)
  monitoringPeriod: number;      // Time window for failure counting (ms)
  halfOpenMaxCalls: number;      // Max calls to allow in half-open state
  successThreshold: number;      // Successes needed to close circuit from half-open
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

export class ApplicationError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

/**
 * Circuit Breaker implementation for Supabase operations
 */
export class SupabaseCircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private totalCalls: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private stateChangedAt: number = Date.now();
  private callsInHalfOpen: number = 0;
  private successesInHalfOpen: number = 0;
  private readonly instanceId: string;

  private readonly config: CircuitBreakerConfig = {
    failureThreshold: 5,        // Open after 5 failures
    recoveryTimeout: 60000,     // Wait 1 minute before retry
    monitoringPeriod: 300000,   // 5-minute monitoring window
    halfOpenMaxCalls: 3,        // Allow 3 test calls in half-open
    successThreshold: 2         // Need 2 successes to close circuit
  };

  constructor(name: string = 'default', customConfig?: Partial<CircuitBreakerConfig>) {
    this.instanceId = `circuit_breaker_${name}_${Date.now()}`;
    this.config = { ...this.config, ...customConfig };

    // Log circuit breaker initialization
    logInfo('Circuit breaker initialized', {
      action: 'CIRCUIT_BREAKER_INIT',
      resource: 'supabase',
      metadata: {
        instanceId: this.instanceId,
        name,
        config: this.config
      }
    });
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>, operationName: string = 'unknown'): Promise<T> {
    const callId = `${this.instanceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Check if circuit should allow the call
    if (!this.shouldAllowCall()) {
      const error = new ApplicationError(
        'Service temporarily unavailable - Circuit breaker is OPEN',
        503,
        'CIRCUIT_OPEN'
      );

      logWarning('Circuit breaker rejected call', {
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
      // Execute the operation
      const result = await operation();
      
      // Record success
      this.onSuccess(callId, operationName, Date.now() - startTime);
      
      return result;

    } catch (error) {
      // Record failure
      this.onFailure(error as Error, callId, operationName, Date.now() - startTime);
      
      throw error;
    }
  }

  /**
   * Determine if the circuit should allow a call
   */
  private shouldAllowCall(): boolean {
    const now = Date.now();

    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if recovery timeout has passed
        if (this.lastFailureTime && (now - this.lastFailureTime) >= this.config.recoveryTimeout) {
          this.transitionToHalfOpen();
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        // Allow limited calls to test service recovery
        return this.callsInHalfOpen < this.config.halfOpenMaxCalls;

      default:
        return false;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(callId: string, operationName: string, duration: number): void {
    const now = Date.now();
    this.successes++;
    this.lastSuccessTime = now;

    // Clean up old failures outside monitoring period
    this.cleanupOldFailures();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successesInHalfOpen++;
      
      // Check if we have enough successes to close the circuit
      if (this.successesInHalfOpen >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }

    // Log successful operation
    Logger.debug('Circuit breaker operation succeeded', {
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

  /**
   * Handle failed operation
   */
  private onFailure(error: Error, callId: string, operationName: string, duration: number): void {
    const now = Date.now();
    this.failures++;
    this.lastFailureTime = now;

    // Clean up old failures outside monitoring period
    this.cleanupOldFailures();

    // Log failure
    logError('Circuit breaker operation failed', error, {
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

    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED && this.failures >= this.config.failureThreshold) {
      this.transitionToOpen();
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state should open the circuit
      this.transitionToOpen();
    }
  }

  /**
   * Transition circuit to OPEN state
   */
  private transitionToOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.stateChangedAt = Date.now();
    this.callsInHalfOpen = 0;
    this.successesInHalfOpen = 0;

    logWarning('Circuit breaker opened - Service degraded', {
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

  /**
   * Transition circuit to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.stateChangedAt = Date.now();
    this.callsInHalfOpen = 0;
    this.successesInHalfOpen = 0;

    logInfo('Circuit breaker testing recovery - Half-open state', {
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

  /**
   * Transition circuit to CLOSED state
   */
  private transitionToClosed(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.stateChangedAt = Date.now();
    this.callsInHalfOpen = 0;
    this.successesInHalfOpen = 0;
    
    // Reset failure count when circuit closes
    this.failures = 0;

    logInfo('Circuit breaker closed - Service recovered', {
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

  /**
   * Clean up failures outside the monitoring period
   */
  private cleanupOldFailures(): void {
    const now = Date.now();
    const cutoffTime = now - this.config.monitoringPeriod;

    // If last failure is outside monitoring period, reset failure count
    if (this.lastFailureTime && this.lastFailureTime < cutoffTime) {
      const previousFailures = this.failures;
      this.failures = 0;

      Logger.debug('Circuit breaker failure count reset', {
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

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
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

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is healthy (closed state)
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Force circuit to specific state (for testing/admin purposes)
   */
  forceState(newState: CircuitState, reason: string = 'Manual override'): void {
    const previousState = this.state;
    this.state = newState;
    this.stateChangedAt = Date.now();
    
    if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.callsInHalfOpen = 0;
      this.successesInHalfOpen = 0;
    }

    logWarning('Circuit breaker state forced', {
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

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
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

    logInfo('Circuit breaker reset', {
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

/**
 * Global circuit breaker instances for different Supabase operations
 */
export const supabaseCircuitBreakers = {
  // General database operations
  database: new SupabaseCircuitBreaker('database', {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringPeriod: 300000,
    halfOpenMaxCalls: 3,
    successThreshold: 2
  }),

  // Authentication operations
  auth: new SupabaseCircuitBreaker('auth', {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    monitoringPeriod: 180000,
    halfOpenMaxCalls: 2,
    successThreshold: 2
  }),

  // Critical operations (cart, orders)
  critical: new SupabaseCircuitBreaker('critical', {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    monitoringPeriod: 180000,
    halfOpenMaxCalls: 2,
    successThreshold: 3
  })
};

/**
 * Utility function to execute Supabase operations with circuit breaker protection
 */
export async function executeWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  circuitBreaker: SupabaseCircuitBreaker,
  operationName: string
): Promise<T> {
  return circuitBreaker.execute(operation, operationName);
}

/**
 * Health check function for all circuit breakers
 */
export function getCircuitBreakerHealth(): {
  healthy: boolean;
  circuits: Record<string, CircuitBreakerMetrics>;
  summary: {
    totalCircuits: number;
    healthyCircuits: number;
    openCircuits: number;
    halfOpenCircuits: number;
  };
} {
  const circuits: Record<string, CircuitBreakerMetrics> = {};
  let healthyCount = 0;
  let openCount = 0;
  let halfOpenCount = 0;

  Object.entries(supabaseCircuitBreakers).forEach(([name, breaker]) => {
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

  const totalCircuits = Object.keys(supabaseCircuitBreakers).length;
  const healthy = openCount === 0; // System is healthy if no circuits are open

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