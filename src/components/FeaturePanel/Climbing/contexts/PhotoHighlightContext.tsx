import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { photoNameKey } from '../utils/photo';

type PhotoHighlightContextType = {
  /** photo name (without `File:`) currently highlighted in the feature panel */
  highlightedPhoto: string | null;
  /** bumped on every request so repeated clicks on the same photo re-trigger scroll */
  highlightToken: number;
  /** highlight a photo in the feature panel image strip */
  highlightPhoto: (photoName: string | null) => void;
  /** highlight a photo, or clear the highlight if it is already highlighted */
  togglePhoto: (photoName: string) => void;
};

const PhotoHighlightContext = createContext<PhotoHighlightContextType>({
  highlightedPhoto: null,
  highlightToken: 0,
  highlightPhoto: () => {},
  togglePhoto: () => {},
});

export const PhotoHighlightProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [highlightedPhoto, setHighlightedPhoto] = useState<string | null>(null);
  const [highlightToken, setHighlightToken] = useState(0);

  const highlightPhoto = useCallback((photoName: string | null) => {
    setHighlightedPhoto(photoName);
    setHighlightToken((token) => token + 1);
  }, []);

  const togglePhoto = useCallback((photoName: string) => {
    setHighlightedPhoto((prev) =>
      prev && photoNameKey(prev) === photoNameKey(photoName) ? null : photoName,
    );
    setHighlightToken((token) => token + 1);
  }, []);

  const value = useMemo(
    () => ({ highlightedPhoto, highlightToken, highlightPhoto, togglePhoto }),
    [highlightedPhoto, highlightToken, highlightPhoto, togglePhoto],
  );

  return (
    <PhotoHighlightContext.Provider value={value}>
      {children}
    </PhotoHighlightContext.Provider>
  );
};

export const usePhotoHighlightContext = () => useContext(PhotoHighlightContext);
