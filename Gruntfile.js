
module.exports = function(grunt){
    grunt.initConfig({
        watch: {
            hapi: {
                files: ['lib/*.{js, coffee}'],
                tasks: ['hapi'],
                options: {
                    spawn: false // Newer versions of grunt-contrib-watch might require this parameter.
                }
            }
        },
        hapi: {
            custom_options: {
                options: {
                    server: require('path').resolve('./app.js'),
                    bases: {
                        '/': '.'
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-hapi');
    grunt.registerTask('server', ['hapi','watch']);
}





