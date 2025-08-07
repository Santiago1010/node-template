module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New functionality
        'fix', // Bug fix
        'perf', // Performance improvements
        'build', // Build tool changes
        'ci', // CI/CD configuration
        'docs', // Documentation
        'refactor', // Refactoring
        'style', // Code formatting
        'test', // Tests
        'chore', // Maintenance tasks
        'revert', // Revert changes
      ],
    ],
    'type-case': [2, 'always', 'lower-case'], // Types must be lowercase
    'type-empty': [2, 'never'], // Type cannot be empty
    'scope-case': [2, 'always', 'lower-case'], // Scope must be lowercase
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']], // Subject cannot use these cases
    'subject-empty': [2, 'never'], // Subject cannot be empty
    'subject-full-stop': [2, 'never', '.'], // Subject cannot end with period
    'header-max-length': [2, 'always', 72], // Header max 72 characters
    'body-leading-blank': [1, 'always'], // Body must have leading blank line
    'body-max-line-length': [2, 'always', 100], // Body lines max 100 characters
    'footer-leading-blank': [1, 'always'], // Footer must have leading blank line
    'footer-max-line-length': [2, 'always', 200], // Footer lines max 200 characters
  },
};
