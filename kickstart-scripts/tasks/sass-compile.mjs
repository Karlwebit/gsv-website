/**
 * Module with one standalone function 'compileSass' to compile every sass file
 * of the working directory to css and copy them to the build directory.
 * @module sass-compile
 * @exports compileSass
 * @requires config
 * @requires fs
 * @requires minimist
 * @requires path
 * @requires sass
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import fs from 'fs'; // https://nodejs.org/api/fs.html
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html
import * as sass from 'sass'; // https://github.com/sass/sass

// Self-written modules
import { config } from '../config.mjs';
import {
  isWsl,
  showError,
  showFileInfo,
  showScriptInfo
} from '../utility.mjs';


/**
 * Iterates through every scss file at the app/components directory and compiles
 * it into css.
 * @function compileSass
 * @public
 */
export function compileSass() {
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

  showScriptInfo(parameter.mode, 'sass-compile', () => {
    return new Promise((resolve, reject) => {
      try {
        /**
         * The user configuration of the config.mjs.
         * @type {!Object}
         */
        const configSass = config.build.css.sass || {};
        /** @type {!string} */
        const pathBuild = config.dirBuild || parameter.dirBuild;
        /** @type {!Array<string>} */
        let pathAssetsCss = config.dirAssetsCss;

        // Adds the build path in front of the js assets path.
        pathAssetsCss.unshift(pathBuild);

        /** @type {!string} */
        const pathBuildCss = path.join.apply(this, pathAssetsCss);

        // Loads excluded-file list array.
        /** @type {!RegExp|boolean} */
        let fileExcludeRegex = false;

        if (
          configSass.files_exclude &&
          Array.isArray(configSass.files_exclude) &&
          configSass.files_exclude.length > 0
        ) {
          fileExcludeRegex =
            new RegExp('(' + configSass.files_exclude.join('|') + ')$', 'g');
        }

        // Creates the css assets directory.
        fs.mkdirSync(pathBuildCss, {
          recursive: true,
        });

        /**
         * Contains all files located at the components directory at the
         * working directory. The option 'encoding' ensure that we only receive
         * the paths as strings.
         * @type {!Array<string>}
         */
        let componentsFiles =
          fs.readdirSync('components', { encoding: 'utf8' });

        /**
         * Compresses incremental every scss file via sass compiler.
         * @function compileEachScssFile
         * @param {!string} file - Path to the file to potentially compile
         */
        function compileEachScssFile(file) {
          if (file) {
            /** @type {!boolean} */
            const excludeThisFile =
              fileExcludeRegex ? (file.search(fileExcludeRegex) >= 0) : false;
            /** @type {!boolean} */
            const hasFileCorrectExtension = file.search(/\.scss$/) >= 0;

            // Proceed only files which are .scss files and are not described
            // within files_exclude.
            if (hasFileCorrectExtension && !excludeThisFile) {
              /**
               * The new output css filename.
               * @type {!string}
               */
              const filename = file.replace('scss', 'css');
              /** @type {!string} */
              const filepath = path.join(pathBuildCss, filename);
              /**
               * The static configuration for the external sass module.
               * @type {!Object}
               */
              const configSassStatic = {
                  file: path.join('components', file),
                  outFile: filepath,
                  outputStyle: 'expanded',
                  sourceMap: parameter.mode === 'dev' ? true : false,
                };

              /**
               * Runs the sass rendering with a combination of our default and
               * the user configuration and saves the result into a constant.
               * Our default keys can be overwritten by the user.
               * @type {Object}
               */
              const sassResult = sass.renderSync({
                ...configSassStatic,
                ...configSass,
              });

              // Checks if the compiler returned css as expected.
              if (sassResult.css) {

                // Write the sass compiled css file into the css assets
                // directory.
                fs.writeFileSync(filepath, sassResult.css.toString());

                showFileInfo(parameter.mode, file, 'writeto', filepath);

                // Writes a map file if we use development mode.
                if (parameter.mode === 'dev') {
                  /** @type {!string} */
                  let sourceMapContent = sassResult.map.toString();

                  // If we are running the build process under WSL, we have to
                  // manipulate the source path. Please take a look at #69771
                  // for more information.
                  if (isWsl()) {
                    /** @type {!string} */
                    const dirCurrentProcess = process.cwd();
                    /** @type {!RegExp} */
                    const receiveMountedHardDriveRegex = /^\/mnt\/(.*?)\//;
                    /** @type {!string} */
                    const dirCurrentProcessMountedHardDriveRegexMatch = dirCurrentProcess.match(receiveMountedHardDriveRegex);

                    if (dirCurrentProcessMountedHardDriveRegexMatch) {
                      /** @type {!string} */
                      const mountedHardDrive =
                      dirCurrentProcessMountedHardDriveRegexMatch[1];

                      sourceMapContent = sourceMapContent.replaceAll(/\/mnt\/(.*?)\//g, `/${mountedHardDrive.toUpperCase()}:/`);
                    }
                  }

                  fs.writeFileSync(filepath + '.map', sourceMapContent);

                  // Displays a console message.
                  showFileInfo(parameter.mode, filepath + '.map', 'sourcemap');
                }
              } else {
                // Shows an error message if we didn't get an expected result.
                showError(`Something went wrong with ${path.join('components', file)}.`);
              }

              // If the sass render process finished for the current file we
              // can proceed with the next one.
              compileEachScssFile(componentsFiles.pop());
            } else {
              // If no file matches, go to next file.
              compileEachScssFile(componentsFiles.pop());
            }
          } else {
            // Triggers end with last function call (where file === undefined).
          }
        };
        // Starts scss compile process.
        compileEachScssFile(componentsFiles.pop());

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

compileSass(); // Always run compileSass on module execution.
