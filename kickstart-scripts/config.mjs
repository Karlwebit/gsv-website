/**
 * @type {!Object}
 * @public
 * @const
 */
export const config = {

  /**
   * The folder to copy your files, relative to dirWorking.
   * @type {!string}
   */
  dirBuild: 'build',
  /**
   * The root directory.
   * @type {!string}
   */
  dirWorking: './',
  /**
   * The path to the css assets in the build directory. We use an array to
   * prevent path separator issues. Don't forget to adjust this path in the
   * sandbox.html.
   * @type {!Array<string>}
   */
  dirAssetsCss: ['assets', 'css'],
  /**
   * The path to the js assets in the build directory. We use an array to
   * prevent path separator issues. Don't forget to adjust this path in the
   * sandbox.html.
   * @type {!Array<string>}
   */
  dirAssetsJs: ['assets', 'js'],
  /**
   * The path to the img assets in the build directory. We use an array to
   * prevent path separator issues.
   * @type {!Array<string>}
   */
  dirAssetsImg: ['assets', 'img'],

  /** @type {!Object} */
  build: {

    /** @type {!Object} */
    css: {
      /** @type {!Object} */
      cleanCss: {},
      /** @type {!Object} */
      cssParse: {},
      /** @type {!boolean} */
      cssPurge: false,
      /** @type {!Object} */
      cssStringify: {},
      /** @type {!Object} */
      jsdom: {},
      /** @type {!Object} */
      nodeMinify: {},
      /** @type {!Object} */
      postCss: {},
      /** @type {!Object} */
      sass: {},
      /** @type {!Object} */
      stylelint: {},
    },

    /** @type {!Object} */
    html: {
      /** @type {!Object} */
      htmlMinify: {},
      /** @type {!Object} */
      htmlValidator: {},
      /** @type {!Object} */
      nodeMinify: {},
    },

    /** @type {!Object} */
    js: {
      /** @type {!Object} */
      babel: {
        /** @type {Array<string>} */
        presets: [
          '@babel/preset-env',
        ]
      },
      /** @type {!Object} */
      eslint: {},
      /** @type {!Object} */
      requirejs: {},
      /**
       * Uses terser to minify JavaScript files.
       * @type {!Object}
       */
      jsMinify: {
        options: {
          ecma: 6,
          output: {
            comments: /(?:^!|@(?:license|preserve|cc_on))/
          }
        }
      },
    },

    /** @type {!Object} */
    statics: {
      /** @type {!Array<Object>} */
      copy: [
        {
          /** @type {!Object} */
          options: {
            /**
             * Set the environment to work with development or production.
             * Default: every mode
             * @type {?string|Array<string>}
             */
            mode: ['dev', 'prod'],
            /**
             * Relative path from dirWorking to setup the copy source. In other
             * modules it's sometimes called 'cwd' (current working directory).
             * Default: root working directory
             * @type {?string}
             */
            sourceDir: './components/app/',
            /**
             * Relative path from dirWorking to setup the copy destination.
             * Default: root build directory
             * @type {?string}
             */
            destinationDir: './build/assets/img/',
            /**
             * Set to 'true' if every file of all subdirectories should get copied
             * to the root destination directory. Otherwise use 'false.
             * Default: true
             * @type {?boolean}
             */
            flatten: true,
            /**
             * You can pass an additional fast-glob configuration if you need.
             * E.g. sometimes the 'dot' configuration causes problems. It's
             * not possible to overwrite the 'cwd' option 'cause we have to
             * ensure the copy task works as expected.
             * @type {!Object}
             */
            fastGlob: {
              ignore: [
                '_svg/',
                '_sprite-items/',
              ],
            },
          },
          /** @type {!Array<string>} */
          files: [
            // Include all images files ignoring directory depth.
            // E.g. *.jpg would only search within the root directory (cwd).
            '**/*.jpg', // Include all .jpg files (ignoring directory depth)
            '**/*.png', // Include all .png files
            '**/*.gif', // Include all .gif files
            '**/*.ico', // Include all .ico files
            '**/*.webp', // Include all .webp files
            '**/*.svg', // Include all .svg files
          ],
        },
        {
          options: {
            sourceDir: './components/app/',
            destinationDir: './build/assets/js/',
            flatten: false,
          },
          files: [
            '**/*.js',
          ],
        },
        {
          options: {
            sourceDir: './node_modules/swiper/',
            destinationDir: './build/assets/js/libs/',
            flatten: false,
          },
          files: [
            'swiper-bundle.min.js',
          ],
        },
      ],
      /** @type {!Object} */
      imageMinify: {
        /** @type {!Array<string>} */
        extensions: ['jpg', 'png', 'gif', 'webp'], // do not minify 'svg', because its broken in prod mode
        /** @type {!Object} */
        jpeg: {},
        /** @type {!Object} */
        png: {},
        /** @type {!Object} */
        svg: {},
        /** @type {!Object} */
        webp: {},
      },
      /** @type {!Object} */
      imagemin: {},
      /** @type {!Array<Object>} */
      svgSprite: [
        {
          /** @type {!Array<string>} */
          sourceDir: ['components', 'app', '_sprite-items', 'test-icons'],
          /** @type {!Array<string>} */
          destinationFile:
            ['components', 'app', '_svg', 'icon-sprite', 'icon-sprite.svg'],
        },
      ],
      /** @type {!Object} */
      svgstore: {
        inline: true,
      },
    },
  }
};


/**
 * @type {!Object}
 * @public
 * @const
 */
export const configConsole = {
  /** @type {!Object} */
  dev: {
    /** @type {!boolean} */
    verbose: true,
    /** @type {!boolean} */
    quiet: false,
  },
  prod: {
    /** @type {!boolean} */
    verbose: false,
    /** @type {!boolean} */
    quiet: false,
  },
};


/**
 * @type {!Object}
 * @public
 * @const
 */
export const configWatch = {
  /**
   * All extensions which trigger the css build task.
   * @type {!Array<string>}
   */
  css: [
    'scss',
  ],
  /**
   * All extensions which trigger the html build task.
   * @type {!Array<string>}
   */
  html: [
    'html',
  ],
  /**
   * All extensions which trigger the js build task.
   * @type {!Array<string>}
   */
  js: [
    'js',
  ],
};
