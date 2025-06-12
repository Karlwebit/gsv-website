/**
 * Module with one standalone function 'compilePostCss' to compile every css
 * file located at the build directory with the PostCss compiles. This allows us
 * to use plugins like the autoprefixer.
 * @module postcss-compile
 * @exports compilePostCss
 * @requires autoprefixer
 * @requires config
 * @requires fs
 * @requires minimist
 * @requires path
 * @requires postcss
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import autoprefixer from 'autoprefixer'; // https://github.com/postcss/autoprefixer
import fs from 'fs'; // https://nodejs.org/api/fs.html
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html
import postCss from 'postcss'; // https://github.com/postcss/postcss

// Self-written modules
import { config } from '../config.mjs';
import { showError, showFileInfo, showScriptInfo } from '../utility.mjs';


/**
 * Iterates through every css file at the build directory and compiles it via
 * PostCss.
 * @function compilePostCss
 * @public
 */
export function compilePostCss() {
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

  showScriptInfo(parameter.mode, 'postcss-compile', () => {
    return new Promise((resolve, reject) => {
      try {
        /**
         * The user configuration of the config.mjs.
         * @type {!Object}
         */
        const configPostCss = config.build.css.postcss || {};
        /** @type {!string} */
        const pathBuild = config.dirBuild || parameter.dirBuild;
        /** @type {!Array<string>} */
        let pathAssetsCss = config.dirAssetsCss;

        // Adds the build path in front of the css assets path.
        pathAssetsCss.unshift(pathBuild);

        /** @type {!string} */
        const pathBuildCss = path.join.apply(this, pathAssetsCss);

        // Iterates through all files located at the assets css directory at the
        // build directory. The option 'encoding' ensure that we only receive
        // the paths as strings.
        fs.readdirSync(pathBuildCss, { encoding: 'utf8' })
          .forEach((file) => {

            // Checks if the current file is a css file.
            if (file.match(/\.css$/)) {
              /** @type {!string} */
              const filepath = path.join(pathBuildCss, file);
              /**
               * The static configuration for the external postcss module.
               * We only refer the source and destination files.
               * @type {!Object}
               */
              const configPostCssStatic = {
                from: filepath,
                to: filepath,
              };

              // Displays a console message.
              showFileInfo(parameter.mode, filepath, 'proceed');

              /**
               * The css code of the current file. The option 'encoding' ensure
               * that we receive the content as string.
               * @type {!string}
               */
              const cssCode = fs.readFileSync(filepath, { encoding: 'utf8' });

              /**
               * Processes the compiler and saves the responding promise into a
               * constant with a combination of our default and the user
               * configuration. Our default keys can be overwritten by the
               * user.
               * @type {!LazyResult}
               */
              const postCssPromise = postCss([autoprefixer]).process(
                cssCode,
                {
                  ...configPostCssStatic,
                  ...configPostCss,
                }
              );

              // Evaluates promise of imagemin process.
              postCssPromise.then(
                (result) => {
                  // Writes the compiled code into the current file.
                  fs.writeFileSync(filepath, result.css.toString());
                },
                // On a error we will print it to the console and proceed with
                // the remaining files.
                (error) => showError(error)
              );
            }
          });

        // We can easily resolve after iterating through all files 'cause
        // on a error we print the error to the console. Sometimes only one
        // file is corrupted so we can still minify the other ones.
        // That's why we don't reject the error.
        resolve();
      } catch (error) {
        // On a unpredictable we reject with the error message.
        reject(error);
      }
    });
  });
}

compilePostCss(); // Always run compilePostCss on module execution.
