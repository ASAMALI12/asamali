import JSZip from 'jszip';
import { SmartZipCore, ZipFileInfo, MobileAppConfig } from '../types';

export const ASAMALI_CORE_FILES = [
  'ASAMALI/manifest.json',
  'ASAMALI/connectors/connector.json',
  'ASAMALI/brain/lexicon_ar.json',
  'ASAMALI/brain/learning_items.json',
  'ASAMALI/brain/schema/learning_item.schema.json',
  'ASAMALI/skills/intent-analysis/SKILL.md',
  'ASAMALI/skills/voice-chat/SKILL.md',
  'ASAMALI/skills/game-building/README.md',
  'ASAMALI/skills/ui-design/SKILL.md',
  'ASAMALI/skills/app-building/SKILL.md',
  'ASAMALI/skills/app-building-v2/SKILL.md',
  'ASAMALI/skills/app-building-v3/SKILL.md',
  'ASAMALI/skills/debugging/SKILL.md',
  'ASAMALI/skills/code-review/CODE_REVIEW.md',
  'ASAMALI/skills/image-generation/README.md',
  'ASAMALI/skills/knowledge-teaching/TEACHING_FROM_CODE.md',
  'ASAMALI/knowledge/build-recipes/feature_recipes.json',
  'ASAMALI/knowledge/build-recipes/BUILD_RECIPES.md',
  'ASAMALI/knowledge/build-recipes/android.yml.tpl',
  'ASAMALI/knowledge/project-ingestion/ZIP_PROJECT_INGESTION.md',
  'ASAMALI/knowledge/kotlin/KOTLIN_ESSENTIALS.md',
  'ASAMALI/knowledge/reasoning/CLARIFYING_QUESTIONS_AND_DECISIONS.md',
  'ASAMALI/knowledge/reasoning/REQUEST_UNDERSTANDING_EXAMPLES.md',
  'ASAMALI/knowledge/cloud-backend/CLOUD_PROVIDER_COMPARISON.md',
  'ASAMALI/knowledge/java/JAVA_ANDROID_ESSENTIALS.md',
  'ASAMALI/knowledge/services/SERVICE_INTEGRATION.md',
  'ASAMALI/knowledge/services/CLOUD_SERVICES_AND_BACKENDS.md',
  'ASAMALI/knowledge/frontend/ANDROID_UI_AND_INTERACTION.md',
  'ASAMALI/knowledge/frontend/MULTIPLATFORM_PROGRAMMING.md',
  'ASAMALI/knowledge/backend/BACKEND_PATTERNS.md',
  'ASAMALI/knowledge/arabic/ARABIC_UI_AND_NLP.md',
  'ASAMALI/knowledge/android-code/COMPOSE_APP_SKELETON.md',
  'ASAMALI/knowledge/android-code/ROOM_AND_LOCAL_DATA.md',
  'ASAMALI/knowledge/android-code/SIGNING_AND_RELEASE.md',
  'ASAMALI/knowledge/android-code/NETWORKING_RETROFIT.md',
  'ASAMALI/knowledge/ai-core/REASONING_AND_EXECUTION.md',
  'ASAMALI/knowledge/ai-core/STATE_TAXONOMY_AND_CAPABILITIES.md',
  'ASAMALI/knowledge/web-apps/CAPACITOR_GUIDE.md',
  'ASAMALI/knowledge/web-apps/HTML_APP_BUILDING.md',
  'ASAMALI/knowledge/voice-chat/VOICE_CHAT_ANDROID.md',
  'ASAMALI/knowledge/app-templates/templates.json',
  'ASAMALI/knowledge/app-templates/TEMPLATES_GUIDE.md',
  'ASAMALI/knowledge/speech-understanding/SPEECH_AND_INTENT.md',
  'ASAMALI/knowledge/debugging/COMMON_ERRORS.md',
  'ASAMALI/knowledge/android/ANDROID_PERMISSIONS_MEDIA_FILES.md',
  'ASAMALI/knowledge/gradle/GRADLE_ESSENTIALS.md',
  'ASAMALI/knowledge/connectors/PAYMENTS_PATTERNS.md',
  'ASAMALI/knowledge/connectors/REST_API_CONNECTION_GUIDE.md',
  'ASAMALI/knowledge/connectors/LLM_AND_SPEECH_APIS.md',
  'ASAMALI/knowledge/connectors/PUSH_NOTIFICATIONS.md',
  'ASAMALI/knowledge/connectors/FIREBASE_CONCEPTS.md',
  'ASAMALI/knowledge/connectors/MAPS_AND_LOCATION.md',
  'ASAMALI/knowledge/connectors/SUPABASE_REST_PATTERNS.md',
  'ASAMALI/knowledge/connectors/AUTH_PATTERNS.md',
  'ASAMALI/knowledge/testing/TEST_PLANS.md',
  'ASAMALI/knowledge/testing/VALIDATION_AND_DEBUGGING.md',
  'ASAMALI/knowledge/github/GITHUB_AND_CI.md',
  'ASAMALI/knowledge/agent-core/AGENT_BEHAVIOR.md',
  'ASAMALI/knowledge/app-design/entity_schemas.json',
  'ASAMALI/knowledge/app-design/UX_PATTERNS_FOR_APPS.md',
  'ASAMALI/knowledge/app-design/DATA_MODELING_FROM_REQUIREMENTS.md',
  'ASAMALI/knowledge/app-architecture/ANDROID_APP_ARCHITECTURE.md',
  'ASAMALI/knowledge/programming/PROGRAMMING_FOUNDATION.md',
  'ASAMALI/knowledge/programming/CORE_LANGUAGES.md',
  'ASAMALI/knowledge/architecture/APP_BUILD_PIPELINE.md',
  'ASAMALI/knowledge/learning/LEARNING_RULES.md',
  'ASAMALI/knowledge/security/SECRETS_AND_PRIVACY.md',
  'ASAMALI/index/knowledge_index.json',
  'ASAMALI/CHANGELOG.md',
  'ASAMALI/experiences/engine/VERIFIED_LESSONS.md',
  'ASAMALI/experiences/learning/LEARNING_LOOP.md'
];

