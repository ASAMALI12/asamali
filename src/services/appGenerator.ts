import { MobileAppConfig, AppTheme, CustomButtonConfig } from '../types';
import { queryZipCore } from './zipEngine';
import { 
  executeAsamaliPipeline, 
  validateAndRepairApp, 
  getEngineContext, 
  saveEngineContext, 
  getEngineMemory, 
  saveEngineMemory, 
  LearningItem,
  analyzeUserIntent 
} from './asamaliCoreEngine';

export const INITIAL_EMPTY_APP: MobileAppConfig = {
  id: 'fresh_app',
  name: 'تطبيق الهاتف الجديد',
  category: 'custom',
  isBuilt: false, // In initial state, phone screen is waiting
  theme: {
    primaryColor: '#DC2626', // Red accent default
    secondaryColor: '#EF4444',
    accentColor: '#F59E0B',
    bgColor: '#0A0A0A',
    textColor: '#FAFAFA',
    cardBg: '#171717',
    borderRadius: 'rounded-2xl',
    fontFamily: 'Cairo, sans-serif',
    isDark: true,
    buttonGradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
  },
  navigation: {
    title: 'تطبيقي 📱',
    showBack: false,
    tabs: [
      { id: 'home', label: 'الرئيسية', icon: 'Home' },
      { id: 'explore', label: 'استكشاف', icon: 'Compass' },
      { id: 'chat', label: 'المحادثات', icon: 'MessageSquare' },
      { id: 'profile', label: 'حسابي', icon: 'User' }
    ],
    activeTab: 'home'
  },
  screens: {
    home: {
      title: 'الشاشة الرئيسية',
      items: [
        {
          id: 'starter-1',
          title: 'عنصر تفاعلي',
          subtitle: 'جاهز للتعديل المباشر بالصوت أو النص',
          price: 'متاح',
          imageEmoji: '🚀'
        }
      ],
      actionButton: {
        text: 'تأكيد العملية',
        color: '#DC2626'
      }
    }
  },
  customButton: {
    id: 'interactive-fab',
    text: 'زر تفاعلي ✨',
    bgColor: '#DC2626',
    textColor: '#FFFFFF',
    shape: 'rounded-full',
    icon: 'Sparkles',
    action: 'trigger_demo',
    glow: true
  },
  cartCount: 0,
  userName: 'المستخدم'
};

/**
 * Recognizes Arabic color names and returns clean HEX codes
 */
export function extractArabicColor(text: string): { color: string; label: string } | null {
  const lower = text.toLowerCase();
  
  if (lower.includes('أزرق') || lower.includes('ازرق') || lower.includes('نيلي') || lower.includes('سماوي') || lower.includes('blue')) {
    if (lower.includes('فاتح') || lower.includes('سماوي')) return { color: '#38BDF8', label: 'الأزرق السماوي' };
    if (lower.includes('غامق') || lower.includes('داكن')) return { color: '#1E40AF', label: 'الأزرق الداكن' };
    return { color: '#2563EB', label: 'الأزرق' };
  }
  if (lower.includes('أحمر') || lower.includes('احمر') || lower.includes('قرمزي') || lower.includes('نبيتي') || lower.includes('red')) {
    return { color: '#DC2626', label: 'الأحمر' };
  }
  if (lower.includes('أخضر') || lower.includes('اخضر') || lower.includes('زمردي') || lower.includes('green')) {
    return { color: '#10B981', label: 'الأخضر' };
  }
  if (lower.includes('بنفسجي') || lower.includes('موف') || lower.includes('أرجواني') || lower.includes('purple')) {
    return { color: '#8B5CF6', label: 'البنفسجي' };
  }
  if (lower.includes('وردي') || lower.includes('زهري') || lower.includes('بينك') || lower.includes('pink')) {
    return { color: '#EC4899', label: 'الوردي' };
  }
  if (lower.includes('برتقالي') || lower.includes('orange')) {
    return { color: '#F97316', label: 'البرتقالي' };
  }
  if (lower.includes('أصفر') || lower.includes('اصفر') || lower.includes('ذهبي') || lower.includes('ذهب') || lower.includes('gold') || lower.includes('yellow')) {
    return { color: '#EAB308', label: 'الذهبي' };
  }
  if (lower.includes('فيروزي') || lower.includes('تركواز') || lower.includes('cyan') || lower.includes('teal')) {
    return { color: '#06B6D4', label: 'الفيروزي' };
  }
  if (lower.includes('أسود') || lower.includes('اسود') || lower.includes('داكن') || lower.includes('black')) {
    return { color: '#0A0A0A', label: 'الأسود' };
  }
  if (lower.includes('أبيض') || lower.includes('ابيض') || lower.includes('white')) {
    return { color: '#FFFFFF', label: 'الأبيض' };
  }
  return null;
}

