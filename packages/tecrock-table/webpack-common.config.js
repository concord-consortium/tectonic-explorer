'use strict';

const path = require('path');
const os = require('os');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const GenerateJsonFromJsPlugin = require('generate-json-from-js-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const { merge } = require('webpack-merge');

module.exports = (env, argv, interactiveDirName, customizations) => {
  const devMode = argv.mode !== 'production';
  const interactiveName = path.basename(interactiveDirName); // e.g. "open-response"
  const rootDir = `${__dirname}/../..`;

  const common = {
    context: interactiveDirName, // to automatically find tsconfig.json
    devServer: {
      static: 'dist',
      hot: true,
      https: {
        key: path.resolve(os.homedir(), '.localhost-ssl/localhost.key'),
        cert: path.resolve(os.homedir(), '.localhost-ssl/localhost.pem'),
      },
    },
    devtool: devMode ? 'eval-cheap-module-source-map' : 'source-map',
    mode: 'development',
    output: {
       // set the path to be ./dist in the top-level monorepo directory
      path: `${rootDir}/dist`,
      filename: '[name]/assets/index.[contenthash].js'
    },
    performance: { hints: false },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: { allowTsInNodeModules: true }
        },
        // .css files are minimally processed because we have included
        // files from libraries like bootstrap and video-js.
        {
          test: /\.css$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        // .global.scss files are processed as global CSS, i.e. not as CSS modules
        {
          test: /\.global.(sa|sc)ss$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader'
          ]
        },
        // .scss files are processed as CSS modules. Some recommend a naming convention of
        // .module.scss for CSS modules, but that would require renaming a bunch of files.
        {
          test: /\.(sa|sc)ss$/i,
          exclude: /\.global.(sa|sc)ss$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]--[local]--question-int'
                },
                sourceMap: true,
                importLoaders: 1
              }
            },
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.(png|woff|woff2|eot|ttf)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
            publicPath: '../../'
          }
        },
        {
          test: /\.svg$/,
          oneOf: [
            {
              // Do not apply SVGR import in (S)CSS files or Javascript files (for the drawing tool).
              issuer: /\.((sa|sc|c)ss|js)$/,
              use: 'url-loader'
            },
            {
              issuer: /\.tsx?$/,
              loader: '@svgr/webpack'
            }
          ]
        }
      ]
    },
    resolve: {
      alias: {
        // prevent duplicate react versions
        // cf. https://github.com/facebook/react/issues/13991#issuecomment-435587809
        react: path.resolve(__dirname, 'node_modules/react'),
      },
      extensions: [ '.ts', '.tsx', '.js' ]
    },
    stats: {
      // suppress "export not found" warnings about re-exported types
      warningsFilter: /export .* was not found in/
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: devMode ? '[name]/assets/index.css' : '[name]/assets/index.[hash].css'
      }),
      // Wrapper page, useful for testing and Cypress.
      // new HtmlWebpackPlugin({
      //   chunks: ['wrapper'],
      //   filename: 'wrapper.html',
      //   template: 'packages/helpers/wrapper.html'
      // }),
      // generate version.json
      new GenerateJsonFromJsPlugin({
        path: `./generate-version-json.js`,
        filename: `${interactiveName}/version.json`,
        data: { interactiveDirName }
      }),
      new ESLintPlugin({
        extensions: ['ts','tsx']
      })
    ]
  };

  return merge(common, customizations);
};
