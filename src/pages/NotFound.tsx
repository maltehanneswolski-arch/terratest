import { useTranslation } from 'react-i18next';
import { HoverButton } from '@/components/ui/hover-button';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="app-page-shell min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="bauhaus-panel p-8 md:p-12 max-w-2xl bg-[#fff8e7]">
        <div className="text-7xl md:text-8xl font-bold uppercase tracking-[0.12em] text-[#d04231]">404</div>
        <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-[0.12em] mt-5 text-[#101820]">{t('notFound')}</h1>
        <p className="mt-4 text-base md:text-xl text-[#33435f]">{t('notFoundMessage')}</p>
        <div className="mt-8 flex justify-center">
          <HoverButton href="/" backgroundColor="#101820">Back home</HoverButton>
        </div>
      </div>
    </div>
  );
}
