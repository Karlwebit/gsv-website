/**
 * Module with one standalone function 'minifyCss' to minify all css files in
 * the build directory.
 * @module css-minify
 * @exports minifyCss
 * @requires @node-minify/clean-css
 * @requires @node-minify/core
 * @requires config
 * @requires fs
 * @requires minimist
 * @requires path
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import cleanCss from '@node-minify/clean-css'; // https://github.com/jakubpawlowicz/clean-css
import fs from 'fs'; // https://nodejs.org/api/fs.html
import path from 'path'; // https://nodejs.org/api/path.html
import minify from '@node-minify/core'; // https://github.com/srod/node-minify
import minimist from 'minimist'; // https://github.com/substack/minimist

// Self-written modules
import { config } from '../config.mjs';
import { showError, showFileInfo, showScriptInfo } from '../utility.mjs';


/**
 * Iterates through the build directory and its assets/css folder to minify all
 * files via node-minify/clean-css.
 * @function minifyCss
 * @public
 */
export function minifyCss() {
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
    showScriptInfo(parameter.mode, 'css-minify', () => {
      return new Promise((resolve, reject) => {
        try {
          /**
           * The user configuration of the config.mjs.
           * @type {!Object}
           */
          const configNodeMinify = config.build.css.nodeMinify || {};
          /**
           * The user configuration of the config.mjs.
           * @type {!Object}
           */
          const configCleanCss = config.build.css.cleanCss || {};
          /** @type {!string} */
          const pathBuild = config.dirBuild || parameter.dirBuild;
          /** @type {!Array<string>} */
          let pathAssetsCss = config.dirAssetsCss;

          // Adds the build path in front of the css assets path.
          pathAssetsCss.unshift(pathBuild);

          /** @type {!string} */
          const pathBuildCss = path.join.apply(this, pathAssetsCss);

          // Iterates through all files located at the root assets css directory
          // at the build directory. The option 'encoding' ensure that we only
          // receive the paths as strings.
          fs.readdirSync(pathBuildCss, { encoding: 'utf8' })
            .forEach((file) => {

              // Checks if the current file is a css file.
              if (file.match(/\.css$/)) {
                /** @type {!string} */
                const filepath = path.join(pathBuildCss, file);
                /**
                 * The static configuration for the external node-minify module.
                 * We have to set the cleanCss module as compiler and we add the
                 * input and output files to work correct.
                 * @type {!Object}
                 * @see https://github.com/srod/node-minify#quick-start
                 */
                const configNodeMinifyStatic = {
                  compressor: cleanCss,
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
                  ...configNodeMinifyStatic,
                  ...configNodeMinify,
                  ...{
                    options: configCleanCss,
                  }
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
              }
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

minifyCss(); // Always run minifyCss on module execution.