/**
 * Builds specific custom apps based on user voice/text description
 */
export function buildAppFromPrompt(prompt: string, currentTheme?: AppTheme, zipCore?: any): MobileAppConfig {
  const p = prompt.toLowerCase();
  const themeColor = currentTheme?.primaryColor || '#DC2626';

  // 1. Chat & Messaging App (e.g. "شات", "دردشة", "محادثة", "رسائل", "واتساب")
  if (p.includes('دردشة') || p.includes('شات') || p.includes('محادثة') || p.includes('رسائل') || p.includes('واتساب') || p.includes('chat') || p.includes('تواصل')) {
    return {
      id: 'chat_app',
      name: 'تطبيق المحادثات الذكية',
      category: 'chat',
      isBuilt: true,
      theme: {
        primaryColor: currentTheme?.primaryColor || '#059669',
        secondaryColor: '#10B981',
        accentColor: '#34D399',
        bgColor: '#06131B',
        textColor: '#F8FAFC',
        cardBg: '#0F232F',
        borderRadius: 'rounded-2xl',
        fontFamily: 'Cairo, sans-serif',
        isDark: true,
      },
      navigation: {
        title: 'شات فوري 💬',
        showBack: false,
        tabs: [
          { id: 'home', label: 'المحادثات', icon: 'MessageSquare' },
          { id: 'calls', label: 'المكالمات', icon: 'Phone' },
          { id: 'status', label: 'الحالات', icon: 'Sparkles' },
          { id: 'profile', label: 'الإعدادات', icon: 'User' }
        ],
        activeTab: 'home'
      },
      screens: {
        home: {
          title: 'صندوق المحادثات',
          headerSubtitle: zipCore?.isLoaded ? `النواة النشطة: ${zipCore.fileName}` : 'متصل الآن ومستعد للمراسلة',
          searchPlaceholder: 'ابحث في المحادثات...',
          items: [
            {
              id: 'chat-1',
              title: 'المهندس أحمد خالد',
              subtitle: 'تم اختبار النواة البرمجية بنجاح ✅',
              tag: 'منذ 2 د',
              imageEmoji: '👨‍💻'
            },
            {
              id: 'chat-2',
              title: 'مجموعة المطورين الذكية',
              subtitle: 'المحرك جاهز لبناء أي تطبيق فورياً بالصوت',
              tag: 'اليوم',
              imageEmoji: '🚀'
            },
            {
              id: 'chat-3',
              title: 'سارة عبد الله',
              subtitle: 'مرحباً، تم تغيير لون الأزرار مباشرة',
              tag: 'أمس',
              imageEmoji: '👩‍💼'
            }
          ],
          actionButton: {
            text: 'بدء محادثة جديدة ➕',
            color: currentTheme?.primaryColor || '#059669',
            actionType: 'new_chat'
          }
        }
      },
      customButton: {
        id: 'new-msg-cta',
        text: 'رسالة جديدة ✍️',
        bgColor: currentTheme?.primaryColor || '#059669',
        textColor: '#FFFFFF',
        shape: 'rounded-full',
        icon: 'MessageSquare',
        action: 'new_message',
        glow: true
      },
      cartCount: 3,
      chatMessagesDemo: [
        { id: '1', sender: 'other', text: 'مرحباً بك! تم توليد واجهة تطبيق الشات بنجاح.', time: '10:00 ص' },
        { id: '2', sender: 'me', text: 'رائع جداً، أخبرني: "ضع هذا اللون أحمر" أو "غير هذا الزر" لتعديلي فورياً!', time: '10:01 ص' }
      ]
    };
  }

  // 2. Task Manager & Notes (e.g. "مهام", "ملاحظات", "نوت", "تودو")
  if (p.includes('مهام') || p.includes('ملاحظات') || p.includes('نوت') || p.includes('تودو') || p.includes('todo') || p.includes('tasks')) {
    return {
      id: 'tasks_app',
      name: 'منظم المهام والملاحظات',
      category: 'productivity',
      isBuilt: true,
      theme: {
        primaryColor: currentTheme?.primaryColor || '#6366F1',
        secondaryColor: '#8B5CF6',
        accentColor: '#EC4899',
        bgColor: '#0B0F19',
        textColor: '#F8FAFC',
        cardBg: '#131B2E',
        borderRadius: 'rounded-2xl',
        fontFamily: 'Cairo, sans-serif',
        isDark: true,
      },
      navigation: {
        title: 'مهامي اليومية 📝',
        showBack: false,
        tabs: [
          { id: 'home', label: 'المهام', icon: 'CheckSquare' },
          { id: 'calendar', label: 'التقويم', icon: 'Clock' },
          { id: 'stats', label: 'الإنجاز', icon: 'Zap' },
          { id: 'profile', label: 'حسابي', icon: 'User' }
        ],
        activeTab: 'home'
      },
      screens: {
        home: {
          title: 'قائمة المهام اليومية',
          headerSubtitle: zipCore?.isLoaded ? `يعمل بنواة: ${zipCore.fileName}` : '3 مهام نشطة اليوم',
          banner: {
            title: 'أنت في المسار الصحيح! 🎯',
            subtitle: 'تم إنجاز 65% من جدولك اليوم',
            buttonText: 'عرض التقدم',
            gradient: 'from-indigo-600 to-purple-600'
          },
          searchPlaceholder: 'ابحث في المهام...',
          items: [
            {
              id: 'task-1',
              title: 'اختبار الربط مع ملف ZIP النواة الذكية',
              subtitle: 'الأولوية: مرتفعة • الموعد: 02:00 م',
              tag: 'قيد التنفيذ ⏳',
              imageEmoji: '📦',
              completed: false
            },
            {
              id: 'task-2',
              title: 'تغيير ألوان الأزرار بالصوت المباشر',
              subtitle: 'تم التحقق من التنفيذ الفوري',
              tag: 'مكتمل ✅',
              imageEmoji: '🎨',
              completed: true
            },
            {
              id: 'task-3',
              title: 'إطلاق واجهة التطبيق على شاشة الهاتف',
              subtitle: 'جاهز للاستخدام والتفاعل',
              tag: 'جديد ✨',
              imageEmoji: '🚀',
              completed: false
            }
          ],
          actionButton: {
            text: 'إضافة مهمة جديدة ➕',
            color: currentTheme?.primaryColor || '#6366F1',
            actionType: 'add_task'
          }
        }
      },
      customButton: {
        id: 'task-add-fab',
        text: 'إضافة مهمة جديدة 📝',
        bgColor: currentTheme?.primaryColor || '#6366F1',
        textColor: '#FFFFFF',
        shape: 'rounded-full',
        icon: 'Plus',
        action: 'add_task',
        glow: true
      },
      cartCount: 3
    };
  }

  // 3. E-commerce & Store (e.g. "متجر", "تسوق", "شراء", "منتجات", "ملابس", "سوق")
  if (p.includes('متجر') || p.includes('تسوق') || p.includes('شراء') || p.includes('منتجات') || p.includes('ملابس') || p.includes('عطور') || p.includes('سوق') || p.includes('store') || p.includes('shop')) {
    return {
      id: 'ecommerce_app',
      name: 'متجر التميز الإلكتروني',
      category: 'ecommerce',
      isBuilt: true,
      theme: {
        primaryColor: currentTheme?.primaryColor || '#8B5CF6',
        secondaryColor: '#EC4899',
        accentColor: '#F59E0B',
        bgColor: '#090D16',
        textColor: '#F8FAFC',
        cardBg: '#131B2E',
        borderRadius: 'rounded-2xl',
        fontFamily: 'Cairo, sans-serif',
        isDark: true,
      },
      navigation: {
        title: 'متجر التميز ✨',
        showBack: false,
        tabs: [
          { id: 'home', label: 'المتجر', icon: 'ShoppingBag' },
          { id: 'explore', label: 'الأصناف', icon: 'Compass' },
          { id: 'cart', label: 'السلة', icon: 'ShoppingBag' },
          { id: 'profile', label: 'حسابي', icon: 'User' }
        ],
        activeTab: 'home'
      },
      screens: {
        home: {
          title: 'أفضل المنتجات المختارة',
          headerSubtitle: zipCore?.isLoaded ? `النواة: ${zipCore.fileName}` : 'شحن مجاني وسريع لكافة الطلبات',
          banner: {
            title: 'عروض حصرية 50% 🔥',
            subtitle: 'تشكيلة مميزة بخصومات استثنائية',
            buttonText: 'تسوق الآن',
            gradient: 'from-purple-600 to-pink-600'
          },
          searchPlaceholder: 'ابحث عن أي منتج...',
          items: [
            {
              id: 'prod-1',
              title: 'ساعة ذكية رياضية متطورة',
              subtitle: 'مقاومة للماء، مراقبة النبض وبطارية تدوم طويلاً',
              price: '380.00 ر.س',
              rating: 4.9,
              tag: 'الأكثر طلباً',
              imageEmoji: '⌚'
            },
            {
              id: 'prod-2',
              title: 'سماعات لاسلكية عازلة للضوضاء',
              subtitle: 'صوت نقي عالي الدقة مع شحن سريع',
              price: '240.00 ر.س',
              rating: 4.8,
              tag: 'جديد',
              imageEmoji: '🎧'
            }
          ],
          actionButton: {
            text: 'إضافة للسلة وإتمام الشراء',
            color: currentTheme?.primaryColor || '#8B5CF6',
            actionType: 'buy'
          }
        }
      },
      customButton: {
        id: 'shop-fab',
        text: 'شراء القطعة المميزة ✨',
        bgColor: currentTheme?.primaryColor || '#8B5CF6',
        textColor: '#FFFFFF',
        shape: 'rounded-full',
        icon: 'ShoppingBag',
        action: 'shop_now',
        glow: true
      },
      cartCount: 2
    };
  }

  // 4. Food & Delivery (e.g. "توصيل", "مطعم", "طعام", "وجبات", "أكل")
  if (p.includes('توصيل') || p.includes('مطعم') || p.includes('طعام') || p.includes('وجبات') || p.includes('أكل') || p.includes('delivery')) {
    return {
      id: 'delivery_app',
      name: 'تطبيق الطلبات والتوصيل',
      category: 'delivery',
      isBuilt: true,
      theme: {
        primaryColor: currentTheme?.primaryColor || '#EA580C',
        secondaryColor: '#F97316',
        accentColor: '#FBBF24',
        bgColor: '#0F172A',
        textColor: '#F8FAFC',
        cardBg: '#1E293B',
        borderRadius: 'rounded-2xl',
        fontFamily: 'Cairo, sans-serif',
        isDark: true,
      },
      navigation: {
        title: 'توصيل الطلبات 🍔',
        showBack: false,
        tabs: [
          { id: 'home', label: 'الرئيسية', icon: 'Home' },
          { id: 'explore', label: 'المطابخ', icon: 'Compass' },
          { id: 'cart', label: 'السلة', icon: 'ShoppingBag' },
          { id: 'profile', label: 'حسابي', icon: 'User' }
        ],
        activeTab: 'home'
      },
      screens: {
        home: {
          title: 'الوجبات والطلبات السريعة',
          headerSubtitle: 'توصيل فوري خلال 25 دقيقة',
          banner: {
            title: 'عرض التوصيل المجاني 🛵',
            subtitle: 'خصم 30% على أول طلب لك اليوم',
            buttonText: 'اطلب الآن',
            gradient: 'from-orange-600 to-amber-600'
          },
          searchPlaceholder: 'ابحث عن وجبة أو مطعم...',
          items: [
            {
              id: 'food-1',
              title: 'برغر كلاسيك فاخر بالجبن',
              subtitle: 'لحم مشوي طازج مع بطاطس مقرمشة',
              price: '34.00 ر.س',
              rating: 4.9,
              tag: 'الأعلى طلباً',
              imageEmoji: '🍔'
            },
            {
              id: 'food-2',
              title: 'بيتزا نابولي بالريحان والموزاريلا',
              subtitle: 'مخبوزة على الحطب بطريقة إيطالية',
              price: '48.00 ر.س',
              rating: 4.8,
              tag: 'ساخن ولذيذ',
              imageEmoji: '🍕'
            }
          ],
          actionButton: {
            text: 'تأكيد الطلب الفوري',
            color: currentTheme?.primaryColor || '#EA580C',
            actionType: 'order'
          }
        }
      },
      customButton: {
        id: 'food-fab',
        text: 'اطلب الآن بضغطة واحدة ⚡',
        bgColor: currentTheme?.primaryColor || '#EA580C',
        textColor: '#FFFFFF',
        shape: 'rounded-full',
        icon: 'Zap',
        action: 'instant_order',
        glow: true
      },
      cartCount: 1
    };
  }

  // 5. Fintech & Wallet (e.g. "محفظة", "بنك", "مالي", "فلوس", "كاش")
  if (p.includes('محفظة') || p.includes('بنك') || p.includes('مالي') || p.includes('فلوس') || p.includes('كاش') || p.includes('wallet')) {
    return {
      id: 'finance_app',
      name: 'محفظة كاش الذكية',
      category: 'finance',
      isBuilt: true,
      theme: {
        primaryColor: currentTheme?.primaryColor || '#10B981',
        secondaryColor: '#06B6D4',
        accentColor: '#3B82F6',
        bgColor: '#06131B',
        textColor: '#ECFDF5',
        cardBg: '#0D212F',
        borderRadius: 'rounded-3xl',
        fontFamily: 'Cairo, sans-serif',
        isDark: true,
      },
      navigation: {
        title: 'محفظتي الذكية 💳',
        showBack: false,
        tabs: [
          { id: 'home', label: 'الرئيسية', icon: 'CreditCard' },
          { id: 'send', label: 'تحويل', icon: 'Send' },
          { id: 'history', label: 'العمليات', icon: 'Clock' },
          { id: 'profile', label: 'الأمان', icon: 'Shield' }
        ],
        activeTab: 'home'
      },
      screens: {
        home: {
          title: 'الرصيد الكلي المتاح',
          headerSubtitle: 'بطاقة فيزا بلاتينية رقمية',
          banner: {
            title: 'رصيدك: 12,450.00 ر.س 💰',
            subtitle: 'كاش باك 3% على جميع العمليات',
            buttonText: 'إيداع فوري',
            gradient: 'from-emerald-600 to-teal-700'
          },
          searchPlaceholder: 'ابحث في المعاملات...',
          items: [
            {
              id: 'tx-1',
              title: 'حوالة بنكية واردة',
              subtitle: 'اليوم، 01:20 م • تحويل فوري',
              price: '+5,000.00 ر.س',
              tag: 'مكتمل بنجاح ✅',
              imageEmoji: '💼'
            },
            {
              id: 'tx-2',
              title: 'دفع مشتريات إلكترونية',
              subtitle: 'أمس، 09:15 م • بطاقة مدى',
              price: '-180.00 ر.س',
              tag: 'كاش باك 5.4 ر.س',
              imageEmoji: '🛒'
            }
          ],
          actionButton: {
            text: 'تحويل مالي فوري ⚡',
            color: currentTheme?.primaryColor || '#10B981',
            actionType: 'transfer'
          }
        }
      },
      customButton: {
        id: 'fin-fab',
        text: 'تحويل نقدي سريع 🚀',
        bgColor: currentTheme?.primaryColor || '#10B981',
        textColor: '#FFFFFF',
        shape: 'rounded-full',
        icon: 'Send',
        action: 'transfer',
        glow: true
      },
      cartCount: 0
    };
  }

  // 6. Generic or Custom Idea (e.g. "حاسبة", "موسيقى", "سيارات", "أفلام", "حجز", or ANY custom text)
  const cleanedTitle = prompt
    .replace(/ابنِ|ابني|اصنع|انشئ|صمم|اعمل|تطبيق|اريد|سوي|لي|شغل|افتح/g, '')
    .trim() || (zipCore?.isLoaded ? zipCore.fileName.replace('.zip', '') : 'التطبيق الذكي');

  return {
    id: `custom_${Date.now()}`,
    name: `تطبيق ${cleanedTitle}`,
    category: 'custom',
    isBuilt: true,
    theme: {
      primaryColor: currentTheme?.primaryColor || '#DC2626',
      secondaryColor: '#EF4444',
      accentColor: '#10B981',
      bgColor: '#0A0A0A',
      textColor: '#FAFAFA',
      cardBg: '#171717',
      borderRadius: 'rounded-2xl',
      fontFamily: 'Cairo, sans-serif',
      isDark: true,
    },
    navigation: {
      title: `${cleanedTitle} 📱`,
      showBack: false,
      tabs: [
        { id: 'home', label: 'الرئيسية', icon: 'Home' },
        { id: 'explore', label: 'استكشاف', icon: 'Compass' },
        { id: 'items', label: 'العناصر', icon: 'Sparkles' },
        { id: 'profile', label: 'حسابي', icon: 'User' }
      ],
      activeTab: 'home'
    },
    screens: {
      home: {
        title: `واجهة ${cleanedTitle}`,
        headerSubtitle: zipCore?.isLoaded ? `يعمل بنواة: ${zipCore.fileName}` : 'تم توليدها فورياً بناءً على طلبك',
        banner: {
          title: `مرحباً بك في ${cleanedTitle} ✨`,
          subtitle: 'تطبيقك جاهز بالكامل على شاشة الهاتف، يمكنك تعديل أي لون أو زر بالصوت',
          buttonText: 'ابدأ الآن',
          gradient: 'from-red-600 via-rose-600 to-amber-600'
        },
        searchPlaceholder: `ابحث داخل ${cleanedTitle}...`,
        items: [
          {
            id: 'dyn-1',
            title: `الخدمة الرئيسية في ${cleanedTitle}`,
            subtitle: zipCore?.isLoaded ? `تعمل بمكتبات: ${zipCore.fileName}` : 'عنصر تفاعلي متكامل تم توليده بنجاح',
            price: 'نشط',
            rating: 5.0,
            tag: 'تم البناء بنجاح ⭐',
            imageEmoji: '⭐'
          },
          {
            id: 'dyn-2',
            title: `الميزة الإضافية لـ ${cleanedTitle}`,
            subtitle: 'قل: "ضع هذا اللون أزرق" أو "غير هذا الزر" للتعديل اللحظي',
            price: 'فوري',
            rating: 4.9,
            tag: 'مباشر',
            imageEmoji: '🚀'
          }
        ],
        actionButton: {
          text: `بدء استخدام ${cleanedTitle}`,
          color: currentTheme?.primaryColor || '#DC2626',
          actionType: 'start'
        }
      }
    },
    customButton: {
      id: 'custom-dyn-btn',
      text: `إجراء في ${cleanedTitle} ✨`,
      bgColor: currentTheme?.primaryColor || '#DC2626',
      textColor: '#FFFFFF',
      shape: 'rounded-full',
      icon: 'Zap',
      action: 'interact',
      glow: true
    },
    cartCount: 0
  };
}

