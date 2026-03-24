import { useEffect, useState } from "react";

type themeType = "light" | "dark";

const useTheme = () => {
  const [theme, setTheme] = useState<themeType>(
    typeof window !== "undefined" ? localStorage.theme : "light"
  );
  const colorTheme = theme === "dark" ? "light" : "dark";

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove(colorTheme);
    root.classList.add(theme);

    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return { theme: colorTheme, setTheme };
};

export default useTheme;
