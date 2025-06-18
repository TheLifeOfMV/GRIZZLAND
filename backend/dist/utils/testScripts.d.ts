export interface TestResult {
    testName: string;
    success: boolean;
    duration: number;
    message: string;
    details?: any;
    errors?: string[];
    warnings?: string[];
}
export interface TestSuite {
    suiteName: string;
    results: TestResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        duration: number;
    };
}
export declare function testShippingUtilities(): Promise<TestSuite>;
export declare function testInventoryService(): Promise<TestSuite>;
export declare function testEnhancedCartService(): Promise<TestSuite>;
export declare function testCircuitBreakerAndObservability(): Promise<TestSuite>;
export declare function testEndToEndScenarios(): Promise<TestSuite>;
export declare function testPerformanceMetrics(): Promise<TestSuite>;
export declare function runAllTests(): Promise<{
    suites: TestSuite[];
    overallSummary: {
        totalTests: number;
        totalPassed: number;
        totalFailed: number;
        totalDuration: number;
        successRate: number;
    };
}>;
export declare function generateTestReport(testResults: {
    suites: TestSuite[];
    overallSummary: any;
}): string;
export declare function runBasicTests(): Promise<TestSuite>;
//# sourceMappingURL=testScripts.d.ts.map