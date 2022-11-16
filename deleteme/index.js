const bcrypt = require('bcrypt');
const bundleModule = require('bundle-module');

bundleModule({
    entry: './myApp/index.js',
    filename: 'myApp.script.js',
    env: 'node',
    output_dir: './dist',
});
