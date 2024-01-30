module.exports = {
    "env": {
        "browser": true,
        "es2020": true
    },
    "extends": [
        "airbnb",
        "airbnb-typescript",
        "airbnb/hooks",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [],
    // Ignoring React templated files we are unlikely to modify, to avoid breaking them
    "ignorePatterns": [
        "src/components/common/**",
        "src/components/views/main/sidebar/**",
        "src/components/views/NotFound.tsx",
        "src/data/sources/source.ts",
        "src/hooks/Auth0.ts",
        "src/utils/formatter.ts",
        "src/utils/htmlForFeature.ts",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2020,
        "project": "./tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "@typescript-eslint"
    ],
    // set reasonable rules from warn to error and resolve offending files
    "rules": {
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/naming-convention": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-shadow": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-use-before-define": "warn",
        "consistent-return": "warn",
        "import/no-cycle": "warn",
        "import/no-extraneous-dependencies": "warn",
        // bc of carto template files
        "import/no-extraneous-dependencies": "off",
        "import/prefer-default-export": "off",
        "jsx-a11y/anchor-is-valid": "warn",
        "max-len": ["warn", { "code": 120 }],
        "no-bitwise": "off",
        "no-else-return": "warn",
        "no-nested-ternary": "warn",
        "no-param-reassign": "warn",
        "no-restricted-globals": "warn",
        "no-restricted-syntax": "warn",
        "no-return-assign": "warn",
        "no-underscore-dangle": "warn",
        "react/no-unstable-nested-components": "warn",
        "react/react-in-jsx-scope": "off",
        "react/require-default-props": "warn",
        "react-hooks/exhaustive-deps": "warn",
    }
};
