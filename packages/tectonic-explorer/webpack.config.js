var path = require('path')
var webpack = require('webpack')
var CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');


// DEPLOY_PATH is set by the s3-deploy-action its value will be:
// `branch/[branch-name]/` or `version/[tag-name]/`
const DEPLOY_PATH = process.env.DEPLOY_PATH;

module.exports = {
  entry: {
    app: './src/index.tsx',
    modelWorker: './src/plates-model/model-worker.ts'
  },
  output: {
    path: path.join(__dirname, '../../dist'),
    filename: '[name].js'
  },
  // PJ 12/20/2021: Disable production mode for now, as it's causing an error and breaks production deployment.
  // mode: process.env.PRODUCTION ? 'production' : 'development',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      },
      {
        // Config based on:
        // https://github.com/react-toolbox/react-toolbox-example/blob/master/webpack.config.js
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]--[local]--[hash:base64:8]'
              },
              sourceMap: true,
              importLoaders: 1
            }
          },
          'postcss-loader' // has separate config, see postcss.config.js nearby
        ]
      },
      {
        // node-modules .scss files (eg react-tabs styles).
        test: /node_modules\/.*\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      // .global.scss files are processed as global CSS, i.e. not as CSS modules
      {
        test: /\.global.(sa|sc)ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      // .scss files are processed as CSS modules. Some recommend a naming convention of
      // .module.scss for CSS modules, but that would require renaming a bunch of files.
      {
        test: /\.(sa|sc)ss$/i,
        exclude: [
          /\.global.(sa|sc)ss$/i,
          /node_modules/
        ],
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]--[local]--tectonic-explorer'
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
        // GLSL shaders should be loaded as strings.
        test: /\.(glsl|txt)$/,
        loader: 'raw-loader'
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        // inline base64 URLs for <=64k images, direct URLs for the rest
        loader: 'url-loader',
        options: {
          limit: 65536
        }
      },
      {
        // Support ?123 suffix, e.g. ../fonts/m4d-icons.eot?3179539#iefix
        test: /\.(eot|ttf|woff|woff2)((\?|#).*)?$/,
        loader: 'url-loader',
        options: {
          limit: 8192
        }
      },
      {
        test: /\.svg$/,
        oneOf: [
          {
            // Do not apply SVGR import in CSS files.
            issuer: /\.(css|scss|less)$/,
            type: 'asset',
          },
          {
            issuer: /\.tsx?$/,
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [
                  {
                    // cf. https://github.com/svg/svgo/releases/tag/v2.4.0
                    name: 'preset-default',
                    params: {
                      overrides: {
                        // don't minify "id"s (i.e. turn randomly-generated unique ids into "a", "b", ...)
                        // https://github.com/svg/svgo/blob/master/plugins/cleanupIDs.js
                        cleanupIds: { minify: false },
                        // leave <line>s, <rect>s and <circle>s alone
                        // https://github.com/svg/svgo/blob/master/plugins/convertShapeToPath.js
                        convertShapeToPath: false,
                        // leave "stroke"s and "fill"s alone
                        // https://github.com/svg/svgo/blob/master/plugins/removeUnknownsAndDefaults.js
                        removeUnknownsAndDefaults: { defaultAttrs: false },
                        // leave viewBox alone
                        removeViewBox: false
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      {
        // Pass global THREE variable to OrbitControls
        test: /three\/examples\/js/,
        loader: 'imports-loader',
        options: {
          imports: [
            'namespace three THREE'
          ]
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new CopyWebpackPlugin({
      patterns: [{ from: 'public' }]
    }),
    ...(DEPLOY_PATH ? [new HtmlWebpackPlugin({
      filename: 'index-top.html',
      template: './public/index.html',
      publicPath: DEPLOY_PATH,
    })] : [])
  ]
}

// PJ 12/20/2021: Disable production mode for now, as it's causing an error and breaks production deployment.
// if (process.env.PRODUCTION) {
//   // We could use NODE_ENV directly (instead of PRODUCTION), but for some reason,
//   // when NODE_ENV is defined in command line, React does not seem to recognize it.
//   module.exports.plugins.push(
//     new webpack.DefinePlugin({
//       'process.env.NODE_ENV': JSON.stringify('production')
//     })
//   )
// }
