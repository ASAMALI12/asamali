import React, { useState } from 'react';
import { 
  FolderArchive, 
  FileCode, 
  Cpu, 
  Download, 
  CheckCircle2, 
  Layers, 
  Code2, 
  Sparkles,
  RefreshCw,
  Folder
} from 'lucide-react';
import { SmartZipCore, MobileAppConfig } from '../types';
import { generateSmartCoreZipBlob } from '../services/zipEngine';

interface ZipInspectorViewProps {
  zipCore: SmartZipCore;
  currentApp: MobileAppConfig;
  onOpenPhoneFilePicker: () => void;
}

export const ZipInspectorView: React.FC<ZipInspectorViewProps> = ({
  zipCore,
  currentApp,
  onOpenPhoneFilePicker,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'appJson' | 'manifest'>('files');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateSmartCoreZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${zipCore.manifest.name || 'smart-core'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-32">
      {/* Top Banner Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <FolderArchive className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">
                {zipCore.fileName || 'ملف النواة الذكي المدمج'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE CORE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              هذا الملف هو قلب ونواة المحرك، يحوي كافة المكتبات والمكونات البرمجية التي تترجم طلباتك الصوتية والتكست إلى تطبيق حي على شاشة الهاتف.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={onOpenPhoneFilePicker}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all flex items-center justify-center gap-2"
          >
            <FolderArchive className="w-4 h-4" />
            <span>اختيار ZIP من الهاتف</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>تحميل النواة</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            المحرك النيورالي
          </span>
          <p className="text-sm font-bold font-mono text-white truncate">{zipCore.manifest.engine}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            المكتبات المحملة
          </span>
          <p className="text-sm font-bold font-mono text-emerald-400">{zipCore.manifest.libraries.length} مكتبات أساسية</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            المكونات الجاهزة
          </span>
          <p className="text-sm font-bold font-mono text-amber-400">{zipCore.manifest.componentsCount} Component</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            إصدار النواة
          </span>
          <p className="text-sm font-bold font-mono text-blue-400">{zipCore.manifest.version}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'files' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>ملفات الأرشيف المستخرجة ({zipCore.files.length || zipCore.fileCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('appJson')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'appJson' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>حالة تطبيق الهاتف الحالية (Live State)</span>
        </button>

        <button
          onClick={() => setActiveTab('manifest')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'manifest' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>بيان النواة (Manifest)</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2 max-h-96 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-300 mb-2">قائمة الملفات في ZIP:</h4>
            {zipCore.files.length > 0 ? (
              zipCore.files.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedFile(file.name)}
                  className={`p-2 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    selectedFile === file.name ? 'bg-indigo-600 text-white' : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-4 h-4 shrink-0 text-amber-400" />
                    <span className="font-mono text-[11px] truncate">{file.name}</span>
                  </div>
                  <span className="text-[10px] opacity-60 font-mono">
                    {Math.round(file.size / 1024) || 1} KB
                  </span>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                {['manifest.json', 'engine-config.json', 'components/Button.tsx', 'components/Card.tsx', 'components/BottomNav.tsx', 'libraries/speech-nlp-ar.js', 'libraries/haptic-feedback.js'].map((name, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedFile(name)}
                    className="p-2 rounded-xl text-xs cursor-pointer flex items-center justify-between hover:bg-white/5 text-slate-300"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-4 h-4 shrink-0 text-amber-400" />
                      <span className="font-mono text-[11px] truncate">{name}</span>
                    </div>
                    <span className="text-[10px] opacity-60 font-mono">4 KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto max-h-96">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px] text-slate-400">
              <span>{selectedFile || 'معاينة شفرة المكون البرمجي'}</span>
              <span className="text-emerald-400">جاهز للترجمة الفورية</span>
            </div>
            <pre className="text-[11px] text-indigo-300 leading-relaxed">
              {selectedFile?.endsWith('.tsx') || selectedFile?.endsWith('.js')
                ? `// ${selectedFile}\nimport React from 'react';\n\nexport const Component = () => {\n  return (\n    <div className="smart-core-node">\n      {/* مدمج ومفعل عبر محرك Smart Core */}\n    </div>\n  );\n};`
                : JSON.stringify(zipCore.manifest, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'appJson' && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs overflow-x-auto max-h-[500px]">
          <pre className="text-emerald-400 text-[11px] leading-relaxed">
            {JSON.stringify(currentApp, null, 2)}
          </pre>
        </div>
      )}

      {activeTab === 'manifest' && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs overflow-x-auto">
          <pre className="text-amber-300 text-[11px] leading-relaxed">
            {JSON.stringify(zipCore.manifest, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
