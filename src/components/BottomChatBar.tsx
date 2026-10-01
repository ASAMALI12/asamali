import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  MessageSquare, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bot, 
  User, 
  Wand2,
  Trash2
} from 'lucide-react';
import { ChatMessage } from '../types';

interface BottomChatBarProps {
  onSendMessage: (text: string, isAudio?: boolean) => void;
  messages: ChatMessage[];
  isProcessing: boolean;
  selectedElement?: string | null;
  onClearHistory: () => void;
}

export const BottomChatBar: React.FC<BottomChatBarProps> = ({
  onSendMessage,
  messages,
  isProcessing,
  selectedElement,
  onClearHistory,
}) => {
  const [inputText, setInputText] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Web Speech API for Arabic and English speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA'; // Primary Arabic recognition

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          onSendMessage(transcript.trim(), true);
          setTranscript('');
        }
      };

      recognitionRef.current = recognition;
    } else {
      setVoiceSupported(false);
    }
  }, [transcript, onSendMessage]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isChatExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatExpanded]);

  // Voice output (TTS) when new assistant message arrives
  useEffect(() => {
    if (!voiceSpeechEnabled || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === 'assistant' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(lastMsg.text);
        utterance.lang = 'ar-SA';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('TTS error', e);
      }
    }
  }, [messages, voiceSpeechEnabled]);

  const toggleListening = () => {
    if (!voiceSupported) {
      alert('المتصفح لا يدعم التعرف الصوتي المباشر، يرجى استخدام متصفح Chrome أو Safari الحديث.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript.trim()) {
        onSendMessage(transcript.trim(), true);
        setTranscript('');
      }
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText.trim(), false);
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    onSendMessage(prompt, false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 shadow-2xl transition-all">
      {/* Expandable Chat History Drawer */}
      {isChatExpanded && (
        <div className="max-w-4xl mx-auto h-72 sm:h-80 flex flex-col border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white">سجل الدردشة والأوامر الحية</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                {messages.length} رسالة
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVoiceSpeechEnabled(!voiceSpeechEnabled)}
                title={voiceSpeechEnabled ? 'كتم النطق الصوتي' : 'تفعيل النطق الصوتي'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                {voiceSpeechEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={onClearHistory}
                title="مسح السجل"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsChatExpanded(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender !== 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-xs shadow-md'
                      : 'bg-slate-900 border border-white/10 text-slate-100 rounded-bl-xs shadow-sm'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {msg.diffInfo && (
                    <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] opacity-80 font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{msg.diffInfo}</span>
                    </div>
                  )}
                  <span className="block text-[9px] opacity-50 mt-1 text-left font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 bg-slate-900/60 p-2.5 rounded-xl border border-indigo-500/20 w-fit">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>جارٍ المعالجة الفورية وتحديث شاشة الهاتف...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Main Bottom Chat Control Bar */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5">
        {/* Quick prompt suggestions pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar text-xs">
          {selectedElement && (
            <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1 shrink-0 text-[11px]">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>محدد: {selectedElement}</span>
            </div>
          )}
          <button
            onClick={() => handleQuickPrompt('غير هذا الزر')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 hover:border-indigo-500 hover:text-indigo-300 text-slate-300 text-[11px] whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <Wand2 className="w-3 h-3 text-indigo-400" />
            <span>غير هذا الزر</span>
          </button>
          <button
            onClick={() => handleQuickPrompt('ضع هذا اللون أزرق نيوني')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 hover:border-blue-500 hover:text-blue-300 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
          >
            🔵 ضع هذا اللون أزرق
          </button>
          <button
            onClick={() => handleQuickPrompt('ضع هذا اللون أحمر قرمزي')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 hover:border-red-500 hover:text-red-300 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
          >
            🔴 ضع هذا اللون أحمر
          </button>
          <button
            onClick={() => handleQuickPrompt('ضع هذا اللون أخضر زمردي')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 hover:border-emerald-500 hover:text-emerald-300 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
          >
            🟢 ضع هذا اللون أخضر
          </button>
          <button
            onClick={() => handleQuickPrompt('اجعل الزر دائرياً مع توهج نيوني')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 hover:border-purple-500 hover:text-purple-300 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
          >
            ✨ زر دائري متوهج
          </button>
          <button
            onClick={() => handleQuickPrompt('ابنِ تطبيق متجر إلكتروني')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 hover:border-violet-500 hover:text-violet-300 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
          >
            🛍️ تطبيق متجر
          </button>
          <button
            onClick={() => handleQuickPrompt('ابنِ تطبيق محفظة مالية')}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 hover:border-emerald-500 hover:text-emerald-300 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
          >
            💳 تطبيق محفظة
          </button>
        </div>

        {/* Live Audio Listening Indicator */}
        {isListening && (
          <div className="mb-2 p-2.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-between text-xs text-indigo-200 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold">الميكروفون يستمع إليك الآن... قل مثلاً: "غير هذا الزر" أو "ضع هذا اللون أحمر"</span>
            </div>
            {transcript && (
              <span className="text-white font-mono bg-black/40 px-2 py-0.5 rounded-lg text-[11px] truncate max-w-[200px]">
                "{transcript}"
              </span>
            )}
          </div>
        )}

        {/* Input Bar with Voice Button & Send */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* THE CHAT TOGGLE BUTTON REQUESTED BY USER */}
          <button
            type="button"
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            title="فتح/إغلاق نافذة سجل الدردشة"
            className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 shrink-0 ${
              isChatExpanded 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">الدردشة</span>
            {isChatExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Voice Chat Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'إيقاف الاستماع' : 'بدء التحدث الصوتي مع المحرك'}
            className={`relative p-2.5 rounded-2xl font-bold flex items-center justify-center transition-all shrink-0 active:scale-95 ${
              isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-bounce'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            {isListening && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-ping" />
            )}
          </button>

          {/* Main Chat Input Field */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اطلب من المحرك بناء أو تغيير شيء (مثال: ضع هذا اللون أزرق، غير هذا الزر)..."
              disabled={isProcessing}
              className="w-full pr-4 pl-12 py-2.5 text-xs rounded-2xl border border-white/10 bg-slate-900/90 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            title="إرسال الأمر"
            className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-md transition-all shrink-0 active:scale-95 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
