const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = env => {

  return {
    mode: env.release ? 'production' : 'development',
    entry: './src/ts/viewer.ts',
    output: {
      filename: 'viewer.js',
      path: path.resolve(__dirname, 'dist'),
    },
      devtool: env.release ? '' : 'inline-source-map',
      devServer: {
          contentBase: path.join(__dirname, 'dist'),
          compress: false,
          port: 9000,
          writeToDisk: true,
           publicPath : '/manual/'
      },

      plugins: [
          new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        template: './src/demo-view.html'
      }),
      new MiniCssExtractPlugin({
      })
    ],
    resolve: {
      extensions: ['.ts', '.js', '.json']
    },
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true // set to true if you want JS source maps
        }),
        new OptimizeCSSAssetsPlugin({})
      ]
    },
      module: { // я х.з что здесь для чего
          rules: [
              {
                  test: /\.ts$/,
                  use: 'ts-loader',
                  exclude: /node_modules/
              },
              {

                  test: /\.s?css$/,

                  use: [
                      env.release ? { loader: MiniCssExtractPlugin.loader, options: {} } : 'style-loader',
                      'css-loader',
                      'sass-loader'
                  ]
              },
              {
                  test: /\.(png|svg|jpg|gif)$/,
                  use: [

                      {
                          loader: 'file-loader',
                          options: {
                              name: '[name].[ext]',
                              outputPath: 'images/'
                          }

                      }
                  ]
              },
              {
                  test: /\.(woff|woff2|eot|ttf|otf)$/,
                  use: [
                      'file-loader'
                  ]
              },
              {
                  test: /\.(html)$/,
                  use: {
                      loader: 'html-loader',
                      options: {
                      }
                  }
              }
          ]
      }
  }

};

