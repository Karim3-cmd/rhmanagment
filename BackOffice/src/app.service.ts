import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      ok: true,
      service: 'HRBrain API',
      timestamp: new Date().toISOString(),
    };
  }

  getMetrics(): string {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const timestamp = Date.now();

    return [
      '# HELP hrbrain_api_up Backend availability flag.',
      '# TYPE hrbrain_api_up gauge',
      'hrbrain_api_up 1',
      '# HELP hrbrain_api_uptime_seconds Backend process uptime in seconds.',
      '# TYPE hrbrain_api_uptime_seconds gauge',
      `hrbrain_api_uptime_seconds ${uptime.toFixed(3)}`,
      '# HELP hrbrain_api_memory_rss_bytes Resident memory used by the Node.js process.',
      '# TYPE hrbrain_api_memory_rss_bytes gauge',
      `hrbrain_api_memory_rss_bytes ${memory.rss}`,
      '# HELP hrbrain_api_memory_heap_used_bytes Heap memory used by the Node.js process.',
      '# TYPE hrbrain_api_memory_heap_used_bytes gauge',
      `hrbrain_api_memory_heap_used_bytes ${memory.heapUsed}`,
      '# HELP hrbrain_api_build_info Static backend build information.',
      '# TYPE hrbrain_api_build_info gauge',
      `hrbrain_api_build_info{service="HRBrain API",runtime="node",version="${process.version}"} 1`,
      '# HELP hrbrain_api_metrics_generated_timestamp_ms Timestamp when metrics were generated.',
      '# TYPE hrbrain_api_metrics_generated_timestamp_ms gauge',
      `hrbrain_api_metrics_generated_timestamp_ms ${timestamp}`,
      '',
    ].join('\n');
  }
}
