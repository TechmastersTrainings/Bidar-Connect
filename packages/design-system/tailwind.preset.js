const tokens = require("./tokens.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: tokens.colors.brand,
        surface: tokens.colors.surface,
        border: tokens.colors.border,
        textColor: tokens.colors.text,
        status: tokens.colors.status,
      },
      borderRadius: {
        sm: tokens.radii.sm,
        md: tokens.radii.md,
        lg: tokens.radii.lg,
        xl: tokens.radii.xl,
      },
      fontFamily: {
        sans: [tokens.typography.fontFamily],
      },
    },
  },
  plugins: [],
};

