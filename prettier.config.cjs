module.exports = {
  plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleAttributePerLine: true,
  vueIndentScriptAndStyle: true,
  bracketSameLine: false,
  htmlWhitespaceSensitivity: "ignore",
}