export const ASAMALI_CORE_MANIFEST = {
  name: 'ASAMALI-Smart-Core',
  version: '3.0.0-core',
  author: 'ASAMALI',
  engine: 'ASAMALI-Neural-Mobile-Compiler',
  description: 'نواة عصام علي الذكية - قلب المحرك المتقدم لهندسة وبناء وتعديل تطبيقات الهواتف والويب بالصوت والدردشة',
  skills: [
    'intent-analysis',
    'voice-chat',
    'game-building',
    'ui-design',
    'app-building-v3',
    'debugging',
    'code-review',
    'image-generation',
    'knowledge-teaching'
  ],
  libraries: [
    'TailwindCSS-v4-JIT',
    'Lucide-Icons-Mobile',
    'Framer-Motion-Runtime',
    'Web-Speech-Arabic-NLP',
    'Reactive-State-Store',
    'ASAMALI-Arabic-Lexicon',
    'Dynamic-CSS-Variables-Engine',
    'Canvas-Particle-Effects',
    'Haptic-Feedback-Sim',
    'Smart-JSON-AST-Parser'
  ],
  capabilities: [
    'Live-Hot-Reload-Without-Refetch',
    'Voice-To-DOM-Compiler',
    'Semantic-Arabic-Color-Mapping',
    'Dynamic-Component-Morphing',
    'Mobile-Viewport-Touch-Emulation',
    'Multi-Platform-Build-Pipeline',
    'Autonomous-Intent-Reasoning'
  ],
  componentsCount: 72,
};

export const DEFAULT_CORE_MANIFEST = ASAMALI_CORE_MANIFEST;

/**
 * Built-in pre-initialized ASAMALI Core
 */
