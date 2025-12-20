// Performance monitoring and analytics utilities

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.initialized = false;
    // Completely disable initialization
    console.log('Analytics disabled - skipping initialization');
  }

  init() {
    // Do nothing - analytics disabled
    return;
  }

  observeWebVitals() {
    // Do nothing - analytics disabled
    return;
  }

  observeResourceTiming() {
    // Do nothing - analytics disabled
    return;
  }

  observeNavigationTiming() {
    // Do nothing - analytics disabled
    return;
  }

  recordMetric(name, value, metadata = {}) {
    // Analytics completely disabled
    return;
  }

  async sendMetric(metric) {
    // DISABLE ANALYTICS COMPLETELY FOR NOW
    return Promise.resolve();
  }

  // Business event tracking
  trackEvent(eventName, properties = {}) {
    // Analytics completely disabled
    return;
  }

  async sendEvent(event) {
    // DISABLE ANALYTICS COMPLETELY FOR NOW
    return Promise.resolve();
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {};
    this.metrics.forEach((metric, key) => {
      if (!summary[metric.name]) {
        summary[metric.name] = [];
      }
      summary[metric.name].push(metric.value);
    });

    // Calculate averages
    Object.keys(summary).forEach(key => {
      const values = summary[key];
      summary[key] = {
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    });

    return summary;
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Export utilities
export const trackEvent = (eventName, properties) => {
  performanceMonitor.trackEvent(eventName, properties);
};

export const recordMetric = (name, value, metadata) => {
  performanceMonitor.recordMetric(name, value, metadata);
};

export const getPerformanceSummary = () => {
  return performanceMonitor.getPerformanceSummary();
};

export default performanceMonitor;