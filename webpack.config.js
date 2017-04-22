const path = require('path');

module.exports = {
  entry: './src/release.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    library: 'ladda',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015', 'stage-2']
          }
        }
      }
    ]
  }
};
