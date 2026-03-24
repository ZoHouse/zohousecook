import { theme, ThemeConfig } from "antd";

const _theme: ThemeConfig = {
  token: {
    colorPrimary: "#cfff50",
    colorInfo: "#cfff50",
    colorSuccess: "#54b835",
    colorWarning: "#ff9e4c",
    colorError: "#ff4545",
    colorBgBase: "#000000",
    colorLink: "#cfff50",
    colorBgMask: "#111111",
    colorText: "#ffffffeb",
    borderRadius: 0,
    wireframe: false,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  components: {
    Menu: {
      itemSelectedBg: "transparent",
      itemSelectedColor: "#cfff50",
      itemHoverBg: "transparent",
      itemHoverColor: "#cfff50",
      itemActiveBg: "transparent",
      subMenuItemBg: "transparent",
      darkItemSelectedBg: "transparent",
      darkSubMenuItemBg: "transparent",
      darkItemBg: "transparent",
      padding: 0,
      itemMarginInline: 0,
      itemHeight: 40,
      itemMarginBlock: 0,
    },
    Slider: {
      dotActiveBorderColor: "rgb(255,255,255)",
      colorPrimaryBorderHover: "rgb(207,255,80)",
      dotBorderColor: "rgb(255,255,255)",
      handleActiveOutlineColor: "rgb(255,255,255)",
      handleColor: "rgb(255,255,255)",
      trackBg: "rgb(255,255,255)",
      railSize: 4,
      controlSize: 8,
      handleLineWidth: 4,
      handleLineWidthHover: 4,
      handleSize: 8,
    },
    Switch: {
      handleBg: "rgb(255,255,255)",
      colorPrimary: "rgb(207,255,80)",
    },
    Carousel: {
      dotHeight: 4,
      dotWidth: 12,
    },
    Progress: {
      lineBorderRadius: 0,
    },
    Drawer: {
      colorBgMask: "rgba(18,18,18,0.8)",
      colorBgElevated: "#161616",
    },
    Modal: {
      colorBgMask: "rgba(18,18,18,0.8)",
    },
  },
  algorithm: theme.darkAlgorithm,
};

export default _theme;
