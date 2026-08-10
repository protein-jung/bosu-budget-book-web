/** @type {import('tailwindcss').Config} */
module.exports = {
  // 브랜드 배경(F4EBDD)을 항상 밝게 유지하기 위해 시스템 다크모드를 따라가지 않는다.
  // (dark: 클래스는 아무도 켜지 않으므로 사실상 비활성화된다.)
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        income: '#2f9e44',
        expense: '#e03131',
        primary: {
          DEFAULT: '#1F6F5C',
          light: '#DCEEE9',
          dark: '#154C40',
        },
        secondary: {
          DEFAULT: '#E07A5F',
          light: '#FBE7E0',
          dark: '#B85A40',
        },
        cream: {
          DEFAULT: '#F4EBDD',
          dark: '#EADFCC',
        },
      },
    },
  },
  plugins: [],
};
