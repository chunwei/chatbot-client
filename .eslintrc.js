module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "node": true,
    "jasmine": true
  },
  "extends": ["eslint:recommended" /* , "google" */ ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "sourceType": "module"
  },
  "rules": {
    // allow console and debugger in development
    'no-console': process.env.NODE_ENV === 'production' ? 2 : 0,
    "indent": [
      "error",
      2,
      { "SwitchCase": 1 } //"SwitchCase" (默认：0) 强制 switch 语句中的 case 子句的缩进水平
    ],

    "linebreak-style": [
      "error",
      "windows"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "warn",
      "always"
    ]
  }
};
