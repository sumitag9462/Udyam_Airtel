import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';

export default function NotFound() {
  const { t } = useTranslation();
  const headingRef = useRef(null);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, []);

  return (
    <main className="container-mobile py-16 text-center">
      <h1 ref={headingRef} tabIndex={-1} className="text-h1 mb-4 outline-none">
        {t('errors.notFoundTitle', 'Page not found')}
      </h1>
      <p className="text-secondary mb-8">
        {t('errors.notFoundMessage', 'The page you are looking for does not exist.')}
      </p>
      <Link to="/" className="btn-primary inline-block">
        {t('errors.goHome', 'Go to home')}
      </Link>
    </main>
  );
}
