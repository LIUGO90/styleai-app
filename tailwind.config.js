/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // 移除 darkMode 配置，使用默认设置
  theme: {
    extend: {},
  },
  plugins: [],
}