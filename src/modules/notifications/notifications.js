// notifications.js
import { firestore } from "./firebase";
import { getLocalizedText } from "./translation";

/**
 * Plays a localized voice notification using the browser's SpeechSynthesis.
 */
export async function playLocalizedVoiceNotification(userId, defaultMessageEn, defaultMessageAr) {
  const userDoc = await firestore.collection("users").doc(userId).get();
  const language = userDoc.exists && userDoc.data().language ? userDoc.data().language : 'en';
  let message = defaultMessageEn;
  
  if (language !== 'en') {
    if (language === 'ar') {
      message = defaultMessageAr || defaultMessageEn;
    } else {
      // Create a simple key by lowercasing and replacing spaces.
      const key = defaultMessageEn.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      message = await getLocalizedText(key, defaultMessageEn, language);
    }
  }
  
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = language === 'ar' ? 'ar-SA' : language;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

/**
 * Notify a courier.
 */
export function notifyCourier(courierId, messageEn, messageAr = messageEn) {
  playLocalizedVoiceNotification(courierId, messageEn, messageAr);
}

/**
 * Notify a customer.
 */
export function notifyCustomer(customerId, messageEn, messageAr = messageEn) {
  playLocalizedVoiceNotification(customerId, messageEn, messageAr);
}
