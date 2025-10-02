// 图片路径配置
export const IMAGE_PATHS = {




  // 背景图片
  BACKGROUNDS: {
    MAIN: require("../../assets/background.png"),
    SPLASH: require("../../assets/splash-icon.png"),
  },

  // // 等待动画
  // ANIMATIONS: {
  //   WAIT: require("../../assets/wait.gif"),
  // },

  // 引导页面图片
  ONBOARDING: {
    BODY_STRUCTURE: {
      AVERAGE: require("../../assets/onboarding/BodyStructure/average.jpeg"),
      CHUBBY: require("../../assets/onboarding/BodyStructure/chubby.jpeg"),
      PETITE: require("../../assets/onboarding/BodyStructure/petite.jpeg"),
      PLUS: require("../../assets/onboarding/BodyStructure/plus.jpeg"),
      SLIM: require("../../assets/onboarding/BodyStructure/slim.jpeg"),
    },
    BODY_TYPE: {
      APPLE: require("../../assets/onboarding/BodyType/apple.jpeg"),
      HOURGLASS: require("../../assets/onboarding/BodyType/hourglass.jpeg"),
      INVERTED_TRIANGLE: require("../../assets/onboarding/BodyType/invertedTriangle.jpeg"),
      PEAR: require("../../assets/onboarding/BodyType/pear.jpeg"),
      RECTANGLE: require("../../assets/onboarding/BodyType/rectangle.jpeg"),
      TRIANGLE: require("../../assets/onboarding/BodyType/triangle.jpeg"),
    },
    STYLE: {
      BOHO: require("../../assets/onboarding/Style/Boho.png"),
      CASUAL: require("../../assets/onboarding/Style/Casual.png"),
      CLASSY: require("../../assets/onboarding/Style/Classy.jpg"),
      COASTAL: require("../../assets/onboarding/Style/Coastal.png"),
      COQUETTE: require("../../assets/onboarding/Style/Coquette.png"),
      DOPAMINE: require("../../assets/onboarding/Style/Dopamine.png"),
      EDGY: require("../../assets/onboarding/Style/Edgy.png"),
      OLD_MONEY: require("../../assets/onboarding/Style/OldMoney.png"),
      PREPPY: require("../../assets/onboarding/Style/Preppy.png"),
      SPORTY: require("../../assets/onboarding/Style/Sporty.png"),
      STREETSTYLE: require("../../assets/onboarding/Style/Streetstyle.png"),
      Y2K: require("../../assets/onboarding/Style/Y2K.png"),
    },
    ZERO: {
      MESSAGES_1: require("../../assets/onboarding/zero/messages-1.png"),
      MESSAGES_2: require("../../assets/onboarding/zero/messages-2.png"),
      MESSAGES_3: require("../../assets/onboarding/zero/messages-3.png"),
      MESSAGES_4: require("../../assets/onboarding/zero/messages-4.png"),
      MESSAGES_5: require("../../assets/onboarding/zero/messages-5.png"),
    },
    FINAL: {
      FINAL_1: require("../../assets/onboarding/Final/1.jpg"),
      FINAL_2: require("../../assets/onboarding/Final/2.jpg"),
    },
  },
  SCROLL: {
    SCROLL_1: require("../../assets/onboarding/Scroll/1.png"),
    SCROLL_2: require("../../assets/onboarding/Scroll/2.png"),
    SCROLL_3: require("../../assets/onboarding/Scroll/3.png"),
  },
} as const;

// 图片路径类型
export type ImagePathKey = keyof typeof IMAGE_PATHS;


export type BackgroundKey = keyof typeof IMAGE_PATHS.BACKGROUNDS;
// export type AnimationKey = keyof typeof IMAGE_PATHS.ANIMATIONS;

// 辅助函数：获取图片路径
export const getImagePath = (category: ImagePathKey, key: string) => {
  const categoryPaths = IMAGE_PATHS[category] as any;
  return categoryPaths[key];
};


// 辅助函数：获取背景图片
export const BACKGROUNDS = (key: BackgroundKey) => {
  return IMAGE_PATHS.BACKGROUNDS[key];
};

// // 辅助函数：获取动画
// export const getAnimation = (key: AnimationKey) => {
//   return IMAGE_PATHS.ANIMATIONS[key];
// };
