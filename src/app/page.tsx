'use client';

import { useState } from 'react';
import { Bot, User, Loader2, Code2, AlertCircle, LayoutPanelLeft, ChevronLeft, Menu, MessageSquare, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const SUGGESTIONS = [
  "今日の東京の天気を教えて",
  "最新のAIニュースを調べて",
  "画面の背景色を薄い青色に変えて"
];

type StepData = {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolCalls: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolResults: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestMessages?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseMessages?: any[];
};

type ProcessData = {
  finalAnswer: string | null;
  steps: StepData[];
  systemPrompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolsSchema: any[];
  error?: string;
};

export default function Dashboard() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'prompts' | 'tools' | 'raw'>('menu');
  const [mainTab, setMainTab] = useState<'chat' | 'sequence' | 'dashboard' | 'architecture'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [processData, setProcessData] = useState<ProcessData | null>(null);
  const [dynamicBgColor, setDynamicBgColor] = useState('#f8fafc');

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    setProcessData(null);
    setInput(text);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });
      const data: ProcessData = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'エラーが発生しました');
      }

      setProcessData(data);

      // 背景色変更の検知
      data.steps.forEach(step => {
        step.toolResults?.forEach(tr => {
          if (tr.toolName === 'change_bg_color' && tr.output?.color) {
            setDynamicBgColor(tr.output.color);
          }
        });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setProcessData({
        finalAnswer: null,
        steps: [],
        systemPrompt: '',
        toolsSchema: [],
        error: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col md:flex-row h-[100dvh] text-slate-800 font-sans selection:bg-emerald-500/30 transition-colors duration-500 overflow-hidden relative"
      style={{ backgroundColor: dynamicBgColor }}
    >
      {/* Sidebar Navigation (Modal Overlay on Mobile/Tablet when open) */}
      <nav className={`absolute md:relative shrink-0 bg-[#0a0c10] text-slate-300 flex flex-col border-r border-[#2d3139] z-50 shadow-2xl transition-all duration-300 h-full ${isSidebarOpen ? 'w-64 lg:w-72 left-0' : 'w-16 md:w-20 -left-16 md:left-0'}`}>
        <header className={`p-4 border-b border-[#2d3139] flex items-center shrink-0 h-[73px] ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen ? 'hidden md:hidden' : ''}`}>
            <div className="bg-emerald-500/20 p-2 rounded-lg shrink-0">
              <LayoutPanelLeft className="text-emerald-500" size={24} />
            </div>
            <h1 className="text-base md:text-[15px] font-bold text-slate-100 leading-tight whitespace-nowrap">
              AIエージェントの<br /><span className="text-slate-300">深掘り</span>
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`text-slate-400 hover:text-white shrink-0 items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors ${!isSidebarOpen ? 'hidden md:flex' : 'flex'}`}>
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <div className="flex flex-col overflow-y-auto overflow-x-hidden p-2 gap-2 custom-scrollbar shrink-0">
          <button
            onClick={() => { setMainTab('chat'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            className={`w-full px-4 py-3 flex items-center justify-center ${isSidebarOpen ? 'md:justify-start' : 'md:justify-center'} gap-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${mainTab === 'chat' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
            title="対話"
          >
            <MessageSquare size={18} className="shrink-0" /> {isSidebarOpen && <span>対話</span>}
          </button>
          <button
            onClick={() => { setMainTab('sequence'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            className={`w-full px-4 py-3 flex items-center justify-center ${isSidebarOpen ? 'md:justify-start' : 'md:justify-center'} gap-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${mainTab === 'sequence' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
            title="シーケンス"
          >
            <Activity size={18} className="shrink-0" /> {isSidebarOpen && <span>シーケンス</span>}
          </button>
          <button
            onClick={() => { setMainTab('dashboard'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            className={`w-full px-4 py-3 flex items-center justify-center ${isSidebarOpen ? 'md:justify-start' : 'md:justify-center'} gap-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${mainTab === 'dashboard' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
            title="ペイロード詳細"
          >
            <Code2 size={18} className="shrink-0" /> {isSidebarOpen && <span>ペイロード詳細</span>}
          </button>
          <button
            onClick={() => { setMainTab('architecture'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            className={`w-full px-4 py-3 flex items-center justify-center ${isSidebarOpen ? 'md:justify-start' : 'md:justify-center'} gap-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${mainTab === 'architecture' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-inner' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
            title="技術スタック"
          >
            <AlertCircle size={18} className="shrink-0" /> {isSidebarOpen && <span>技術スタック</span>}
          </button>
        </div>
      </nav>

      {/* Mobile Open Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 relative bg-transparent transition-all duration-300 ${isSidebarOpen ? 'md:ml-0' : 'md:ml-0 ml-16'}`}>


        {/* タブ1: 対話ペイン */}
        <div className={`flex-1 flex-col h-full bg-white/40 backdrop-blur-sm z-10 overflow-hidden ${mainTab === 'chat' ? 'flex' : 'hidden'}`}>
          <header className="px-4 border-b border-slate-200 flex items-center justify-between shadow-sm shrink-0 h-[73px] bg-white/80">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-slate-500 hover:text-slate-800 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="メニューを開く"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <MessageSquare className="text-emerald-600" size={24} />
                エージェント対話
              </h2>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            {!processData && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-6">
                <Bot size={48} className="opacity-20 mb-2" />
                <div className="text-center space-y-3">
                  <h2 className="text-lg font-bold text-slate-700">質問を投げかけてみてください</h2>
                  <p className="text-sm max-w-sm">エージェントが自律的にツールを選択して回答を生成します。詳細はシーケンスタブやダッシュボードで確認できます。</p>
                </div>
                <div className="flex flex-col gap-2 mt-4 items-center w-full max-w-md">
                  <p className="text-xs font-bold text-slate-400 uppercase">おすすめの質問</p>
                  {SUGGESTIONS.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => { setMainTab('chat'); setInput(text); handleSubmit(text); }}
                      className="w-full text-left px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium transition-all shadow-sm text-slate-700"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ユーザー入力 */}
            {(input || isLoading || processData) && (
              <div className="p-5 rounded-2xl bg-blue-600 text-white shadow-sm ml-auto max-w-[90%]">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-blue-100">
                  <User size={16} /> 質問
                </div>
                <div className="text-[15px]">{input}</div>
              </div>
            )}

            {/* 処理シーケンスのローディング表示 */}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex py-8 items-center justify-center gap-3 text-sm text-emerald-600 font-medium">
                <Loader2 size={20} className="animate-spin" /> エージェントの推論とツール実行を待機中...
              </motion.div>
            )}

            {/* エラー表示 */}
            {processData?.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-start gap-4">
                <AlertCircle className="mt-0.5" size={20} />
                <div>
                  <div className="font-bold text-[15px]">エラーが発生しました</div>
                  <div className="text-sm mt-1">{processData.error}</div>
                </div>
              </div>
            )}

            {/* 最終回答 */}
            {processData?.finalAnswer && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm mr-auto max-w-[95%]">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-500">
                    <Bot size={16} className="text-emerald-500" /> 最終出力（ユーザーへの回答）
                  </div>
                  <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-slate-800">
                    {processData.finalAnswer}
                  </div>
                </div>
              </motion.div>
            )}
          </main>

          {processData && (
            <footer className="p-4 bg-white/80 border-t border-slate-200 shrink-0 text-center backdrop-blur-sm">
              <button
                onClick={() => { setProcessData(null); setInput(''); }}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-colors"
              >
                新しく質問する
              </button>
            </footer>
          )}
        </div>

        {/* タブ2: シーケンスペイン */}
        <div className={`flex-1 flex-col h-full bg-white/40 backdrop-blur-sm z-10 overflow-hidden ${mainTab === 'sequence' ? 'flex' : 'hidden'}`}>
          <header className="px-4 border-b border-slate-200 flex items-center justify-between shadow-sm shrink-0 h-[73px] bg-white/80">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-slate-500 hover:text-slate-800 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="メニューを開く"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <Activity className="text-emerald-600" size={24} />
                実行シーケンス
              </h2>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            {!processData && !isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-center px-4">
                対話タブから質問を送信すると、ここに実行フローのアニメーションが表示されます。
              </div>
            ) : null}

            {/* 簡易シーケンス表示 (アクターごとのフロー) */}
            {processData?.steps && processData.steps.length > 0 && (
              <div className="pt-2">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:w-0.5 before:bg-slate-200">

                  {/* User Input Event */}
                  <div className="relative pl-8">
                    <span className="absolute left-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ring-4 ring-white/50 shadow-sm">
                      <User size={12} className="text-white" />
                    </span>
                    <div className="text-sm font-bold text-slate-700">User</div>
                    <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 mt-1 shadow-sm inline-block">
                      <span className="font-bold block text-blue-600 mb-1">Q. {input}</span>
                      質問が送信されました
                    </div>
                  </div>

                  {processData.steps.map((step, idx) => (
                    <div key={idx} className="space-y-6">
                      {/* LLM Inference Event */}
                      <div className="relative pl-8">
                        <span className="absolute left-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center ring-4 ring-white/50 shadow-sm">
                          <Bot size={12} className="text-white" />
                        </span>
                        <div className="text-sm font-bold text-slate-700">LLM <span className="text-xs font-normal text-slate-500">(Step {idx + 1})</span></div>
                        <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 mt-1 shadow-sm inline-block">
                          推論を実行しました
                          {step.toolCalls && step.toolCalls.length > 0 ? (
                            <div className="text-purple-600 mt-1 font-semibold">→ Agentにツールの使用を指示</div>
                          ) : (
                            <div className="text-purple-600 mt-1 font-semibold">→ 回答を生成</div>
                          )}
                        </div>
                      </div>

                      {/* Agent Tool Execution Event */}
                      {step.toolCalls && step.toolCalls.length > 0 && (
                        <div className="relative pl-8">
                          <span className="absolute left-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-4 ring-white/50 shadow-sm">
                            <Code2 size={12} className="text-white" />
                          </span>
                          <div className="text-sm font-bold text-slate-700">Agent System</div>
                          <div className="text-xs text-slate-600 bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 mt-1 shadow-sm block w-full max-w-3xl space-y-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {step.toolCalls.map((tc: any, tci: number) => {
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const result = step.toolResults?.find((tr: any) => tr.toolCallId === tc.toolCallId);
                              const args = tc.args || tc.input || {};
                              const out = result?.result || result?.output || "実行中...";

                              return (
                                <div key={tci} className="bg-white p-3 rounded-lg border border-emerald-100 overflow-hidden">
                                  <div className="text-emerald-700 mx-1 font-mono font-bold flex items-center gap-2 mb-2">
                                    <Code2 size={16} /> <span className="text-sm">{tc.toolName}()</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">引数 (Request)</div>
                                      <pre className="overflow-x-auto text-[11px] font-mono text-slate-700 whitespace-pre-wrap">{JSON.stringify(args, null, 2)}</pre>
                                    </div>
                                    <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                                      <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">実行結果 (Response)</div>
                                      <pre className="overflow-x-auto max-h-56 custom-scrollbar text-[11px] font-mono text-emerald-900 whitespace-pre-wrap">{JSON.stringify(out, null, 2)}</pre>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* 右ペイン：詳細ダッシュボード */}
        <div className={`flex-1 flex-col h-full bg-white/40 backdrop-blur-sm shadow-inner z-20 overflow-hidden ${mainTab === 'dashboard' ? 'flex' : 'hidden'}`}>
          <header className="px-4 border-b border-slate-200 flex items-center gap-2 shadow-sm shrink-0 h-[73px] bg-white/80">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-800 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="メニューを開く"
            >
              <Menu size={24} />
            </button>
            <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto custom-scrollbar">
              {[
                { id: 'menu', label: '1. メニュー表' },
                { id: 'prompts', label: '2. LLM送受信' },
                { id: 'tools', label: '3. ツールIO詳細' },
                { id: 'raw', label: 'Raw JSON' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-xs font-semibold whitespace-nowrap rounded-md transition-all ${activeTab === tab.id
                    ? 'text-emerald-700 bg-white shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 font-mono text-xs lg:text-sm custom-scrollbar relative">
            {!processData && !isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                対話画面から質問を送信すると、ここに詳細なペイロードが表示されます。
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">
                Generating payload data...
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                {/* タブ1: メニュー表 */}
                {activeTab === 'menu' && (
                  <>
                    <section>
                      <h3 className="text-emerald-700 font-bold mb-3 flex items-center gap-2 uppercase tracking-widest text-xs border-b border-slate-200 pb-2">
                        System Prompt
                      </h3>
                      <div className="bg-white p-4 rounded-xl text-blue-800 whitespace-pre-wrap leading-relaxed shadow-sm border border-slate-200">
                        {processData?.systemPrompt}
                      </div>
                    </section>
                    <section>
                      <h3 className="text-emerald-700 font-bold mb-3 flex items-center gap-2 uppercase tracking-widest text-xs border-b border-slate-200 pb-2 mt-8">
                        Available Tools Schema
                      </h3>
                      <div className="bg-white p-4 rounded-xl text-amber-700 overflow-x-auto shadow-sm border border-slate-200">
                        <pre>{JSON.stringify(processData?.toolsSchema, null, 2)}</pre>
                      </div>
                    </section>
                  </>
                )}

                {/* タブ2: LLM送受信ログ (Prompt & Response) */}
                {activeTab === 'prompts' && (
                  <div className="space-y-8">
                    {processData?.steps.map((step, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-3 font-bold text-slate-700 text-xs flex justify-between items-center border-b border-slate-200">
                          <span className="flex items-center gap-2"><Bot size={14} className="text-purple-600" /> Step {idx + 1} Communication</span>
                          <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Tokens: {step.usage?.totalTokens || 'N/A'}</span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                          {/* Agent -> LLM (Request) */}
                          <div className="p-4 bg-slate-50/50">
                            <div className="text-xs font-bold text-blue-600 mb-3 flex items-center gap-2 uppercase tracking-wide">
                              <Code2 size={12} /> Agent → LLM <span className="text-slate-500 normal-case font-normal">(Request Payload)</span>
                            </div>
                            <div className="text-slate-700 overflow-x-auto max-h-[400px] custom-scrollbar text-xs bg-white p-3 rounded border border-slate-200">
                              {step.requestMessages ? (
                                <pre className="whitespace-pre-wrap font-mono">{JSON.stringify(step.requestMessages, null, 2)}</pre>
                              ) : (
                                <span className="text-slate-400 italic">No explicit prompt payload captured in this step.</span>
                              )}
                            </div>
                          </div>

                          {/* LLM -> Agent (Response) */}
                          <div className="p-4 bg-white">
                            <div className="text-xs font-bold text-purple-600 mb-3 flex items-center gap-2 uppercase tracking-wide">
                              <Bot size={12} /> LLM → Agent <span className="text-slate-500 normal-case font-normal">(Response Payload)</span>
                            </div>
                            <div className="text-slate-700 overflow-x-auto max-h-[400px] custom-scrollbar text-xs bg-slate-50 p-3 rounded border border-slate-200">
                              {step.responseMessages ? (
                                <pre className="whitespace-pre-wrap font-mono">{JSON.stringify(step.responseMessages, null, 2)}</pre>
                              ) : (
                                <span className="text-slate-400 italic">No explicit response payload captured in this step.</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Agent Tool Execution (action taken based on LLM response) */}
                        {step.toolCalls && step.toolCalls.length > 0 && (
                          <div className="border-t border-slate-200 bg-emerald-50/30 p-4">
                            <div className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                              <Code2 size={12} /> Agent → Tool Execution <span className="text-slate-500 normal-case font-normal">(LLMの指示に基づきツールを実行)</span>
                            </div>
                            <div className="space-y-4">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {step.toolCalls.map((tc: any, i: number) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const result = step.toolResults?.find((tr: any) => tr.toolCallId === tc.toolCallId);
                                return (
                                  <div key={i} className="bg-white p-4 rounded border border-emerald-100 grid grid-cols-1 lg:grid-cols-2 gap-4 shadow-sm">
                                    <div>
                                      <div className="text-slate-400 text-[10px] uppercase mb-1">Execution Call (Args)</div>
                                      <pre className="text-emerald-700 text-xs overflow-x-auto font-mono bg-emerald-50 p-2 rounded border border-emerald-100">{tc.toolName}({JSON.stringify(tc.args, null, 2)})</pre>
                                    </div>
                                    <div>
                                      <div className="text-slate-400 text-[10px] uppercase mb-1">Execution Result (Output)</div>
                                      <pre className="text-slate-700 text-xs overflow-x-auto max-h-40 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                                        {JSON.stringify(result?.output || result?.error || "待機中...", null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}

                {/* タブ3: ツールIO */}
                {activeTab === 'tools' && (
                  <div className="space-y-8">
                    {processData?.steps.map((step, idx) => {
                      const hasTools = step.toolCalls && step.toolCalls.length > 0;
                      if (!hasTools) return null;

                      return (
                        <div key={idx} className="space-y-4">
                          <div className="text-slate-700 text-xs font-bold border-b border-slate-200 pb-1">
                            Step {idx + 1} Tools
                          </div>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {step.toolCalls?.map((tc: any, tci: number) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const result = step.toolResults?.find((tr: any) => tr.toolCallId === tc.toolCallId);
                            return (
                              <div key={tci} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-blue-600 text-xs mb-2">Request (Call): <span className="font-bold">{tc.toolName}</span></div>
                                  <pre className="text-slate-700 text-xs overflow-x-auto bg-slate-50 p-2 rounded border border-slate-100">{JSON.stringify(tc.args, null, 2)}</pre>
                                </div>
                                <div className="lg:border-l border-slate-200 mt-2 pt-2 border-t lg:mt-0 lg:pt-0 lg:border-t-0 lg:pl-4">
                                  <div className="text-emerald-600 text-xs mb-2">Response (Result):</div>
                                  <pre className="text-slate-700 text-xs overflow-x-auto max-h-60 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                                    {JSON.stringify(result?.output || result?.error || "待機中...", null, 2)}
                                  </pre>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {processData?.steps.every(s => !s.toolCalls || s.toolCalls.length === 0) && (
                      <div className="text-slate-500 text-center py-10 bg-white rounded-xl border border-slate-200 shadow-sm">
                        ツール呼び出しは実行されませんでした。
                      </div>
                    )}
                  </div>
                )}

                {/* タブ4: RAW JSON */}
                {activeTab === 'raw' && (
                  <div className="bg-white p-4 rounded-xl text-slate-700 overflow-x-auto shadow-sm border border-slate-200 text-xs">
                    <pre>{JSON.stringify(processData, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* アーキテクチャ・スタック解説ペイン */}
        <div className={`flex-1 flex-col h-full bg-slate-50 overflow-y-auto z-20 ${mainTab === 'architecture' ? 'flex' : 'hidden'}`}>
          <header className="px-4 border-b border-slate-200 flex items-center gap-3 shadow-sm shrink-0 h-[73px] bg-white sticky top-0 z-10 w-full">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-500 hover:text-slate-800 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="メニューを開く"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <AlertCircle className="text-purple-600" size={24} />
              技術スタック詳細
            </h2>
          </header>

          <div className="p-6 md:p-12 pb-20 w-full max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-slate-800 border-b-4 border-emerald-500 pb-4 inline-block">システム構成と技術スタック</h2>

            <div className="space-y-12">
              <section>
                <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2"><Code2 /> Frontend & UI</h3>
                <ul className="list-disc pl-5 space-y-2 text-slate-700">
                  <li><strong>Next.js (App Router):</strong> 基盤となるフレームワーク。</li>
                  <li><strong>Tailwind CSS:</strong> ユーティリティファーストでの柔軟でモダンなスタイリング。レスポンシブなタブとグリッドレイアウトを実現。</li>
                  <li><strong>Framer Motion:</strong> 流れるようなアニメーションやローディングステートの演出。</li>
                  <li><strong>Lucide React:</strong> 軽量で美しいSVGアイコン。</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2"><Bot /> Backend & AI Engine</h3>
                <ul className="list-disc pl-5 space-y-4 text-slate-700">
                  <li><strong>Next.js API Routes:</strong> プロキシおよびステートレスなバックエンドAPIとして機能。</li>
                  <li>
                    <strong>Gemini 3 Flash Preview (詳しく):</strong>
                    <div className="bg-white p-4 rounded-xl mt-3 border border-slate-200 text-sm overflow-hidden shadow-sm">
                      <p className="mb-4">Googleの高性能LLM。高速な推論と関数の並行呼び出し（Parallel Function Calling）を利用しています。<br />推論を投げる際、バックエンドでは以下のような設定・プロンプトを全てリクエストペイロード（JSON）にまとめて送信しています。</p>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-emerald-50 border-y border-emerald-100">
                              <th className="py-2 px-3 font-semibold text-emerald-800 border-r border-emerald-100 w-1/4">設定項目 (カラム)</th>
                              <th className="py-2 px-3 font-semibold text-emerald-800">設定内容・役割</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            <tr>
                              <td className="py-3 px-3 border-r border-slate-100 font-mono text-xs bg-slate-50"><strong>model</strong></td>
                              <td className="py-3 px-3"><code>gemini-3-flash-preview</code><br />使用するLLMのモデル名を指定。</td>
                            </tr>
                            <tr>
                              <td className="py-3 px-3 border-r border-slate-100 font-mono text-xs bg-slate-50"><strong>system</strong><br />(System Instruction)</td>
                              <td className="py-3 px-3"><strong>AIの大前提となる命令</strong>。<br />「親切なアシスタントであること」「日時を明記すること」「ツールをループさせず必要な情報を一度でとること」などを明確に指示。</td>
                            </tr>
                            <tr>
                              <td className="py-3 px-3 border-r border-slate-100 font-mono text-xs bg-slate-50"><strong>prompt / messages</strong><br />(Chat History)</td>
                              <td className="py-3 px-3"><strong>直近の質問＆これまでの会話履歴</strong>。<br />ユーザーのリクエスト内容だけでなく、対話のコンテキストを全て配列で保持して送信。</td>
                            </tr>
                            <tr>
                              <td className="py-3 px-3 border-r border-slate-100 font-mono text-xs bg-slate-50"><strong>tools</strong><br />(Function Declarations)</td>
                              <td className="py-3 px-3"><strong>AIが自律的に実行可能な関数群の定義</strong>。<br />「検索(`search`)」「天気(`get_weather`)」「背景色変更(`change_bg_color`)」の説明と、それぞれに必要な<strong>引数の型（Zodスキーマ）</strong>を関数一覧として渡す。</td>
                            </tr>
                            <tr>
                              <td className="py-3 px-3 border-r border-slate-100 font-mono text-xs bg-slate-50"><strong>stopWhen</strong><br />(maxSteps/ループ制限)</td>
                              <td className="py-3 px-3"><strong>エージェント最大再帰回数</strong> <code>stepCountIs(5)</code><br />LLMがツールを使い続ける無限ループを防ぐため、実行の往復（推論⇄ツール実行）の上限を5回に制限。</td>
                            </tr>
                            <tr>
                              <td className="py-3 px-3 border-r border-slate-100 font-mono text-xs bg-slate-50"><strong>Message Payloads</strong><br />(実行中のやり取り)</td>
                              <td className="py-3 px-3">ツール名と引数(JSON)を含む <strong>Tool Callリクエスト</strong> や、API実行結果を含む <strong>Tool Resultレスポンス</strong> などが、テキストの他に裏側でやりとりされる。</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </li>
                  <li>
                    <strong>Vercel AI SDK:</strong>
                    <div className="bg-white p-3 rounded mt-2 border border-slate-200 text-sm">
                      <p className="mb-2">このプロジェクトでAIの統合を容易にしているコアライブラリです。<code>@ai-sdk/google</code> というプロバイダパッケージを通じて Gemini を呼び出しています。</p>
                      <p className="mb-2">通常、LLMとの直接的なAPI通信を書く場合は、ベンダーごとのスキーマやストリーミング処理を自作する必要がありますが、AI SDKはそれらを <strong>抽象化・標準化</strong> します。</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>プロバイダを変更するだけで（例: <code>@ai-sdk/openai</code>に差し替えて <code>openai(&apos;gpt-4o&apos;)</code> にするだけ）、同じコードのまま他のLLM（ChatGPTやClaudeなど）へ乗り換えが可能です。</li>
                        <li><code>generateText</code> を使って自律的なAgentループ（推論 → ツール実行 → 再推論）を <code>stepCountIs(5)</code> など短い記述で実現しています。</li>
                      </ul>
                    </div>
                  </li>
                  <li><strong>Zod:</strong> ツール引数のスキーマ定義およびバリデーションを堅牢にするライブラリ。</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-emerald-600 mb-4 flex items-center gap-2"><LayoutPanelLeft /> Tools (関数群)</h3>
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2">1. Tavily Search API (<code>search</code>)</h4>
                    <p className="text-sm text-slate-600">LLM専用の検索エンジンAPI。直近のニュース検索のため、内部で <code>topic: &apos;news&apos;</code> などの詳細なパラメータ付与を行っています。</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2">2. Tsukumijima Weather (<code>get_weather</code>)</h4>
                    <p className="text-sm text-slate-600">気象庁データをJSONで返す無料API。都市名と都市コードの紐づけのために <code>primary_area.xml</code> をその都度フェッチして自動解決する仕組みを備えています。</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-2">3. UI Controller (<code>change_bg_color</code>)</h4>
                    <p className="text-sm text-slate-600">フロントエンドのReact Stateと連動し、背景色を変えてみせるなど「AIエージェントによるUI操作」を疑似的に体験できるモック機能です。</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
