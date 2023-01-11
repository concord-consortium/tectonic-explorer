'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpackCommon = require('./webpack-common.config.js');

module.exports = (env, argv) => {
  const interactiveName = path.basename(__dirname); // e.g. "open-response"

  return webpackCommon(env, argv, __dirname, {
    // Add custom webpack configuration here
    entry: {
      [`${interactiveName}`]: './src/index.tsx'
    },
    plugins: [
      new HtmlWebpackPlugin({
        chunks: [interactiveName],
        filename: `${interactiveName}/index.html`,
        template: './index.html'
      })
    ]
  });
};
