'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './AudioPlayer.module.css';

export default function AudioPlayer() {
  // Start as muted=true because browsers ALWAYS block unmuted autoplay.
  // On the first user interaction anywhere on the page we unmute + play.
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasUnmutedRef = useRef(false);

  const sendCommand = (func: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      '*'
    );
  };

  useEffect(() => {
    // Unmute + play on the very first user interaction (click OR touch).
    // We use 'touchend' instead of 'touchstart' so scroll gestures don't
    // accidentally trigger it; 'touchend' still counts as a user gesture
    // for the browser's autoplay policy.
    const handleFirstInteraction = () => {
      if (hasUnmutedRef.current) return;
      hasUnmutedRef.current = true;
      // Call synchronously inside the event handler so the browser
      // treats the postMessage as originating from a user gesture.
      sendCommand('unMute');
      sendCommand('playVideo');
      setIsMuted(false);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    // Use { passive: true } for better scroll performance on mobile.
    window.addEventListener('touchend', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
    };
  }, []);

  const toggleMute = () => {
    // Mark first interaction done so the global handler doesn't double-fire.
    if (!hasUnmutedRef.current) {
      hasUnmutedRef.current = true;
      window.removeEventListener('click', () => {});
      window.removeEventListener('touchend', () => {});
    }

    if (isMuted) {
      sendCommand('unMute');
      sendCommand('playVideo');
      setIsMuted(false);
    } else {
      sendCommand('mute');
      setIsMuted(true);
    }
  };

  // Shared handler for both mouse and touch on the button.
  // stopPropagation is intentionally removed so the global listener
  // can also fire (it is idempotent via hasUnmutedRef).
  const handleButtonTouch = (e: React.TouchEvent) => {
    e.preventDefault(); // prevent the subsequent 300ms-delayed click on mobile
    toggleMute();
  };

  return (
    <>
      {/* Hidden YouTube iframe — starts MUTED (mute=1) so browser allows autoplay */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <iframe
          ref={iframeRef}
          width="1"
          height="1"
          src="https://www.youtube.com/embed/WTJSt4wP2ME?enablejsapi=1&autoplay=1&mute=1&start=34"
          frameBorder="0"
          allow="autoplay; encrypted-media"
        ></iframe>
      </div>

      <button
        onClick={toggleMute}
        onTouchEnd={handleButtonTouch}
        className={styles.audioToggleBtn}
        aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        title={isMuted ? 'Click to play background music' : 'Mute background music'}
      >
        {isMuted ? (
          // Volume Off / Muted Icon
          <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          // Volume Up / Unmuted Icon
          <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>
    </>
  );
}
