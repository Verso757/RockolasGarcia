import React, { useState } from 'react';
import { Disc3 } from 'lucide-react';

interface SongThumbnailProps {
  src?: string;
  videoId?: string;
  alt: string;
  className?: string;
}

export const SongThumbnail: React.FC<SongThumbnailProps> = ({
  src,
  videoId,
  alt,
  className = 'h-11 w-16 rounded object-cover bg-black shrink-0 border border-[#543818]',
}) => {
  const [errorLevel, setErrorLevel] = useState(0);

  // Extract ID if available
  const cleanId =
    videoId ||
    (src ? src.match(/(?:vi\/|vi%2F|v=)([a-zA-Z0-9_-]{11})/)?.[1] : null);

  const getImgSrc = () => {
    if (errorLevel === 0) {
      if (cleanId) return `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
      if (src && !src.startsWith('/vi/')) return src;
      if (src && src.startsWith('/vi/') && cleanId) {
        return `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
      }
      return null;
    }
    if (errorLevel === 1 && cleanId) {
      return `https://i.ytimg.com/vi/${cleanId}/mqdefault.jpg`;
    }
    if (errorLevel === 2 && cleanId) {
      return `https://img.youtube.com/vi/${cleanId}/default.jpg`;
    }
    return null;
  };

  const currentSrc = getImgSrc();

  if (errorLevel >= 3 || !currentSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1a0f08] border border-[#543818] ${className}`}
        title={alt}
      >
        <Disc3 className="h-5 w-5 text-[#d4af37] animate-spin [animation-duration:15s]" />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      className={className}
      loading="lazy"
      onError={() => setErrorLevel((prev) => prev + 1)}
    />
  );
};
