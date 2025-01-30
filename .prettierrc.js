module.exports = {
  semi: true,
  singleQuote: true,
  printWidth: 150,
  trailingComma: 'none',
  tabWidth: 2,
  useTabs: false,
  overrides: [
    {
      files: '*.sql',
      options: {
        tabWidth: 2,
        parser: 'sql'
      }
    }
  ]
};
