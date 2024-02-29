const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'eval-source-map',
    entry: './src/index.js',
    module: {
        rules: [{
            test: /\.s[ac]ss$/i,
            use: [
                // Creates `style` nodes from JS strings
                "style-loader",
                // Translates CSS into CommonJS
                "css-loader",
                // Compiles Sass to CSS
                "sass-loader",
            ],
        }],
    },
    output: {
        path: path.resolve(__dirname, 'public/dist'),
        filename: 'bundle.js'
    },
    experiments: {
        topLevelAwait: true,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "src/images", to: "images" },
            ],
        }), 
    ]
};