import { useState, useEffect, useCallback } from 'react';

export type Route =
  | '/'
  | '/login'
  | '/register'
  | '/jobs'
  | '/jobs/:id'
  | '/employer/dashboard'
  | '/employer/jobs/new'
  | '/employer/jobs/:id/edit'
  | '/employer/jobs/:id/applicants'
  | '/applicant/dashboard'
  | '/applicant/bookmarks'
  | '/unauthorized';

export const useRouter = () => {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handler = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  const matchPath = (pattern: string, actual: string) => {
    const patternParts = pattern.split('/');
    const actualParts = actual.split('/');
    if (patternParts.length !== actualParts.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = actualParts[i];
      } else if (patternParts[i] !== actualParts[i]) {
        return null;
      }
    }
    return params;
  };

  return { path, navigate, matchPath };
};
