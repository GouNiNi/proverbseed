import { createContext, useContext } from 'react';
import { useTranslation } from './translations';

export const LanguageContext = createContext('fr');

export function useT() {
    const language = useContext(LanguageContext);
    return useTranslation(language);
}
