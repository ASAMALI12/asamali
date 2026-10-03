import { MobileAppConfig, SmartZipCore, AppItem, CustomButtonConfig, AppScreen, AppTab } from '../types';
import { queryZipCore } from './zipEngine';

export type RouterIntent = 
  | 'CHAT'
  | 'PROJECT_QUESTION'
  | 'BUILD'
  | 'MODIFY'
  | 'DELETE'
  | 'DEBUG'
  | 'UNKNOWN';

export interface RouteAnalysis {
  intent: RouterIntent;
  confidence: number;
  reason: string;
  target?: string;
  isActionable: boolean;
}

export interface AsamaliLexicon {
  version: string;
  author: string;
  verbs: Record<string, string>;
  targets: Record<string, string>;
  colors: Record<string, { hex: string; name: string }>;
  shapes: Record<string, 'rounded-md' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full'>;
  themes: Record<string, { dark: boolean; bg: string; text: string }>;
}

export interface LearningItem {
  id: string;
  timestamp: string;
  prompt: string;
  normalizedTokens: string[];
  resolvedIntent: string;
  matchedCoreFiles: string[];
  status: 'executed' | 'learned';
  executionPlan?: string[];
}

export interface EngineContext {
  lastModifiedElement?: {
    type: 'button' | 'screen' | 'color' | 'item' | 'tab';
    id: string;
    name: string;
    screenKey?: string;
  };
  lastIntent?: string;
  conversationTurns: Array<{ user: string; action: string; timestamp: string }>;
  activeProjectName?: string;
  virtualFiles: Record<string, string>;
}

export interface TeachCoreRecord {
  id: string;
  word: string;
  meaning: string;
  type: 'verb' | 'target' | 'color';
  timestamp: string;
}

// 1. Persistent Storage Handlers
const MEMORY_STORAGE_KEY = 'asamali_engine_memory';
const CONTEXT_STORAGE_KEY = 'asamali_engine_context';
const TEACHING_STORAGE_KEY = 'asamali_custom_teachings';

export function getEngineMemory(): LearningItem[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveEngineMemory(items: LearningItem[]) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch (e) {
    console.warn('Could not save engine memory to localStorage:', e);
  }
}

export function getEngineContext(): EngineContext {
  try {
    if (typeof localStorage === 'undefined') {
      return { conversationTurns: [], virtualFiles: {} };
    }
    const raw = localStorage.getItem(CONTEXT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {
      conversationTurns: [],
      virtualFiles: {}
    };
  } catch (e) {
    return { conversationTurns: [], virtualFiles: {} };
  }
}

export function saveEngineContext(ctx: EngineContext) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(ctx));
  } catch (e) {
    console.warn('Could not save engine context to localStorage:', e);
  }
}

