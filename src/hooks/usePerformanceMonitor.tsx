'use client';

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  slow: number;
  critical: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  slow: 1000, // 1 second
  critical: 3000, // 3 seconds
};

export const usePerformanceMonitor = (
  componentName: string,
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
) => {
  const startTimes = useRef<Map<string, number>>(new Map());
  const metrics = useRef<PerformanceMetric[]>([]);

  // Observable Implementation: Structured logging for performance tracking
  const logMetric = useCallback((metric: PerformanceMetric) => {
    console.log('PerformanceMonitor: Metric recorded', {
      component: componentName,
      operation: metric.name,
      duration: `${metric.duration}ms`,
      timestamp: metric.timestamp,
      metadata: metric.metadata,
    });

    // Fail Fast, Fail Loud: Alert on performance issues
    if (metric.duration > thresholds.critical) {
      console.error('PerformanceMonitor: Critical performance issue', {
        component: componentName,
        operation: metric.name,
        duration: `${metric.duration}ms`,
        threshold: `${thresholds.critical}ms`,
        severity: 'CRITICAL',
        recommendation: 'Immediate optimization required',
      });
    } else if (metric.duration > thresholds.slow) {
      console.warn('PerformanceMonitor: Slow operation detected', {
        component: componentName,
        operation: metric.name,
        duration: `${metric.duration}ms`,
        threshold: `${thresholds.slow}ms`,
        severity: 'WARNING',
        recommendation: 'Consider optimization',
      });
    }

    metrics.current.push(metric);
  }, [componentName, thresholds]);

  // Start timing an operation
  const startTiming = useCallback((operationName: string) => {
    const startTime = performance.now();
    startTimes.current.set(operationName, startTime);
    
    console.log('PerformanceMonitor: Operation started', {
      component: componentName,
      operation: operationName,
      timestamp: new Date().toISOString(),
    });
  }, [componentName]);

  // End timing and record metric
  const endTiming = useCallback((operationName: string, metadata?: Record<string, any>) => {
    const startTime = startTimes.current.get(operationName);
    if (!startTime) {
      console.warn('PerformanceMonitor: No start time found for operation', {
        component: componentName,
        operation: operationName,
        warning: 'startTiming() was not called',
      });
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      name: operationName,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    };

    logMetric(metric);
    startTimes.current.delete(operationName);
  }, [componentName, logMetric]);

  // Time a function execution
  const timeFunction = useCallback(
    async function<T>(
      operationName: string,
      fn: () => T | Promise<T>,
      metadata?: Record<string, any>
    ): Promise<T> {
      startTiming(operationName);
      try {
        const result = await fn();
        endTiming(operationName, { ...metadata, success: true });
        return result;
      } catch (error) {
        endTiming(operationName, { 
          ...metadata, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    },
    [startTiming, endTiming]
  );

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const summary = {
      component: componentName,
      totalOperations: metrics.current.length,
      averageDuration: metrics.current.length > 0 
        ? metrics.current.reduce((sum, m) => sum + m.duration, 0) / metrics.current.length 
        : 0,
      slowOperations: metrics.current.filter(m => m.duration > thresholds.slow).length,
      criticalOperations: metrics.current.filter(m => m.duration > thresholds.critical).length,
      operations: metrics.current.map(m => ({
        name: m.name,
        duration: m.duration,
        timestamp: m.timestamp,
      })),
    };

    console.log('PerformanceMonitor: Summary generated', summary);
    return summary;
  }, [componentName, thresholds]);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    console.log('PerformanceMonitor: Metrics cleared', {
      component: componentName,
      clearedCount: metrics.current.length,
    });
    metrics.current = [];
    startTimes.current.clear();
  }, [componentName]);

  // Monitor component lifecycle
  useEffect(() => {
    const mountTime = performance.now();
    console.log('PerformanceMonitor: Component mounted', {
      component: componentName,
      timestamp: new Date().toISOString(),
    });

    return () => {
      const unmountTime = performance.now();
      const lifecycleDuration = unmountTime - mountTime;
      
      console.log('PerformanceMonitor: Component unmounted', {
        component: componentName,
        lifecycleDuration: `${lifecycleDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      // Log final summary
      getPerformanceSummary();
    };
  }, [componentName, getPerformanceSummary]);

  // Monitor Web Vitals if available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'paint' || entry.entryType === 'navigation') {
            console.log('PerformanceMonitor: Web Vital', {
              component: componentName,
              type: entry.entryType,
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration || entry.startTime,
              timestamp: new Date().toISOString(),
            });
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['paint', 'navigation'] });
      } catch (error) {
        console.warn('PerformanceMonitor: Performance Observer not supported', error);
      }

      return () => observer.disconnect();
    }
  }, [componentName]);

  return {
    startTiming,
    endTiming,
    timeFunction,
    getPerformanceSummary,
    clearMetrics,
  };
};

// Specialized hooks for common use cases
export const useCartPerformance = () => {
  return usePerformanceMonitor('Cart', { slow: 500, critical: 1500 });
};

export const useProductPerformance = () => {
  return usePerformanceMonitor('Product', { slow: 800, critical: 2000 });
};

export const useNavigationPerformance = () => {
  return usePerformanceMonitor('Navigation', { slow: 300, critical: 1000 });
};

export default usePerformanceMonitor; 