export const BUILTIN_ASAMALI_CORE: SmartZipCore = {
  fileName: 'ASAMALI.zip',
  fileCount: ASAMALI_CORE_FILES.length,
  files: ASAMALI_CORE_FILES.map(name => ({
    name,
    size: 4096,
    date: new Date(),
    isDir: false,
    contentSnippet: `ASAMALI Core File: ${name}`
  })),
  manifest: ASAMALI_CORE_MANIFEST,
  isLoaded: true,
  loadedAt: new Date(),
  customLibraries: {
    'ASAMALI/manifest.json': JSON.stringify(ASAMALI_CORE_MANIFEST, null, 2),
    'ASAMALI/brain/lexicon_ar.json': JSON.stringify({
      author: 'ASAMALI',
      terms: ['بناء', 'تطبيق', 'شات', 'متجر', 'زر', 'لون', 'نواة', 'محرك', 'رسم', 'تعديل']
    }),
    'ASAMALI/skills/app-building-v3/SKILL.md': '# ASAMALI App Building v3\nAutonomous mobile screen generator with instant live drawing and dynamic voice commands.',
    'ASAMALI/skills/voice-chat/SKILL.md': '# ASAMALI Voice Chat\nReal-time Arabic voice conversation and intent extraction.',
  }
};

export async function parseZipFile(file: File): Promise<SmartZipCore> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const files: ZipFileInfo[] = [];
  let manifest = { ...ASAMALI_CORE_MANIFEST };
  let embeddedAppConfig: Partial<MobileAppConfig> | undefined;
  const customLibraries: Record<string, string> = {};

  const filePromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    const isDir = zipEntry.dir;
    const fileInfo: ZipFileInfo = {
      name: relativePath,
      size: (zipEntry as any)._data?.uncompressedSize || 0,
      date: zipEntry.date,
      isDir,
    };

    if (!isDir) {
      const lowerName = relativePath.toLowerCase();
      // Read all readable files up to 100KB
      if (
        lowerName.endsWith('.json') || 
        lowerName.endsWith('.txt') || 
        lowerName.endsWith('.ts') || 
        lowerName.endsWith('.tsx') || 
        lowerName.endsWith('.js') || 
        lowerName.endsWith('.jsx') || 
        lowerName.endsWith('.css') || 
        lowerName.endsWith('.html') ||
        lowerName.endsWith('.md') ||
        lowerName.endsWith('.yaml') ||
        lowerName.endsWith('.yml')
      ) {
        const p = zipEntry.async('string').then((content) => {
          fileInfo.contentSnippet = content.slice(0, 500);

          // Store file contents
          customLibraries[relativePath] = content.slice(0, 10000);

          // Check for manifest
          if (lowerName.includes('manifest.json') || lowerName.includes('engine.json')) {
            try {
              const parsed = JSON.parse(content);
              manifest = {
                ...manifest,
                ...parsed,
                name: parsed.name || manifest.name,
                version: parsed.version || manifest.version,
                libraries: Array.isArray(parsed.libraries) ? parsed.libraries : manifest.libraries,
                componentsCount: parsed.componentsCount || files.length,
              };
            } catch (e) {
              console.warn('Failed to parse manifest inside zip', e);
            }
          }

          // Check for app config or theme definition inside zip
          if (
            lowerName.includes('app.json') || 
            lowerName.includes('config.json') || 
            lowerName.includes('screens.json') || 
            lowerName.includes('theme.json') ||
            lowerName.includes('package.json')
          ) {
            try {
              const parsedApp = JSON.parse(content);
              embeddedAppConfig = {
                ...(embeddedAppConfig || {}),
                ...parsedApp,
              };
            } catch (e) {
              console.warn('Failed to parse app json inside zip', e);
            }
          }
        });
        filePromises.push(p);
      }
    }
    files.push(fileInfo);
  });

  await Promise.all(filePromises);

  // If the zip contains ASAMALI structure, register it as ASAMALI core
  const isAsamali = files.some(f => f.name.includes('ASAMALI') || f.name.includes('manifest.json'));
  if (isAsamali) {
    manifest.name = 'ASAMALI-Smart-Core';
    manifest.author = 'ASAMALI';
  }

  return {
    fileName: file.name,
    fileCount: files.length,
    files,
    manifest: {
      ...manifest,
      componentsCount: Math.max(manifest.componentsCount, files.length),
    },
    isLoaded: true,
    loadedAt: new Date(),
    rawZipBlob: file,
    embeddedAppConfig,
    customLibraries,
  };
}

