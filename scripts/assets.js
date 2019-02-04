var fs = require('fs-extra');
var handlebars = require('handlebars');
var sass = require('node-sass');
var deasync = require('deasync');
var glob = require('glob');
var rollup = require('rollup');
var resolve = require('rollup-plugin-node-resolve');
var minify = require('rollup-plugin-babel-minify');
var commonjs = require('rollup-plugin-commonjs');

module.exports = {
    js: function(config) {
        fs.removeSync(config.path + '/main.js');
        let isDone = false;

        (async function () {
            let rollupOptions = {
                input: './src/js/main.js',
                plugins: [
                    resolve(),
                    commonjs({
                        namedExports: {
                            'node_modules/jquery/dist/jquery.min.js': [ 'jquery' ]
                        }
                    })
                ]
            };

            if (config.specs.deploy) {
                rollupOptions.plugins.push(minify({
                    comments: false
                }))
            }

            var bundle = await rollup.rollup(rollupOptions);

            await bundle.write({
                file: config.path + '/main.js',
                format: 'umd',
                sourcemap: config.specs.deploy ? false : 'inline'
            });

            isDone = true;
        })()

        deasync.loopWhile(() => {
            return !isDone;
        });
    },

    css: function(config) {
        fs.removeSync(config.path + '/main.css');

        var isDone = false,
            css;

        sass.render({
            file: 'src/sass/main.scss'
        }, function(err, result) {
            if (err) {
                console.log(err);
            }
            fs.writeFileSync(config.path + '/main.css', result.css.toString('utf8').replace(/\{\{ path \}\}/g, config.absolutePath).replace(/\{\{path\}\}/g, config.absolutePath));
            isDone = true;
            console.log('Updated css!');
        });

        deasync.loopWhile(function() {
            return !isDone;
        });
    },

    html: function(config) {
        fs.removeSync(config.path + '/index.html');

        handlebars.registerHelper('handlise', function(string) {
            if (string) {
                return string.replace(/ – /g, '-').replace(/ /g, '-').replace(/,/g, '').toLowerCase();
            }
        });

        var html = fs.readFileSync('src/templates/index.html', 'utf8');
        var template = handlebars.compile(html);

        var partials = glob.sync('src/templates/**/*.*');

        partials.forEach(function(partial) {
            var name = partial.replace('src/templates/', '').split('.')[0];
            var template = fs.readFileSync(partial, 'utf8');

            handlebars.registerPartial(name, template);
        });

        fs.writeFileSync(config.path + '/index.html', template(config.data));
        console.log('Updated html!');
    },

    static: function(config) {
        fs.emptyDirSync(config.path + '/assets');
        fs.mkdirsSync(config.path + '/assets');
        fs.copySync('src/assets', config.path + '/assets');
        console.log('Updated static assets');
    },

    compile: function(config) {
        fs.mkdirsSync(config.path);

        var modified = config.specs.modified;

        if (modified === 'html') {
            this.html(config);
        } else if (modified === 'js') {
            this.js(config);
        } else if (modified === 'css') {
            this.css(config);
        } else if (modified === 'static') {
            this.static(config)
        } else {
            this.html(config);
            this.css(config);
            this.js(config);
            this.static(config);
        }
    }
}
