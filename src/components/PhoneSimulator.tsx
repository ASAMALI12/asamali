import React, { useState } from 'react';
import { 
  Wifi, 
  Battery, 
  Search, 
  Heart, 
  Plus, 
  Star, 
  ShoppingBag, 
  Home, 
  Compass, 
  User, 
  ArrowRight,
  Flame,
  Sparkles,
  Zap,
  CheckCircle2,
  Circle,
  MessageSquare,
  Phone,
  Send,
  PlusCircle,
  Wand2,
  Mic
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MobileAppConfig, AppItem } from '../types';

interface PhoneSimulatorProps {
  app: MobileAppConfig;
  onUpdateApp: (updated: MobileAppConfig) => void;
  onElementSelect?: (elementName: string) => void;
  onQuickVoicePrompt?: (prompt: string) => void;
  selectedElement?: string | null;
  isFullscreen?: boolean;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  app,
  onUpdateApp,
  onElementSelect,
  onQuickVoicePrompt,
  selectedElement,
  isFullscreen = false
}) => {
  const [activeTab, setActiveTab] = useState(app.navigation.activeTab || 'home');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInputText, setChatInputText] = useState('');
  const [currentTime] = useState(() => {
    const d = new Date();
    return `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, '0')}`;
  });

  const activeScreen = app.screens[activeTab] || app.screens['home'] || Object.values(app.screens)[0];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onElementSelect?.(`شريط التنقل: ${tabId}`);
  };

  const handleTaskToggle = (itemId: string) => {
    const updatedScreens = { ...app.screens };
    const screen = updatedScreens[activeTab] || updatedScreens['home'];
    if (screen) {
      screen.items = screen.items.map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      onUpdateApp({ ...app, screens: updatedScreens });
    }
  };

  const handleLikeToggle = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedScreens = { ...app.screens };
    const screen = updatedScreens[activeTab] || updatedScreens['home'];
    if (screen) {
      screen.items = screen.items.map(item => 
        item.id === itemId ? { ...item, isLiked: !item.isLiked } : item
      );
      onUpdateApp({ ...app, screens: updatedScreens });
    }
  };

  const handleCtaClick = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 }
    });
    onElementSelect?.(`الزر التفاعلي: ${app.customButton.text}`);
  };

  const handleSendDemoMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;
    const newMsg = {
      id: `${Date.now()}`,
      sender: 'me' as const,
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };
    onUpdateApp({
      ...app,
      chatMessagesDemo: [...(app.chatMessagesDemo || []), newMsg]
    });
    setChatInputText('');
  };

  const renderNavIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'compass': return <Compass className="w-5 h-5" />;
      case 'messagesquare': return <MessageSquare className="w-5 h-5" />;
      case 'user': return <User className="w-5 h-5" />;
      case 'shoppingbag': return <ShoppingBag className="w-5 h-5" />;
      case 'phone': return <Phone className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const filteredItems = (activeScreen?.items || []).filter(item => {
    return searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={`relative flex items-center justify-center ${isFullscreen ? 'w-full h-full' : 'p-2 sm:p-4'}`}>
      {/* Smartphone Device Frame */}
      <div 
        className={`relative w-full max-w-[390px] h-[780px] rounded-[48px] p-3 shadow-2xl transition-all duration-300 border-4 border-slate-700/80 bg-slate-900 overflow-hidden flex flex-col`}
        style={{
          boxShadow: `0 25px 60px -15px ${app.theme.primaryColor}33, 0 0 0 1px rgba(255,255,255,0.1)`
        }}
      >
        {/* Device Outer Details (Buttons on Phone Edge) */}
        <div className="absolute -left-1 top-24 w-1 h-8 bg-slate-600 rounded-l-md" />
        <div className="absolute -left-1 top-36 w-1 h-12 bg-slate-600 rounded-l-md" />
        <div className="absolute -left-1 top-52 w-1 h-12 bg-slate-600 rounded-l-md" />
        <div className="absolute -right-1 top-32 w-1 h-16 bg-slate-600 rounded-r-md" />

        {/* Screen Content Wrapper */}
        <div 
          className="relative w-full h-full rounded-[38px] flex flex-col overflow-hidden transition-colors duration-300"
          style={{
            backgroundColor: app.theme.bgColor,
            color: app.theme.textColor,
            fontFamily: app.theme.fontFamily
          }}
        >
          {/* Top Status Bar */}
          <div className="relative z-30 flex items-center justify-between px-6 pt-3 pb-1 select-none text-xs font-semibold">
            <span>{currentTime}</span>
            {/* Dynamic Island */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 h-6 w-28 bg-black rounded-full flex items-center justify-between px-2 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] text-slate-400 font-mono">LIVE</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono">5G</span>
              <div className="flex items-center gap-0.5">
                <Battery className="w-4 h-4" />
                <span className="text-[10px]">98%</span>
              </div>
            </div>
          </div>

          {/* App Header Bar */}
          <div 
            onClick={() => onElementSelect?.(`الهيدر: ${app.navigation.title}`)}
            className="flex items-center justify-between px-5 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              {app.navigation.showBack && (
                <button className="p-1 rounded-full hover:bg-white/10">
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <div>
                <h1 className="text-base font-extrabold tracking-tight flex items-center gap-1.5">
                  {app.navigation.title}
                </h1>
                <p className="text-[11px] opacity-70">
                  {activeScreen?.headerSubtitle || 'المحرك الذكي متصل ومستعد'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: app.theme.primaryColor }}
                title="اللون النشط"
              />
            </div>
          </div>

          {/* Screen Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-28">

            {/* INITIAL STATE: Ready to Build Canvas (Shown before user asks for a specific app) */}
            {!app.isBuilt && (
              <div className="flex flex-col items-center justify-center text-center py-6 px-2 space-y-5 animate-in fade-in">
                <div 
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl border border-white/10"
                  style={{ 
                    backgroundColor: `${app.theme.primaryColor}22`,
                    borderColor: `${app.theme.primaryColor}55`
                  }}
                >
                  📱
                </div>

                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/10 mb-2">
                    شاشة الهاتف فارغة ومستعدة ⚡
                  </span>
                  <h2 className="text-lg font-black text-white">
                    جاهز لبناء أي تطبيق تطلبه الآن!
                  </h2>
                  <p className="text-xs opacity-75 mt-1.5 max-w-[260px] leading-relaxed">
                    تحدث معي عبر الميكروفون بالأسفل أو اكتب في شريط الدردشة لبناء تطبيقك كاملاً فورياً على هذا الهاتف.
                  </p>
                </div>

                {/* Suggestions on the phone screen */}
                <div className="w-full space-y-2 pt-2 text-right">
                  <span className="text-[10px] font-bold opacity-60 block px-1">
                    أمثلة سريعة يمكنك نطقها أو النقر عليها:
                  </span>
                  <button
                    onClick={() => onQuickVoicePrompt?.('ابنِ تطبيق دردشة فوري')}
                    className="w-full p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">💬</span>
                      <span className="font-bold">"ابنِ تطبيق دردشة ومحادثات"</span>
                    </div>
                    <Wand2 className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => onQuickVoicePrompt?.('ابنِ تطبيق مهام وملاحظات')}
                    className="w-full p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">📝</span>
                      <span className="font-bold">"ابنِ تطبيق مهام وملاحظات"</span>
                    </div>
                    <Wand2 className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => onQuickVoicePrompt?.('ابنِ تطبيق محفظة مالية')}
                    className="w-full p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">💳</span>
                      <span className="font-bold">"ابنِ تطبيق محفظة مالية"</span>
                    </div>
                    <Wand2 className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <button
                    onClick={() => onQuickVoicePrompt?.('ابنِ متجر تسوق إلكتروني')}
                    className="w-full p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🛍️</span>
                      <span className="font-bold">"ابنِ متجر تسوق إلكتروني"</span>
                    </div>
                    <Wand2 className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>
              </div>
            )}

            {/* BUILT APP STATE: Renders the generated application */}
            {app.isBuilt && (
              <>
                {/* Search Input */}
                <div 
                  onClick={() => onElementSelect?.('حقل البحث')}
                  className="relative flex items-center"
                >
                  <Search className="absolute right-3 w-4 h-4 opacity-50" />
                  <input
                    type="text"
                    placeholder={activeScreen?.searchPlaceholder || 'ابحث في التطبيق...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-4 py-2.5 text-xs rounded-2xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all placeholder:text-slate-400"
                    style={{ 
                      borderColor: selectedElement === 'حقل البحث' ? app.theme.primaryColor : undefined,
                      boxShadow: selectedElement === 'حقل البحث' ? `0 0 0 2px ${app.theme.primaryColor}` : undefined
                    }}
                  />
                </div>

                {/* Banner Section */}
                {activeScreen?.banner && (
                  <div 
                    onClick={() => onElementSelect?.(`البانر الإعلاني: ${activeScreen.banner?.title}`)}
                    className={`relative overflow-hidden p-4 rounded-3xl bg-gradient-to-r ${activeScreen.banner.gradient} text-white shadow-lg cursor-pointer transition-transform hover:scale-[1.01]`}
                  >
                    <div className="relative z-10 max-w-[70%]">
                      <span className="inline-block px-2.5 py-0.5 mb-2 text-[10px] font-bold rounded-full bg-white/20 backdrop-blur-md">
                        مباشر
                      </span>
                      <h3 className="text-sm font-black mb-1 leading-snug">
                        {activeScreen.banner.title}
                      </h3>
                      <p className="text-[11px] opacity-90 mb-3 line-clamp-2">
                        {activeScreen.banner.subtitle}
                      </p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCtaClick(); }}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-900 shadow-md hover:bg-slate-100 transition-all"
                      >
                        {activeScreen.banner.buttonText}
                      </button>
                    </div>
                    <span className="absolute left-3 bottom-2 text-5xl opacity-40 select-none">
                      ⚡
                    </span>
                  </div>
                )}

                {/* Chat App Specific Interactive View */}
                {app.category === 'chat' && app.chatMessagesDemo && (
                  <div className="space-y-2 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[11px] font-bold opacity-70 block mb-1">
                      معاينة المحادثة المباشرة:
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {app.chatMessagesDemo.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.sender === 'me' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`p-2.5 rounded-2xl text-xs max-w-[80%] ${
                              m.sender === 'me'
                                ? 'bg-emerald-600 text-white rounded-br-xs'
                                : 'bg-slate-800 text-white rounded-bl-xs'
                            }`}
                          >
                            <p>{m.text}</p>
                            <span className="text-[9px] opacity-60 block mt-0.5">{m.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendDemoMessage} className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                      <input
                        type="text"
                        placeholder="اكتب رسالة تجريبية..."
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white"
                      />
                      <button type="submit" className="p-2 rounded-xl bg-emerald-600 text-white text-xs">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}

                {/* Items / Cards List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      {app.category === 'productivity' ? 'قائمة المهام' : 'عناصر التطبيق'}
                    </span>
                    <span className="text-[10px] opacity-60">
                      {filteredItems.length} عنصر
                    </span>
                  </div>

                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onElementSelect?.(`بطاقة: ${item.title}`)}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer hover:border-white/20 flex gap-3 relative`}
                      style={{
                        backgroundColor: app.theme.cardBg,
                        borderColor: selectedElement?.includes(item.title) ? app.theme.primaryColor : 'rgba(255,255,255,0.07)',
                        boxShadow: selectedElement?.includes(item.title) ? `0 0 0 2px ${app.theme.primaryColor}` : '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      {/* Checkbox for Tasks */}
                      {app.category === 'productivity' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTaskToggle(item.id); }}
                          className="shrink-0 self-center text-indigo-400 hover:scale-110 transition-transform"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                      )}

                      {/* Emoji / Item Avatar */}
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner"
                        style={{ backgroundColor: `${app.theme.primaryColor}18` }}
                      >
                        {item.imageEmoji}
                      </div>

                      {/* Item Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className={`text-xs font-bold truncate ${item.completed ? 'line-through opacity-50' : ''}`}>
                              {item.title}
                            </h4>
                            <button
                              onClick={(e) => handleLikeToggle(item.id, e)}
                              className="p-1 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Heart 
                                className={`w-3.5 h-3.5 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                              />
                            </button>
                          </div>
                          <p className="text-[11px] opacity-70 line-clamp-1 mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            {item.price && (
                              <span 
                                className="text-xs font-black font-mono"
                                style={{ color: app.theme.primaryColor }}
                              >
                                {item.price}
                              </span>
                            )}
                            {item.tag && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 opacity-80 font-bold">
                                {item.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Screen Bottom Action Button */}
                {activeScreen?.actionButton && (
                  <div className="pt-2">
                    <button
                      onClick={handleCtaClick}
                      className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: activeScreen.actionButton.color || app.theme.primaryColor,
                        boxShadow: `0 4px 20px -2px ${activeScreen.actionButton.color || app.theme.primaryColor}66`
                      }}
                    >
                      <Zap className="w-4 h-4" />
                      <span>{activeScreen.actionButton.text}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Interactive Floating Button (The "Custom Button" the user can command to change) */}
          <div className="absolute bottom-20 left-4 right-4 z-20">
            <button
              onClick={() => {
                onElementSelect?.(`الزر التفاعلي: ${app.customButton.text}`);
                handleCtaClick();
              }}
              className={`w-full py-3 px-5 text-xs font-extrabold shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 ${app.customButton.shape}`}
              style={{
                backgroundColor: app.customButton.bgColor,
                color: app.customButton.textColor,
                boxShadow: app.customButton.glow 
                  ? `0 0 25px 4px ${app.customButton.bgColor}88, 0 10px 20px rgba(0,0,0,0.4)`
                  : `0 8px 24px -4px ${app.customButton.bgColor}66`,
                border: selectedElement?.includes(app.customButton.text) ? '2px solid #FFFFFF' : 'none'
              }}
            >
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
              <span>{app.customButton.text}</span>
            </button>
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <div 
            onClick={() => onElementSelect?.('شريط التنقل السفلي')}
            className="absolute bottom-0 left-0 right-0 z-20 px-3 py-2 border-t border-white/10 backdrop-blur-xl flex items-center justify-around select-none"
            style={{
              backgroundColor: `${app.theme.cardBg}E6`
            }}
          >
            {app.navigation.tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
                    isActive ? 'scale-105' : 'opacity-50 hover:opacity-80'
                  }`}
                  style={{
                    color: isActive ? app.theme.primaryColor : undefined
                  }}
                >
                  {renderNavIcon(tab.icon)}
                  <span className="text-[10px] font-bold">{tab.label}</span>
                  {isActive && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: app.theme.primaryColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* iPhone Home Bar Indicator */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-30 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
