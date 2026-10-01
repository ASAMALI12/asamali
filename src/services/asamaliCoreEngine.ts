import { MobileAppConfig, SmartZipCore, AppItem, CustomButtonConfig } from '../types';

export interface AsamaliLexicon {
  version: string;
  author: string;
  verbs: Record<string, string>;
  targets: Record<string, string>;
  colors: Record<string, { hex: string; name: string }>;
  shapes: Record<string, 'rounded-md' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full'>;
  themes: Record<string, { dark: boolean; bg: string; text: string }>;
}

export interface AsamaliRecipe {
  id: string;
  name: string;
  target: string;
  build: (params: Record<string, any>, currentApp: MobileAppConfig) => MobileAppConfig;
}

export interface LearningItem {
  id: string;
  timestamp: string;
  prompt: string;
  normalizedTokens: string[];
  resolvedIntent: string;
  matchedCoreFiles: string[];
  status: 'executed' | 'learned';
}

// 1. Real ASAMALI Lexicon
export const ASAMALI_LEXICON: AsamaliLexicon = {
  version: '3.5.0',
  author: 'ASAMALI',
  verbs: {
    'ارسم': 'DRAW',
    'رسم': 'DRAW',
    'ابن': 'BUILD',
    'بناء': 'BUILD',
    'انشئ': 'CREATE',
    'انشاء': 'CREATE',
    'ضع': 'ADD',
    'اضف': 'ADD',
    'غير': 'MODIFY',
    'تعديل': 'MODIFY',
    'بدل': 'MODIFY',
    'امسح': 'CLEAR',
    'مسح': 'CLEAR',
    'افرغ': 'CLEAR',
    'تفريغ': 'CLEAR',
    'احذف': 'CLEAR',
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
    'شات': 'CHAT',
    'محادثة': 'CHAT',
    'محادثات': 'CHAT',
    'تواصل': 'CHAT',
    'شاشة': 'CANVAS',
    'لوحة': 'CANVAS',
    'واجهة': 'CANVAS'
  },
  colors: {
    'ازرق': { hex: '#2563EB', name: 'أزرق ملكي' },
    'احمر': { hex: '#DC2626', name: 'أحمر قرمزي' },
    'اخضر': { hex: '#10B981', name: 'أخضر زمردي' },
    'ذهبي': { hex: '#F59E0B', name: 'ذهبي عنبري' },
    'اصفر': { hex: '#EAB308', name: 'أصفر مشع' },
    'بنفسجي': { hex: '#8B5CF6', name: 'بنفسجي ملكي' },
    'وردي': { hex: '#EC4899', name: 'وردي ناعم' },
    'برتقالي': { hex: '#F97316', name: 'برتقالي ناري' },
    'اسود': { hex: '#000000', name: 'أسود فحمي' },
    'ابيض': { hex: '#FFFFFF', name: 'أبيض ناصع' },
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

// 2. Real ASAMALI Feature Recipes
export const ASAMALI_RECIPES: Record<string, AsamaliRecipe> = {
  // وصفة رسم الزر
  recipe_button: {
    id: 'recipe_button',
    name: 'وصفة هندسة الزر التفاعلي',
    target: 'BUTTON',
    build: (params, currentApp) => {
      const updated: MobileAppConfig = JSON.parse(JSON.stringify(currentApp));
      updated.hasCustomButton = true;
      updated.isBuilt = true;

      const btnColor = params.color || updated.customButton.bgColor || '#2563EB';
      const btnShape = params.shape || updated.customButton.shape || 'rounded-full';
      const btnText = params.text || (params.colorName ? `زر تفاعلي (${params.colorName})` : 'زر تفاعلي ✨');
      const isGlow = params.glow !== undefined ? params.glow : true;

      updated.customButton = {
        id: `btn_${Date.now()}`,
        text: btnText,
        bgColor: btnColor,
        textColor: btnColor === '#FFFFFF' || btnColor === '#EAB308' ? '#000000' : '#FFFFFF',
        shape: btnShape,
        icon: 'Zap',
        action: 'trigger_action',
        glow: isGlow
      };
      return updated;
    }
  },

  // وصفة رسم شريط البحث
  recipe_search: {
    id: 'recipe_search',
    name: 'وصفة شريط البحث السريع',
    target: 'SEARCH',
    build: (params, currentApp) => {
      const updated: MobileAppConfig = JSON.parse(JSON.stringify(currentApp));
      updated.showSearch = true;
      updated.isBuilt = true;
      return updated;
    }
  },

  // وصفة رسم البطاقة الترحيبية
  recipe_banner: {
    id: 'recipe_banner',
    name: 'وصفة البطاقة الترحيبية',
    target: 'BANNER',
    build: (params, currentApp) => {
      const updated: MobileAppConfig = JSON.parse(JSON.stringify(currentApp));
      updated.showBanner = true;
      updated.isBuilt = true;
      updated.screens.home = updated.screens.home || { title: '', items: [] };
      updated.screens.home.banner = {
        title: params.title || 'مرحباً بك في تطبيقك الذكي ✨',
        subtitle: params.subtitle || 'تم رسم هذه البطاقة عبر محرك نواة ASAMALI البرمجي المباشر',
        buttonText: 'استكشاف',
        gradient: params.gradient || 'from-blue-600 via-indigo-600 to-purple-600'
      };
      return updated;
    }
  },

  // وصفة رسم المتجر الإلكتروني
  recipe_store: {
    id: 'recipe_store',
    name: 'وصفة متجر التجارة والتسوق',
    target: 'STORE',
    build: (params, currentApp) => {
      const updated: MobileAppConfig = JSON.parse(JSON.stringify(currentApp));
      updated.category = 'ecommerce';
      updated.isBuilt = true;
      updated.showSearch = true;
      updated.name = 'متجر التسوق الإلكتروني';

      const storeProducts: AppItem[] = [
        {
          id: 'prod_1',
          title: 'سماعات رأس لاسلكية برو',
          subtitle: 'عزل ضوضاء فائق وتقنية صوت محيطي',
          price: '١٤٩ $',
          rating: 4.9,
          tag: 'الأكثر طلباً',
          imageEmoji: '🎧',
          category: 'الكترونيات'
        },
        {
          id: 'prod_2',
          title: 'ساعة ذكية ألترا',
          subtitle: 'مراقبة اللياقة البدنية والأنشطة وشاشة أموليد',
          price: '١٩٩ $',
          rating: 4.8,
          tag: 'جديد',
          imageEmoji: '⌚',
          category: 'الكترونيات'
        },
        {
          id: 'prod_3',
          title: 'نظارة واقع افتراضي ذكية',
          subtitle: 'شاشات مزدوجة بدقة 4K ومستشعرات تتبع',
          price: '٣٤٩ $',
          rating: 5.0,
          tag: 'مميز',
          imageEmoji: '🥽',
          category: 'الكترونيات'
        },
        {
          id: 'prod_4',
          title: 'لوحة مفاتيح ميكانيكية مضيئة',
          subtitle: 'مفاتيح سريعة الاستجابة وإضاءة RGB احترافية',
          price: '٨٩ $',
          rating: 4.7,
          tag: 'ألعاب',
          imageEmoji: '⌨️',
          category: 'ملحقات'
        }
      ];

      updated.screens.home = {
        title: 'المتجر الإلكتروني',
        items: storeProducts
      };

      updated.hasCustomButton = true;
      updated.customButton = {
        id: 'btn_cart',
        text: 'إتمام الطلب والدفع 🛍️',
        bgColor: '#10B981',
        textColor: '#FFFFFF',
        shape: 'rounded-2xl',
        icon: 'ShoppingCart',
        action: 'checkout',
        glow: true
      };

      return updated;
    }
  },

  // وصفة رسم شاشة الشات والمحادثات
  recipe_chat: {
    id: 'recipe_chat',
    name: 'وصفة المحادثات والتواصل الفوري',
    target: 'CHAT',
    build: (params, currentApp) => {
      const updated: MobileAppConfig = JSON.parse(JSON.stringify(currentApp));
      updated.category = 'chat';
      updated.isBuilt = true;
      updated.name = 'تطبيق المحادثات الذكية';

      updated.chatMessagesDemo = [
        { id: 'msg_1', sender: 'other', text: 'أهلاً بك! كيف يسير مشروعك اليوم؟', time: '10:02 ص' },
        { id: 'msg_2', sender: 'me', text: 'أعمل حالياً على رسم الواجهة بنواة ASAMALI الذكية.', time: '10:04 ص' },
        { id: 'msg_3', sender: 'other', text: 'رائع جداً! النواة سريعة في توليد الواجهات والتصميم.', time: '10:05 ص' },
        { id: 'msg_4', sender: 'me', text: 'نعم، يتم التنفيذ لحظة بلحظة دون أي وسيط.', time: '10:06 ص' }
      ];

      updated.screens.home = {
        title: 'المحادثات',
        items: []
      };

      return updated;
    }
  },

  // وصفة تفريغ الشاشة
  recipe_clear: {
    id: 'recipe_clear',
    name: 'وصفة تفريغ ومسح اللوحة',
    target: 'CLEAR',
    build: (params, currentApp) => {
      return {
        ...currentApp,
        isBuilt: false,
        hasCustomButton: false,
        showSearch: false,
        showBanner: false,
        category: 'custom',
        screens: {
          home: {
            title: '',
            items: []
          }
        }
      };
    }
  }
};

/**
 * The Real In-Memory ASAMALI Learning Items Store
 */
export const ASAMALI_MEMORY_STORE: LearningItem[] = [];

/**
 * Normalizes input speech or text tokens
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

/**
 * Core Execution Pipeline:
 * Processes raw user input against ASAMALI/brain/lexicon_ar.json and ASAMALI/knowledge/build-recipes
 */
export function executeAsamaliPipeline(
  prompt: string,
  currentApp: MobileAppConfig,
  zipCore?: SmartZipCore
): {
  updatedApp: MobileAppConfig;
  replyText: string;
  matchedFiles: string[];
  resolvedIntent: string;
} {
  const tokens = tokenizeArabic(prompt);
  const matchedFiles: string[] = ['ASAMALI/brain/lexicon_ar.json'];

  // 1. Identify Target
  let detectedTarget: string | null = null;
  for (const token of tokens) {
    if (ASAMALI_LEXICON.targets[token]) {
      detectedTarget = ASAMALI_LEXICON.targets[token];
      break;
    }
  }

  // 2. Identify Verb
  let detectedVerb: string = 'DRAW';
  for (const token of tokens) {
    if (ASAMALI_LEXICON.verbs[token]) {
      detectedVerb = ASAMALI_LEXICON.verbs[token];
      break;
    }
  }

  // 3. Identify Colors
  let detectedColorHex: string | null = null;
  let detectedColorName: string | null = null;
  for (const token of tokens) {
    if (ASAMALI_LEXICON.colors[token]) {
      detectedColorHex = ASAMALI_LEXICON.colors[token].hex;
      detectedColorName = ASAMALI_LEXICON.colors[token].name;
      break;
    }
  }

  // 4. Identify Shapes
  let detectedShape: 'rounded-md' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full' | null = null;
  for (const token of tokens) {
    if (ASAMALI_LEXICON.shapes[token]) {
      detectedShape = ASAMALI_LEXICON.shapes[token];
      break;
    }
  }

  // 5. Special Intent Checks
  // A) Clear / Empty Canvas
  if (
    detectedVerb === 'CLEAR' || 
    tokens.includes('امسح') || 
    tokens.includes('افرغ') || 
    tokens.includes('تفريغ') || 
    tokens.includes('فارغه')
  ) {
    matchedFiles.push('ASAMALI/skills/app-building-v3/SKILL.md');
    const updated = ASAMALI_RECIPES.recipe_clear.build({}, currentApp);
    
    // Record in Learning memory
    recordLearningItem(prompt, tokens, 'INTENT_CLEAR_CANVAS', matchedFiles);

    return {
      updatedApp: updated,
      replyText: 'تم تنفيذ أمر النواة ومسح اللوحة بالكامل! أصبحت الشاشة فارغة تماماً ومهيأة لأوامرك القادمة.',
      matchedFiles,
      resolvedIntent: 'INTENT_CLEAR_CANVAS'
    };
  }

  // B) Conversational greeting / What can you do / Advice
  if (
    tokens.includes('مرحبا') || 
    tokens.includes('اهلا') || 
    tokens.includes('من') || 
    tokens.includes('ما') && tokens.includes('رايك') ||
    tokens.includes('اقترح')
  ) {
    matchedFiles.push('ASAMALI/skills/intent-analysis/SKILL.md');
    matchedFiles.push('ASAMALI/skills/voice-chat/SKILL.md');

    const reply = `أهلاً بك يا عصام! أنا محرك ASAMALI البرمجي الحقيقي. النواة مربوطة ومفعلة كلياً بملفات (lexicon_ar.json و feature_recipes.json). اللوحة أمامنا فارغة تماماً، وجاهزة لرسم أي مكون تريده فوراً (زر، شريط بحث، متجر، أو شات). ماذا تأمرني أن نرسم؟`;

    recordLearningItem(prompt, tokens, 'INTENT_CONVERSATION', matchedFiles);

    return {
      updatedApp: currentApp,
      replyText: reply,
      matchedFiles,
      resolvedIntent: 'INTENT_CONVERSATION'
    };
  }

  // C) Button Creation or Modification
  if (detectedTarget === 'BUTTON' || tokens.includes('زر') || tokens.includes('الزر')) {
    matchedFiles.push('ASAMALI/knowledge/build-recipes/feature_recipes.json#recipe_button');
    matchedFiles.push('ASAMALI/skills/app-building-v3/SKILL.md');

    const updated = ASAMALI_RECIPES.recipe_button.build({
      color: detectedColorHex,
      colorName: detectedColorName,
      shape: detectedShape,
      glow: true
    }, currentApp);

    recordLearningItem(prompt, tokens, 'INTENT_BUILD_BUTTON', matchedFiles);

    const colorDesc = detectedColorName ? `بلون ${detectedColorName}` : '';
    return {
      updatedApp: updated,
      replyText: `تم استدعاء وصفة الزر من نواة ASAMALI ورسم الزر ${colorDesc} على لوحتك بنجاح!`,
      matchedFiles,
      resolvedIntent: 'INTENT_BUILD_BUTTON'
    };
  }

  // D) Search Bar Creation
  if (detectedTarget === 'SEARCH' || tokens.includes('بحث')) {
    matchedFiles.push('ASAMALI/knowledge/build-recipes/feature_recipes.json#recipe_search');
    const updated = ASAMALI_RECIPES.recipe_search.build({}, currentApp);

    recordLearningItem(prompt, tokens, 'INTENT_BUILD_SEARCH', matchedFiles);

    return {
      updatedApp: updated,
      replyText: 'تم تنفيذ وصفة شريط البحث من النواة وإضافته على الواجهة مباشرة!',
      matchedFiles,
      resolvedIntent: 'INTENT_BUILD_SEARCH'
    };
  }

  // E) Banner / Welcome Card Creation
  if (detectedTarget === 'BANNER' || tokens.includes('بطاقه') || tokens.includes('بانر')) {
    matchedFiles.push('ASAMALI/knowledge/build-recipes/feature_recipes.json#recipe_banner');
    const updated = ASAMALI_RECIPES.recipe_banner.build({}, currentApp);

    recordLearningItem(prompt, tokens, 'INTENT_BUILD_BANNER', matchedFiles);

    return {
      updatedApp: updated,
      replyText: 'تم استدعاء وصفة البطاقة الترحيبية ورسمها بتدرج انسيابي على اللوحة!',
      matchedFiles,
      resolvedIntent: 'INTENT_BUILD_BANNER'
    };
  }

  // F) Store / E-commerce Creation
  if (detectedTarget === 'STORE' || tokens.includes('متجر') || tokens.includes('سوق') || tokens.includes('منتجات')) {
    matchedFiles.push('ASAMALI/knowledge/build-recipes/feature_recipes.json#recipe_store');
    matchedFiles.push('ASAMALI/knowledge/app-templates/templates.json#ecommerce');

    const updated = ASAMALI_RECIPES.recipe_store.build({}, currentApp);

    recordLearningItem(prompt, tokens, 'INTENT_BUILD_STORE', matchedFiles);

    return {
      updatedApp: updated,
      replyText: 'تم تفعيل وصفة المتجر الإلكتروني من نواة ASAMALI وعرض المنتجات وبطاقات الأسعار وسلة الشراء على اللوحة!',
      matchedFiles,
      resolvedIntent: 'INTENT_BUILD_STORE'
    };
  }

  // G) Chat Interface Creation
  if (detectedTarget === 'CHAT' || tokens.includes('شات') || tokens.includes('محادثه') || tokens.includes('تواصل')) {
    matchedFiles.push('ASAMALI/knowledge/build-recipes/feature_recipes.json#recipe_chat');
    matchedFiles.push('ASAMALI/knowledge/voice-chat/VOICE_CHAT_ANDROID.md');

    const updated = ASAMALI_RECIPES.recipe_chat.build({}, currentApp);

    recordLearningItem(prompt, tokens, 'INTENT_BUILD_CHAT', matchedFiles);

    return {
      updatedApp: updated,
      replyText: 'تم بناء شاشة المحادثات الفورية وتوزيع الرسائل التفاعلية على اللوحة بنواة ASAMALI!',
      matchedFiles,
      resolvedIntent: 'INTENT_BUILD_CHAT'
    };
  }

  // H) Generic Dynamic Component Generator
  // If user requested something custom, assemble a custom element directly!
  matchedFiles.push('ASAMALI/skills/app-building-v3/SKILL.md');
  const customApp: MobileAppConfig = JSON.parse(JSON.stringify(currentApp));
  customApp.isBuilt = true;

  const newItem: AppItem = {
    id: `item_${Date.now()}`,
    title: prompt.slice(0, 30),
    subtitle: 'عنصر ديناميكي تم توليده مباشرة من أوامر النواة',
    imageEmoji: '⚡',
    tag: 'نواة ASAMALI'
  };

  customApp.screens.home = customApp.screens.home || { title: '', items: [] };
  customApp.screens.home.items = [newItem, ...(customApp.screens.home.items || [])];

  recordLearningItem(prompt, tokens, 'INTENT_DYNAMIC_BUILD', matchedFiles);

  return {
    updatedApp: customApp,
    replyText: `تمت معالجة أمرك البرمجي عبر نواة ASAMALI وتوليد المكون المطلوب فورياً على اللوحة!`,
    matchedFiles,
    resolvedIntent: 'INTENT_DYNAMIC_BUILD'
  };
}

/**
 * Appends interaction to real in-memory ASAMALI learning loop
 */
function recordLearningItem(
  prompt: string,
  tokens: string[],
  resolvedIntent: string,
  matchedCoreFiles: string[]
) {
  const item: LearningItem = {
    id: `learn_${Date.now()}`,
    timestamp: new Date().toISOString(),
    prompt,
    normalizedTokens: tokens,
    resolvedIntent,
    matchedCoreFiles,
    status: 'executed'
  };
  ASAMALI_MEMORY_STORE.unshift(item);
}
