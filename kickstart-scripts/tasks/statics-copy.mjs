/**
 * Module with one standalone function 'copyStatics' to search recursively for
 * files with the given file extensions and copy them into the configured
 * build directory.
 * @module copy-statics
 * @exports copyStatics
 * @requires config
 * @requires fast-glob
 * @requires fs
 * @requires minimist
 * @requires path
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 * @author Stephan Friedrich (frontend@webit.de)
 */

// External modules
import fastGlob from 'fast-glob'; // https://github.com/mrmlnc/fast-glob
import fs from 'fs'; // https://nodejs.org/api/fs.html
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html

// Self-written modules
import { config } from '../config.mjs';
import {
  showError,
  showFileInfo,
  showScriptInfo,
  showWarning,
} from '../utility.mjs';


/**
 * Wrapper for executing a recursive function to copy statics into the build
 * directory.
 * @function copyStatics
 * @public
 */
export function copyStatics() {
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

  showScriptInfo(parameter.mode, 'statics-copy', () => {
    return new Promise((resolve, reject) => {
      try {
        /**
         * The user configuration of the config.mjs.
         * @type {!Object}
         */
        const copyConfig = config.build.statics.copy || {};
        /** @type {string} */
        const pathBuild = config.dirBuild || parameter.dirBuild;
        /** @type {!string} */
        const pathWorking = config.dirWorking || parameter.dirWorking;

        // Only proceed if we received an user configuration.
        if (Object.keys(copyConfig).length) {
          /** @type {!Array<string>} */
          const forbiddenChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(',
          ')', '+', '=', '[', ']', '{', '}', ';', '\'', ':', '"', '|', ',', '<',
          '>', '?', ' '];

          Object.values(copyConfig).forEach((copyEntry) => {
            /** @type {!Object} */
            const copyEntryOptions = copyEntry.options || {};
            /** @type {!string|Array<string>} */
            const copyEntryMode = copyEntryOptions.mode || ['dev', 'prod'];

            if (parameter.mode === copyEntryMode
                || copyEntryMode.includes(parameter.mode)) {
              /** @type {!string} */
              const copyEntrySourceDir =
                copyEntryOptions.sourceDir || pathWorking;
              /** @type {!string} */
              const copyEntryDestinationDir =
                copyEntryOptions.destinationDir || pathBuild;
              /** @type {!boolean} */
              let copyEntryFlatten = true;
              /** @type {!Array<string>} */
              const copyEntryFiles = copyEntry.files || ['*'];
              /**
               * The user configuration of the config.mjs.
               * @type {!Object}
               */
              const configFastGlob = copyEntryOptions.fastGlob || {};
              /**
               * The static configuration for the external fast-glob module.
               * @type {!Object}
               * @see https://github.com/mrmlnc/fast-glob#options-3
               */
              const configFastGlobStatic = {
                cwd: copyEntrySourceDir,
              };

              // Checks if the flatten option is set in the configuration.
              // Otherwise we use  the default value.
              // Hint: It's not possible to use the shorthand variation 'cause
              // it the user sets the option to false, we always receive true
              // as the new default value.
              if ('flatten' in copyEntryOptions
                  && typeof copyEntryOptions.flatten === 'boolean') {
                    copyEntryFlatten = copyEntryOptions.flatten;
              }

              // Gets all files of the working directory recursively.
              /** @type {!Array<EntryItem>} */
              const fileEntries = fastGlob.sync(copyEntryFiles, {
                ...configFastGlob,
                ...configFastGlobStatic,
              });

              // Iterate through all founded files and copy them depending on
              // the flatten option.
              fileEntries.forEach((fileEntry) => {
                /** @type {!string} */
                const sourceFilePath =
                  path.join(copyEntrySourceDir, `${fileEntry}`);
                /** @type {!string} */
                let destinationFilePath =
                  path.join(copyEntryDestinationDir, `${fileEntry}`);
                /** @type {!string} */
                let destinationDirPath = copyEntryDestinationDir;

                if (copyEntryFlatten) {
                  // If the flatten option is set to true we concatenate the
                  // destination directory with the filename. To receive the
                  // filename we split the filepath on its separator character
                  // and catch the last entry with Array.pop().
                  destinationFilePath = path.join(
                    copyEntryDestinationDir,
                    `${fileEntry}`.split('/').pop()
                  );
                } else {
                  // Otherwise we have to set the new helper destination
                  // directory entry to create the new dir.
                  /** @type {!Array<string>} */
                  let destinationDirPathHelper = `${fileEntry}`.split('/');

                  destinationDirPathHelper.pop();
                  destinationDirPath = path.join(
                    copyEntryDestinationDir,
                    destinationDirPathHelper.join('/')
                  );
                }

                // Create the new destination filepath.
                if (!fs.existsSync(destinationDirPath)) {
                  fs.mkdirSync(destinationDirPath, { recursive: true });
                }

                // Copy the file to its destination.
                fs.copyFileSync(sourceFilePath, destinationFilePath);

                // Just display a log message.
                showFileInfo(
                  parameter.mode,
                  sourceFilePath,
                  'writeto',
                  destinationFilePath
                );

                // Show a warning if the destination filepath contains forbidden
                // characters.
                for (const forbiddenChar of forbiddenChars) {
                  if (`${fileEntry}`.includes(forbiddenChar)) {
                    showWarning(`This filepath contains forbidden characters for some file systems. Please take a look.`);
                    break;
                  }
                }
              });
            }
          });

          // We can easily resolve after iterating through all files 'cause
          // on a error we print the error to the console. Sometimes only one
          // file is corrupted so we can still copy the other ones.
          // That's why we don't reject the error.
          resolve();
        } else {
          // Shows a warning if the user configuration is missing.
          showWarning(`No configuration found. No files were copied.`);
        }
      } catch (error) {
        // On a unpredictable we reject with the error message.
        reject(error);
      }
    });
  });
}

copyStatics(); // Always run copyStatics on module execution.
