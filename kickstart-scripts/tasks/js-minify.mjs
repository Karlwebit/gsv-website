/**
 * Module with one standalone function 'minifyJs' to minify all js files in the
 * build directory.
 * @module js-minify
 * @exports minifyJs
 * @requires @node-minify/core
 * @requires @node-minify/uglify-es
 * @requires config
 * @requires fast-glob
 * @requires minimist
 * @requires path
 * @requires utility
 * @todo Set module to dynamic js minification
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import fastGlob from 'fast-glob'; // https://github.com/mrmlnc/fast-glob
import minify from '@node-minify/core'; // https://github.com/srod/node-minify
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html
import terser from '@node-minify/terser'; // https://github.com/terser/terser

// Self-written modules
import { config } from '../config.mjs';
import { showError, showFileInfo, showScriptInfo } from '../utility.mjs';


/**
 * Minifies in multiple steps library files, deferred modules and other js files.
 * @function minifyJs
 * @public
 */
export function minifyJs() {
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
      dirWorking: './',
      mode: 'dev',
    },
  });

  if (parameter.mode !== 'dev') { // Don't execute minify in dev mode.
    showScriptInfo(parameter.mode, 'js-minify', () => {
      return new Promise((resolve, reject) => {
        try {
          /**
           * The user configuration of the config.mjs.
           * @type {!Object}
           */
          const configJsMinify = config.build.js.jsMinify || {};
          /** @type {!string} */
          const pathBuild = config.dirBuild || parameter.dirBuild;
          /** @type {!Array<string>} */
          let pathAssetsJs = config.dirAssetsJs;

          // Adds the build path in front of the js assets path.
          pathAssetsJs.unshift(pathBuild);

          /** @type {!string} */
          const pathBuildJs = path.join.apply(this, pathAssetsJs);

          // Iterates through all files located at the assets js directory at
          // the build directory recursively.
          fastGlob.sync(['**/*.js'], {
            cwd: pathBuildJs,
          }).forEach((fileEntry) => {
            /** @type {!string} */
            const filepath = path.join(pathBuildJs, `${fileEntry}`);
            /**
             * The static configuration for the external terser module.
             * We have to set the terser module as compiler and we add the
             * input and output files to work correct.
             * @type {!Object}
             */
            const configJsMinifyStatic = {
              compressor: terser,
              input: filepath,
              output: filepath,
              sync: true,
            };

            /**
             * Runs the minifier and saves the responding promise into a
             * constant with a combination of our default and the user
             * configuration. Our default keys can be overwritten by the
             * user.
             * @type {!Promise}
             */
            const minifyPromise = minify({
              ...configJsMinifyStatic,
              ...configJsMinify,
            });

            // Evaluates promise of node-minify process.
            minifyPromise.then(
              () => {
                // Displays a console message.
                showFileInfo(parameter.mode, filepath, 'write');
              },
              // On a minify error we will print it to the console and
              // proceed with the remaining files.
              (error) => showError(error)
            );
          });

          // We can easily resolve after iterating through all files 'cause
          // on a minify error we print the error to the console. Sometimes only
          // one file is corrupted so we can still minify the other ones.
          // That's why we don't reject the error.
          resolve();
        } catch (error) {
          // On a unpredictable we reject with the error message.
          reject(error);
        }
      });
    });
  }
}

minifyJs(); // Always run minifyJs on module execution.
