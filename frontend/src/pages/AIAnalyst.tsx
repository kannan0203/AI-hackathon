import React, { useContext, useRef, useEffect, useState } from 'react';
import { Send, MessageSquare, ChevronDown, ChevronUp, BarChart2, Table, Lightbulb, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { queryData } from '../services/api';
import { AppContext } from '../App';
import NoDataState from '../components/NoDataState';
import type { QueryResponse } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const SAMPLE_QUESTIONS = [
  'What is my total revenue?',
  'Which product is performing worst?',
  'Which region is performing best?',
  'Why did sales decrease?',
  'What are my top 5 products?',
  'Are there any unusual transactions?',
  'What business insights can you find?',
  'Which products need attention?',
];

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  response?: QueryResponse;
  loading?: boolean;
  error?: string;
}

function EvidenceSection({ response }: { response: QueryResponse }) {
  const [expanded, setExpanded] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const evidenceEntries = Object.entries(response.evidence).filter(([k]) =>
    !['all_products_ranked', 'product_ranking', 'region_ranking', 'monthly_trend', 'anomaly_list'].includes(k)
  );

  return (
    <div className="mt-4 space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        🔍 {expanded ? 'Hide Evidence' : 'View Evidence'}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-gray-100 pt-4">
          {/* Evidence */}
          {evidenceEntries.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-3 text-sm">📊 Evidence</h4>
              <div className="grid grid-cols-2 gap-3">
                {evidenceEntries.map(([key, value]) => (
                  <div key={key} className="bg-white rounded-lg p-3">
                    <p className="text-blue-600 text-xs font-medium capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                    <p className="text-blue-900 font-bold text-sm">
                      {typeof value === 'number'
                        ? (key.includes('revenue') || key.includes('sales') ? `$${(value as number).toLocaleString()}` : String(value))
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculation */}
          {response.calculation && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">🧮 Calculation</h4>
              <code className="text-gray-700 text-sm font-mono whitespace-pre-wrap">{response.calculation}</code>
            </div>
          )}

          {/* Chart */}
          {response.chart_data && response.chart_data.data.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Visualization
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                {response.chart_data.type === 'pie' ? (
                  <PieChart>
                    <Pie data={response.chart_data.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {response.chart_data.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                  </PieChart>
                ) : response.chart_data.type === 'line' ? (
                  <LineChart data={response.chart_data.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Sales']} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                ) : (
                  <BarChart data={response.chart_data.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Sales']} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {response.chart_data.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Source Data */}
          {response.source_data.length > 0 && (
            <div>
              <button
                onClick={() => setShowSource(!showSource)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium mb-2"
              >
                <Table className="w-4 h-4" />
                {showSource ? 'Hide' : 'Show'} Source Data ({response.source_data.length} rows)
              </button>
              {showSource && (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(response.source_data[0] || {}).map(k => (
                          <th key={k} className="text-left py-2 px-3 text-gray-600 font-semibold whitespace-nowrap">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {response.source_data.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="py-2 px-3 text-gray-700 whitespace-nowrap">{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Business Impact */}
          {response.business_impact && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-semibold text-amber-900 mb-2 text-sm">💼 Business Impact</h4>
              <p className="text-amber-800 text-sm">{response.business_impact}</p>
            </div>
          )}

          {/* Recommendation */}
          {response.recommendation && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-2 text-sm">✅ Recommendation</h4>
              <p className="text-green-800 text-sm">{response.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIAnalyst() {
  const { appState } = useContext(AppContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!appState.datasetLoaded) return <NoDataState />;

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: question };
    const loadingMsg: Message = { id: (Date.now() + 1).toString(), type: 'assistant', content: '', loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await queryData(question);
      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, loading: false, content: response.answer, response } : m
      ));
    } catch (e: unknown) {
      const errMsg = (e as {response?: {data?: {detail?: string}}})?.response?.data?.detail || 'Failed to process query.';
      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, loading: false, content: '', error: errMsg } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">AI Business Analyst</h1>
        <p className="text-gray-500 text-sm mt-1">Ask questions about your data. Get explainable, evidence-backed answers.</p>
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="mb-4 flex-shrink-0">
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Suggested questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Ask your first question</p>
              <p className="text-gray-400 text-sm">Your data is ready to be analyzed</p>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl rounded-2xl px-5 py-4 ${
              msg.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              {msg.loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-gray-500">Analyzing your data...</span>
                </div>
              ) : msg.error ? (
                <p className="text-red-600">{msg.error}</p>
              ) : (
                <>
                  <p className={msg.type === 'user' ? 'text-white' : 'text-gray-900'}>{msg.content}</p>
                  {msg.response && <EvidenceSection response={msg.response} />}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 bg-white border border-gray-200 rounded-2xl p-3 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask a business question about your data..."
          className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl p-2.5 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
