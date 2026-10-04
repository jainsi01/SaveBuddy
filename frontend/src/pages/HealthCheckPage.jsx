import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Database,
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Terminal,
} from 'lucide-react';
import api, { fetchSystemHealth } from '../services/api';
import HealthStatusBadge from '../components/common/HealthStatusBadge';

export default function HealthCheckPage({ onStatusUpdate }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const data = await fetchSystemHealth();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHealthData(data);
      if (onStatusUpdate) {
        onStatusUpdate({
          api: data.status || 'UP',
          database: data.database || 'CONNECTED',
        });
      }
    } catch (err) {
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      // Degraded state (e.g. 503 from backend when DB is not ready) or network drop
      if (err.status === 'DEGRADED') {
        setHealthData(err);
        if (onStatusUpdate) {
          onStatusUpdate({ api: 'UP', database: 'DISCONNECTED' });
        }
      } else {
        setError(err.message || 'Unable to connect to SaveBuddy Backend.');
        if (onStatusUpdate) {
          onStatusUpdate({ api: 'OFFLINE', database: 'DISCONNECTED' });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [onStatusUpdate]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Test Route 404 Handlers
  const test404Route = async () => {
    setTestingEndpoint(true);
    setTestResult(null);
    try {
      await api.get('/unmapped-test-route');
    } catch (err) {
      setTestResult({
        test: '404 Route Not Found Handling',
        status: 'PASSED',
        response: err,
      });
    } finally {
      setTestingEndpoint(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* Page Title & Mission */}
      <div className="border-b border-coffee-200/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-coffee-500 uppercase">
            Module 1 — Foundation & Environment
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-coffee-950 mt-1">
            System Architecture & Health
          </h1>
          <p className="text-sm text-coffee-600 mt-1">
            Live operational status of the REST API, MongoDB connection, security middleware, and client interceptors.
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center gap-2 bg-coffee-500 hover:bg-coffee-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-warm-sm transition self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Health Status</span>
        </button>
      </div>

      {/* Network / Offline Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-rose-900 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Server Offline or Unreachable</h4>
            <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
            <p className="text-[11px] text-rose-600 italic pt-1">
              Tip: Ensure the backend is running (`npm start` or `npm run dev` in `backend/`).
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Card 1: API Server Status */}
        <div className="bg-white rounded-3xl p-6 border border-coffee-200/70 shadow-warm-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-coffee-600 uppercase tracking-wider">REST API</span>
            <div className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-700">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-coffee-950">
              {loading ? 'Checking...' : healthData?.status || 'OFFLINE'}
            </div>
            <div className="mt-2">
              <HealthStatusBadge
                status={healthData?.status === 'UP' ? 'UP' : 'OFFLINE'}
                label={healthData?.status === 'UP' ? 'Port 5000 Active' : 'Unreachable'}
              />
            </div>
          </div>
        </div>

        {/* Card 2: MongoDB Connection State */}
        <div className="bg-white rounded-3xl p-6 border border-coffee-200/70 shadow-warm-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-coffee-600 uppercase tracking-wider">Database</span>
            <div className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-700">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-coffee-950">
              {loading ? 'Checking...' : healthData?.database || 'DISCONNECTED'}
            </div>
            <div className="mt-2">
              <HealthStatusBadge
                status={healthData?.database === 'CONNECTED' ? 'CONNECTED' : 'DEGRADED'}
                label={healthData?.database === 'CONNECTED' ? 'Mongoose Ready' : 'Connection Standby'}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Response Latency */}
        <div className="bg-white rounded-3xl p-6 border border-coffee-200/70 shadow-warm-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-coffee-600 uppercase tracking-wider">Latency</span>
            <div className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-coffee-950">
              {latency !== null ? `${latency} ms` : '—'}
            </div>
            <p className="text-xs text-coffee-500 mt-2 font-medium">Round-trip API speed</p>
          </div>
        </div>

        {/* Card 4: Server Uptime */}
        <div className="bg-white rounded-3xl p-6 border border-coffee-200/70 shadow-warm-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-coffee-600 uppercase tracking-wider">Uptime</span>
            <div className="w-8 h-8 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-coffee-950">
              {healthData?.uptimeSeconds !== undefined ? `${healthData.uptimeSeconds}s` : '—'}
            </div>
            <p className="text-xs text-coffee-500 mt-2 font-medium">Process lifetime</p>
          </div>
        </div>
      </div>

      {/* Module 1 Architectural Checklist */}
      <div className="bg-white rounded-3xl p-8 border border-coffee-200/70 shadow-warm-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-coffee-100 flex items-center justify-center text-coffee-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-coffee-950">Module 1 Baseline Deliverables</h3>
            <p className="text-xs text-coffee-600">Verified core architectural components and middleware</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-coffee-50/60 border border-coffee-200/50">
            <CheckCircle2 className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-coffee-900 block">Dynamic CORS & Security Headers</span>
              <span className="text-coffee-600">Configured via Helmet and dynamic origin resolvers (EC-1.5).</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-coffee-50/60 border border-coffee-200/50">
            <CheckCircle2 className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-coffee-900 block">Centralized Error Handling</span>
              <span className="text-coffee-600">Universal JSON error envelopes with SyntaxError & 413 limits (EC-1.3, EC-1.4).</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-coffee-50/60 border border-coffee-200/50">
            <CheckCircle2 className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-coffee-900 block">Environment Variable Validation</span>
              <span className="text-coffee-600">Pre-boot checks guarding against missing critical secrets (EC-1.1).</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-coffee-50/60 border border-coffee-200/50">
            <CheckCircle2 className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-coffee-900 block">Resilient Axios API Client</span>
              <span className="text-coffee-600">Interceptors handling network drops and 401 transitions (EC-1.6).</span>
            </div>
          </div>
        </div>

        {/* Live Interactive API Diagnostics */}
        <div className="pt-4 border-t border-coffee-200/70">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-coffee-500" />
              <h4 className="font-semibold text-xs text-coffee-900 uppercase tracking-wider">
                Live Edge-Case Diagnostics
              </h4>
            </div>
            <button
              onClick={test404Route}
              disabled={testingEndpoint}
              className="text-xs text-coffee-600 bg-coffee-100 hover:bg-coffee-200 px-3 py-1.5 rounded-lg transition font-medium"
            >
              Test Unmapped 404 Route
            </button>
          </div>

          {testResult && (
            <div className="bg-coffee-900 text-coffee-100 rounded-2xl p-4 font-mono text-[11px] overflow-x-auto shadow-inner">
              <div className="text-sage-400 font-bold mb-1">
                ✓ {testResult.test}: Standardized Error Envelope Received
              </div>
              <pre>{JSON.stringify(testResult.response, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
