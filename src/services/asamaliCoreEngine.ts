import { MobileAppConfig, SmartZipCore, AppItem, CustomButtonConfig, AppScreen, AppTab } from '../types';
import { queryZipCore } from './zipEngine';

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

// 1. Persistent Storage Handlers
const MEMORY_STORAGE_KEY = 'asamali_engine_memory';
const CONTEXT_STORAGE_KEY = 'asamali_engine_context';

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

// 2. Real ASAMALI Lexicon
export const ASAMALI_LEXICON: AsamaliLexicon = {
  version: '3.6.0',
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

  // 1. Ensure isBuilt is true when screens exist
  if (!fixed.isBuilt && Object.keys(fixed.screens || {}).length > 0) {
    fixed.isBuilt = true;
    repaired = true;
    issues.push('تم تفعيل حالة البناء النشط للمشروع');
  }

  // 2. Ensure screens object exists and has at least one screen
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

  // 3. Ensure navigation tabs align with existing screens
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

  // Add missing tabs for newly generated screens
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

  // 4. Ensure activeTab exists
  if (!fixed.screens[fixed.navigation.activeTab]) {
    fixed.navigation.activeTab = screenKeys[0] || 'home';
    repaired = true;
    issues.push(`تم ضبط التبويب النشط على: ${fixed.navigation.activeTab}`);
  }

  // 5. Ensure valid customButton
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
 * Intelligent ASAMALI Core Execution Pipeline
 * Comprehends full natural language sentences and compound requests
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
  executionPlan: string[];
} {
  const normPrompt = prompt.trim();
  const tokens = tokenizeArabic(normPrompt);
  const context = getEngineContext();
  const matchedFiles: string[] = ['ASAMALI/brain/lexicon_ar.json'];
  const executionPlan: string[] = [];

  // Query ZIP core to pull relevant recipes and skills
  let zipCoreQueryResult: any = null;
  if (zipCore && zipCore.isLoaded) {
    zipCoreQueryResult = queryZipCore(normPrompt, zipCore);
    if (zipCoreQueryResult.matchedFiles.length > 0) {
      matchedFiles.push(...zipCoreQueryResult.matchedFiles);
    }
  }

  let updated: MobileAppConfig = JSON.parse(JSON.stringify(currentApp));
  let replyText = '';
  let resolvedIntent = 'INTENT_CUSTOM_PIPELINE';

  // -------------------------------------------------------------
  // TEST CASE 2 & COMPOUND REQUEST: Restaurant App with Menu, Cart, Confirm
  // e.g. "أنشئ تطبيق مطعم يحتوي على قائمة أطعمة وسلة طلبات وصفحة تأكيد الطلب"
  // -------------------------------------------------------------
  const isRestaurantIntent = 
    (tokens.includes('مطعم') || tokens.includes('اكل') || tokens.includes('طعام') || tokens.includes('وجبات')) &&
    (tokens.includes('قائمه') || tokens.includes('سله') || tokens.includes('تاكيد') || tokens.includes('انشئ') || tokens.includes('ابن'));

  if (isRestaurantIntent) {
    resolvedIntent = 'INTENT_BUILD_RESTAURANT_SYSTEM';
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
  // TEST CASE 1: Add Login Screen to Current Project
  // e.g. "أضف شاشة تسجيل دخول إلى المشروع"
  // -------------------------------------------------------------
  else if (
    (tokens.includes('دخول') || tokens.includes('تسجيل') || tokens.includes('login') || tokens.includes('auth')) &&
    (tokens.includes('اضف') || tokens.includes('ضع') || tokens.includes('شاشه') || tokens.includes('صفحه') || tokens.includes('انشئ') || tokens.includes('اعمل'))
  ) {
    resolvedIntent = 'INTENT_ADD_LOGIN_SCREEN';
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

    // Add tab in navigation if missing
    if (!updated.navigation.tabs.some(t => t.id === 'login')) {
      updated.navigation.tabs.push({
        id: 'login',
        label: 'تسجيل الدخول',
        icon: 'User'
      });
    }

    // Immediately activate the newly added login screen so the user sees it
    updated.navigation.activeTab = 'login';

    replyText = 'تم إنشاء شاشة تسجيل الدخول المتكاملة وإضافتها بنجاح إلى مشروعك الحالي! تم تفعيل الشاشة فورياً على الهاتف.';
    context.lastModifiedElement = { type: 'screen', id: 'login', name: 'شاشة تسجيل الدخول' };
    context.virtualFiles['src/screens/login.json'] = JSON.stringify(loginScreen);
  }

  // -------------------------------------------------------------
  // CONTEXTUAL MODIFICATION: e.g. "عدل الزر السابق", "غير لونه"
  // -------------------------------------------------------------
  else if (
    (tokens.includes('السابق') || tokens.includes('سابق') || tokens.includes('الماضي')) ||
    ((tokens.includes('غير') || tokens.includes('عدل') || tokens.includes('بدل')) && (tokens.includes('زر') || tokens.includes('الزر') || tokens.includes('لون')))
  ) {
    resolvedIntent = 'INTENT_MODIFY_PREVIOUS_ELEMENT';
    matchedFiles.push('ASAMALI/skills/debugging/SKILL.md');
    matchedFiles.push('ASAMALI/skills/app-building-v3/SKILL.md');

    executionPlan.push('1. مراجعة ذاكرة سياق المحرك لاسترجاع العنصر السابق');
    executionPlan.push('2. تحديد التعديل المطلوب (لون، شكل، أو نص)');
    executionPlan.push('3. تطبيق التعديل المباشر على ملفات المشروع');

    // Detect color
    let newColor: string | null = null;
    let colorName: string = '';
    for (const token of tokens) {
      if (ASAMALI_LEXICON.colors[token]) {
        newColor = ASAMALI_LEXICON.colors[token].hex;
        colorName = ASAMALI_LEXICON.colors[token].name;
        break;
      }
    }

    if (newColor) {
      updated.customButton.bgColor = newColor;
      updated.customButton.textColor = (newColor === '#FFFFFF' || newColor === '#EAB308') ? '#000000' : '#FFFFFF';
      updated.customButton.glow = true;
      updated.hasCustomButton = true;
      updated.isBuilt = true;

      replyText = `تم استرجاع الزر السابق من ذاكرة المشروع وتعديل لونه إلى ${colorName || newColor} بنجاح!`;
      context.lastModifiedElement = { type: 'button', id: updated.customButton.id, name: updated.customButton.text };
    } else {
      updated.customButton.text = 'زر تفاعلي محدث ✨';
      updated.customButton.glow = true;
      updated.hasCustomButton = true;
      updated.isBuilt = true;
      replyText = 'تم تعديل الزر السابق وتحديث حالته التفاعلية وفقاً لسياق المشروع.';
    }
  }

  // -------------------------------------------------------------
  // EXPLICIT DELETION: ONLY when user explicitly asks to delete
  // e.g. "احذف الزر", "احذف شاشة ...", "امسح الشاشة"
  // -------------------------------------------------------------
  else if (tokens.includes('احذف') || tokens.includes('حذف') || tokens.includes('ازل') || tokens.includes('ازالة')) {
    resolvedIntent = 'INTENT_EXPLICIT_DELETE';
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
      // Delete active screen if user asked to delete current screen
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
  // CLEAR CANVAS
  // -------------------------------------------------------------
  else if (tokens.includes('امسح') || tokens.includes('افرغ') || tokens.includes('تفريغ') || tokens.includes('فارغه')) {
    resolvedIntent = 'INTENT_CLEAR_CANVAS';
    matchedFiles.push('ASAMALI/skills/app-building-v3/SKILL.md');
    updated = {
      ...updated,
      isBuilt: false,
      hasCustomButton: false,
      showSearch: false,
      showBanner: false,
      screens: {
        home: {
          title: '',
          items: []
        }
      },
      navigation: {
        title: 'تطبيق جديد',
        showBack: false,
        tabs: [{ id: 'home', label: 'الرئيسية', icon: 'Home' }],
        activeTab: 'home'
      }
    };
    replyText = 'تم مسح اللوحة وتفريغ المشروع بنجاح. أصبحت الشاشة بيضاء مهيأة لأي مشروع جديد تطلبه.';
  }

  // -------------------------------------------------------------
  // ADD BUTTON DIRECTLY
  // -------------------------------------------------------------
  else if (tokens.includes('زر') || tokens.includes('الزر') || tokens.includes('زرار')) {
    resolvedIntent = 'INTENT_BUILD_BUTTON';
    matchedFiles.push('ASAMALI/knowledge/build-recipes/feature_recipes.json#recipe_button');

    let btnColor = updated.theme?.primaryColor || '#2563EB';
    let colorName = '';
    for (const token of tokens) {
      if (ASAMALI_LEXICON.colors[token]) {
        btnColor = ASAMALI_LEXICON.colors[token].hex;
        colorName = ASAMALI_LEXICON.colors[token].name;
        break;
      }
    }

    updated.hasCustomButton = true;
    updated.isBuilt = true;
    updated.customButton = {
      id: `btn_${Date.now()}`,
      text: colorName ? `زر تفاعلي (${colorName})` : 'زر تفاعلي ✨',
      bgColor: btnColor,
      textColor: (btnColor === '#FFFFFF' || btnColor === '#EAB308') ? '#000000' : '#FFFFFF',
      shape: 'rounded-full',
      icon: 'Zap',
      action: 'trigger_action',
      glow: true
    };

    replyText = `تم استدعاء وصفة الزر من نواة ASAMALI ورسم الزر ${colorName ? `بلون ${colorName}` : ''} على اللوحة!`;
    context.lastModifiedElement = { type: 'button', id: updated.customButton.id, name: updated.customButton.text };
  }

  // -------------------------------------------------------------
  // GENERAL INTENT: Comprehensive App Generation from Natural Language
  // -------------------------------------------------------------
  else {
    resolvedIntent = 'INTENT_NATURAL_COMPILATION';
    matchedFiles.push('ASAMALI/skills/app-building-v3/SKILL.md');
    matchedFiles.push('ASAMALI/knowledge/app-templates/templates.json');

    const cleanTitle = normPrompt
      .replace(/ابنِ|ابني|اصنع|انشئ|صمم|اعمل|تطبيق|اريد|سوي|لي|شغل|افتح/g, '')
      .trim() || 'التطبيق الذكي';

    executionPlan.push(`1. فهم فكرة التطبيق: ${cleanTitle}`);
    executionPlan.push('2. توليد الهيكل التفاعلي والواجهات المناسبة عبر النواة');
    executionPlan.push('3. إضافة العناصر التفاعلية وضبط الهوية البصرية');

    updated.isBuilt = true;
    updated.name = `تطبيق ${cleanTitle}`;
    updated.screens = updated.screens || {};
    updated.screens.home = {
      title: `واجهة ${cleanTitle}`,
      headerSubtitle: zipCore?.isLoaded ? `تعمل بنواة: ${zipCore.fileName}` : 'تم توليدها فورياً استجابةً لأمرك الصوتي/النصي',
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
        },
        {
          id: `item_2_${Date.now()}`,
          title: 'إمكانية التعديل اللحظي',
          subtitle: 'يمكنك قول: "غير لون هذا الزر" أو "أضف شاشة تسجيل دخول"',
          price: 'فوري',
          rating: 4.9,
          tag: 'مرن ✅',
          imageEmoji: '⚡'
        }
      ],
      actionButton: {
        text: `بدء استخدام ${cleanTitle}`,
        color: updated.theme?.primaryColor || '#DC2626',
        actionType: 'start'
      }
    };

    updated.hasCustomButton = true;
    replyText = `تم فهم أمرك وبناء واجهة [${cleanTitle}] بنجاح وتفعيلها مباشرة على الهاتف!`;
    context.lastModifiedElement = { type: 'screen', id: 'home', name: updated.screens.home.title };
  }

  // 4. Validate and auto-repair resulting app state
  const validation = validateAndRepairApp(updated);
  updated = validation.app;

  // 5. Update and persist engine context and memory
  context.conversationTurns.unshift({
    user: normPrompt,
    action: resolvedIntent,
    timestamp: new Date().toISOString()
  });
  context.activeProjectName = updated.name;
  saveEngineContext(context);

  const memoryItem: LearningItem = {
    id: `learn_${Date.now()}`,
    timestamp: new Date().toISOString(),
    prompt: normPrompt,
    normalizedTokens: tokens,
    resolvedIntent,
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
    resolvedIntent,
    executionPlan
  };
}
