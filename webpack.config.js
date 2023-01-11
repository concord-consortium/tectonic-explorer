var path = require('path')
var webpack = require('webpack')
var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    app: './js/index.tsx',
    modelWorker: './js/plates-model/model-worker.ts',
    // `shared` is a set of helpers and assets that are used by question-interactives TecRock Table interactive.
    shared: './js/shared/index.ts'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd' // used by shared entrypoint only
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
        // node-modules .less files.
        test: /node_modules\/.*\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      },
      {
        // Local .less files.
        test: /css\/.*\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /css-modules\/.*\.less$/,
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
          'less-loader'
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
                        cleanupIDs: { minify: false },
                        // leave <line>s, <rect>s and <circle>s alone
                        // https://github.com/svg/svgo/blob/master/plugins/convertShapeToPath.js
                        convertShapeToPath: false,
                        // leave "class"es and "id"s alone
                        // https://github.com/svg/svgo/blob/master/plugins/prefixIds.js
                        prefixIds: false,
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
      patterns: [ { from: 'public' } ]
    })
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
