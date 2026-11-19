import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title
      ? `${title} · CoFoundr AI`
      : 'CoFoundr AI — Find Your Perfect Co-Founder';
  }, [title]);
}
