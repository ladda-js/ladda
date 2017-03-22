const path = require('path');

module.exports = {
    entry: './src/release.js',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
        library: 'ladda',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        root: path.resolve(__dirname),
        modulesDirectories: ['src', 'node_modules']
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel',
                query: {
                    presets: ['es2015', 'stage-2']
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loaders: ['babel-loader', 'eslint-loader']
            },
        ]
    }
};
