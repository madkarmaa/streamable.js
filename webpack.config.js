const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const pkg = require('./package.json');

module.exports = {
    entry: path.resolve('./index.js'),
    output: {
        filename: `streamable@${pkg.version}.web.js`,
        path: path.resolve('./dist'),
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    compress: true,
                    keep_classnames: true,
                    keep_fnames: true,
                    mangle: false,
                },
            }),
        ],
    },
    mode: 'production',
};
