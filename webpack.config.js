var path = require('path')
var webpack = require('webpack')
var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    app: './js/index.js',
    modelWorker: './js/plates-model/model-worker.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  mode: process.env.PRODUCTION ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
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
            // Do not apply SVGR import in CSS/LESS files.
            issuer: /\.(less|css)$/,
            use: 'url-loader'
          },
          {
            issuer: /\.js$/,
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: {
                  // SVGR removes viewbox by default. Disable this behavior.
                  removeViewBox: false
                }
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
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new CopyWebpackPlugin({
      patterns: [ { from: 'public' } ]
    })
  ]
}

if (process.env.PRODUCTION) {
  // We could use NODE_ENV directly (instead of PRODUCTION), but for some reason,
  // when NODE_ENV is defined in command line, React does not seem to recognize it.
  module.exports.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  )
}
