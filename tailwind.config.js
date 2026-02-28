/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#f9f8f7",
        card: "#d8d0c4",
        secondary: "#bfb5a8",

        primaryText: "#1f2617",
        secondaryText: "#393f35",

        accent: "#e5fc01",
      },
    },
  },
  plugins: [],
}