import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Mic, 
  Send, 
  Menu, 
  X, 
  FolderArchive, 
  Save, 
  Trash2, 
  Clock, 
  Search, 
  Volume2, 
  VolumeX,
  ArrowRight,
  GraduationCap,
  Layers,
  Smartphone,
  Eye,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Cpu
} from 'lucide-react';
import { parseZipFile, BUILTIN_ASAMALI_CORE } from './services/zipEngine';
import { processAppModification, buildAppFromPrompt } from './services/appGenerator';
import { getCustomTeachings, saveCustomTeaching, TeachCoreRecord } from './services/asamaliCoreEngine';
import { PhoneSimulator } from './components/PhoneSimulator';
import { MobileAppConfig, SmartZipCore } from './types';

interface SavedProject {
  id: string;
  name: string;
  savedAt: string;
  app: MobileAppConfig;
}

export default function App() {
  // Screen views: 'main' (Empty canvas with ASAM orb) or 'listening' (Dedicated Listening Screen)
  const [currentView, setCurrentView] = useState<'main' | 'listening'>('main');

  // Active application configuration (Completely empty and pristine by default)
  const [activeApp, setActiveApp] = useState<MobileAppConfig>(() => ({
    ...buildAppFromPrompt('مشروع جديد'),
    isBuilt: false,
    hasCustomButton: false,
    showSearch: false,
    showBanner: false,
    screens: {
      home: {
        title: '',
        items: []
      }
    }
  }));

  // Clean conversation: Only what ASAM says
  const [currentExchange, setCurrentExchange] = useState<{ user: string; reply: string; coreInfo?: string }>({
    user: '',
    reply: 'نواة ASAMALI متصلة كلياً وجاهزة لتنفيذ أوامرك الحقيقية عبر ملفات النواة (lexicon_ar.json و feature_recipes.json). اللوحة فارغة تماماً، تفضل بأمرك بالصوت أو النص.'
  });

  // Audio Voice output enabled by default
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Saved Projects List
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
    try {
      const stored = localStorage.getItem('smart_core_saved_projects');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Smart ZIP Core State
  const [zipCore, setZipCore] = useState<SmartZipCore>(BUILTIN_ASAMALI_CORE);

  // Modals
  const [showProjectsDrawer, setShowProjectsDrawer] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Modals
  const [showTeachCoreModal, setShowTeachCoreModal] = useState(false);
  const [showBuildReviewModal, setShowBuildReviewModal] = useState(false);

  // Teach core state
  const [teachWord, setTeachWord] = useState('');
  const [teachMeaning, setTeachMeaning] = useState('BUILD');
  const [teachType, setTeachType] = useState<'verb' | 'target' | 'color'>('verb');
  const [teachingsList, setTeachingsList] = useState<TeachCoreRecord[]>(() => getCustomTeachings());
  const [teachSuccessMsg, setTeachSuccessMsg] = useState('');

  // Voice Chat States in Listening Screen
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [voiceStatusNotice, setVoiceStatusNotice] = useState<string>('🎙️ أنا أستمع إليك الآن... تفضل بالكلام');

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDockListening, setIsDockListening] = useState(false);

  // References
  const coreZipInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const dockRecognitionRef = useRef<any>(null);
  const dockTimerRef = useRef<any>(null);
  const autoSendTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isListeningRef = useRef<boolean>(false);

  // Persist saved projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('smart_core_saved_projects', JSON.stringify(savedProjects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  }, [savedProjects]);

  // Pre-load voices on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Play short auditory confirmation chime using Web Audio
  const playAudioChime = (freq = 560, duration = 0.12) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Synchronously unlock browser audio context on user gesture
  const unlockAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}
    }
  };

  // Speech synthesis feedback (Arabic TTS out loud)
  const speakReply = (text: string) => {
    if (!isVoiceOutputEnabled) return;
    playAudioChime(620, 0.15);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        // Clean text of emojis and markdown tokens for clean phonetics
        const cleanText = text
          .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
          .replace(/[*_#`~[\]]/g, '')
          .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);

        const allVoices = window.speechSynthesis.getVoices();
        const arVoice = allVoices.find(v => 
          v.lang.toLowerCase().startsWith('ar') || 
          v.name.toLowerCase().includes('arabic') ||
          v.name.toLowerCase().includes('saudi') ||
          v.name.toLowerCase().includes('maged') ||
          v.name.toLowerCase().includes('laila') ||
          v.name.toLowerCase().includes('tarik')
        );

        if (arVoice) {
          utterance.voice = arVoice;
          utterance.lang = arVoice.lang;
        } else {
          utterance.lang = 'ar-SA';
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
          console.warn('TTS error:', e);
          setIsSpeaking(false);
        };

        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('TTS error:', err);
        setIsSpeaking(false);
      }
    }
  };

  // Cleanup audio tracks & speech recognition
  const stopAudioStreams = () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  // فتح شاشة الاستماع وبدء التقاط الصوت فوراً
  const openListeningScreen = async () => {
    stopAudioStreams();
    setVoiceTranscript('');
    setVoiceVolume(0);
    setVoiceStatusNotice('🎙️ جاري تفعيل المايك والاستماع...');
    setCurrentView('listening');
    isListeningRef.current = true;
    setIsListening(true);

    // 1. تشغيل مقياس الصوت الحي من المايك لضمان أن المايك يعمل ويلتقط ذبذبات الصوت
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!isListeningRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setVoiceVolume(avg);
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      }
    } catch (err: any) {
      console.warn('Audio Visualizer Stream:', err);
    }

    // 2. تفعيل محرك تحويل الصوت إلى كلام (Web Speech API)
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceStatusNotice('خاصية الصوت المباشر غير مدعومة في متصفحك. تفضل بكتابة كلامك هنا وسأنفذه فوراً.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setVoiceStatusNotice('🎙️ أنا أستمع إليك الآن... تفضل بالكلام');
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const cleaned = fullTranscript.trim();
        setVoiceTranscript(cleaned);

        // إرسال تلقائي ذكي بعد انتهاء المستخدم من التحدث (صمت 1.4 ثانية)
        if (cleaned.length > 1) {
          if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
          autoSendTimerRef.current = setTimeout(() => {
            if (isListeningRef.current) {
              stopAudioStreams();
              setCurrentView('main');
              handleCommand(cleaned);
              setVoiceTranscript('');
            }
          }, 1400);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech Recognition Event Error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceStatusNotice('إذن الميكروفون مقفل في المتصفح. يمكنك كتابة أمرك في الصندوق أدناه وسأرد عليك صوتياً.');
        } else if (event.error === 'no-speech') {
          // Keep listening peacefully
        } else {
          setVoiceStatusNotice(`حالة الصوت: ${event.error}. تفضل بالتحدث أو الكتابة هنا.`);
        }
      };

      recognition.onend = () => {
        // إذا كان المستخدم لا يزال داخل شاشة الاستماع، نعيد تشغيل الاستماع تلقائياً حتى لا ينقطع كلامه
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start recognition:', err);
      setVoiceStatusNotice('تعذر تشغيل المايك تلقائياً. يمكنك كتابة أمرك وسأرد عليك صوتياً.');
    }
  };

  // إرسال الكلام الملتقط من شاشة الاستماع والعودة للواجهة الرئيسية
  const handleSendVoiceAndClose = () => {
    stopAudioStreams();
    setCurrentView('main');

    const textToSend = voiceTranscript.trim();
    if (textToSend) {
      handleCommand(textToSend);
      setVoiceTranscript('');
    }
  };

  // إلغاء الاستماع والرجوع للواجهة الرئيسية
  const handleCancelListening = () => {
    stopAudioStreams();
    setCurrentView('main');
    setVoiceTranscript('');
  };

  // التحدث المباشر السريع من شريط الإدخال الرئيسي دون مغادرة الشاشة
  const toggleDockVoice = async () => {
    unlockAudio();
    playAudioChime(480, 0.1);

    if (isDockListening) {
      if (dockRecognitionRef.current) {
        try { dockRecognitionRef.current.abort(); } catch (e) {}
        dockRecognitionRef.current = null;
      }
      setIsDockListening(false);
      setVoiceStatusNotice('');
      return;
    }

    // 1. طلب إذن المايكروفون عبر المتصفح لضمان تفعيله دون رفض صامت
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (permErr: any) {
      console.warn('Microphone permission warning:', permErr);
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      openListeningScreen();
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA';
      recognition.maxAlternatives = 2;

      recognition.onstart = () => {
        setIsDockListening(true);
        setVoiceStatusNotice('🎙️ أنا أستمع إليك الآن... تفضل بالكلام وسأنفذه فوراً');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        const cleaned = transcript.trim();
        setInputText(cleaned);

        if (cleaned.length > 1) {
          if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
          dockTimerRef.current = setTimeout(() => {
            try { recognition.abort(); } catch (e) {}
            setIsDockListening(false);
            dockRecognitionRef.current = null;
            setVoiceStatusNotice('');
            handleCommand(cleaned);
          }, 1300);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Dock mic error:', e.error);
        setIsDockListening(false);
        if (e.error === 'not-allowed') {
          setVoiceStatusNotice('⚠️ إذن المايك محظور بالمتصفح. يمكنك كتابة أمرك أو استخدام الأوامر السريعة بالأسفل وسأرد عليك صوتياً.');
        } else if (e.error === 'no-speech') {
          setVoiceStatusNotice('لم أسمع صوتاً، اضغط المايك وتفضل بنطق أمرك.');
        } else {
          setVoiceStatusNotice(`حالة الصوت: ${e.error}`);
        }
      };

      recognition.onend = () => {
        setIsDockListening(false);
      };

      dockRecognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Failed dock voice:', e);
      setIsDockListening(false);
      setVoiceStatusNotice('تعذر تشغيل المايك. تفضل بكتابة أمرك وسأرد عليك صوتياً.');
    }
  };

  // معالجة الأوامر ونطق الرد
  const handleCommand = async (cmdText: string) => {
    const query = cmdText.trim();
    if (!query) return;

    setIsProcessing(true);
    setInputText('');

    try {
      const result = await processAppModification(
        query,
        activeApp,
        zipCore
      );

      setActiveApp(result.updatedApp);
      setCurrentExchange({
        user: query,
        reply: result.replyText,
        coreInfo: result.diffInfo
      });
      speakReply(result.replyText);
    } catch (err: any) {
      console.error('Command processing error:', err);
      const errReply = 'حدث خطأ أثناء معالجة الأمر، تفضل بتكراره.';
      setCurrentExchange({ user: query, reply: errReply });
      speakReply(errReply);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const text = inputText.trim();
    if (text) {
      handleCommand(text);
    } else {
      chatInputRef.current?.focus();
    }
  };

  // تعليم النواة وحفظ الكلمات الجديدة
  const handleTeachSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachWord.trim()) return;
    const added = saveCustomTeaching({
      word: teachWord.trim(),
      meaning: teachMeaning,
      type: teachType
    });
    setTeachingsList(prev => [added, ...prev]);
    setTeachWord('');
    setTeachSuccessMsg(`✓ تم تعليم النواة الكلمة [${added.word}] بنجاح!`);
    setTimeout(() => setTeachSuccessMsg(''), 3000);
    speakReply(`تمت إضافة الكلمة إلى ذاكرة النواة بنجاح.`);
  };

  // رفع ملف ZIP
  const handleCoreZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsProcessing(true);
        const parsed = await parseZipFile(file);
        setZipCore(parsed);

        const reply = `تم ربط نواة ملف [${file.name}] بنجاح يا عصام. الواجهة فارغة وجاهزة لأي أمر.`;
        setCurrentExchange({
          user: `ربط ملف: ${file.name}`,
          reply
        });
        speakReply(reply);
      } catch (err: any) {
        console.error('Error loading zip:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // حفظ المشروع
  const handleSaveCurrentProject = () => {
    const current = activeApp || buildAppFromPrompt('تطبيق جديد');
    const newProject: SavedProject = {
      id: `proj_${Date.now()}`,
      name: current.name || 'مشروع محفوظ',
      savedAt: new Date().toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      app: JSON.parse(JSON.stringify(current))
    };

    setSavedProjects(prev => [newProject, ...prev]);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
    speakReply(`تم حفظ مشروعك بنجاح.`);
  };

  const handleLoadSavedProject = (proj: SavedProject) => {
    setActiveApp(proj.app);
    setShowProjectsDrawer(false);
    const reply = `تم فتح مشروعك [${proj.name}]. ماذا تحب أن نعدل فيه؟`;
    setCurrentExchange({
      user: `فتح مشروع: ${proj.name}`,
      reply
    });
    speakReply(reply);
  };

  const handleDeleteSavedProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  };

  // هل توجد عناصر مرسومة على اللوحة؟
  const hasDrawnElements = activeApp.hasCustomButton || 
    activeApp.showSearch || 
    activeApp.showBanner || 
    (activeApp.screens['home']?.items && activeApp.screens['home'].items.length > 0) ||
    activeApp.category === 'chat';

  // تنظيف العمليات الصوتية عند إغلاق أو تفريغ الكومبوننت
  useEffect(() => {
    return () => {
      stopAudioStreams();
    };
  }, []);

  return (
    <div className="h-screen w-full bg-black text-slate-100 flex flex-col justify-between overflow-hidden relative select-none font-['Cairo',sans-serif]">
      
      {/* Subtle Ambient Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-slate-900/40 blur-[180px] pointer-events-none" />

      {/* Hidden File Input */}
      <input
        ref={coreZipInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleCoreZipUpload}
        className="hidden"
      />

      {/* ============================================================== */}
      {/* 1. TOP HEADER (بسيط ونظيف جداً دون أي أزرار أو خيارات) */}
      {/* ============================================================== */}
      <header className="relative z-30 w-full px-6 py-4 flex items-center justify-between shrink-0">
        
        {/* Left: Projects Menu, Voice Speaker & Teach Core */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowProjectsDrawer(!showProjectsDrawer)}
            className="p-2 rounded-full text-slate-400 hover:text-white transition-all active:scale-90"
            title="المشاريع المحفوظة"
          >
            <Menu className="w-5 h-5 stroke-[1.5]" />
          </button>

          <button
            onClick={() => setIsVoiceOutputEnabled(!isVoiceOutputEnabled)}
            className="p-2 rounded-full text-slate-400 hover:text-white transition-all active:scale-90"
            title={isVoiceOutputEnabled ? 'الصوت مفعل' : 'الصوت مكتوم'}
          >
            {isVoiceOutputEnabled ? (
              <div className="relative">
                <Volume2 className="w-5 h-5 text-slate-300" />
                {isSpeaking && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
            ) : (
              <VolumeX className="w-5 h-5 opacity-40" />
            )}
          </button>

          {/* زر صغير أعلى شاشة اليسار لتعليم النواة الكلام والأوامر البرمجية */}
          <button
            onClick={() => setShowTeachCoreModal(true)}
            className="p-2 rounded-full text-amber-400 hover:text-amber-300 hover:bg-white/5 transition-all active:scale-90"
            title="تعليم النواة الكلام والأوامر البرمجية"
          >
            <GraduationCap className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Center: Clean ASAM Branding */}
        <div className="text-sm font-light tracking-widest text-slate-400">
          ASAM
        </div>

        {/* Right: Clean Action (Save, Add Core & Visual App Review) */}
        <div className="flex items-center gap-2">
          {/* زر صغير أعلى الشاشة من اليمين رفيو لمشاهدة واجهات وألوان المشروع صوريًا */}
          <button
            onClick={() => setShowBuildReviewModal(true)}
            className={`p-2 rounded-full transition-all active:scale-90 flex items-center gap-1 ${
              activeApp.isBuilt 
                ? 'text-cyan-400 hover:text-cyan-300 hover:bg-white/5' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="معاينة الواجهة صوريًا (Review)"
          >
            <Smartphone className="w-5 h-5 stroke-[1.5]" />
          </button>

          {hasDrawnElements ? (
            <button
              onClick={handleSaveCurrentProject}
              className="p-2 rounded-full text-slate-400 hover:text-emerald-400 transition-all active:scale-90"
              title="حفظ المشروع"
            >
              <Save className="w-5 h-5 stroke-[1.5]" />
            </button>
          ) : (
            <button
              onClick={() => coreZipInputRef.current?.click()}
              className="p-2 rounded-full text-slate-400 hover:text-white transition-all active:scale-90"
              title="ربط ملف ZIP"
            >
              <Plus className="w-5 h-5 stroke-[1.5]" />
            </button>
          )}
        </div>

      </header>

      {/* نافذة المشاريع المحفوظة */}
      {showProjectsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-5 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">المشاريع المحفوظة</h4>
              </div>
              <button onClick={() => setShowProjectsDrawer(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccessNotice && (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs text-center font-bold">
                ✓ تم حفظ مشروعك!
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  لا توجد مشاريع محفوظة بعد.
                </div>
              ) : (
                savedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleLoadSavedProject(proj)}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between cursor-pointer transition-all active:scale-98"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-slate-200">{proj.name}</h5>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {proj.savedAt}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSavedProject(proj.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. شاشة الاستماع المباشرة عند الضغط على زر التحدث */}
      {/* ============================================================== */}
      {currentView === 'listening' ? (
        <main className="flex-1 w-full px-6 py-6 flex flex-col items-center justify-between animate-in fade-in z-20">
          
          {/* Header of Listening Screen */}
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-slate-400 tracking-wider">شاشة الاستماع</span>
            <button
              onClick={handleCancelListening}
              className="p-2 rounded-full text-slate-400 hover:text-white transition-all active:scale-90"
              title="إلغاء"
            >
              <X className="w-6 h-6 stroke-[1.5]" />
            </button>
          </div>

          {/* Glowing Voice Orb responding dynamically to your actual microphone volume */}
          <div className="relative w-64 h-64 flex items-center justify-center my-auto">
            {/* Dynamic Volume Aura */}
            <div 
              className="absolute rounded-full blur-3xl transition-all duration-100 opacity-60"
              style={{
                width: `${Math.min(260, 160 + voiceVolume * 1.5)}px`,
                height: `${Math.min(260, 160 + voiceVolume * 1.5)}px`,
                background: 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(249,115,22,0.4) 60%, rgba(0,0,0,0) 100%)'
              }}
            />

            {/* Central Listening Orb */}
            <div 
              className="relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-transform duration-100"
              style={{
                transform: `scale(${1 + Math.min(0.2, voiceVolume / 200)})`,
                background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95) 0%, rgba(239, 68, 68, 0.6) 45%, rgba(185, 28, 28, 0.35) 100%)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                boxShadow: '0 0 60px rgba(239, 68, 68, 0.7), inset 0 2px 6px rgba(255, 255, 255, 0.9)',
                border: '1.5px solid rgba(255, 255, 255, 0.5)'
              }}
            >
              <Mic className="w-10 h-10 text-slate-900 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-900 mt-1 select-none">
                أستمع إليك...
              </span>
            </div>
          </div>

          {/* Area displaying recognized speech live as you talk */}
          <div className="w-full max-w-lg space-y-4 text-center my-auto">
            <div className="p-4 rounded-3xl bg-zinc-950/80 border border-white/10 min-h-[90px] flex items-center justify-center text-center">
              {voiceTranscript ? (
                <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
                  {voiceTranscript}
                </p>
              ) : (
                <p className="text-xs text-slate-400 animate-pulse">
                  {voiceStatusNotice}
                </p>
              )}
            </div>

            {/* Input to refine or type speech directly if microphone permissions are restricted */}
            <input
              type="text"
              value={voiceTranscript}
              onChange={(e) => setVoiceTranscript(e.target.value)}
              placeholder="يمكنك تعديل كلامك أو كتابته هنا أيضاً..."
              className="w-full bg-zinc-900/60 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-center text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>

          {/* Bottom Send & Cancel Buttons in Listening Screen */}
          <div className="w-full max-w-md flex items-center gap-3 pt-4 shrink-0">
            <button
              onClick={handleSendVoiceAndClose}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-black font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>إرسال لـ ASAM</span>
            </button>
            <button
              onClick={handleCancelListening}
              className="py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-slate-300 font-semibold text-sm active:scale-95 transition-all"
            >
              إلغاء
            </button>
          </div>

        </main>
      ) : (
        /* ============================================================== */
        /* 3. MAIN CANVAS (الواجهة الفارغة تماماً مع كرة ASAM في المنتصف) */
        /* ============================================================== */
        <main className="flex-1 w-full relative overflow-y-auto px-4 sm:px-12 py-2 flex flex-col items-center justify-center no-scrollbar">

          {/* أ) إذا كانت اللوحة فارغة تماماً (كرة ASAM فقط في المنتصف تحاورك) */}
          {!hasDrawnElements ? (
            <div className="w-full max-w-xl flex flex-col items-center justify-center my-auto space-y-6 animate-in fade-in">
              
              {/* كلام المستخدم وكلام ASAM الصوتي والمكتوب في الأعلى بخفة تامة */}
              <div className="text-center px-4 max-w-md animate-in fade-in space-y-2">
                {currentExchange.user && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-amber-300">
                    <span className="opacity-70">أمرك:</span>
                    <span className="font-semibold">"{currentExchange.user}"</span>
                  </div>
                )}
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-400 animate-pulse py-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>جاري التفكير والتنفيذ الذكي...</span>
                  </div>
                ) : (
                  currentExchange.reply && (
                    <div className="space-y-1.5">
                      <p className="text-sm sm:text-base font-light text-slate-200 leading-relaxed tracking-wide">
                        {currentExchange.reply}
                      </p>
                      {currentExchange.coreInfo && (
                        <p className="text-[10px] text-amber-400/90 font-mono tracking-wide">
                          {currentExchange.coreInfo}
                        </p>
                      )}
                      <div className="pt-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => speakReply(currentExchange.reply)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs transition-all active:scale-95 border border-amber-500/20"
                          title="استمع للرد صوتياً"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>استمع للرد بصوت النواة 🔊</span>
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* كرة ASAM في المنتصف - اضغط عليها لأخذك لشاشة الاستماع مباشرة */}
              <div className="relative w-64 h-64 flex items-center justify-center my-4">
                <div 
                  className="absolute w-44 h-44 rounded-full blur-3xl opacity-50 transition-all duration-700 animate-pulse-glow"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(249,115,22,0.3) 50%, rgba(59,130,246,0.2) 100%)'
                  }}
                />

                {/* The Liquid Fluid ASAM Orb */}
                <div 
                  onClick={openListeningScreen}
                  className="relative z-10 w-40 h-40 cursor-pointer transition-transform duration-500 hover:scale-105 active:scale-95 animate-fluid-blob flex flex-col items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.8) 0%, rgba(226, 232, 240, 0.35) 45%, rgba(148, 163, 184, 0.15) 100%)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6), inset 0 2px 5px rgba(255, 255, 255, 0.8), inset 0 -2px 5px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }}
                  title="اضغط للتحدث - ينقلك لشاشة الاستماع"
                >
                  <span className="font-extrabold text-2xl tracking-widest text-slate-900 select-none">
                    ASAM
                  </span>
                </div>
              </div>

            </div>
          ) : (
            /* ب) بعد أن يتم بناء المشروع أو رسم عناصر (يظهر المحاكي الصوري للتطبيق بالكامل) */
            <div className="w-full max-w-xl h-full flex flex-col items-center justify-between py-2 space-y-3 animate-in fade-in">
              
              {/* رد ASAM الصوتي والمكتوب في الأعلى */}
              <div className="text-center px-4 max-w-md animate-in fade-in space-y-1 shrink-0">
                {currentExchange.user && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-amber-300 mb-1">
                    <span className="opacity-70">أمرك:</span>
                    <span className="font-semibold">"{currentExchange.user}"</span>
                  </div>
                )}
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-amber-400 animate-pulse py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>جاري التفكير والتنفيذ...</span>
                  </div>
                ) : (
                  currentExchange.reply && (
                    <>
                      <p className="text-sm font-light text-slate-200 leading-relaxed">
                        {currentExchange.reply}
                      </p>
                      {currentExchange.coreInfo && (
                        <p className="text-[10px] text-amber-400/90 font-mono tracking-wide">
                          {currentExchange.coreInfo}
                        </p>
                      )}
                      <div className="pt-1.5 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => speakReply(currentExchange.reply)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs transition-all active:scale-95 border border-amber-500/20"
                          title="استمع للرد صوتياً"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>استمع للرد بصوت النواة 🔊</span>
                        </button>
                      </div>
                    </>
                  )
                )}
              </div>

              {/* المحاكي الصوري التفاعلي لتطبيق الهاتف بالكامل */}
              <div className="flex-1 w-full max-w-[340px] flex items-center justify-center overflow-y-auto no-scrollbar py-1">
                <PhoneSimulator
                  app={activeApp}
                  onUpdateApp={setActiveApp}
                />
              </div>

            </div>
          )}

        </main>
      )}

      {/* ============================================================== */}
      {/* 4. BOTTOM DOCK (الكبسولة البسيطة في الأسفل للتحدث أو الكتابة) */}
      {/* ============================================================== */}
      {currentView === 'main' && (
        <footer className="relative z-30 w-full px-4 sm:px-12 py-3 shrink-0 flex flex-col items-center gap-2">
          
          {/* شريط الأوامر السريعة المنطوقة لتجربة التحدث والنواة فوراً */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl">
            {[
              'ابنِ تطبيق مطعم مع قائمة وسلة 🍔',
              'أضف شاشة تسجيل الدخول 🔐',
              'مرحبا يا عصام 👋',
              'هل أنت متصل بالنواة؟ 📦',
              'غير لون الزر إلى الأزرق 🎨'
            ].map((cmd, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  unlockAudio();
                  handleCommand(cmd);
                }}
                className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 border border-white/10 transition-all active:scale-95"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* تنبيه حالة المايك الصوتي */}
          {voiceStatusNotice && (
            <div className="text-center animate-in fade-in">
              <span className={`text-[11px] px-3 py-1 rounded-full ${
                isDockListening 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                  : 'bg-zinc-900 text-slate-300 border border-white/10'
              }`}>
                {voiceStatusNotice}
              </span>
            </div>
          )}

          <form 
            onSubmit={handleSubmit}
            className="w-full max-w-xl rounded-full bg-zinc-900/90 border border-white/10 px-4 py-2 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md"
          >
            {/* زر التحدث المباشر السريع في شريط الإدخال */}
            <button
              type="button"
              onClick={toggleDockVoice}
              title={isDockListening ? 'جاري الاستماع... اضغط للإيقاف' : 'اضغط للتحدث المباشر بالصوت'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 ${
                isDockListening
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                  : 'text-amber-400 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              <Mic className={`w-5 h-5 ${isDockListening ? 'animate-bounce' : 'stroke-[1.8]'}`} />
            </button>

            {/* مستطيل الكتابة الهادئ */}
            <input
              ref={chatInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isDockListening ? '🎙️ أنا أستمع إليك الآن... تحدث وسأنفذ فوراً' : (isProcessing ? 'جاري التفكير والتنفيذ...' : 'اضغط المايك للتحدث أو اكتب هنا...')}
              className="flex-1 bg-transparent px-2 py-1 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none tracking-wide min-w-0"
            />

            {/* زر الإرسال */}
            <button
              type="submit"
              title="إرسال"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 ${
                isProcessing 
                  ? 'text-amber-400 animate-pulse' 
                  : 'text-white hover:text-slate-200'
              }`}
            >
              <Send className="w-4 h-4 stroke-[1.8]" />
            </button>
          </form>
        </footer>
      )}

      {/* ============================================================== */}
      {/* 5. MODALS (تعليم النواة - مراحل البناء - المحادثة المباشرة) */}
      {/* ============================================================== */}

      {/* نافذة: تعليم النواة الكلام والأوامر البرمجية (أعلى اليسار) */}
      {showTeachCoreModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-white/10 p-5 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">تعليم النواة الكلام والأوامر</h4>
                  <p className="text-[10px] text-slate-400">تحديث المعجم البرمجي الدائم لـ ASAMALI</p>
                </div>
              </div>
              <button onClick={() => setShowTeachCoreModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {teachSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs text-center font-bold">
                {teachSuccessMsg}
              </div>
            )}

            <form onSubmit={handleTeachSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">الكلمة أو العبارة الجديدة:</label>
                <input
                  type="text"
                  value={teachWord}
                  onChange={(e) => setTeachWord(e.target.value)}
                  placeholder="مثال: جهز لي واجهة، شاشتي، أضف زر، ..."
                  required
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">نوع التعليم:</label>
                  <select
                    value={teachType}
                    onChange={(e) => setTeachType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="verb">فعل برمجي (Verb)</option>
                    <option value="target">مكون / هدف (Target)</option>
                    <option value="color">لون مخصص (Color)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">الإجراء في النواة:</label>
                  <select
                    value={teachMeaning}
                    onChange={(e) => setTeachMeaning(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="BUILD">بناء تطبيق (BUILD)</option>
                    <option value="ADD">إضافة مكون (ADD)</option>
                    <option value="MODIFY">تعديل (MODIFY)</option>
                    <option value="BUTTON">زر تفاعلي (BUTTON)</option>
                    <option value="SCREEN">شاشة كاملة (SCREEN)</option>
                    <option value="LOGIN">شاشة دخول (LOGIN)</option>
                    <option value="RESTAURANT">تطبيق مطعم (RESTAURANT)</option>
                    <option value="CLEAR">مسح اللوحة (CLEAR)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-all active:scale-95"
              >
                + حفظ في ذاكرة النواة الدائمة
              </button>
            </form>

            <div className="border-t border-white/10 pt-3">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">الكلمات التي تم تعليمها للنواة:</span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {teachingsList.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-2">لا توجد كلمات مخصصة بعد. أضف أول كلمة أعلاه!</p>
                ) : (
                  teachingsList.map(t => (
                    <div key={t.id} className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-300">{t.word}</span>
                      <span className="text-slate-400 font-mono text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">
                        {t.meaning} ({t.type})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة: معاينة واجهات وألوان المشروع صوريًا (Review) (أعلى اليمين) */}
      {showBuildReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-md max-h-[94vh] rounded-3xl bg-zinc-950 border border-white/10 p-4 space-y-3 shadow-2xl flex flex-col animate-in fade-in">
            {/* Header of Visual Review Modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">معاينة واجهات المشروع (Review)</h4>
                  <p className="text-[10px] text-cyan-300/80">
                    {activeApp.isBuilt ? `محاكاة بصرية لتطبيق [${activeApp.name}]` : 'المشروع قيد الإنشاء - اللوحة فارغة'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowBuildReviewModal(false)} 
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Simulator Display */}
            <div className="flex-1 overflow-y-auto flex items-center justify-center py-2 no-scrollbar">
              <div className="w-full max-w-[340px]">
                <PhoneSimulator
                  app={activeApp}
                  onUpdateApp={setActiveApp}
                />
              </div>
            </div>

            {/* Bottom info bar */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeApp.theme?.primaryColor || '#DC2626' }} />
                <span className="text-[11px] text-slate-300">اللون الأساسي: {activeApp.theme?.primaryColor}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                الشاشات: {Object.keys(activeApp.screens || {}).length}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
