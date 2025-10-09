/** @type {import('tailwindcss').Config} */
import sharedConfig from "@repo/tailwind-config";

const config = {
  content: ["./src/**/*.tsx"], // Scans all .tsx files in this package
  presets: [sharedConfig],
};

export default config;
