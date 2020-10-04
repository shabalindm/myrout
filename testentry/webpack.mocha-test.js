var webpack = require('webpack');
const path = require('path');
var nodeExternals = require('webpack-node-externals');
var WebpackShellPlugin = require('webpack-shell-plugin');


module.exports = {

    mode: 'development',

    resolve: {
        extensions: ['.ts', '.js', '.json'],
        alias: {
            Source: path.resolve(__dirname, '../src/'),
          },
      },

        entry: path.resolve(__dirname, './test.js'),
        output: {
        filename: '../testentry/browser/testBundle.js'
        },
       devtool:  'inline-source-map',

        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
            ]
        },

    plugins: [
        new WebpackShellPlugin
            ({
              //  onBuildExit: "./node_modules/.bin/mocha --colors ../testentry/browser/testBundle.js"
            })
    ]
}
;