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
    const { prompt, currentApp, zipCoreContext } = req.body;

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
You are an expert AI Mobile App Engine and UI/UX compiler.
The user speaks to you (often in Arabic or English) to create or live-modify a mobile app that renders directly inside a phone simulator.
The user might ask for color changes ("ضع هذا اللون أحمر/أزرق"), button redesigns ("غير هذا الزر"), screen additions, data changes, or building an entirely new app concept.

Current App State JSON:
${JSON.stringify(currentApp || {}, null, 2)}

Smart Core ZIP Engine Context:
${JSON.stringify(zipCoreContext || {}, null, 2)}

User Request: "${prompt}"

Return ONLY a valid JSON object with the updated application configuration matching this schema:
{
  "speechReply": "Short friendly Arabic response explaining what was created or changed (1 sentence)",
  "actionTaken": "Brief tag like 'theme_color_change' | 'button_update' | 'new_app_generated' | 'component_added'",
  "app": {
    "id": "string",
    "name": "App Name in Arabic",
    "category": "e.g. ecommerce | social | delivery | fitness | booking | finance | custom",
    "theme": {
      "primaryColor": "hex color code (e.g. #3B82F6)",
      "secondaryColor": "hex color code (e.g. #10B981)",
      "accentColor": "hex color code (e.g. #F59E0B)",
      "bgColor": "hex or tailwind color (e.g. #0F172A)",
      "textColor": "hex color (e.g. #F8FAFC)",
      "cardBg": "hex color (e.g. #1E293B)",
      "borderRadius": "rounded-none | rounded-lg | rounded-2xl | rounded-3xl | rounded-full",
      "fontFamily": "Cairo, sans-serif",
      "isDark": true
    },
    "navigation": {
      "title": "Title on phone header",
      "showBack": false,
      "tabs": [
        { "id": "home", "label": "الرئيسية", "icon": "Home" },
        { "id": "explore", "label": "استكشاف", "icon": "Compass" },
        { "id": "cart", "label": "السلة", "icon": "ShoppingBag" },
        { "id": "profile", "label": "حسابي", "icon": "User" }
      ],
      "activeTab": "home"
    },
    "screens": {
      "home": {
        "title": "اسم الصفحة",
        "headerSubtitle": "وصف لطيف",
        "banner": {
          "title": "عنوان البانر",
          "subtitle": "عرض حصري اليوم",
          "buttonText": "اكتشف الآن",
          "gradient": "from-indigo-600 to-purple-600"
        },
        "searchPlaceholder": "ابحث هنا...",
        "categories": [
          { "id": "c1", "label": "الأكثر طلباً", "icon": "Flame" },
          { "id": "c2", "label": "عروض خاصة", "icon": "Percent" },
          { "id": "c3", "label": "جديدنا", "icon": "Sparkles" }
        ],
        "items": [
          {
            "id": "item-1",
            "title": "اسم العنصر الأول",
            "subtitle": "وصف موجز للمنتج أو الخدمة",
            "price": "49.00 ر.س",
            "rating": 4.9,
            "tag": "شائع",
            "imageEmoji": "🍔"
          }
        ],
        "actionButton": {
          "text": "زر العمل الرئيسي",
          "color": "#3B82F6",
          "actionType": "primary"
        }
      }
    },
    "customButton": {
      "id": "floating-action",
      "text": "اطلب الآن",
      "bgColor": "#3B82F6",
      "textColor": "#FFFFFF",
      "shape": "rounded-full",
      "icon": "Zap",
      "action": "trigger_order"
    }
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
    const parsed = JSON.parse(text);

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error generating app with Gemini:', error);
    return res.status(500).json({
      success: false,
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
