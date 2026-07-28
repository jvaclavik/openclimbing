import { useEffect, useRef } from 'react';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useClimbingContext } from './contexts/ClimbingContext';

const FIT_SCALE = 1;

// The programmatic re-pin during a pane resize may legitimately need to exceed
// the user-facing zoom limits. `scale` is measured relative to the photo's fit
// size, and that fit size itself grows/shrinks with the pane; holding a fixed
// crop across a large resize can therefore require a scale below the fit scale
// (pane grew a lot) or above the max zoom (pane shrank a lot). Clamping the
// correction to the user limits is what let the crop drift ("photo too big /
// too small") at the extremes, so we give the correction a much wider range.
const CORRECTION_MIN_SCALE = 0.01;
const CORRECTION_MAX_SCALE = 100;

// Keeps the visible photo crop pinned while the split pane is resized. The
// <img> is sized `height: 100%`, so its layout size follows the photo pane;
// resizing the pane would otherwise rescale the image and let
// react-zoom-pan-pinch re-center it, shifting/zooming the view. Rather than
// predict the shift, we remember the on-screen rectangle of the image at the
// last user gesture (the "anchor") and, after every pane resize, measure
// where the image actually landed and transform it back onto that anchor.
// Closed-loop correction like this is robust to the library's own
// re-centering and to the image switching between width/height constraints.
// Only active while zoomed in — at fit scale we keep the default refit.
export const useCropAnchor = () => {
  const { photoRef, photoPath } = useClimbingContext();

  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const wrapperElRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<{
    top: number;
    left: number;
    height: number;
  } | null>(null);

  // Measures the *rendered* photo rectangle relative to the wrapper — not the
  // <img> box. With `object-fit: contain`, a wide photo in a narrow pane is
  // letterboxed vertically inside its box, and the letterbox amount changes as
  // the pane height changes. Anchoring the box (as before) therefore let the
  // visible image drift by the changing letterbox on every resize. We resolve
  // the actual displayed rectangle from the natural aspect ratio so the anchor
  // tracks the pixels the user actually sees.
  const measureImageInWrapper = () => {
    const img = photoRef.current;
    const wrapperEl = wrapperElRef.current;
    if (!img || !wrapperEl) return null;
    const boxRect = img.getBoundingClientRect();
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    if (!boxRect.height || !boxRect.width || !naturalW || !naturalH)
      return null;

    const imageAspect = naturalW / naturalH;
    const boxAspect = boxRect.width / boxRect.height;
    let renderedH: number;
    let offsetX: number;
    let offsetY: number;
    if (imageAspect > boxAspect) {
      // Width-constrained: full box width, letterboxed top/bottom.
      renderedH = boxRect.width / imageAspect;
      offsetX = 0;
      offsetY = (boxRect.height - renderedH) / 2;
    } else {
      // Height-constrained: full box height, pillarboxed left/right.
      renderedH = boxRect.height;
      const renderedW = boxRect.height * imageAspect;
      offsetX = (boxRect.width - renderedW) / 2;
      offsetY = 0;
    }
    return {
      top: boxRect.top - wrapperRect.top + offsetY,
      left: boxRect.left - wrapperRect.left + offsetX,
      height: renderedH,
    };
  };

  // Snapshot the current crop as the anchor to restore across future resizes.
  // Captured only at the end of real user gestures (pan/zoom), never during a
  // resize, so it always reflects what the user last chose to look at.
  const captureAnchor = () => {
    const scale = transformRef.current?.instance.transformState.scale ?? 1;
    anchorRef.current = scale > FIT_SCALE ? measureImageInWrapper() : null;
  };

  const correctToAnchor = () => {
    const ref = transformRef.current;
    const anchor = anchorRef.current;
    if (!ref || !anchor) return;
    const current = measureImageInWrapper();
    if (!current) return;

    const { scale, positionX, positionY } = ref.instance.transformState;

    // Image top-left in the library's (unscaled) content coordinate space.
    const contentX = (current.left - positionX) / scale;
    const contentY = (current.top - positionY) / scale;

    // Keep the visible height equal to the anchored crop. Allowed to leave the
    // user zoom limits — see CORRECTION_MIN/MAX_SCALE — so the crop stays pinned
    // even when the fit size change would otherwise force it out of the range.
    const nextScale = Math.min(
      CORRECTION_MAX_SCALE,
      Math.max(CORRECTION_MIN_SCALE, (scale * anchor.height) / current.height),
    );
    const nextPositionX = anchor.left - contentX * nextScale;
    const nextPositionY = anchor.top - contentY * nextScale;

    ref.setTransform(nextPositionX, nextPositionY, nextScale, 0);
  };

  const handleInit = (ref: ReactZoomPanPinchRef) => {
    transformRef.current = ref;
    wrapperElRef.current = ref.instance.wrapperComponent ?? null;
  };

  // Observe the viewport for resizes and re-pin the crop *synchronously* in the
  // same frame the size changes — so every painted frame during a split-pane
  // drag already shows the corrected position (no one-frame lag that made the
  // photo visibly trail the divider). Registering the observer in an effect of
  // the component above TransformComponent (rather than in onInit) is
  // deliberate: that effect runs after the nested TransformComponent's init
  // effect has created the library's own ResizeObserver, so ours fires *after*
  // the library re-centers and gets the final word within the same delivery.
  useEffect(() => {
    const wrapperEl = wrapperElRef.current;
    if (!wrapperEl || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      if (!anchorRef.current) return;
      correctToAnchor();
    });
    observer.observe(wrapperEl);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A photo swap replaces the image, so the previous anchor is meaningless.
  useEffect(() => {
    anchorRef.current = null;
  }, [photoPath]);

  return { handleInit, captureAnchor };
};