/**
 * Normalizes Arabic text for speech-recognition variations and dialects
 */
export function normalizeArabicSpeech(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/[ـ]/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent Synthesis Engine
 * Directly executes user instructions through the unified Gemini + ASAMALI Core Pipeline
 */
export async function processAppModification(
  prompt: string,
  currentApp: MobileAppConfig,
  zipCore?: any
): Promise<{
  updatedApp: MobileAppConfig;
  replyText: string;
  actionTaken: string;
  diffInfo: string;
}> {
  const conversationContext = getEngineContext();
  
  // 1. INTENT ROUTER CHECK
  const route = analyzeUserIntent(prompt, currentApp, conversationContext);

  // If the intent is non-actionable (CHAT, PROJECT_QUESTION, DEBUG, UNKNOWN):
  // DO NOT alter the project state or files!
  if (!route.isActionable) {
    const localResult = executeAsamaliPipeline(prompt, currentApp, zipCore);
    return {
      updatedApp: localResult.updatedApp, // completely untouched
      replyText: localResult.replyText,
      actionTaken: localResult.resolvedIntent,
      diffInfo: localResult.resolvedIntent === 'CHAT' ? 'محادثة حوارية ذكية' : 'فحص تحليلي للمشروع'
    };
  }

  // 2. Query ZIP Core to extract actual relevant files and recipes
  const zipQueryResult = zipCore?.isLoaded ? queryZipCore(prompt, zipCore) : null;

  let updatedApp: MobileAppConfig | null = null;
  let replyText = '';
  let actionTaken = '';
  let diffInfo = '';

  // 3. Attempt smart server-side reasoning via Gemini if available
  try {
    const apiUrl = typeof window !== 'undefined' 
      ? '/api/gemini/modify-app' 
      : 'http://127.0.0.1:3000/api/gemini/modify-app';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        prompt,
        currentApp,
        zipCoreContext: {
          isLoaded: zipCore?.isLoaded,
          fileName: zipCore?.fileName,
          matchedFiles: zipQueryResult?.matchedFiles || [],
          snippet: zipQueryResult?.snippet || '',
          manifest: zipCore?.manifest,
          customLibraries: zipCore?.customLibraries,
        },
        conversationContext,
        detectedIntent: route.intent
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.app) {
        const validation = validateAndRepairApp(data.data.app);
        updatedApp = validation.app;
        replyText = data.data.speechReply || 'تم تنفيذ طلبك بنجاح على مشروعك!';
        actionTaken = data.data.actionTaken || route.intent;
        diffInfo = `تنفيذ ذكي عبر Gemini مدعوماً بنواة: ${zipCore?.fileName || 'النواة الذكية'}`;

        conversationContext.conversationTurns.unshift({
          user: prompt,
          action: actionTaken,
          timestamp: new Date().toISOString(),
        });
        conversationContext.activeProjectName = updatedApp.name;
        saveEngineContext(conversationContext);

        const memoryItem: LearningItem = {
          id: `learn_${Date.now()}`,
          timestamp: new Date().toISOString(),
          prompt,
          normalizedTokens: prompt.split(/\s+/),
          resolvedIntent: actionTaken,
          matchedCoreFiles: zipQueryResult?.matchedFiles || ['ASAMALI/brain/lexicon_ar.json'],
          status: 'executed',
          executionPlan: data.data.executionPlan || ['تحليل الطلب', 'تعديل ملفات المشروع', 'فحص السلامة'],
        };
        const curMem = getEngineMemory();
        curMem.unshift(memoryItem);
        saveEngineMemory(curMem);
      }
    }
  } catch (err) {
    console.warn('Server Gemini call failed, falling back seamlessly to ASAMALI Core Engine:', err);
  }

  // 4. Fallback to Local ASAMALI Core Pipeline (guarantees 100% offline & local reliability)
  if (!updatedApp) {
    const localResult = executeAsamaliPipeline(prompt, currentApp, zipCore);
    updatedApp = localResult.updatedApp;
    replyText = localResult.replyText;
    actionTaken = localResult.resolvedIntent;
    diffInfo = `تنفيذ حقيقي عبر ملفات النواة: ${localResult.matchedFiles.slice(0, 3).join(' | ')}`;
  }

  return {
    updatedApp,
    replyText,
    actionTaken,
    diffInfo,
  };
}
