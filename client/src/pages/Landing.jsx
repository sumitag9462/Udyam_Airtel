import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function Landing() {
  const { t } = useTranslation();
  const headingRef = useRef(null);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, []);

  return (
    <main className="container-mobile py-8">
      <h1 ref={headingRef} tabIndex={-1} className="text-h1 mb-2 outline-none">
        <span className="border-b-2 border-airtel-red pb-1">{t('landing.title', 'Udyam One')}</span>
      </h1>
      <p className="text-secondary mb-8">
        {t('landing.subtitle', 'Smart business connectivity for your business')}
      </p>

      <ol className="space-y-6 mb-10" aria-label={t('landing.stepsLabel', 'How it works')}>
        <li className="flex gap-4">
          <span className="text-airtel-red font-bold text-lg" aria-hidden="true">
            1
          </span>
          <div>
            <p className="font-medium">{t('landing.step1Title', 'Tell us about your business')}</p>
            <p className="text-secondary text-sm">
              {t('landing.step1Desc', 'Chat with our advisor in Hindi or English')}
            </p>
          </div>
        </li>
        <li className="flex gap-4">
          <span className="text-airtel-red font-bold text-lg" aria-hidden="true">
            2
          </span>
          <div>
            <p className="font-medium">{t('landing.step2Title', 'Get your plan')}</p>
            <p className="text-secondary text-sm">
              {t('landing.step2Desc', 'One transparent monthly quote with options you control')}
            </p>
          </div>
        </li>
        <li className="flex gap-4">
          <span className="text-airtel-red font-bold text-lg" aria-hidden="true">
            3
          </span>
          <div>
            <p className="font-medium">{t('landing.step3Title', 'Quick verification')}</p>
            <p className="text-secondary text-sm">
              {t(
                'landing.step3Desc',
                'Upload documents and track your order — no phone calls needed'
              )}
            </p>
          </div>
        </li>
      </ol>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/advisor" className="btn-primary inline-block text-center flex-1">
          {t('landing.cta', 'Chat with Advisor')}
        </Link>
        <Link to="/quotes" className="btn-secondary inline-block text-center flex-1">
          Explore Plans & Quotes
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t border-divider">
        <Link to="/privacy" className="text-secondary text-sm underline">
          {t('landing.privacyLink', 'Privacy notice')}
        </Link>
      </div>
    </main>
  );
}
