import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'de' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex h-7 w-7 items-center justify-center text-[10px] font-black text-[#101820]/40 dark:text-[#fff8e7]/35 hover:text-[#101820] dark:hover:text-[#fff8e7] transition-colors duration-150 cursor-pointer"
      aria-label="Toggle language"
      title={i18n.language === 'en' ? 'Switch to DE' : 'Switch to EN'}
    >
      {i18n.language === 'en' ? 'EN' : 'DE'}
    </button>
  );
}
