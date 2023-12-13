'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpackCommon = require('./webpack-common.config.js');

const DEPLOY_PATH = process.env.DEPLOY_PATH;

module.exports = (env, argv) => {
  const interactiveName = path.basename(__dirname); // e.g. "open-response"

  return webpackCommon(env, argv, __dirname, {
    stats: {
      children: true,
    },
    // Add custom webpack configuration here
    entry: {
      [`${interactiveName}`]: './src/index.tsx'
    },
    plugins: [
      new HtmlWebpackPlugin({
        chunks: [interactiveName],
        filename: `${interactiveName}/index.html`,
        template: './index.html'
      }),
      ...(DEPLOY_PATH ? [new HtmlWebpackPlugin({
        filename: 'tecrock-table/index-top.html',
        template: './index.html',
        publicPath: DEPLOY_PATH,
      })] : [])
    ]
  });
};
