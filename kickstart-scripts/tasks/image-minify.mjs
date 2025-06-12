/**
 * Module with one standalone function 'minifyImage' to minify all images in the
 * build assets image directory.
 * @module image-minify
 * @exports minifyImage
 * @requires config
 * @requires imagemin
 * @requires imagemin-jpegtran
 * @requires imagemin-pngquants
 * @requires imagemin-svgo
 * @requires imagemin-webp
 * @requires minimist
 * @requires path
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 * @todo: Add webp support
 */

// External modules
import fs from 'fs'; // https://nodejs.org/api/fs.html
import imagemin from 'imagemin'; // https://github.com/imagemin/imagemin
import imageminJpegtran from 'imagemin-jpegtran'; // https://github.com/imagemin/imagemin-jpegtran
import imageminPngquant from 'imagemin-pngquant'; // https://github.com/imagemin/imagemin-pngquant
import imageminSvgo from 'imagemin-svgo'; // https://github.com/imagemin/imagemin-svgo
import imageminWebp from 'imagemin-webp'; // https://github.com/imagemin/imagemin-webp
import path from 'path'; // https://nodejs.org/api/path.html
import minimist from 'minimist'; // https://github.com/substack/minimist

// Self-written modules
import { config } from '../config.mjs';
import {
  getDirectoriesRecursive,
  showError,
  showFileInfo,
  showScriptInfo,
  showWarning,
} from '../utility.mjs';


/**
 * Iterates through the build directory and its assets/img folder and all sub
 * directories to compress all png, jpg, svg and webp images.
 * @function minifyImage
 * @public
 */
export function minifyImage() {
  /**
   * Object containing the command line arguments passed when the Node.js
   * process was launched.
   * We are so careful that we set default values.
   * @see https://github.com/substack/minimist#var-argv--parseargsargs-opts
   * @type {!Object.<string, string>}
   */
  const parameter = minimist(process.argv.slice(2), {
    default: {
      dirBuild: 'build',
      mode: 'dev',
    },
  });

  if (parameter.mode !== 'dev') { // Don't execute minify in dev mode.
    showScriptInfo(parameter.mode, 'image-minify', () => {
      return new Promise((resolve, reject) => {
        try {
          /** @type {!string} */
          const pathBuild = config.dirBuild || parameter.dirBuild;
          /** @type {!Array<string>} */
          let pathAssetsImg = config.dirAssetsImg;

          // Adds the build path in front of the img assets path.
          pathAssetsImg.unshift(pathBuild);

          /** @type {!string} */
          const pathBuildImg = path.join.apply(this, pathAssetsImg);

          if (fs.existsSync(pathBuildImg)) {
            /** @type {!Array<string>} */
            const dirImage = getDirectoriesRecursive(pathBuildImg);
            /**
             * The user configuration of the config.mjs.
             * @type {!Object}
             */
            const configImagemin = config.build.statics.imagemin || {};
            /**
             * The user configuration of the config.mjs.
             * @type {!Object}
             */
            const configImageMinify = config.build.statics.imageMinify;
            /**
             * The user configuration of the config.mjs.
             * @type {!Object}
             */
            const configJpeg = configImageMinify.jpeg;
            /**
             * The user configuration of the config.mjs.
             * @type {!Object}
             */
            const configPng = configImageMinify.png;
            /**
             * The user configuration of the config.mjs.
             * @type {!Object}
             */
            const configSvg = configImageMinify.svg;
            /**
             * The user configuration of the config.mjs.
             * @type {!Object}
             */
            const configWebp = configImageMinify.webp;
            /**
             * The file extension(s) configured by the user which get affected
             * by the minifier process.
             * @type {!string}
             */
            const fileExtensions = configImageMinify.extensions.join(',') || '';
            /**
             * The static configuration for the external imagemin-jpegtran
             * module.
             * @see https://www.npmjs.com/package/imagemin-jpegtran#options
             * @type {!Object}
             */
            const configJpegStatic = {};
            /**
             * The static configuration for the external imagemin-pngquant
             * module.
             * @see https://www.npmjs.com/package/imagemin-pngquant#options
             * @type {!Object}
             */
            const configPngStatic = {
              quality: [0.6, 0.8],
            };
            /**
             * The static configuration for the external imagemin-svgo module.
             * We pre-configured many options as a result of our experience.
             * E.g. we never want to remove the view box 'cause it's essential
             * for our sprite items.
             * @see https://github.com/svg/svgo#what-it-can-do
             * @type {!Object}
             */
            const configSvgStatic = {
              removeDimensions: true,
              removeOffCanvasPaths: true,
              removeRasterImages: true,
              removeScriptElement: true,
              removeViewBox: false,
              reusePaths: true,
              sortAttrs: true,
            };
            /**
             * The static configuration for the external imagemin-webp module.
             * @see https://www.npmjs.com/package/imagemin-webp#options
             * @type {!Object}
             */
            const configWebpStatic = {};

            // Iterates through all image directories.
            for (const index in dirImage) {
              /** @type {!string} */
              const dir = dirImage[index].replace(/\\/g, '/'); // I dunno why..
              /**
               * The static configuration for the external imagemin module.
               * Here we set the working directory and the image plugins we use.
               * @type {!Object}
               */
              const configImageminStatic = {
                destination: dir,
                plugins: [
                  imageminJpegtran({
                    ...configJpegStatic,
                    ...configJpeg,
                  }),
                  imageminPngquant({
                    ...configPngStatic,
                    ...configPng,
                  }),
                  imageminSvgo({
                    ...configSvgStatic,
                    ...configSvg,
                  }),
                  imageminWebp({
                    ...configWebpStatic,
                    ...configWebp,
                  }),
                ],
              };

              // Displays a console message.
              showFileInfo(
                parameter.mode,
                [`${dir}/*.{${fileExtensions}}`],
                'proceed'
              );

              /**
               * Runs the minifier and saves the responding promise into a
               * constant with a combination of our default and the user
               * configuration. Our default keys can be overwritten by the
               * user.
               * @type {!Promise<Object[]>}
               */
              const imageminPromise =
                imagemin([`${dir}/*.{${fileExtensions}}`], {
                  ...configImageminStatic,
                  ...configImagemin,
                });

              // Evaluates promise of imagemin process.
              imageminPromise.then(
                (files) => {
                  files.forEach((file) => {
                    // Displays a console message for every proceeded file.
                    showFileInfo(parameter.mode, file.destinationPath, 'write');
                  });
                },
                // On a minify error we will print it to the console and
                // proceed with the remaining directories.
                (error) => showError(error)
              );
            }

            // We can easily resolve after iterating through all files 'cause
            // on a minify error we print the error to the console. Sometimes
            // only one file is corrupted so we can still minify the other
            // ones. That's why we don't reject the error.
            resolve();
          } else {
            // Shows a warning if the directory doesn't exist.
            showWarning(`${pathBuildImg} doesn't exist.`);

            // If there is no directory we do nothing and resolve the promise.
            resolve();
          }
        } catch (error) {
          // On a unpredictable we reject with the error message.
          reject(error);
        }
      });
    });
  }
}

minifyImage(); // Always run minifyImage on module execution.
