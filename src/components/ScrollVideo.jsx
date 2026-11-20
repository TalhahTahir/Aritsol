import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useMediaQuery';
import s from './ScrollVideo.module.css';

/**
 * A video that plays forward/back as the visitor scrolls through the section.
 * Tip: for smooth scrubbing, encode with a keyframe on every frame, e.g.
 *   ffmpeg -i in.mp4 -an -vcodec libx264 -g 1 -crf 23 -preset veryfast -movflags faststart out.mp4
 * With reduced motion on, it shows as a normal video with controls instead.
 */
export default function ScrollVideo({ src, poster, title, caption }) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const video = videoRef.current;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (!video.duration) return;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      video.currentTime = progress * video.duration;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    video.pause();
    video.addEventListener('loadedmetadata', update);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      video.removeEventListener('loadedmetadata', update);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <figure className={`container ${s.static}`}>
        <video src={src} poster={poster} controls playsInline preload="metadata" className={s.video} />
        {caption && <figcaption className="muted">{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <section ref={sectionRef} className={s.track} aria-label={title}>
      <div className={s.sticky}>
        <video ref={videoRef} src={src} poster={poster} muted playsInline preload="auto" className={s.video} />
        {caption && <p className={s.caption}>{caption}</p>}
      </div>
    </section>
  );
}
