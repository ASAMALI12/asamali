import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API endpoint for processing app generation / modification via Gemini
app.post('/api/gemini/modify-app', async (req, res) => {
  try {
    const { prompt, currentApp, zipCoreContext, conversationContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      // Graceful fallback response informing frontend to use built-in smart engine
      return res.json({
        success: false,
        useLocalEngine: true,
        message: 'No GEMINI_API_KEY configured on server; smart local engine will process the request.',
      });
    }

    const systemInstruction = `
You are the ASAMALI Intelligent Mobile App Compiler and Architect.
The user speaks to you (in Arabic or English) to create or live-modify a mobile application that renders inside an interactive phone simulator.

Capabilities:
1. Understand compound, natural language instructions (e.g. "أنشئ تطبيق مطعم يحتوي على قائمة أطعمة وسلة طلبات وصفحة تأكيد الطلب", or "أضف شاشة تسجيل دخول إلى المشروع", or "غير لون الزر السابق إلى أحمر").
2. Create complete screens inside "app.screens" object (e.g. "home", "login", "cart", "confirm", "profile", "explore", "details").
3. Update "app.navigation.tabs" to include all relevant screens so the user can navigate between them.
4. Set "app.navigation.activeTab" to the newly created or most relevant screen so it immediately renders on screen.
5. Create or modify custom buttons, items, banners, themes, search bars, and categories.
6. Delete elements or screens ONLY when the user explicitly asks to delete or remove them ("احذف", "امسح", "ازل").
7. Retain the context of the current project and previous actions.
8. Strictly consult and utilize the provided Smart Core ZIP Engine context (recipes, templates, and libraries) to align with best mobile design patterns.

Current App State JSON:
${JSON.stringify(currentApp || {}, null, 2)}

Smart Core ZIP Engine Context:
${JSON.stringify(zipCoreContext || {}, null, 2)}

Conversation & Memory Context:
${JSON.stringify(conversationContext || {}, null, 2)}

User Request: "${prompt}"

Return ONLY a valid JSON object matching this schema:
{
  "speechReply": "Clear, friendly Arabic response explaining exactly what was planned, created or updated in 1-2 sentences",
  "actionTaken": "Brief intent tag like 'create_restaurant_app' | 'add_login_screen' | 'modify_element' | 'delete_element' | 'theme_update'",
  "executionPlan": [
    "Step 1: description in Arabic",
    "Step 2: description in Arabic",
    "Step 3: description in Arabic"
  ],
  "app": {
    "id": "string",
    "name": "App Name in Arabic",
    "category": "restaurant | ecommerce | chat | delivery | finance | fitness | custom",
    "isBuilt": true,
    "theme": {
      "primaryColor": "hex color (e.g. #DC2626 or #3B82F6 or #10B981)",
      "secondaryColor": "hex color",
      "accentColor": "hex color",
      "bgColor": "#0A0A0A or #0F172A",
      "textColor": "#FAFAFA",
      "cardBg": "#171717 or #1E293B",
      "borderRadius": "rounded-2xl | rounded-3xl | rounded-full",
      "fontFamily": "Cairo, sans-serif",
      "isDark": true
    },
    "navigation": {
      "title": "Title on phone header",
      "showBack": false,
      "tabs": [
        { "id": "screen_key", "label": "اسم التبويب", "icon": "Home | ShoppingBag | CheckCircle2 | User | MessageSquare | Flame | Search" }
      ],
      "activeTab": "id of the screen to display now"
    },
    "screens": {
      "screen_key": {
        "title": "عنوان الشاشة",
        "headerSubtitle": "وصف توضيحي",
        "banner": {
          "title": "عنوان البانر",
          "subtitle": "وصف البانر",
          "buttonText": "زر البانر",
          "gradient": "from-red-600 to-amber-600"
        },
        "searchPlaceholder": "ابحث هنا...",
        "categories": [
          { "id": "c1", "label": "تصنيف", "icon": "Flame" }
        ],
        "items": [
          {
            "id": "item-1",
            "title": "اسم العنصر أو الحقل",
            "subtitle": "وصف العنصر أو التفاصيل",
            "price": "السعر أو القيمة إن وجدت",
            "rating": 4.9,
            "tag": "وسم مميز",
            "imageEmoji": "🍔"
          }
        ],
        "actionButton": {
          "text": "زر الإجراء الأساسي للشاشة",
          "color": "hex color",
          "actionType": "action_id"
        }
      }
    },
    "customButton": {
      "id": "floating-action",
      "text": "نص الزر التفاعلي",
      "bgColor": "hex color",
      "textColor": "#FFFFFF",
      "shape": "rounded-full",
      "icon": "Zap",
      "action": "trigger_action",
      "glow": true
    },
    "hasCustomButton": true,
    "showSearch": true,
    "showBanner": true,
    "cartCount": 0
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.warn('Gemini response was not valid JSON, using local engine fallback', text);
      return res.json({
        success: false,
        useLocalEngine: true,
        message: 'Model response required parsing correction; local engine will handle.',
      });
    }

    if (!parsed || !parsed.app || !parsed.app.screens) {
      return res.json({
        success: false,
        useLocalEngine: true,
        message: 'Model response lacked required schema; local engine will handle.',
      });
    }

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error generating app with Gemini:', error);
    return res.json({
      success: false,
      useLocalEngine: true,
      error: error.message || 'Internal server error',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
