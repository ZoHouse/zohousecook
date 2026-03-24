import React, { useState, useEffect } from "react";

const useKeypress = (key: string, node: React.RefObject<any>, timeout = 0) => {
  const [keyPressed, setKeyPressed] = useState(false);

  function keyDownHandler(event: React.KeyboardEvent<any>) {
    if (event.key === key) {
      setKeyPressed(true);
      timeout && setTimeout(() => setKeyPressed(false), timeout);
    }
  }

  function keyUpHandler(event: React.KeyboardEvent<any>) {
    event.preventDefault();
    if (event.key === key) {
      setKeyPressed(false);
    }
  }

  useEffect(() => {
    const ref = node.current;
    ref.addEventListener("keydown", keyDownHandler);
    ref.addEventListener("keyup", keyUpHandler);

    return () => {
      ref.removeEventListener("keydown", keyDownHandler);
      ref.removeEventListener("keyup", keyUpHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return keyPressed;
};

export default useKeypress;
