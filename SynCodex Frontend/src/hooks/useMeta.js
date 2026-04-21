import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import metaConfig from '../utils/metaConfig';

const useMeta = (override = {}) => {
  const location = useLocation();
  const path = location.pathname;

  const getPageKey = () => {
    if (path === '/') return 'homepage';
    if (path.includes('about')) return 'about';
    if (path.includes('contact')) return 'contact';
    if (path.includes('faq')) return 'faq';
    if (path.includes('licences')) return 'licences';
    if (path.includes('forgot-password')) return 'forgotPassword';
    if (path.includes('reset')) return 'resetPassword';
    if (path.includes('login')) return 'login';
    if (path.includes('signup')) return 'signup';
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('collab-editor')) return 'collabEditor';
    if (path.includes('interview-editor')) return 'interviewEditor';
    if (path.includes('interview-guidelines')) return 'interviewGuidelines';
    if (path.includes('editor')) return 'editor';
    return null;
  };

  const pageKey = getPageKey();
  const meta = metaConfig[pageKey] || {};
  const { title, description } = { ...meta, ...override };

  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let metaTag = document.querySelector('meta[name="description"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'description';
        document.head.appendChild(metaTag);
      }
      metaTag.content = description;
    }
  }, [title, description]);
};

export default useMeta;
