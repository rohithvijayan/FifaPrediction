'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './AudioPlayer.module.css';

// Declare YT for TypeScript compiler and avoid using 'any'
interface YTPlayer {
  playVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
}

interface YTEvent {
  target: YTPlayer;
  data?: number;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (element: HTMLIFrameElement | string, options: object) => YTPlayer;
      PlayerState: {
        PLAYING: number;
      };
    };
  }
}

export default function AudioPlayer() {
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    // 1. Load YouTube Iframe Player API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // 2. Define the callback for when the API is ready
    const initPlayer = () => {
      if (!iframeRef.current || !window.YT) return;
      
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: (event: YTEvent) => {
            // Attempt to autoplay unmuted
            event.target.unMute();
            event.target.playVideo();
            
            // Sync initial state after player initializes
            setIsMuted(event.target.isMuted());
          },
          onStateChange: (event: YTEvent) => {
            // Update muted state if it changes or plays
            if (window.YT && event.data === window.YT.PlayerState.PLAYING) {
              setIsMuted(event.target.isMuted());
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Store previous callback if any, or set ours
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initPlayer();
      };
    }

    // 3. User interaction handler to start audio if blocked by browser autoplay policy
    const startAudioOnInteraction = () => {
      if (playerRef.current && window.YT) {
        // Only trigger if currently muted or paused
        if (playerRef.current.isMuted() || playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
          playerRef.current.unMute();
          playerRef.current.playVideo();
          setIsMuted(false);
        }
      }
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('click', startAudioOnInteraction);
      window.removeEventListener('touchstart', startAudioOnInteraction);
    };

    window.addEventListener('click', startAudioOnInteraction);
    window.addEventListener('touchstart', startAudioOnInteraction);

    return () => {
      cleanupListeners();
    };
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    // Prevent the global click handler from immediately overriding this action
    e.stopPropagation();

    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.playVideo();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  return (
    <>
      <div style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}>
        <iframe
          ref={iframeRef}
          width="0"
          height="0"
          src="https://www.youtube.com/embed/WTJSt4wP2ME?enablejsapi=1&autoplay=1&start=34"
          frameBorder="0"
          allow="autoplay; encrypted-media"
        ></iframe>
      </div>

      <button
        onClick={toggleMute}
        className={styles.audioToggleBtn}
        aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        title={isMuted ? 'Unmute background music' : 'Mute background music'}
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
