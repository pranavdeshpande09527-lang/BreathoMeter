import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function scrollToTop() {
  // Scroll every possible container to top instantly
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Also scroll any .main-content div (the patient/doctor shell scroll container)
  const mainContent = document.querySelector('.main-content');
  if (mainContent) mainContent.scrollTop = 0;

  const pageContent = document.querySelector('.page-content');
  if (pageContent) pageContent.scrollTop = 0;
}

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const userInteractedRef = useRef(false);

  // Reset interaction flag and scroll to top on route change or refresh
  useEffect(() => {
    userInteractedRef.current = false;
    
    // Disable browser scroll restoration so refresh always lands at top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    scrollToTop();

    // Set up a sequence of timeouts to combat lazy-loading and layout shifts
    const timeouts = [50, 100, 200, 400, 800, 1500].map(delay => 
      setTimeout(() => {
        if (!userInteractedRef.current) {
          scrollToTop();
        }
      }, delay)
    );

    // Listen for manual user scroll/interaction to stop overriding their scroll position
    const handleUserInteraction = () => {
      userInteractedRef.current = true;
    };

    const eventOptions = { passive: true };
    window.addEventListener('wheel', handleUserInteraction, eventOptions);
    window.addEventListener('touchmove', handleUserInteraction, eventOptions);
    window.addEventListener('keydown', handleUserInteraction, eventOptions);

    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('touchmove', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [pathname]);

  // Trick the browser into saving Y=0 as the scroll position before reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
}
