import React, { useContext, useRef, useEffect, useState } from 'react';
import { Send, Compass, Loader2, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { makeDecision } from '../services/api';
import { AppContext } from '../App';
import NoDataState from '../components/NoDataState';
import type { DecisionResponse } from '../types';

const DECISION_QUESTIONS = [
  'What should I focus on next month?',
  'Which product needs attention?',
  'Where are we losing revenue?',
  'Which region should receive more attention?',
  'What business risks can you identify?',
  'What is the best growth opportunity?',
];

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  response?: DecisionResponse;
  loading?: boolean;
  error?: string;
}

function DecisionCard({ response }: { response: DecisionResponse }) {
  return (
    <div className="space-y-4 mt-3">
      <div className="bg-blue-50 rounded-xl p-4">
        <h4 className="text-blue-900 font-semibold mb-2 flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4" /> Analysis
        </h4>
        <p className="text-blue-800 text-sm">{response.analysis}</p>
      </div>

      {response.key_findings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-gray-900 font-semibold mb-3 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" /> Key Findings
          </h4>
          <ul className="space-y-2">
            {response.key_findings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold mt-0.5">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h4 className="text-green-900 font-semibold mb-2 flex items-center gap-2 text-sm">
          <Target className="w-4 h-4" /> Recommendation
        </h4>
        <p className="text-green-800 text-sm">{response.recommendation}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">Confidence:</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          response.confidence === 'high' ? 'bg-green-100 text-green-700' :
          response.confidence === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {response.confidence}
        </span>
      </div>
    </div>
  );
}

export default function DecisionAssistant() {
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
      const response = await makeDecision(question);
      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, loading: false, content: response.recommendation, response } : m
      ));
    } catch (_e: unknown) {
      setMessages(prev => prev.map(m =>
        m.loading ? { ...m, loading: false, content: '', error: 'Failed to generate decision analysis.' } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Decision Assistant</h1>
        <p className="text-gray-500 text-sm mt-1">Data-backed business recommendations. All insights from your actual data.</p>
      </div>

      {messages.length === 0 && (
        <div className="mb-4 flex-shrink-0">
          <p className="text-sm text-gray-500 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {DECISION_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Ask for strategic guidance</p>
              <p className="text-gray-400 text-sm">All recommendations are based on your data</p>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl rounded-2xl px-5 py-4 ${
              msg.type === 'user' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200'
            }`}>
              {msg.loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  <span className="text-gray-500">Analyzing business data...</span>
                </div>
              ) : msg.error ? (
                <p className="text-red-600">{msg.error}</p>
              ) : (
                <>
                  <p className={msg.type === 'user' ? 'text-white' : 'text-gray-900'}>{msg.content}</p>
                  {msg.response && <DecisionCard response={msg.response} />}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3 bg-white border border-gray-200 rounded-2xl p-3 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask for a business decision or recommendation..."
          className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-xl p-2.5 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
