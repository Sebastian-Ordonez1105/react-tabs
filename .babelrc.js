'use strict';

const target = process.env.BABEL_TARGET;
const output = process.env.BABEL_OUTPUT;
const modules = target === 'rollup' || output == null ? false : output;

const options = {
  presets: [['env', { loose: true, modules }], 'react'],
  plugins: ['transform-object-rest-spread', ['transform-class-properties', { loose: true }]],
};

if (target === 'rollup') {
  options.plugins.push('external-helpers');
} else if (target === 'examples') {
  options.plugins.push(['transform-react-remove-prop-types', { removeImport: true }]);
} else {
  options.plugins.push(['transform-react-remove-prop-types', { mode: 'wrap' }]);
}

module.exports = options;
