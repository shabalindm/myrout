var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
        entry: __dirname + '/test.js',
        output: {
            filename: 'testBundle.js'
        },
        target: 'node',
        externals: [nodeExternals()],
        node: {
            fs: 'empty'
        },

        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                }]
        },

    plugins: [
        new WebpackShellPlugin
            ({
                onBuildExit: "mocha --colors ./dist/testBundle.js"
            })
    ]
}
;