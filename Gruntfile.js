module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        coffee:{
            dev:{
                files:{
                    'engine/*.js':'engine/coffee/*.coffee'
                }
            }
        },
        simplemocha:{
            dev:{
                src:"test/engine/packageTest.js",
                options:{
                    reporter: 'spec',
                    slow: 200,
                    timeout: 1000
                }
            }
        },
        watch:{
            all:{
                files:['engine/coffee/*'],
                tasks:['buildDev', 'buildTest', 'test']
            }
        }
    });

    grunt.registerTask('test', 'simplemocha:dev');
    grunt.registerTask('buildDev', 'coffee:dev');
    grunt.registerTask('watch', ['buildDev', 'test', 'watch:all']);

};




