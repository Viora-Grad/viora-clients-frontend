// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
	{
		files: ['**/*.ts'],
		extends: [
			eslint.configs.recommended,
			tseslint.configs.recommendedTypeChecked,
			tseslint.configs.stylisticTypeChecked,
			angular.configs.tsRecommended,
		],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},
		processor: angular.processInlineTemplates,
		rules: {
			'@angular-eslint/directive-selector': [
				'warn',
				{
					type: 'attribute',
					prefix: 'app',
					style: 'camelCase',
				},
			],
			'@angular-eslint/component-selector': [
				'error',
				{
					type: 'element',
					prefix: 'app',
					style: 'kebab-case',
				},
			],
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],

			'@typescript-eslint/prefer-readonly': 'warn',

			'no-var': 'error',
			'prefer-const': 'warn',

			'@typescript-eslint/naming-convention': [
				'warn',

				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},

				{
					selector: 'variableLike',
					format: ['camelCase', 'UPPER_CASE'],
				},

				{
					selector: 'property',
					format: ['camelCase'],
					leadingUnderscore: 'allow',
				},
			],

			complexity: ['warn', 10],
			'max-depth': ['warn', 4],

			'@angular-eslint/component-class-suffix': ['error', { suffixes: ['Component', 'Page'] }],

			'@angular-eslint/directive-class-suffix': ['error', { suffixes: ['Directive'] }],

			'@angular-eslint/prefer-on-push-component-change-detection': 'error',

			'@angular-eslint/prefer-signals': 'error',

			'@angular-eslint/prefer-inject': 'error',

			'@angular-eslint/prefer-output-emitter-ref': 'error',

			'@angular-eslint/prefer-standalone': 'error',

			'@angular-eslint/prefer-host-metadata-property': 'error',

			'@angular-eslint/use-injectable-provided-in': 'error',

			'@angular-eslint/no-uncalled-signals': 'error',

			'@angular-eslint/computed-must-return': 'error',
		},
	},
	{
		files: ['**/*.html'],
		extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
		rules: {
			'@angular-eslint/template/prefer-control-flow': 'error',
			'@angular-eslint/template/prefer-self-closing-tags': 'error',
			'@angular-eslint/template/prefer-ngsrc': 'error',
			'@angular-eslint/template/no-negated-async': 'error',
			'@angular-eslint/template/button-has-type': 'error',
			'@angular-eslint/template/no-inline-styles': 'error',
			'@angular-eslint/template/eqeqeq': 'error',
			'@angular-eslint/template/no-duplicate-attributes': 'error',
		},
	},
]);
