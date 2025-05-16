// translation.js
import { firestore } from "./firebase";

/**
 * Get a localized translation for a text.
 * key is a unique identifier for the default text.
 */
export async function getLocalizedText(key, defaultText, targetLanguage) {
  const docId = `${targetLanguage}_${key}`;
  const cacheDoc = await firestore.collection("translation_cache").doc(docId).get();
  if (cacheDoc.exists) {
    const data = cacheDoc.data();
    if (data && data.translation) return data.translation;
  }
  // Translation not found; call translation API.
  const translatedText = await translateAPI(defaultText, targetLanguage);
  await firestore.collection("translation_cache").doc(docId).set({ translation: translatedText });
  return translatedText;
}

/**
 * Dummy translate API function.
 * Replace this with an actual call to a service such as Google Translate API.
 */
async function translateAPI(text, targetLanguage) {
  // For demo purposes, simulate translation.
  return `${text} [${targetLanguage} translation]`;
}
