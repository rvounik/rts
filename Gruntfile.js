module.exports = function(grunt) {
    // project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            "build": {
                "options": {
                    "transform": [
                        "babelify"
                    ],
                    "watch": false,
                    "keepAlive": false
                },
                "files": {
                    "js/build/compiled.js": "js/src/rts.js"
                }
            }
        },
        copy: {
            options: {
                punctuation: ''
            },
            js: {
                files: {
                    'web/js/rts.js': ['js/build/compiled.js']
                }
            },
            vendor: {
                files: {
                    'web/js/vendor/polyfill.js': ['node_modules/babel-polyfill/dist/polyfill.min.js']
                }
            },
            assets: {
                "files": [
                    {
                        "src": [
                            "assets/image/*"
                        ],
                        "dest": "web/assets/image",
                        "flatten": true,
                        "expand": true
                    }
                ]
            }
        },
        clean: {
            "build": [
                "js/build"
            ],
            "web": [
                "web/js",
                "web/css",
                "web/assets"
            ]
        },
        uglify: {
            "js": {
                "files": {
                    "js/build/compiled.js": ["js/build/compiled.js"]
                }
            }
        },
        autoprefixer: {
            "build": {
                "files": {
                    "web/css/screen.css": "web/css/screen.css"
                }
            }
        },
        compass: {
            "build": {
                "options": {
                    "importPath": [
                        "node_modules"
                    ],
                    "sassDir": [
                        "css/src"
                    ],
                    "cssDir": "web/css/",
                    "environment": "production",
                    "noLineComments": false,
                    "outputStyle": "compressed",
                    "specify": "css/src/screen.scss"
                }
            }
        },
        watch: {
            "project": {
                "files": [
                    "js/src/**/*.js",
                    "css/src/**"
                ],
                "tasks": [
                    'clean:build',
                    "browserify:build",
                    'clean:web',
                    'compass:build',
                    "copy:js",
                    'copy:vendor',
                    'copy:assets',
                    'autoprefixer:build'
                ]
            }
        }
    });

    // load the plugins
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-compass');

    // register tasks
    grunt.registerTask(
        'default',
        [
            'clean:build',
            'browserify:build',
            'clean:web',
            'compass:build',
            'copy:js',
            'copy:vendor',
            'copy:assets',
            'autoprefixer:build',
            'watch:project'
        ]
    );

    grunt.registerTask(
        'deploy',
        [
            'clean:build',
            'browserify:build',
            'clean:web',
            'compass:build',
            'uglify:js',
            'copy:js',
            'copy:vendor',
            'copy:assets',
            'autoprefixer:build'
        ]
    );
};
