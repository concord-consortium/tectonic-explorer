'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpackCommon = require('./webpack-common.config.js');

const DEPLOY_PATH = `../${process.env.DEPLOY_PATH}`;

module.exports = (env, argv) => {
  const interactiveName = path.basename(__dirname); // e.g. "open-response"

  return webpackCommon(env, argv, __dirname, {
    stats: {
      children: true,
    },
    // Add custom webpack configuration here
    entry: {
      [`${interactiveName}`]: './src/index.tsx',
      [`${interactiveName}/report-item`]: './src/report-item-index.tsx',
    },
    plugins: [
      new HtmlWebpackPlugin({
        chunks: [interactiveName],
        filename: `${interactiveName}/index.html`,
        template: './index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: [`${interactiveName}/report-item`],
        filename: `${interactiveName}/report-item/index.html`,
        template: './index.html'
      }),
      ...(DEPLOY_PATH ? [new HtmlWebpackPlugin({
        chunks: [interactiveName],
        filename: `${interactiveName}/index-top.html`,
        template: './index.html',
        publicPath: DEPLOY_PATH,
      })] : []),
      ...(DEPLOY_PATH ? [new HtmlWebpackPlugin({
        chunks: [`${interactiveName}/report-item`],
        filename: `${interactiveName}/report-item/index-top.html`,
        template: './index.html',
        publicPath: DEPLOY_PATH,
      })] : []),
    ]
  });
};