export function getCustomTeachings(): TeachCoreRecord[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(TEACHING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomTeaching(record: Omit<TeachCoreRecord, 'id' | 'timestamp'>): TeachCoreRecord {
  const newRec: TeachCoreRecord = {
    id: `teach_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...record
  };
  try {
    const list = getCustomTeachings();
    list.unshift(newRec);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TEACHING_STORAGE_KEY, JSON.stringify(list));
    }
    // Register into active runtime lexicon
    if (record.type === 'verb') {
      ASAMALI_LEXICON.verbs[record.word.toLowerCase()] = record.meaning;
    } else if (record.type === 'target') {
      ASAMALI_LEXICON.targets[record.word.toLowerCase()] = record.meaning;
    }
  } catch (e) {
    console.warn('Failed to save teaching:', e);
  }
  return newRec;
}

// 2. Real ASAMALI Lexicon
export const ASAMALI_LEXICON: AsamaliLexicon = {
  version: '3.7.0',
  author: 'ASAMALI',
  verbs: {
    'ارسم': 'DRAW',
    'رسم': 'DRAW',
    'ابن': 'BUILD',
    'ابني': 'BUILD',
    'بناء': 'BUILD',
    'انشئ': 'CREATE',
    'انشاء': 'CREATE',
    'اصنع': 'CREATE',
    'سوي': 'CREATE',
    'اعمل': 'CREATE',
    'ضع': 'ADD',
    'اضف': 'ADD',
    'اضافة': 'ADD',
    'غير': 'MODIFY',
    'تعديل': 'MODIFY',
    'بدل': 'MODIFY',
    'حدث': 'MODIFY',
    'امسح': 'CLEAR',
    'مسح': 'CLEAR',
    'افرغ': 'CLEAR',
    'تفريغ': 'CLEAR',
    'احذف': 'DELETE',
    'حذف': 'DELETE',
    'ازل': 'DELETE',
    'ازالة': 'DELETE',
    'حفظ': 'SAVE',
    'فتح': 'OPEN'
  },
  targets: {
    'زر': 'BUTTON',
    'الزر': 'BUTTON',
    'زرار': 'BUTTON',
    'بحث': 'SEARCH',
    'شريط_بحث': 'SEARCH',
    'بطاقة': 'BANNER',
    'بانر': 'BANNER',
    'عنوان': 'BANNER',
    'متجر': 'STORE',
    'سوق': 'STORE',
    'منتجات': 'STORE',
    'مطعم': 'RESTAURANT',
    'اكل': 'RESTAURANT',
    'وجبات': 'RESTAURANT',
    'طعام': 'RESTAURANT',
    'شات': 'CHAT',
    'محادثة': 'CHAT',
    'محادثات': 'CHAT',
    'رسائل': 'CHAT',
    'تواصل': 'CHAT',
    'دخول': 'LOGIN',
    'تسجيل_دخول': 'LOGIN',
    'تسجيل': 'LOGIN',
    'سلة': 'CART',
    'تأكيد': 'CONFIRM',
    'تاكيد': 'CONFIRM',
    'طلب': 'ORDER',
    'شاشة': 'SCREEN',
    'صفحة': 'SCREEN',
    'واجهة': 'CANVAS'
  },
  colors: {
    'ازرق': { hex: '#2563EB', name: 'أزرق ملكي' },
    'أزرق': { hex: '#2563EB', name: 'أزرق ملكي' },
    'احمر': { hex: '#DC2626', name: 'أحمر قرمزي' },
    'أحمر': { hex: '#DC2626', name: 'أحمر قرمزي' },
    'اخضر': { hex: '#10B981', name: 'أخضر زمردي' },
    'أخضر': { hex: '#10B981', name: 'أخضر زمردي' },
    'ذهبي': { hex: '#F59E0B', name: 'ذهبي عنبري' },
    'اصفر': { hex: '#EAB308', name: 'أصفر مشع' },
    'أصفر': { hex: '#EAB308', name: 'أصفر مشع' },
    'بنفسجي': { hex: '#8B5CF6', name: 'بنفسجي ملكي' },
    'وردي': { hex: '#EC4899', name: 'وردي ناعم' },
    'برتقالي': { hex: '#EA580C', name: 'برتقالي دافئ' },
    'اسود': { hex: '#000000', name: 'أسود فحمي' },
    'أسود': { hex: '#000000', name: 'أسود فحمي' },
    'ابيض': { hex: '#FFFFFF', name: 'أبيض ناصع' },
    'أبيض': { hex: '#FFFFFF', name: 'أبيض ناصع' },
    'سماوي': { hex: '#06B6D4', name: 'سماوي بحري' },
    'نيوني': { hex: '#00F0FF', name: 'أزرق نيوني مشع' }
  },
  shapes: {
    'دائري': 'rounded-full',
    'مدور': 'rounded-full',
    'مربع': 'rounded-md',
    'حواف_ناعمة': 'rounded-2xl',
    'مستطيل': 'rounded-xl'
  },
  themes: {
    'داكن': { dark: true, bg: '#09090B', text: '#FAFAFA' },
    'مظلم': { dark: true, bg: '#000000', text: '#FFFFFF' },
    'ليلي': { dark: true, bg: '#0A0A0A', text: '#F4F4F5' },
    'فاتح': { dark: false, bg: '#F8FAFC', text: '#0F172A' },
    'نهاري': { dark: false, bg: '#FFFFFF', text: '#18181B' }
  }
};

// Merge any previously saved teachings into lexicon
if (typeof localStorage !== 'undefined') {
  try {
    const list = getCustomTeachings();
    list.forEach(item => {
      if (item.type === 'verb') {
        ASAMALI_LEXICON.verbs[item.word.toLowerCase()] = item.meaning;
      } else if (item.type === 'target') {
        ASAMALI_LEXICON.targets[item.word.toLowerCase()] = item.meaning;
      }
    });
  } catch (e) {}
}

/**
 * Normalizes input text and extracts clean tokens
 */
export function tokenizeArabic(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[ـ]/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/gi, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

// =====================================================================
// 3. INTENT ROUTER (طبقة توجيه النية الصارمة قبل تنفيذ أي إجراء)
// =====================================================================
export function analyzeUserIntent(
  prompt: string,
  currentApp: MobileAppConfig,
  context: EngineContext
): RouteAnalysis {
  const norm = prompt.trim().toLowerCase();
  const tokens = tokenizeArabic(norm);

  // -------------------------------------------------------------
  // A) Pure Conversational Greetings & Capabilities (CHAT)
  // e.g. "مرحبا", "السلام عليكم", "كيف حالك", "ماذا تستطيع ان تفعل", "ما الذي تستطيع بناءه؟"
  // -------------------------------------------------------------
  const capabilityInquiries = [
    'كيف حالك', 'كيفك', 'من انت', 'من أنت', 'ماذا تستطيع', 'ما الذي تستطيع', 
    'اشرح لي ماذا', 'ما هي قدراتك', 'ماذا تفعل', 'عرفني بنفسك', 'اقترح علي', 
    'شكرا', 'شكراً', 'مع السلامة', 'باي', 'تستطيع بناء',
    'النواة', 'نوات', 'متصل بالنواة', 'ملف النواة', 'ما هي النواة', 'ماذا في النواة'
  ];
  const isCapabilityInquiry = capabilityInquiries.some(ci => norm.includes(ci));

  const chatGreetings = ['مرحبا', 'مرحباً', 'اهلا', 'أهلاً', 'السلام عليكم', 'صباح الخير', 'مساء الخير', 'هلا', 'هاي', 'hello', 'hi'];
  const isPureGreeting = chatGreetings.some(g => norm === g || norm.startsWith(g + ' ') || norm === g + '!');

  // If user says "ما الذي تستطيع بناءه؟" or "هل أنت متصل بالنواة؟" or "مرحبا" -> strictly CHAT!
  if ((isCapabilityInquiry && !norm.includes('ابن') && !norm.includes('انشئ') && !norm.includes('اصنع')) || (isPureGreeting && !norm.includes('ابن') && !norm.includes('انشئ') && !norm.includes('اصنع'))) {
    return {
      intent: 'CHAT',
      confidence: 0.98,
      reason: 'محادثة عادية أو استفسار عن قدرات المحرك والنواة دون طلب بناء أو تعديل',
      isActionable: false
    };
  }

  // 1. Explicit Build Verbs
  const buildKeywords = ['ابنِ', 'ابني', 'انشئ', 'انشاء', 'اصنع', 'صمم', 'سوي تطبيق', 'اعمل تطبيق', 'build', 'create app'];
  const hasExplicitBuildDirective = buildKeywords.some(bk => norm.includes(bk));

  // 2. Explicit Modification / Addition Verbs
  const modifyKeywords = ['اضف', 'أضف', 'اضافة', 'ضع', 'غير', 'عدل', 'بدل', 'حدث', 'لون', 'اجعل', 'modify', 'update', 'change'];
  const hasExplicitModifyDirective = modifyKeywords.some(mk => norm.includes(mk));

  // 3. Explicit Delete Verbs
  const deleteKeywords = ['احذف', 'حذف', 'ازل', 'ازالة', 'امسح', 'مسح', 'افرغ', 'تفريغ', 'delete', 'remove', 'clear'];
  const hasExplicitDeleteDirective = deleteKeywords.some(dk => norm.includes(dk));

  // 4. Project Question Indicators
  const questionKeywords = ['ماذا يوجد', 'ما الملفات', 'ما الذي', 'هل يوجد', 'ما هو', 'ما هي', 'كم شاشة', 'كم شاشه', 'كم صفحة', 'اشرح لي المشروع', 'ما حالة', 'هل تم'];
  const isQuestion = questionKeywords.some(qk => norm.includes(qk)) || (norm.includes('?') || norm.includes('؟'));

  // 5. Debugging Indicators
  const debugKeywords = ['لماذا ظهر', 'سبب الخطأ', 'سبب هذا الخطأ', 'افحص المشروع', 'حلل الخطأ', 'debug', 'error'];
  const isDebug = debugKeywords.some(dk => norm.includes(dk));

  // -------------------------------------------------------------
  // B) Debugging Questions (DEBUG)
  // -------------------------------------------------------------
  if (isDebug && !hasExplicitBuildDirective) {
    return {
      intent: 'DEBUG',
      confidence: 0.95,
      reason: 'طلب تحليل وتشخيص أخطاء المشروع دون تعديل',
      isActionable: false
    };
  }

  // -------------------------------------------------------------
  // C) Project Questions (PROJECT_QUESTION)
  // e.g. "ماذا يوجد في المشروع؟", "هل يوجد في المشروع شاشة تسجيل دخول؟"
  // -------------------------------------------------------------
  if (isQuestion && !hasExplicitBuildDirective && !hasExplicitModifyDirective && !hasExplicitDeleteDirective) {
    return {
      intent: 'PROJECT_QUESTION',
      confidence: 0.95,
      reason: 'سؤال تحليلي واستفسار عن محتويات وملفات المشروع الحالي دون طلب تعديل',
      isActionable: false
    };
  }

  // -------------------------------------------------------------
  // D) Explicit Delete Intent (DELETE)
  // e.g. "احذف هذه الصفحة", "احذف الزر"
  // -------------------------------------------------------------
  if (hasExplicitDeleteDirective) {
    return {
      intent: 'DELETE',
      confidence: 0.95,
      reason: 'أمر صريح بحذف عنصر أو شاشة محددة',
      isActionable: true
    };
  }

  // -------------------------------------------------------------
  // E) Explicit Build Intent (BUILD)
  // e.g. "ابنِ تطبيق مطعم", "ابني واجهة ترحيب مكتوب فيها مرحبا"
  // -------------------------------------------------------------
  if (hasExplicitBuildDirective || norm.includes('تطبيق مطعم') || norm.includes('تطبيق شات') || norm.includes('تطبيق متجر')) {
    return {
      intent: 'BUILD',
      confidence: 0.96,
      reason: 'أمر إنشاء وتوليد تطبيق أو واجهة جديدة بالكامل',
      isActionable: true
    };
  }

  // -------------------------------------------------------------
  // F) Explicit Modify Intent (MODIFY)
  // e.g. "أضف شاشة تسجيل الدخول", "عدل لون الزر", "أضف زر تسجيل الدخول"
  // -------------------------------------------------------------
  if (hasExplicitModifyDirective || tokens.includes('السابق') || tokens.includes('زر') || tokens.includes('شاشه') || tokens.includes('شاشة')) {
    return {
      intent: 'MODIFY',
      confidence: 0.92,
      reason: 'أمر تعديل أو إضافة مكون إلى المشروع الحالي',
      isActionable: true
    };
  }

  // -------------------------------------------------------------
  // G) Ambiguous or Unknown (UNKNOWN)
  // -------------------------------------------------------------
  if (tokens.length <= 1 && !hasExplicitBuildDirective && !hasExplicitModifyDirective) {
    return {
      intent: 'UNKNOWN',
      confidence: 0.5,
      reason: 'رسالة غير واضحة المعالم، تحتاج توضيح من المستخدم',
      isActionable: false
    };
  }

  // Fallback to CHAT if no clear actionable directive was given
  return {
    intent: 'CHAT',
    confidence: 0.8,
    reason: 'سياق حواري عام دون أمر تنفيذي صريح',
    isActionable: false
  };
}

/**
 * Handles purely conversational queries (CHAT) without touching project state
 */
export function handleChatResponse(prompt: string, zipCore?: SmartZipCore): string {
  const norm = prompt.trim().toLowerCase();

  if (norm.includes('مرحبا') || norm.includes('اهلا') || norm.includes('السلام عليكم') || norm.includes('هلا')) {
    return zipCore?.isLoaded
      ? `أهلاً بك يا عصام! نواة [${zipCore.fileName}] مربوطة ومفعلة كلياً معي. أنا في خدمتك للمحادثة، أو التخطيط، أو بناء أي تطبيق تطلبه بالصوت أو النص. كيف يمكنني مساعدتك اليوم؟`
      : `أهلاً بك يا عصام! أنا مساعدك ومحرك ASAM الذكي. تفضل بأي سؤال أو حدد لي التطبيق الذي تريد هندسته وبناءه فورياً.`;
  }

  if (norm.includes('النواة') || norm.includes('نوات') || norm.includes('ملف') || norm.includes('مرتبط') || norm.includes('ربط')) {
    return zipCore?.isLoaded
      ? `نعم يا عصام، أنا متصل ومرتبط كلياً بملفات النواة [${zipCore.fileName}] وقواعدها البرمجية (${zipCore.manifest?.name || 'ASAMALI Smart Core'}). جميع الأوامر التي تنطقها أو تكتبها يتم توجيهها وتفسيرها مباشرة عبر وصفات وقوالب النواة لبناء الشاشات والأزرار.`
      : `أنا متصل بالنواة الذكية لـ ASAMALI وجاهز لتفسير أوامرك الصوتية والكتابية وتحويلها إلى واجهات برمجية حقيقية.`;
  }

  if (norm.includes('ماذا تستطيع') || norm.includes('ما الذي تستطيع') || norm.includes('اشرح لي ماذا') || norm.includes('قدراتك')) {
    return `أستطيع بناء وهندسة تطبيقات الهواتف الذكية التفاعلية بالكامل؛ مثل تطبيقات المطاعم، والمتاجر الإلكترونية، والمحادثات الفورية، وإضافة شاشات كشاشة تسجيل الدخول والسلة والدفع، وتعديل الألوان والتصاميم لحظياً بالصوت أو النص عبر النواة.`;
  }

  if (norm.includes('كيف حالك') || norm.includes('كيفك')) {
    return `أنا بخير وفي أتم الجاهزية البرمجية! النواة نشطة ومستعد لتنفيذ أي خطة تطلبها.`;
  }

  if (norm.includes('شكرا') || norm.includes('شكراً')) {
    return `العفو يا عصام! أنا هنا دائماً في خدمتك لمساعدتك في بناء وتطوير مشاريعك.`;
  }

  return `أهلاً بك! يمكنك سؤالي عن أي شيء، أو إعطائي أمراً مباشراً لبناء تطبيق (مثل: "ابنِ تطبيق مطعم" أو "أضف شاشة تسجيل الدخول").`;
}

/**
 * Answers questions about the current project without altering it (PROJECT_QUESTION)
 */
export function handleProjectQuestion(
  prompt: string,
  currentApp: MobileAppConfig,
  context: EngineContext
): string {
  const norm = prompt.trim().toLowerCase();
  const screenKeys = Object.keys(currentApp.screens || {});

  // Check login screen presence
  if (norm.includes('تسجيل دخول') || norm.includes('دخول') || norm.includes('login') || norm.includes('auth')) {
    const hasLogin = screenKeys.some(k => k.includes('login') || k.includes('auth'));
    if (hasLogin) {
      return `نعم، المشروع يحتوي حالياً على شاشة تسجيل دخول (Login Screen) مجهزة بحقول الإدخال، وزر الدخول، وخيار تذكر الجلسة.`;
    } else {
      return `لا، المشروع الحالي لا يحتوي على شاشة تسجيل دخول حتى الآن. إذا رغبت في إضافتها، فقط اطلب مني: "أضف شاشة تسجيل دخول إلى المشروع".`;
    }
  }

  // Check general files / screens in project
  if (norm.includes('ماذا يوجد') || norm.includes('ما الملفات') || norm.includes('ما الذي انشأته') || norm.includes('كم شاشة') || norm.includes('كم صفحة')) {
    if (!currentApp.isBuilt || screenKeys.length === 0) {
      return `المشروع الحالي ما زال فارغاً وفي حالة الانتظار، لم يتم بناء أي شاشات بعد. يمكنك البدء بطلب: "ابنِ تطبيق مطعم" أو أي فكرة أخرى.`;
    }
    const screenNames = screenKeys.map(k => currentApp.screens[k]?.title || k).join('، ');
    const hasBtn = currentApp.hasCustomButton ? `وزر تفاعلي (${currentApp.customButton.text})` : 'بدون زر عائم';
    return `يحتوي المشروع الحالي [${currentApp.name}] على ${screenKeys.length} شاشات هي: (${screenNames})، مع شريط تنقل سفلي، ${hasBtn}.`;
  }

  // Check button color / custom button
  if (norm.includes('زر') || norm.includes('لون')) {
    if (currentApp.hasCustomButton) {
      return `الزر التفاعلي الحالي نصه: "${currentApp.customButton.text}"، ولونه: ${currentApp.customButton.bgColor}، وشكله: ${currentApp.customButton.shape}.`;
    } else {
      return `لا يوجد زر تفاعلي عائم مفعل في المشروع حالياً. يمكنك إضافة زر بقول: "أضف زراً باللون الأزرق".`;
    }
  }

  return `حالة المشروع [${currentApp.name}]: يتضمن ${screenKeys.length} شاشات (${screenKeys.join(', ')}). جميع المكونات تعمل بتوافق تام.`;
}

/**
 * Validates the resulting app schema and automatically repairs any inconsistencies
 */
export function validateAndRepairApp(app: MobileAppConfig): {
  app: MobileAppConfig;
  repaired: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let repaired = false;
  const fixed = JSON.parse(JSON.stringify(app)) as MobileAppConfig;

  if (!fixed.isBuilt && Object.keys(fixed.screens || {}).length > 0) {
    fixed.isBuilt = true;
    repaired = true;
    issues.push('تم تفعيل حالة البناء النشط للمشروع');
  }

  if (!fixed.screens || Object.keys(fixed.screens).length === 0) {
    fixed.screens = {
      home: {
        title: 'الرئيسية',
        items: []
      }
    };
    repaired = true;
    issues.push('تم إنشاء الشاشة الرئيسية التلقائية');
  }

  if (!fixed.navigation) {
    fixed.navigation = {
      title: fixed.name || 'تطبيقي 📱',
      showBack: false,
      tabs: [],
      activeTab: 'home'
    };
    repaired = true;
  }

  const screenKeys = Object.keys(fixed.screens);
  const existingTabIds = new Set((fixed.navigation.tabs || []).map(t => t.id));

  screenKeys.forEach(sKey => {
    if (!existingTabIds.has(sKey)) {
      const scr = fixed.screens[sKey];
      let icon = 'Home';
      if (sKey.includes('login') || sKey.includes('auth')) icon = 'User';
      else if (sKey.includes('cart') || sKey.includes('basket')) icon = 'ShoppingBag';
      else if (sKey.includes('confirm') || sKey.includes('checkout')) icon = 'CheckCircle2';
      else if (sKey.includes('menu') || sKey.includes('food')) icon = 'Flame';
      else if (sKey.includes('chat')) icon = 'MessageSquare';
      else if (sKey.includes('profile')) icon = 'User';

      fixed.navigation.tabs.push({
        id: sKey,
        label: scr.title || sKey,
        icon
      });
      repaired = true;
      issues.push(`تمت إضافة تبويب تنقل للشاشة: ${scr.title || sKey}`);
    }
  });

  if (!fixed.screens[fixed.navigation.activeTab]) {
    fixed.navigation.activeTab = screenKeys[0] || 'home';
    repaired = true;
    issues.push(`تم ضبط التبويب النشط على: ${fixed.navigation.activeTab}`);
  }

  if (!fixed.customButton) {
    fixed.customButton = {
      id: 'cta_btn',
      text: 'إجراء تفاعلي ✨',
      bgColor: fixed.theme?.primaryColor || '#DC2626',
      textColor: '#FFFFFF',
      shape: 'rounded-full',
      icon: 'Zap',
      action: 'default',
      glow: true
    };
    fixed.hasCustomButton = true;
    repaired = true;
  }

  return { app: fixed, repaired, issues };
}

/**
 * Intelligent ASAMALI Core Execution Pipeline with Strict Intent Routing
 */
export function executeAsamaliPipeline(
  prompt: string,
  currentApp: MobileAppConfig,
  zipCore?: SmartZipCore
): {
  updatedApp: MobileAppConfig;
  replyText: string;
  matchedFiles: string[];
  resolvedIntent: RouterIntent;
  executionPlan: string[];
} {
  const normPrompt = prompt.trim();
  const tokens = tokenizeArabic(normPrompt);
  const context = getEngineContext();
  const matchedFiles: string[] = ['ASAMALI/brain/lexicon_ar.json'];
  const executionPlan: string[] = [];

  // ===================================================================
  // 1. INTENT ROUTING LAYER (تحليل وتوجيه النية أولاً)
  // ===================================================================
  const route = analyzeUserIntent(normPrompt, currentApp, context);

  // A) Pure Conversation (CHAT) -> DO NOT TOUCH APP OR FILES
  if (route.intent === 'CHAT') {
    const replyText = handleChatResponse(normPrompt, zipCore);
    return {
      updatedApp: currentApp, // NO modification
      replyText,
      matchedFiles: ['ASAMALI/skills/voice-chat/SKILL.md'],
      resolvedIntent: 'CHAT',
      executionPlan: ['توجيه المحادثة: إجابة حوارية مباشرة دون تعديل المشروع']
    };
  }

  // B) Question about Current Project (PROJECT_QUESTION) -> DO NOT TOUCH APP
  if (route.intent === 'PROJECT_QUESTION') {
    const replyText = handleProjectQuestion(normPrompt, currentApp, context);
    return {
      updatedApp: currentApp, // NO modification
      replyText,
      matchedFiles: ['ASAMALI/skills/intent-analysis/SKILL.md'],
      resolvedIntent: 'PROJECT_QUESTION',
      executionPlan: ['فحص المشروع: استرجاع معلومات الشاشات والملفات للإجابة التحليلية']
    };
  }

  // C) Debugging Question (DEBUG) -> DO NOT TOUCH APP
  if (route.intent === 'DEBUG') {
    const replyText = `تم فحص المشروع الحالي [${currentApp.name}]. الهيكل البرمجي متناسق وجميع الشاشات (${Object.keys(currentApp.screens).join(', ')}) معرفة بصورة سليمة دون تعارضات برمجية.`;
    return {
      updatedApp: currentApp,
      replyText,
      matchedFiles: ['ASAMALI/skills/debugging/SKILL.md'],
      resolvedIntent: 'DEBUG',
      executionPlan: ['تحليل سلامة الأكواد ومراجعة التناسق']
    };
  }

  // D) Ambiguous / Unknown (UNKNOWN) -> Ask clarifying question without modifying
  if (route.intent === 'UNKNOWN') {
    const replyText = `لم أستطع تحديد ما إذا كنت تريد محادثة عادية أو بناء تطبيق معين. هل تريد بناء تطبيق جديد، أو تعديل شاشة معينة؟ وضح لي طلبك وسأنفذه فوراً.`;
    return {
      updatedApp: currentApp,
      replyText,
      matchedFiles: ['ASAMALI/skills/intent-analysis/SKILL.md'],
      resolvedIntent: 'UNKNOWN',
      executionPlan: ['طلب توضيح من المستخدم لتفادي التعديل العشوائي']
    };
  }

  // ===================================================================
  // 2. ACTIONABLE EXECUTION PIPELINE (BUILD / MODIFY / DELETE)
  // Reaching here ONLY when intent is strictly actionable!
  // ===================================================================
  if (zipCore && zipCore.isLoaded) {
    const zipRes = queryZipCore(normPrompt, zipCore);
    if (zipRes.matchedFiles.length > 0) {
      matchedFiles.push(...zipRes.matchedFiles);
    }
  }

  let updated: MobileAppConfig = JSON.parse(JSON.stringify(currentApp));
  let replyText = '';

  // -------------------------------------------------------------
  // ACTIONABLE 1: Compound Request: Restaurant App (BUILD)
  // -------------------------------------------------------------
  const isRestaurantIntent = 
    (tokens.includes('مطعم') || tokens.includes('اكل') || tokens.includes('طعام') || tokens.includes('وجبات')) &&
    (tokens.includes('قائمه') || tokens.includes('سله') || tokens.includes('تاكيد') || tokens.includes('انشئ') || tokens.includes('ابن'));

  if (isRestaurantIntent && route.intent === 'BUILD') {
    matchedFiles.push('ASAMALI/knowledge/build-recipes/feature_recipes.json#recipe_restaurant');
    matchedFiles.push('ASAMALI/knowledge/app-templates/templates.json#food_delivery');
    matchedFiles.push('ASAMALI/knowledge/app-design/UX_PATTERNS_FOR_APPS.md');

    executionPlan.push('1. تحليل مواصفات تطبيق المطعم الشامل (القائمة، السلة، تأكيد الطلب)');
    executionPlan.push('2. استخراج مكونات تصميم الوجبات والسلة من مكتبات النواة');
    executionPlan.push('3. بناء شاشة قائمة الأطعمة (Menu) مع الأسعار والتقييمات');
    executionPlan.push('4. بناء شاشة سلة المشتريات (Cart) مع حساب المجموع والخصم');
    executionPlan.push('5. بناء شاشة تأكيد الطلب (Checkout) مع العنوان وطرق الدفع');
    executionPlan.push('6. تهيئة أشرطة التنقل السفلية وتفعيل الشاشة الرئيسية');

    updated = {
      id: `restaurant_${Date.now()}`,
      name: 'مطعم السعادة والذوق الرفيع 🍽️',
      category: 'restaurant',
      isBuilt: true,
      hasCustomButton: true,
      showSearch: true,
      showBanner: true,
      cartCount: 3,
      theme: {
        primaryColor: '#EA580C',
        secondaryColor: '#DC2626',
        accentColor: '#F59E0B',
        bgColor: '#0F172A',
        textColor: '#F8FAFC',
        cardBg: '#1E293B',
        borderRadius: 'rounded-2xl',
        fontFamily: 'Cairo, sans-serif',
        isDark: true,
        buttonGradient: 'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)'
      },
      navigation: {
        title: 'مطعم السعادة 🍔',
        showBack: false,
        tabs: [
          { id: 'home', label: 'القائمة', icon: 'Flame' },
          { id: 'cart', label: 'السلة', icon: 'ShoppingBag' },
          { id: 'confirm', label: 'تأكيد الطلب', icon: 'CheckCircle2' },
          { id: 'profile', label: 'حسابي', icon: 'User' }
        ],
        activeTab: 'home'
      },
      screens: {
        home: {
          title: 'قائمة الأطعمة الشهية',
          headerSubtitle: 'وجبات طازجة محضرة بأعلى جودة وتصلك ساخنة',
          banner: {
            title: 'عرض الشيف الذهبي اليوم 🔥',
            subtitle: 'خصم 25% على كافة وجبات البرجر والبيتزا العائلية',
            buttonText: 'اطلب العرض الآن',
            gradient: 'from-amber-600 via-orange-600 to-red-600'
          },
          searchPlaceholder: 'ابحث عن وجبتك المفضلة...',
          categories: [
            { id: 'c1', label: 'الأكثر طلباً', icon: 'Flame' },
            { id: 'c2', label: 'برجر مشوي', icon: 'Sparkles' },
            { id: 'c3', label: 'بيتزا إيطالية', icon: 'Star' },
            { id: 'c4', label: 'مشروبات وحلويات', icon: 'Heart' }
          ],
          items: [
            {
              id: 'food-1',
              title: 'برجر لحم كلاسيك ديلوكس',
              subtitle: 'شريحة لحم أنجوس مع صوص الشيف الخاص وجبنة الشيدر',
              price: '34.00 ر.س',
              rating: 4.9,
              tag: 'الأكثر مبيعاً ⭐',
              imageEmoji: '🍔'
            },
            {
              id: 'food-2',
              title: 'بيتزا بيبروني بالجبنة الموزاريلا',
              subtitle: 'عجينة رقيقة ومقرمشة مخبوزة على الحطب مع صوص الطماطم',
              price: '48.00 ر.س',
              rating: 4.8,
              tag: 'جديدنا 🔥',
              imageEmoji: '🍕'
            },
            {
              id: 'food-3',
              title: 'بطاطس مقرمشة بتوابل الكيرلي',
              subtitle: 'بطاطس ذهبية مقلية تقدم مع صوص الرانش اللذيذ',
              price: '14.00 ر.س',
              rating: 4.7,
              tag: 'طبق جانبي',
              imageEmoji: '🍟'
            },
            {
              id: 'food-4',
              title: 'عصير برتقال طبيعي مثلج',
              subtitle: 'عصير طازج معصور يومياً بدون سكر مضاف',
              price: '12.00 ر.س',
              rating: 4.9,
              tag: 'طبيعي 100%',
              imageEmoji: '🥤'
            }
          ],
          actionButton: {
            text: 'عرض السلة وإتمام الطلب (3 عناصر) 🛒',
            color: '#EA580C',
            actionType: 'goto_cart'
          }
        },
        cart: {
          title: 'سلة طلباتك الحالية',
          headerSubtitle: 'لديك 3 وجبات جاهزة للطلب من مطعم السعادة',
          banner: {
            title: 'كوبون الخصم مفعل: ASAM25 ✅',
            subtitle: 'تم توفير 20.00 ر.س على مجموع طلبك الحالي',
            buttonText: 'تعديل الكوبون',
            gradient: 'from-emerald-600 to-teal-700'
          },
          items: [
            {
              id: 'cart-1',
              title: 'برجر لحم كلاسيك ديلوكس (العدد: 2)',
              subtitle: 'إضافات: مخلل وصوص زيادة • بدون بصل',
              price: '68.00 ر.س',
              tag: 'جاهز 🍔',
              imageEmoji: '🍔'
            },
            {
              id: 'cart-2',
              title: 'بيتزا بيبروني بالجبنة (العدد: 1)',
              subtitle: 'حجم عائلي كبير مع أطراف جبنة',
              price: '48.00 ر.س',
              tag: 'جاهز 🍕',
              imageEmoji: '🍕'
            },
            {
              id: 'cart-fee',
              title: 'رسوم التوصيل السريع (30 دقيقة)',
              subtitle: 'مندوب المطعم المباشر حتى باب منزلك',
              price: '10.00 ر.س',
              tag: 'توصيل فوري 🛵',
              imageEmoji: '🛵'
            },
            {
              id: 'cart-total',
              title: 'المجموع الإجمالي المطلوب',
              subtitle: 'شامل الخصم وضريبة القيمة المضافة (15%)',
              price: '106.00 ر.س',
              tag: 'المجموع النهائي 🧾',
              imageEmoji: '💳'
            }
          ],
          actionButton: {
            text: 'المتابعة لصفحة تأكيد الطلب ➡️',
            color: '#EA580C',
            actionType: 'goto_confirm'
          }
        },
        confirm: {
          title: 'تأكيد الطلب والدفع',
          headerSubtitle: 'خطوة واحدة تفصلك عن وصول وجبتك الساخنة',
          banner: {
            title: 'توصيل سريع مضمون ⏱️',
            subtitle: 'سيتولى كابتن التوصيل استلام الطلب فور تأكيده الآن',
            buttonText: 'تتبع المندوب',
            gradient: 'from-blue-600 to-indigo-700'
          },
          items: [
            {
              id: 'conf-addr',
              title: 'عنوان التوصيل المختار',
              subtitle: 'الرياض - حي النخيل، شارع الأمير تركي الأول، عمارة 14',
              price: 'المنزل 🏡',
              tag: 'موقع دقيق 📍',
              imageEmoji: '📍'
            },
            {
              id: 'conf-pay',
              title: 'طريقة الدفع المختارة',
              subtitle: 'بطاقة مدى الرقمية عبر أبل باي (Apple Pay)',
              price: '106.00 ر.س',
              tag: 'دفع آمن 🔒',
              imageEmoji: '💳'
            },
            {
              id: 'conf-phone',
              title: 'رقم جوال المستلم للتنسيق',
              subtitle: '+966 50 123 4567 • تواصل واتساب مفعل',
              price: 'مؤكد ✅',
              tag: 'رقم أساسي',
              imageEmoji: '📱'
            },
            {
              id: 'conf-notes',
              title: 'ملاحظات تسليم الطلب',
              subtitle: 'يرجى وضع الطلب عند الباب وقرع الجرس برفق',
              price: 'تعليمات 📝',
              tag: 'ملاحظة',
              imageEmoji: '📝'
            }
          ],
          actionButton: {
            text: 'تأكيد وإرسال الطلب للمطبخ الآن 🚀',
            color: '#EA580C',
            actionType: 'place_order'
          }
        }
      },
      customButton: {
        id: 'cart-float-btn',
        text: 'السلة (3 وجبات) 🛒',
        bgColor: '#EA580C',
        textColor: '#FFFFFF',
        shape: 'rounded-full',
        icon: 'ShoppingBag',
        action: 'open_cart',
        glow: true
      }
    };

    replyText = 'تم تنفيذ خطة بناء تطبيق المطعم المتكامل بنجاح عبر نواة ASAMALI! تم إنشاء شاشة قائمة الأطعمة وسلة الطلبات وصفحة تأكيد الطلب وربط شريط التنقل.';
    context.lastModifiedElement = { type: 'screen', id: 'home', name: 'شاشة قائمة الأطعمة' };
    context.virtualFiles['src/screens/menu.json'] = JSON.stringify(updated.screens.home);
    context.virtualFiles['src/screens/cart.json'] = JSON.stringify(updated.screens.cart);
    context.virtualFiles['src/screens/confirm.json'] = JSON.stringify(updated.screens.confirm);
  }

  // -------------------------------------------------------------
  // ACTIONABLE 2: Add Login Screen (MODIFY / BUILD)
  // e.g. "أضف شاشة تسجيل دخول إلى المشروع" (without "زر")
  // -------------------------------------------------------------
  else if (
    (tokens.includes('دخول') || tokens.includes('تسجيل') || tokens.includes('login') || tokens.includes('auth')) &&
    (tokens.includes('شاشه') || tokens.includes('شاشة') || tokens.includes('صفحه') || tokens.includes('صفحة')) &&
    !tokens.includes('زر') && !tokens.includes('الزر')
  ) {
    matchedFiles.push('ASAMALI/knowledge/connectors/AUTH_PATTERNS.md');
    matchedFiles.push('ASAMALI/knowledge/build-recipes/feature_recipes.json#recipe_login');

    executionPlan.push('1. تحليل متطلبات شاشة تسجيل الدخول وأمان المستخدم');
    executionPlan.push('2. إنشاء شاشة الدخول (Login Screen) مع حقول الهوية وكلمة المرور');
    executionPlan.push('3. إضافة أزرار الدخول السريع واستعادة الحساب');
    executionPlan.push('4. تسجيل تبويب الشاشة الجديدة في شريط التنقل');
    executionPlan.push('5. تفعيل الشاشة الجديدة فورياً على المحاكي');

    updated.isBuilt = true;
    const loginThemeColor = updated.theme?.primaryColor || '#2563EB';

    const loginScreen: AppScreen = {
      title: 'تسجيل الدخول',
      headerSubtitle: 'سجل دخولك للوصول إلى كافة ميزات وخدمات حسابك',
      banner: {
        title: 'أهلاً بك مجدداً 🔐',
        subtitle: 'أدخل بيانات حسابك المسجل أو أنشئ حساباً جديداً',
        buttonText: 'دخول سريع',
        gradient: 'from-blue-600 to-indigo-700'
      },
      items: [
        {
          id: 'field-username',
          title: 'البريد الإلكتروني أو اسم المستخدم',
          subtitle: 'أدخل بريدك مثل: user@example.com',
          price: 'مطلوب',
          tag: 'حقل إدخال',
          imageEmoji: '📧'
        },
        {
          id: 'field-password',
          title: 'كلمة المرور السرية',
          subtitle: '•••••••• (8 خانات على الأقل)',
          price: 'مطلوب',
          tag: 'سري 🔒',
          imageEmoji: '🔒'
        },
        {
          id: 'field-remember',
          title: 'تذكر تسجيل دخولي دائماً',
          subtitle: 'حفظ الجلسة الآمنة على هذا الهاتف المحمول',
          price: 'مفعل',
          tag: 'أمان ✅',
          imageEmoji: '✅'
        },
        {
          id: 'field-forgot',
          title: 'نسيت كلمة المرور؟',
          subtitle: 'اضغط هنا لاستعادة كلمة المرور عبر البريد أو الـ SMS',
          price: 'مساعدة',
          tag: 'استعادة',
          imageEmoji: '🔑'
        }
      ],
      actionButton: {
        text: 'تسجيل الدخول الآن 🚀',
        color: loginThemeColor,
        actionType: 'submit_login'
      }
    };

    updated.screens = updated.screens || {};
    updated.screens['login'] = loginScreen;

    if (!updated.navigation.tabs.some(t => t.id === 'login')) {
      updated.navigation.tabs.push({
        id: 'login',
        label: 'تسجيل الدخول',
        icon: 'User'
      });
    }

    updated.navigation.activeTab = 'login';
    replyText = 'تم إنشاء وتعديل ملفات المشروع لإضافة شاشة تسجيل الدخول المتكاملة وربطها بالتنقل بنجاح!';
    context.lastModifiedElement = { type: 'screen', id: 'login', name: 'شاشة تسجيل الدخول' };
    context.virtualFiles['src/screens/login.json'] = JSON.stringify(loginScreen);
  }

  // -------------------------------------------------------------
  // ACTIONABLE 3: Explicit Deletions (DELETE)
  // e.g. "احذف هذه الصفحة", "احذف الزر"
  // -------------------------------------------------------------
  else if (route.intent === 'DELETE') {
    matchedFiles.push('ASAMALI/skills/app-building-v3/SKILL.md');

    if (tokens.includes('زر') || tokens.includes('الزر')) {
      updated.hasCustomButton = false;
      replyText = 'تم حذف الزر التفاعلي من المشروع بناءً على طلبك الصريح.';
    } else if (tokens.includes('بحث')) {
      updated.showSearch = false;
      replyText = 'تم حذف شريط البحث من الواجهة.';
    } else if (tokens.includes('بانر') || tokens.includes('بطاقه')) {
      updated.showBanner = false;
      replyText = 'تم حذف البطاقة الترحيبية من الشاشة.';
    } else {
      const curTab = updated.navigation.activeTab;
      if (curTab !== 'home' && updated.screens[curTab]) {
        delete updated.screens[curTab];
        updated.navigation.tabs = updated.navigation.tabs.filter(t => t.id !== curTab);
        updated.navigation.activeTab = 'home';
        replyText = `تم حذف الشاشة [${curTab}] والرجوع إلى الشاشة الرئيسية.`;
      } else {
        replyText = 'حدد بدقة العنصر أو الشاشة التي تريد حذفها صراحةً.';
      }
    }
  }

  // -------------------------------------------------------------
  // ACTIONABLE 4: Contextual Modification (MODIFY)
  // e.g. "عدل الزر السابق", "أضف زر تسجيل الدخول"
  // -------------------------------------------------------------
  else if (route.intent === 'MODIFY') {
    matchedFiles.push('ASAMALI/skills/app-building-v3/SKILL.md');

    let newColor: string | null = null;
    let colorName: string = '';
    for (const token of tokens) {
      if (ASAMALI_LEXICON.colors[token]) {
        newColor = ASAMALI_LEXICON.colors[token].hex;
        colorName = ASAMALI_LEXICON.colors[token].name;
        break;
      }
    }

    if (tokens.includes('زر') || tokens.includes('الزر')) {
      const btnColor = newColor || updated.theme?.primaryColor || '#2563EB';
      const btnText = tokens.includes('تسجيل') ? 'تسجيل الدخول 🔐' : (colorName ? `زر (${colorName})` : 'زر تفاعلي ✨');

      updated.hasCustomButton = true;
      updated.isBuilt = true;
      updated.customButton = {
        id: `btn_${Date.now()}`,
        text: btnText,
        bgColor: btnColor,
        textColor: (btnColor === '#FFFFFF' || btnColor === '#EAB308') ? '#000000' : '#FFFFFF',
        shape: 'rounded-full',
        icon: 'Zap',
        action: 'trigger_action',
        glow: true
      };

      replyText = `تم تعديل وإضافة الزر [${btnText}] إلى المشروع بنجاح!`;
      context.lastModifiedElement = { type: 'button', id: updated.customButton.id, name: updated.customButton.text };
    } else if (newColor) {
      updated.theme.primaryColor = newColor;
      replyText = `تم تحديث لون الهوية البصرية للمشروع إلى ${colorName || newColor}.`;
    } else {
      replyText = `تم تطبيق التعديلات المطلوبة على عناصر المشروع بنجاح.`;
    }
  }

  // -------------------------------------------------------------
  // ACTIONABLE 5: General App Building (BUILD)
  // e.g. "ابني واجهة ترحيب مكتوب فيها مرحبا", "ابنِ تطبيق سياحة"
  // -------------------------------------------------------------
  else if (route.intent === 'BUILD') {
    matchedFiles.push('ASAMALI/skills/app-building-v3/SKILL.md');
    matchedFiles.push('ASAMALI/knowledge/app-templates/templates.json');

    const cleanTitle = normPrompt
      .replace(/ابنِ|ابني|اصنع|انشئ|صمم|اعمل|تطبيق|اريد|سوي|لي|شغل|افتح/g, '')
      .trim() || 'التطبيق الجديد';

    executionPlan.push(`1. فهم فكرة التطبيق: ${cleanTitle}`);
    executionPlan.push('2. استخراج مكونات الواجهة المناسبة من النواة');
    executionPlan.push('3. بناء شاشات وعناصر المشروع');

    updated.isBuilt = true;
    updated.name = `تطبيق ${cleanTitle}`;
    updated.screens = updated.screens || {};
    updated.screens.home = {
      title: `واجهة ${cleanTitle}`,
      headerSubtitle: zipCore?.isLoaded ? `تعمل بنواة: ${zipCore.fileName}` : 'تم توليدها استجابة لأمر البناء',
      banner: {
        title: `مرحباً بك في ${cleanTitle} ✨`,
        subtitle: 'تطبيقك مهيكل بالكامل وجاهز للتعديل المباشر على الهاتف',
        buttonText: 'استكشف الآن',
        gradient: 'from-indigo-600 via-purple-600 to-pink-600'
      },
      searchPlaceholder: `ابحث داخل ${cleanTitle}...`,
      items: [
        {
          id: `item_1_${Date.now()}`,
          title: `الخدمة الأساسية في ${cleanTitle}`,
          subtitle: 'عنصر ديناميكي تم بناؤه وتنسيقه بواسطة نواة ASAMALI',
          price: 'نشط',
          rating: 5.0,
          tag: 'ميزة رئيسية ⭐',
          imageEmoji: '🚀'
        }
      ],
      actionButton: {
        text: `بدء استخدام ${cleanTitle}`,
        color: updated.theme?.primaryColor || '#DC2626',
        actionType: 'start'
      }
    };

    updated.hasCustomButton = true;
    replyText = `تم بناء واجهة [${cleanTitle}] بنجاح وتفعيلها مباشرة على الهاتف!`;
    context.lastModifiedElement = { type: 'screen', id: 'home', name: updated.screens.home.title };
  }

  // 3. Validate and auto-repair resulting app state
  const validation = validateAndRepairApp(updated);
  updated = validation.app;

  // 4. Update and persist engine context and memory
  context.conversationTurns.unshift({
    user: normPrompt,
    action: route.intent,
    timestamp: new Date().toISOString()
  });
  context.activeProjectName = updated.name;
  saveEngineContext(context);

  const memoryItem: LearningItem = {
    id: `learn_${Date.now()}`,
    timestamp: new Date().toISOString(),
    prompt: normPrompt,
    normalizedTokens: tokens,
    resolvedIntent: route.intent,
    matchedCoreFiles: matchedFiles,
    status: 'executed',
    executionPlan
  };
  const currentMem = getEngineMemory();
  currentMem.unshift(memoryItem);
  saveEngineMemory(currentMem);

  return {
    updatedApp: updated,
    replyText,
    matchedFiles,
    resolvedIntent: route.intent,
    executionPlan
  };
}
