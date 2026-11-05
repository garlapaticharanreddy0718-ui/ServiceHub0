import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Server, Database, Code2, ShieldCheck } from 'lucide-react';

export default function StatusCard() {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(null);
  const [responseTime, setResponseTime] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const healthUrl = apiBase.endsWith('/health') ? apiBase : `${apiBase.replace(/\/$/, '')}/health`;

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

      if (!response.ok) {
        throw new Error(`Server returned status HTTP ${response.status}`);
      }

      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      console.error('API connection check failed:', err);
      setError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Backend API Health Status</h2>
            <p className="text-xs text-slate-500">Endpoint: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">GET /api/v1/health</code></p>
          </div>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 transition-colors"
          title="Re-check health endpoint"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Checking...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-6">
        {/* Status Indicator Banner */}
        {loading ? (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center space-x-3 text-blue-800">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-sm font-medium">Connecting to Backend API...</p>
              <p className="text-xs text-blue-600">Sending health ping to Express server</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Backend Unreachable</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
              <p className="text-xs text-red-500 mt-2">
                Make sure the backend server is running (<code className="font-mono">npm run dev</code> inside <code className="font-mono">server/</code> on port 5000).
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Backend Connection Healthy</p>
                <p className="text-xs text-emerald-700">Successfully received HTTP 200 OK response</p>
              </div>
            </div>
            {responseTime !== null && (
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-medium">
                {responseTime} ms latency
              </span>
            )}
          </div>
        )}

        {/* Technical Diagnostics Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Code2 className="w-3.5 h-3.5" />
              <span>Response Payload</span>
            </div>
            {healthData ? (
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-md font-mono text-xs overflow-x-auto">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">No payload received</div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Architecture Checklist</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Express Server with CORS & JSON Parsing</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Centralized Express Error Handling</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Prisma ORM & PostgreSQL Configuration</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Structured API Routing (/api/v1)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
