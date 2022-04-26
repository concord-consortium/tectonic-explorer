import React, { useCallback, useEffect } from "react";

export type UseAnimationFrameCallback = (deltaTime?: number) => void;

// https://css-tricks.com/using-requestanimationframe-with-react-hooks/#aa-update-taking-the-extra-mile-with-a-custom-hook
export const useAnimationFrame = (callback: UseAnimationFrameCallback) => {
  const requestRef = React.useRef<number>();
  const prevTimeRef = React.useRef<number>();

  const animate: FrameRequestCallback = useCallback(time => {
    if (prevTimeRef.current != null) {
      const deltaTime = time - prevTimeRef.current;
      callback(deltaTime);
    }
    prevTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => requestRef.current ? cancelAnimationFrame(requestRef.current) : undefined;
  }, [animate]);
};
