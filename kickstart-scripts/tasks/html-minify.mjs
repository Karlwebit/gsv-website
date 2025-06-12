/**
 * Module with one standalone function 'minifyHtml' to minify all html files in
 * the build root directory.
 * @module html-minify
 * @exports minifyHtml
 * @requires @node-minify/core
 * @requires @node-minify/html-minifier
 * @requires config
 * @requires fs
 * @requires minimist
 * @requires path
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import fs from 'fs'; // https://nodejs.org/api/fs.html
import htmlMinifier from '@node-minify/html-minifier'; // https://github.com/kangax/html-minifier
import path from 'path'; // https://nodejs.org/api/path.html
import minify from '@node-minify/core'; // https://github.com/srod/node-minify
import minimist from 'minimist'; // https://github.com/substack/minimist

// Self-written modules
import { config } from '../config.mjs';
import { showError, showFileInfo, showScriptInfo } from '../utility.mjs';


/**
 * Iterates through the build root directory to minify all files via
 * node-minify/html-minifier.
 * @function minifyHtml
 * @public
 */
export function minifyHtml() {
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
    showScriptInfo(parameter.mode, 'minify-html', () => {
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
          const configMinifyHtml = config.build.html.htmlMinify || {};
          /** @type {!string} */
          const pathBuild = config.dirBuild || parameter.dirBuild;

          // Iterates through all files located at the build root directory.
          // The option 'encoding' ensure that we only receive the paths as
          // strings.
          fs.readdirSync(pathBuild, { encoding: 'utf8' }).forEach((file) => {

            // Checks if the current file is an html file.
            if (file.match(/\.html$/)) {
              /** @type {!string} */
              const filepath = path.join(pathBuild, file);
              /**
               * The static configuration for the external node-minify module.
               * We have to set the htmlMinifier module as compiler and we add
               * the input and output files to work correct.
               * @type {!Object}
               */
              const configNodeMinifyStatic = {
                compressor: htmlMinifier,
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
                  options: configMinifyHtml,
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

minifyHtml(); // Always run minifyHtml on module execution.
