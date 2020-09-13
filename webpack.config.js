const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = env => {

    return {
        mode: env.release ? 'production' : 'development',
        entry: './src/ts/my-route-asset.ts',
        output: {
            filename: 'myrout/myrout.js',
            path: path.resolve(__dirname, 'dist'),
        },
        devtool: env.release ? '' : 'inline-source-map',
        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: false,
            port: 9002,
            writeToDisk: true,
            openPage: '/demo/demo.html'
        },

        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new MiniCssExtractPlugin({}),
            new CopyWebpackPlugin([
                {from: 'src/ico', to: 'myrout/ico'},
                {from: 'src/demo', to: 'demo'},
                {from: 'src/css', to: 'myrout/css'}//пока тупо копируем
            ]),
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
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    include: path.resolve(__dirname, 'src')
                },
                {
                    test: /\.s?css$/,

                    use: [
                        env.release ? {loader: MiniCssExtractPlugin.loader, options: {}} : 'style-loader',
                        'css-loader',
                        'sass-loader'
                    ]
                },

            ]
        }
    }

};

