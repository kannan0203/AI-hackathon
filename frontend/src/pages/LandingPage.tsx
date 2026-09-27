import React from 'react';
import { BarChart3, Brain, Shield, TrendingUp, Upload, MessageSquare, ChevronRight, Zap } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export default function LandingPage({ onGetStarted, onTryDemo }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">BizInsight AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onGetStarted} className="text-gray-300 hover:text-white transition-colors">Upload Data</button>
            <button onClick={onTryDemo} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">Try Demo</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-8">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300 text-sm font-medium">AI-Powered Business Intelligence</span>
        </div>

        <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
          Turn Business Data Into
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Explainable Decisions</span>
        </h1>

        <p className="text-xl text-gray-400 mb-4 max-w-3xl mx-auto">
          Upload your business data. Ask questions in natural language.
          Get answers backed by evidence.
        </p>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
          Every insight includes calculations, source data, and data-backed recommendations — no black box AI.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Upload className="w-5 h-5" />
            Get Started
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onTryDemo}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-white/20"
          >
            <BarChart3 className="w-5 h-5" />
            Try Demo
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Everything You Need to Understand Your Business</h2>
          <p className="text-gray-400">From raw data to actionable decisions in minutes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Upload, title: 'Smart Data Upload', desc: 'Upload CSV or Excel files. Auto-detect columns, compute KPIs instantly.', color: 'text-blue-400' },
            { icon: BarChart3, title: 'Executive Dashboard', desc: 'Interactive charts for revenue trends, product performance, and regional analysis.', color: 'text-green-400' },
            { icon: MessageSquare, title: 'AI Business Chat', desc: 'Ask natural language questions. Get answers with evidence and source data.', color: 'text-purple-400' },
            { icon: Shield, title: 'Explainable AI', desc: 'Every answer shows calculations, source rows, and evidence. No black box.', color: 'text-yellow-400' },
            { icon: TrendingUp, title: 'Anomaly Detection', desc: 'Statistical IQR-based detection flags unusual transactions automatically.', color: 'text-red-400' },
            { icon: Brain, title: 'Decision Assistant', desc: 'Get data-backed recommendations on focus areas and business risks.', color: 'text-cyan-400' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
              <Icon className={`w-10 h-10 ${color} mb-4`} />
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {[
            { step: '01', title: 'Upload Data', desc: 'CSV or Excel file' },
            { step: '02', title: 'Auto Analysis', desc: 'Instant KPI generation' },
            { step: '03', title: 'Ask Questions', desc: 'Natural language' },
            { step: '04', title: 'Get Evidence', desc: 'Backed by data' },
          ].map((item, i) => (
            <React.Fragment key={item.step}>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">{item.step}</div>
                <div className="text-white font-medium">{item.title}</div>
                <div className="text-gray-400 text-sm">{item.desc}</div>
              </div>
              {i < 3 && <ChevronRight className="w-6 h-6 text-gray-600 hidden md:block" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center">
        <p className="text-gray-500">BizInsight AI — <span className="text-gray-400">"From Raw Data to Explainable Decisions."</span></p>
      </footer>
    </div>
  );
}
