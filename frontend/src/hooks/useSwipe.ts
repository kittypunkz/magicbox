import { useEffect, useRef, useCallback } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefault?: boolean;
}

export function useSwipe(
  ref: React.RefObject<HTMLElement>,
  options: SwipeOptions
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);
  const { threshold = 50, preventDefault = false } = options;

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, [preventDefault]);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (Math.abs(distanceX) > threshold) {
        if (distanceX > 0 && options.onSwipeLeft) {
          options.onSwipeLeft();
        } else if (distanceX < 0 && options.onSwipeRight) {
          options.onSwipeRight();
        }
      }
    } else {
      if (Math.abs(distanceY) > threshold) {
        if (distanceY > 0 && options.onSwipeUp) {
          options.onSwipeUp();
        } else if (distanceY < 0 && options.onSwipeDown) {
          options.onSwipeDown();
        }
      }
    }

    touchStart.current = null;
    touchEnd.current = null;
  }, [options, threshold]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [ref, onTouchStart, onTouchMove, onTouchEnd, preventDefault]);
}

// Hook for detecting if device is touch capable
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false);
  
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  return isTouch;
}

// Hook for pull to refresh
import React from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
}

export function usePullToRefresh(
  ref: React.RefObject<HTMLElement>,
  options: PullToRefreshOptions
) {
  const [isPulling, setIsPulling] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  const { threshold = 80, maxPullDistance = 120 } = options;
  const startY = useRef(0);
  const currentY = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    // Only trigger if at top of element
    const element = ref.current;
    if (!element || element.scrollTop > 0) return;
    
    startY.current = e.targetTouches[0].clientY;
    setIsPulling(true);
  }, [ref]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling) return;
    
    currentY.current = e.targetTouches[0].clientY;
    const distance = Math.min(
      (currentY.current - startY.current) * 0.5,
      maxPullDistance
    );
    
    if (distance > 0) {
      setPullDistance(distance);
    }
  }, [isPulling, maxPullDistance]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      await options.onRefresh();
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, options]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });
    element.addEventListener('touchend', onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [ref, onTouchStart, onTouchMove, onTouchEnd]);

  return { isPulling, pullDistance, isRefreshing };
}
