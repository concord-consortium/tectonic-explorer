var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: './js/index.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader!autoprefixer-loader'
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader!autoprefixer-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        // GLSL shaders should be loaded as strings.
        test: /\.(glsl|txt)$/,
        loader: 'raw-loader'
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        // inline base64 URLs for <=8k images, direct URLs for the rest
        loader: 'url-loader?limit=8192'
      },
      {
        // Support ?123 suffix, e.g. ../fonts/m4d-icons.eot?3179539#iefix
        test: /\.(eot|ttf|woff|woff2|svg)((\?|\#).*)?$/,
        loader: 'url-loader?limit=8192'
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      {from: 'public'}
    ])
  ]
};
