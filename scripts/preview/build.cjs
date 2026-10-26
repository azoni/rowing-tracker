// Render actual components against in-memory fixtures; never import App.js/Firebase.
const path = require('node:path');
const fs = require('node:fs');
const webpack = require('webpack');
const repo = path.resolve(__dirname, '../..');
const modules = path.join(repo, 'node_modules');
const output = path.join(repo, 'artifacts/preview');
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
webpack({
  mode: 'development', devtool: false, context: repo,
  entry: path.join(__dirname, 'fixture.jsx'),
  output: { path: output, filename: 'app.js' },
  resolve: { modules: [modules], extensions: ['.js', '.jsx', '.json'] },
  resolveLoader: { modules: [modules] },
  module: { rules: [
    { test: /\.[jt]sx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: [path.join(modules, 'babel-preset-react-app')], babelrc: false, configFile: false } } },
    { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    { test: /\.(png|jpe?g|svg|webp|gif)$/, type: 'asset/resource' },
  ] },
  plugins: [new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('development'), 'process.env.PUBLIC_URL': JSON.stringify('') })],
}, (error, stats) => {
  if (error) { console.error(error); process.exitCode = 1; return; }
  console.log(stats.toString({ colors: false, all: false, errors: true, warnings: true, timings: true }));
  if (stats.hasErrors()) { process.exitCode = 1; return; }
  fs.cpSync(path.join(repo, 'public'), output, { recursive: true });
  fs.writeFileSync(path.join(output, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Row Crew · synthetic preview</title></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
  console.log('Synthetic preview built. Run node scripts/preview/server.cjs');
});
