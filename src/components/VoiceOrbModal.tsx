import React, { useEffect, useState } from 'react';
import { Mic, MicOff, X, Volume2, Sparkles } from 'lucide-react';

interface VoiceOrbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceCommand: (command: string) => void;
  lastReply?: string;
  isProcessing: boolean;
}

export const VoiceOrbModal: React.FC<VoiceOrbModalProps> = ({
  isOpen,
  onClose,
  onVoiceCommand,
  lastReply,
  isProcessing
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognition) recognition.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'ar-SA';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[event.results.length - 1].isFinal) {
          const finalText = currentTranscript.trim();
          if (finalText) {
            onVoiceCommand(finalText);
            setTranscript('');
          }
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Voice modal recognition error', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      try {
        rec.start();
        setRecognition(rec);
      } catch (err) {
        console.warn(err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl">
      <div className="relative w-full max-w-md flex flex-col items-center text-center p-6 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
            وضع التحدث الصوتي المباشر 🎙️
          </span>
          <h3 className="text-xl font-black text-white">
            تحدث بحرية مع محرك التطبيق
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            "ضع هذا اللون أحمر"، "غير هذا الزر"، "ابنِ تطبيق متجر"، "أضف عرض تخفيض"
          </p>
        </div>

        {/* Pulsing Voice Orb Visualizer */}
        <div className="relative flex items-center justify-center my-6">
          {/* Wave rings */}
          <div className="absolute w-48 h-48 rounded-full bg-indigo-600/20 animate-pulse-ring" />
          <div className="absolute w-36 h-36 rounded-full bg-purple-600/30 animate-pulse-ring" style={{ animationDelay: '0.4s' }} />
          <div className="absolute w-28 h-28 rounded-full bg-pink-500/40 animate-pulse" />

          {/* Central Orb */}
          <button
            onClick={() => {
              if (isListening) {
                recognition?.stop();
                setIsListening(false);
              } else {
                recognition?.start();
                setIsListening(true);
              }
            }}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-indigo-500/50 scale-105'
                : 'bg-slate-800 border-2 border-white/20'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 animate-bounce" />
            ) : (
              <MicOff className="w-10 h-10 text-slate-400" />
            )}
          </button>
        </div>

        {/* Live Transcript / Speech Feedback */}
        <div className="w-full min-h-[70px] p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
          {isProcessing ? (
            <div className="flex items-center gap-2 text-indigo-300 text-xs">
              <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
              <span>جارٍ ترجمة صوتك وتعديل التطبيق في ثوانٍ...</span>
            </div>
          ) : transcript ? (
            <p className="text-sm font-bold text-white font-mono">
              "{transcript}"
            </p>
          ) : lastReply ? (
            <div className="flex items-center gap-2 text-emerald-300 text-xs">
              <Volume2 className="w-4 h-4 shrink-0" />
              <span>{lastReply}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              {isListening ? 'أنا أستمع إليك الآن... تفضل بالحديث' : 'انقر على الميكروفون للبدء بالحديث'}
            </span>
          )}
        </div>

        {/* Quick action buttons inside voice modal */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {['ضع هذا اللون أزرق', 'غير هذا الزر', 'ابنِ تطبيق توصيل', 'اجعل الزر دائري'].map((cmd, i) => (
            <button
              key={i}
              onClick={() => onVoiceCommand(cmd)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-white/10 hover:border-indigo-500 text-slate-300 transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
