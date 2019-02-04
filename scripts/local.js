// dependancies
var watch = require('node-watch');
var cmd = require('node-cmd');

// create server
var bs = require('browser-sync').create();
    bs.init({
        server: './.build',
        port: 8000
    });

    bs.watch('./.build/*.css', function(event, file) {
        if (event === 'change') {
            bs.reload('*.css');
        }
    });

// watch src files
watch('src', { recursive: true }, function(event, file) {
    var fileExt = file.substring(file.lastIndexOf('.') + 1);
    var isAssets = file.includes('/assets/');

    if (isAssets) {
        console.log('updating static assets');
        cmd.get('npm run compile -- local static', function(data) { console.log(data); });
    } else if (fileExt === 'html' || fileExt === 'svg') {
        console.log('updating html');
        cmd.get('npm run compile -- local html', function(data) { console.log(data); });
    } else if (fileExt === 'scss') {
        console.log('updating css');
        cmd.get('npm run compile -- local css', function(data) { console.log(data); });
    } else if (fileExt === 'js') {
        console.log('updating js');
        cmd.get('npm run compile -- local js', function(data) { console.log(data); });
    } else {
        console.log('non-watchable file extension changed :' + fileExt);
    }
});
