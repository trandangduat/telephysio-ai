/**
 * @file index.ts
 * @description Cấu hình quốc tế hóa (i18n) cho ứng dụng TelePhysioAI.
 *
 * Sử dụng thư viện: i18next + react-i18next + expo-localization.
 * Ngôn ngữ mặc định: Tiếng Anh ('en').
 * Ngôn ngữ hỗ trợ: Tiếng Anh ('en'), Tiếng Việt ('vi').
 *
 * File này phải được import một lần tại gốc ứng dụng (App.tsx)
 * để khởi tạo instance i18n trước khi bất kỳ component nào render.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en';
import vi from './locales/vi';

const resources = {
    en: { translation: en },
    vi: { translation: vi },
};

/**
 * @function getDeviceLanguage
 * @description Phát hiện ngôn ngữ địa phương của thiết bị và đối chiếu với danh sách
 * ngôn ngữ được hỗ trợ. Nếu không tìm thấy ngôn ngữ phù hợp, trả về 'en'.
 *
 * @returns {string} Mã ngôn ngữ (ví dụ: 'en', 'vi')
 */
function getDeviceLanguage(): string {
    try {
        const locales = getLocales();
        if (locales.length > 0) {
            const lang = locales[0].languageCode;
            if (lang && lang in resources) {
                return lang;
            }
        }
    } catch {
    // expo-localization có thể gây lỗi trên web trong quá trình SSR
    }
    return 'en';
}

i18n.use(initReactI18next).init({
    resources,
    lng: 'en', // Mặc định là Tiếng Anh theo yêu cầu
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false, // React đã tự động thoát HTML
    },
    compatibilityJSON: 'v4',
});

export default i18n;

/**
 * @description Tiện ích xuất ra ngoài: lấy ngôn ngữ thiết bị
 * (hữu ích khi muốn chuyển sang ngôn ngữ của thiết bị).
 */
export { getDeviceLanguage };
