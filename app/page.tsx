'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Home, LayoutTemplate, Video, Settings, Briefcase, Users, Target, CheckCircle, Clock, Lightbulb, ArrowRight, Link as LinkIcon, Loader2, FileText, Upload, Printer, Copy, Download, CheckSquare, Square, Check } from 'lucide-react';

interface ContextData {
  lastKnownGoal: string;
  completedSoFar: string[];
  pendingTasks: string[];
  keyDecisions: string[];
  nextStep: string;
  references: string[];
}

export default function FocusResumeDashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ContextData | null>(null);
  const [inputText, setInputText] = useState('');
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LOAD MEMORY & AUTOSAVE DRAFTS
  useEffect(() => {
    const savedDashboard = localStorage.getItem('focusResumeData');
    const savedDraft = localStorage.getItem('focusResumeDraft');
    if (savedDashboard) setData(JSON.parse(savedDashboard));
    if (savedDraft) setInputText(savedDraft);
  }, []);

  // AUTOSAVE TEXT INPUT
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    localStorage.setItem('focusResumeDraft', e.target.value);
  };

  const handleResumeWork = async () => {
    if (!inputText.trim()) {
      alert("Please paste notes or upload a text file first!");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/generate-context', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceData: inputText }) 
      });
      const result = await response.json();
      setData(result);
      setCheckedTasks({}); // Reset checkboxes
      localStorage.setItem('focusResumeData', JSON.stringify(result)); 
      localStorage.removeItem('focusResumeDraft'); // Clear draft on success
    } catch (error) {
      console.error("Failed to fetch context", error);
      alert("Something went wrong with the AI.");
    }
    setLoading(false);
  };

  const handleClearSession = () => {
    setData(null);
    setInputText('');
    setCheckedTasks({});
    localStorage.removeItem('focusResumeData');
    localStorage.removeItem('focusResumeDraft');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const newText = inputText + `\n\n--- Imported from ${file.name} ---\n${text}`;
      setInputText(newText);
      localStorage.setItem('focusResumeDraft', newText);
    };
    reader.readAsText(file);
  };

  // INTERACTIVE CHECKBOXES
  const toggleTask = (index: number) => {
    setCheckedTasks(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // COPY TO CLIPBOARD
  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // EXPORT JSON
  const downloadJSON = () => {
    if (!data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "focus-resume-context.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex h-screen bg-[#0b0b0e] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-white/5 flex flex-col p-4 hidden md:flex print:hidden">
        <div className="bg-[#15151a] p-3 rounded-xl border border-white/5 mb-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition">
          <div className="flex items-center gap-3">
            <div className="bg-white text-black p-1.5 rounded-lg"><Briefcase size={16} /></div>
            <div>
              <p className="text-sm font-semibold">localhost:5000</p>
              <p className="text-xs text-gray-500">Pro Workspace</p>
            </div>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
          <input type="text" placeholder="Search" className="w-full bg-[#15151a] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-purple-500 transition"/>
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="text-xs text-gray-500 font-semibold tracking-wider mb-3">MAIN MENU</p>
          <nav className="space-y-1 mb-8">
            <NavItem icon={<Home size={18} />} label="Home" active />
            <NavItem icon={<LayoutTemplate size={18} />} label="Templates" />
          </nav>

          <p className="text-xs text-gray-500 font-semibold tracking-wider mb-3">PROJECTS</p>
          <nav className="space-y-1">
            <NavItem icon={<Target size={18} />} label="Focus Resume" active/>
            <NavItem icon={<Target size={18} />} label="Alert Intelligence" />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto flex flex-col print:p-0 print:bg-white print:text-black transition-all duration-500">
        <header className="flex justify-between items-center mb-10 shrink-0 print:hidden">
          <h1 className="text-3xl font-semibold tracking-tight">Focus Resume Engine</h1>
          
          <div className="flex gap-3">
            {data && (
              <>
                <button onClick={downloadJSON} className="bg-[#15151a] border border-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                  <Download size={18} /> JSON
                </button>
                <button onClick={() => window.print()} className="bg-[#15151a] border border-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                  <Printer size={18} /> PDF
                </button>
                <button onClick={handleClearSession} className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                  Reset
                </button>
              </>
            )}
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="bg-[#15151a] border border-white/5 rounded-2xl h-48"></div>)}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 print:text-black animate-in fade-in duration-500">
            
            <BentoCard 
              title="Last Known Goal" 
              icon={<Target className="text-purple-400" size={20} />} 
              onCopy={() => copyToClipboard(data.lastKnownGoal, 'goal')}
              isCopied={copiedSection === 'goal'}
            >
              <p className="text-gray-300 print:text-gray-800 leading-relaxed">{data.lastKnownGoal}</p>
            </BentoCard>

            <BentoCard 
              title="Next Logical Step" 
              icon={<ArrowRight className="text-pink-400" size={20} />} 
              highlight
              onCopy={() => copyToClipboard(data.nextStep, 'next')}
              isCopied={copiedSection === 'next'}
            >
              <p className="text-white print:text-black font-medium text-lg leading-relaxed">{data.nextStep}</p>
            </BentoCard>

            <BentoCard 
              title="Interactive Pending Tasks" 
              icon={<Clock className="text-orange-400" size={20} />}
              onCopy={() => copyToClipboard(data.pendingTasks.join('\n'), 'pending')}
              isCopied={copiedSection === 'pending'}
            >
              <ul className="space-y-3">
                {data.pendingTasks.map((task, i) => (
                  <li key={`pending-${i}`} className="flex items-start gap-3 text-sm group cursor-pointer" onClick={() => toggleTask(i)}>
                    <div className="mt-0.5 text-orange-400 transition-transform group-hover:scale-110">
                      {checkedTasks[i] ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                    <span className={`transition-all ${checkedTasks[i] ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                      {task}
                    </span>
                  </li>
                ))}
              </ul>
            </BentoCard>

            <BentoCard 
              title="Completed So Far" 
              icon={<CheckCircle className="text-green-400" size={20} />}
              onCopy={() => copyToClipboard(data.completedSoFar.join('\n'), 'completed')}
              isCopied={copiedSection === 'completed'}
            >
              <ul className="space-y-2">
                {data.completedSoFar.map((task, i) => (
                  <li key={`completed-${i}`} className="flex items-start gap-2 text-sm text-gray-400 line-through opacity-70">
                    <CheckCircle size={14} className="mt-0.5 text-green-500/50 shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </BentoCard>

            <BentoCard 
              title="Key Decisions" 
              icon={<Lightbulb className="text-yellow-400" size={20} />}
              onCopy={() => copyToClipboard(data.keyDecisions.join('\n'), 'decisions')}
              isCopied={copiedSection === 'decisions'}
            >
              <ul className="space-y-2">
                {data.keyDecisions.map((decision, i) => (
                  <li key={`decision-${i}`} className="flex items-start gap-2 text-sm text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                    {decision}
                  </li>
                ))}
              </ul>
            </BentoCard>

            <BentoCard 
              title="Helpful References" 
              icon={<LinkIcon className="text-blue-400" size={20} />}
              onCopy={() => copyToClipboard(data.references.join('\n'), 'refs')}
              isCopied={copiedSection === 'refs'}
            >
              <ul className="space-y-2">
                {data.references.map((ref, i) => (
                  <li key={`ref-${i}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline cursor-pointer p-1.5 rounded-md hover:bg-white/5 transition">
                    <LinkIcon size={14} />
                    {ref}
                  </li>
                ))}
              </ul>
            </BentoCard>

          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full print:hidden">
            <div className="bg-[#15151a] p-8 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col gap-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-500/20 p-3 rounded-xl border border-purple-500/30">
                  <FileText className="text-purple-400" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Reconstruct your context</h2>
                  <p className="text-sm text-gray-400 mt-1">Dump project docs, code, or chat history. We'll organize it instantly.</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 border border-white/5"
                >
                  <Upload size={16} /> Upload Text File (.txt, .md)
                </button>
                <input type="file" accept=".txt,.md,.csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              </div>

              <textarea 
                value={inputText}
                onChange={handleTextChange}
                placeholder="Paste your messy notes, Slack messages, or code here. Your draft auto-saves locally..."
                className="w-full h-56 bg-[#0b0b0e] border border-white/10 rounded-2xl p-5 text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition resize-none custom-scrollbar shadow-inner"
              />
              
              <button 
                onClick={handleResumeWork}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white px-6 py-4 rounded-2xl font-bold shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2 mt-2 text-lg transform hover:-translate-y-0.5"
              >
                <Target size={20} /> Generate Focus Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function BentoCard({ title, icon, children, highlight = false, onCopy, isCopied }: { title: string, icon: React.ReactNode, children: React.ReactNode, highlight?: boolean, onCopy?: () => void, isCopied?: boolean }) {
  return (
    <div className={`group bg-[#15151a] print:bg-white print:border-gray-200 p-6 rounded-3xl border ${highlight ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] print:shadow-none' : 'border-white/5'} flex flex-col h-full relative overflow-hidden transition-all hover:border-white/10`}>
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-semibold text-white/90 print:text-black tracking-wide text-sm uppercase">{title}</h3>
        <div className="flex items-center gap-2">
          {onCopy && (
            <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 hover:bg-white/10 p-1.5 rounded-md text-gray-400 hover:text-white print:hidden">
              {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          )}
          {icon}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}