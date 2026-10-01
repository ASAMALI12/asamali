import React, { useRef, useState } from 'react';
import { 
  FolderArchive, 
  Cpu, 
  Smartphone, 
  Columns, 
  FileCode2, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  X,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { SmartZipCore } from '../types';
import { generateSmartCoreZipBlob } from '../services/zipEngine';

interface TopBarProps {
  zipCore: SmartZipCore;
  onZipUpload: (file: File) => void;
  viewMode: 'phone' | 'split' | 'files';
  setViewMode: (mode: 'phone' | 'split' | 'files') => void;
  onResetApp: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  zipCore,
  onZipUpload,
  viewMode,
  setViewMode,
  onResetApp,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onZipUpload(file);
    }
  };

  const handleDownloadSampleZip = async () => {
    try {
      setIsDownloadingZip(true);
      const blob = await generateSmartCoreZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'smart-core-engine-v2.5.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 shadow-lg">
        {/* Hidden File Input targeting device storage */}
        <input 
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Right side (RTL Start): Logo & Core Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">Smart Core</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  v2.5
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                محرك بناء وتعديل تطبيقات الهاتف بالصوت
              </p>
            </div>
          </div>
        </div>

        {/* Center / Highlighted: Small Top Button for Smart ZIP File Picker */}
        <div className="flex items-center gap-2">
          {/* THE SMALL TOP BUTTON REQUESTED BY USER */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="انقر لفتح ملفات الهاتف واختيار ملف ZIP الذكي لنواة المحرك"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all group"
          >
            <FolderArchive className="w-4 h-4 text-slate-950 group-hover:rotate-6 transition-transform" />
            <span>ملفات الهاتف (ZIP)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-950/70 ml-0.5 animate-pulse" />
          </button>

          {/* Engine Status Badge (Clickable to inspect extracted files) */}
          <button
            onClick={() => setShowCoreModal(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 border border-emerald-500/30 text-emerald-300 hover:bg-slate-800 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>النواة نشطة: {zipCore.fileName || 'المحرك الذكي'}</span>
            <span className="text-[10px] opacity-75 font-mono">({zipCore.manifest.libraries.length} مكتبات)</span>
          </button>
        </div>

        {/* Left side (RTL End): View Modes & Actions */}
        <div className="flex items-center gap-1.5">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/5">
            <button
              onClick={() => setViewMode('phone')}
              title="عرض الهاتف المباشر"
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                viewMode === 'phone' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">الهاتف</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              title="عرض مقسم: الهاتف + الدردشة"
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">مقسم</span>
            </button>
            <button
              onClick={() => setViewMode('files')}
              title="استعراض النواة والملفات"
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                viewMode === 'files' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">النواة</span>
            </button>
          </div>

          {/* Reset App Button */}
          <button
            onClick={onResetApp}
            title="إعادة ضبط التطبيق"
            className="p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Smart Core ZIP Inspector Modal */}
      {showCoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    نواة ومكتبات ملف ZIP الذكي
                  </h3>
                  <p className="text-xs text-slate-400">
                    {zipCore.fileName || 'smart-core-engine.zip'} • {zipCore.fileCount || 38} ملف ووحدة معالجة
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCoreModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {/* Core Manifest Info */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    محرك التجميع السريع:
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">{zipCore.manifest.engine}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">إصدار النواة:</span>
                  <span className="font-mono text-slate-300">{zipCore.manifest.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">المكونات الجاهزة:</span>
                  <span className="font-mono text-emerald-400 font-bold">{zipCore.manifest.componentsCount} عنصر</span>
                </div>
              </div>

              {/* Libraries List */}
              <div>
                <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  المكتبات المدمجة داخل ملف الـ ZIP:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {zipCore.manifest.libraries.map((lib, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-mono text-[11px] text-slate-200">{lib}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  قدرات المعالجة الفورية المتاحة للمحرك:
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {zipCore.manifest.capabilities.map((cap, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleDownloadSampleZip}
                disabled={isDownloadingZip}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{isDownloadingZip ? 'جارٍ التحضير...' : 'تحميل حزمة النواة (ZIP) لجهازك'}</span>
              </button>

              <button
                onClick={() => {
                  setShowCoreModal(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-colors"
              >
                <FolderArchive className="w-4 h-4" />
                <span>اختيار ملف ZIP آخر من الهاتف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
