/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0984e3';
const tintColorDark = '#74b9ff';

export const Colors = {
  light: {
    text: '#1a1a1a',
    background: '#f8f9fa',
    tint: tintColorLight,
    icon: '#636e72',
    tabIconDefault: '#95a5a6',
    tabIconSelected: tintColorLight,
    primary: '#0984e3',
    secondary: '#00b894',
    accent: '#6c5ce7',
    card: '#ffffff',
    border: '#e0e0e0',
    success: '#00b894',
    warning: '#fdcb6e',
    error: '#d63031',
  },
  dark: {
    text: '#ECEDEE',
    background: '#121212',
    tint: tintColorDark,
    icon: '#b0b0b0',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#74b9ff',
    secondary: '#55efc4',
    accent: '#a29bfe',
    card: '#1e1e1e',
    border: '#333333',
    success: '#55efc4',
    warning: '#ffeaa7',
    error: '#ff7675',
  },
};
