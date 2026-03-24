import { VoidFunction } from "@zo/definitions/general";
import { useCallback, useState } from "react";

const useVisibilityState: (
  initialState?: boolean
) => [boolean, VoidFunction, VoidFunction] = (initialState = false) => {
  const [isVisible, setIsVisible] = useState<boolean>(initialState);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);

  return [isVisible, show, hide];
};

export default useVisibilityState;
