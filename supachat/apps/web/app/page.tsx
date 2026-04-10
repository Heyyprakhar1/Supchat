'use client';

import { useState, useRef, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Send, Database, Activity, MessageSquare, Terminal, ChevronRight, Clock } from 'lucide-react';

interface QueryResult {
  sql:         string;
  data:        Record<string, unknown>[];
  chart_type:  'line' | 'bar' | 'table';
  explanation: string;
  timestamp:   string;
}

interface HistoryItem {
  question:    string;
  explanation: string;
  timestamp:   string;
}

const SUGGESTIONS = [
  'Show top trending topics in last 30 days',
  'Compare article engagement by topic',
  'Plot daily views trend for AI articles',
  'Which articles have the most shares?',
];

// ── Chart tooltip styled for dark theme ───────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#8b949e] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="text-[#e6edf3]">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export default function Home() {
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [status,  setStatus]  = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [showSql, setShowSql] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Health check on mount
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setStatus(d.status === 'healthy' ? 'healthy' : 'unhealthy'))
      .catch(() => setStatus('unhealthy'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [result]);

  const handleSubmit = async (question: string = input) => {
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setShowSql(false);
    setInput('');

    try {
      const res  = await fetch('/api/query', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question: q }),
      });
      const data: QueryResult = await res.json();
      setResult(data);
      setHistory(prev => [
        { question: q, explanation: data.explanation, timestamp: data.timestamp },
        ...prev.slice(0, 19),
      ]);
    } catch {
      setResult({
        sql:         '',
        data:        [],
        chart_type:  'table',
        explanation: 'Connection error — is the API running?',
        timestamp:   new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  // ── Chart renderer ───────────────────────────────────────────────────────
  const renderChart = () => {
    if (!result?.data?.length || result.chart_type === 'table') return null;
    const keys    = Object.keys(result.data[0]);
    const xKey    = keys[0];
    const yKeys   = keys.slice(1);
    const palette = ['#3fb950', '#58a6ff', '#bc8cff', '#f0883e'];

    const commonProps = {
      data:   result.data,
      margin: { top: 5, right: 20, bottom: 40, left: 10 },
    };
    const axisProps = {
      tick:     { fill: '#8b949e', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
      axisLine: { stroke: '#30363d' },
      tickLine: false,
    };

    if (result.chart_type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
            <XAxis dataKey={xKey} {...axisProps} angle={-30} textAnchor="end" />
            <YAxis {...axisProps} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: '#21262d' }} />
            <Legend wrapperStyle={{ color: '#8b949e', fontSize: 11 }} />
            {yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={palette[i % palette.length]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} angle={-30} textAnchor="end" />
          <YAxis {...axisProps} />
          <Tooltip content={<DarkTooltip />} />
          <Legend wrapperStyle={{ color: '#8b949e', fontSize: 11 }} />
          {yKeys.map((k, i) => (
            <Line
              key={k} type="monotone" dataKey={k}
              stroke={palette[i % palette.length]} strokeWidth={2}
              dot={{ fill: palette[i % palette.length], r: 3 }} activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // ── Data table ────────────────────────────────────────────────────────────
  const renderTable = () => {
    if (!result?.data?.length) return null;
    const cols = Object.keys(result.data[0]);
    return (
      <div className="overflow-x-auto rounded-lg border border-[#30363d]">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-[#21262d]">
              {cols.map(c => (
                <th key={c} className="px-4 py-2 text-left text-[#8b949e] font-medium uppercase tracking-wider whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {result.data.map((row, i) => (
              <tr key={i} className="hover:bg-[#21262d] transition-colors">
                {cols.map(c => (
                  <td key={c} className="px-4 py-2 text-[#e6edf3] whitespace-nowrap">
                    {row[c] != null ? String(row[c]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ── STATUS badge ──────────────────────────────────────────────────────────
  const statusColor = status === 'healthy' ? 'text-[#3fb950]' : status === 'unhealthy' ? 'text-red-400' : 'text-[#8b949e]';
  const statusDot   = status === 'healthy' ? 'bg-[#3fb950]'   : status === 'unhealthy' ? 'bg-red-400'   : 'bg-[#8b949e]';

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col font-mono text-[#e6edf3]">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-[#30363d] bg-[#161b22] px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Terminal className="w-5 h-5 text-[#3fb950]" />
        <span className="text-[#3fb950] font-semibold text-sm">~/supchat</span>
        <ChevronRight className="w-3 h-3 text-[#8b949e]" />
        <span className="text-[#e6edf3] text-sm font-semibold">SupaChat</span>
        <span className="text-[#8b949e] text-xs ml-1">— conversational analytics</span>

        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className={`inline-block w-2 h-2 rounded-full ${statusDot} ${status === 'healthy' ? 'animate-pulse' : ''}`} />
          <Activity className={`w-3 h-3 ${statusColor}`} />
          <span className={statusColor}>
            {status === 'checking' ? 'connecting...' : status === 'healthy' ? 'system operational' : 'api unreachable'}
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-60 border-r border-[#30363d] bg-[#161b22]">
          <div className="px-4 py-3 border-b border-[#30363d] flex items-center gap-2 text-xs text-[#8b949e]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider font-medium">Query History</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {history.length === 0 ? (
              <p className="text-xs text-[#8b949e] px-4 py-3 italic">No queries yet</p>
            ) : (
              history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(h.question)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#21262d] transition-colors group"
                >
                  <p className="text-xs text-[#e6edf3] truncate group-hover:text-[#3fb950] transition-colors">
                    {h.question}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* DB info footer */}
          <div className="px-4 py-3 border-t border-[#30363d] text-[10px] text-[#8b949e] space-y-1">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-[#58a6ff]" />
              <span className="text-[#58a6ff]">supachat_db</span>
            </div>
            <p>PostgreSQL 15 · articles table</p>
          </div>
        </aside>

        {/* ── Main panel ──────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0">

          {/* Results area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

            {/* Empty state */}
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <Database className="w-10 h-10 text-[#30363d] mb-4" />
                <p className="text-[#8b949e] text-sm mb-1">Ask me about your blog analytics</p>
                <p className="text-[#8b949e] text-xs mb-6">Powered by Ollama · PostgreSQL · FastAPI</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSubmit(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[#30363d] text-[#8b949e] hover:border-[#3fb950] hover:text-[#3fb950] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center gap-3 text-sm text-[#8b949e] py-4">
                <span className="text-[#3fb950]">$</span>
                <span className="text-[#e6edf3]">ollama generate</span>
                <span className="cursor-blink text-[#3fb950]">▋</span>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div className="space-y-4 max-w-4xl">

                {/* Explanation bubble */}
                <div className="flex gap-3 items-start">
                  <span className="text-[#3fb950] text-sm mt-0.5 select-none">$</span>
                  <div className="flex-1">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-3">
                      <p className="text-sm text-[#e6edf3] leading-relaxed">{result.explanation}</p>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                {result.chart_type !== 'table' && result.data?.length > 0 && (
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-4">
                      {result.chart_type === 'bar' ? 'Bar chart' : 'Line chart'} · {result.data.length} rows
                    </p>
                    {renderChart()}
                  </div>
                )}

                {/* Table */}
                {result.data?.length > 0 && (
                  <div>
                    <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-2">
                      Results · {result.data.length} rows
                    </p>
                    {renderTable()}
                  </div>
                )}

                {/* SQL toggle */}
                {result.sql && (
                  <div>
                    <button
                      onClick={() => setShowSql(p => !p)}
                      className="text-xs text-[#58a6ff] hover:text-[#79c0ff] flex items-center gap-1 mb-2 transition-colors"
                    >
                      <ChevronRight className={`w-3 h-3 transition-transform ${showSql ? 'rotate-90' : ''}`} />
                      {showSql ? 'hide' : 'show'} generated sql
                    </button>
                    {showSql && (
                      <div className="bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 overflow-x-auto">
                        <code className="text-xs text-[#79c0ff] whitespace-pre">{result.sql}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input bar ─────────────────────────────────────────────────── */}
          <div className="border-t border-[#30363d] bg-[#161b22] px-6 py-4">

            {/* Quick chips (only when no result) */}
            {!result && !loading && (
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTIONS.slice(0, 3).map(s => (
                  <button
                    key={s}
                    onClick={() => handleSubmit(s)}
                    className="text-[10px] px-2.5 py-1 rounded border border-[#30363d] text-[#8b949e] hover:border-[#3fb950] hover:text-[#3fb950] transition-colors truncate max-w-[220px]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 focus-within:border-[#3fb950] transition-colors">
              <span className="text-[#3fb950] text-sm select-none">❯</span>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask about your analytics..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none typewriter-input"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !input.trim()}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-30 disabled:cursor-not-allowed rounded text-xs text-white font-medium transition-colors"
              >
                {loading
                  ? <span className="cursor-blink">▋</span>
                  : <><Send className="w-3 h-3" /> Send</>
                }
              </button>
            </div>
            <p className="text-[10px] text-[#8b949e] mt-2 text-center">
              Powered by Ollama (tinyllama) · PostgreSQL 15 · FastAPI
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