/**
 * Executes a user command directly against the contents of the loaded Smart ZIP file (ASAMALI Core)
 */
export function queryZipCore(
  prompt: string,
  zipCore: SmartZipCore
): {
  matchedFiles: string[];
  snippet: string;
  foundData: any;
  summary: string;
} {
  const p = prompt.toLowerCase();
  const matchedFiles: string[] = [];
  let snippet = '';
  let foundData: any = null;

  if (!zipCore.isLoaded) {
    return {
      matchedFiles: [],
      snippet: '',
      foundData: null,
      summary: 'لم يتم ربط ملف ZIP بعد',
    };
  }

  // 1. Search in file names
  zipCore.files.forEach((f) => {
    const fLower = f.name.toLowerCase();
    const keywords = p.split(/\s+/).filter(k => k.length > 2);
    if (keywords.some(k => fLower.includes(k))) {
      matchedFiles.push(f.name);
    }
  });

  // 2. Search in customLibraries file contents
  if (zipCore.customLibraries) {
    for (const [filePath, content] of Object.entries(zipCore.customLibraries)) {
      const cLower = content.toLowerCase();
      const keywords = p.split(/\s+/).filter(k => k.length > 2);
      if (keywords.some(k => cLower.includes(k))) {
        if (!matchedFiles.includes(filePath)) {
          matchedFiles.push(filePath);
        }
        if (!snippet) {
          snippet = content.slice(0, 300);
        }
      }
    }
  }

  // Fallback: If no specific match, list first 3 core files
  if (matchedFiles.length === 0 && zipCore.files.length > 0) {
    matchedFiles.push(...zipCore.files.slice(0, 3).map(f => f.name));
  }

  const summary = `تم فحص نواة الـ ZIP [${zipCore.fileName}] (${zipCore.fileCount} ملف) ومطابقة الملفات: ${matchedFiles.slice(0, 3).join(', ')}`;

  return {
    matchedFiles,
    snippet,
    foundData,
    summary,
  };
}

/**
 * Creates and downloads a ready-made Smart ZIP file with all libraries, components and configs
 */
export async function generateSmartCoreZipBlob(): Promise<Blob> {
  const zip = new JSZip();

  // Root manifest
  zip.file('ASAMALI/manifest.json', JSON.stringify({
    ...ASAMALI_CORE_MANIFEST,
    createdAt: new Date().toISOString(),
    description: 'نواة ASAMALI الذكية للمحرك لتطوير وتعديل تطبيقات الهواتف الذكية بالصوت والدردشة'
  }, null, 2));

  zip.file('ASAMALI/brain/lexicon_ar.json', JSON.stringify({
    author: 'ASAMALI',
    terms: ['بناء', 'تطبيق', 'شات', 'متجر', 'زر', 'لون', 'نواة', 'محرك', 'رسم', 'تعديل']
  }, null, 2));

  // Add all ASAMALI skill files
  const skillsFolder = zip.folder('ASAMALI/skills');
  skillsFolder?.file('app-building-v3/SKILL.md', '# ASAMALI App Building v3\nAutonomous mobile screen generator.');
  skillsFolder?.file('voice-chat/SKILL.md', '# ASAMALI Voice Chat\nReal-time Arabic voice conversation.');
  skillsFolder?.file('intent-analysis/SKILL.md', '# ASAMALI Intent Analysis\nNatural language understanding.');

  return await zip.generateAsync({ type: 'blob' });
}
