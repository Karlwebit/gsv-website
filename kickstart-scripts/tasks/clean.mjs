/**
 * Module with one standalone function 'clean' to clean the build directory.
 * @module clean
 * @exports clean
 * @requires config
 * @requires fast-glob
 * @requires fs
 * @requires minimist
 * @requires path
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import fastGlob from 'fast-glob'; // https://github.com/mrmlnc/fast-glob
import fs from 'fs'; // https://nodejs.org/api/fs.html
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html

// Self-written modules
import { config } from '../config.mjs';
import { showScriptInfo } from '../utility.mjs';


/**
 * Deletes the whole build directory. Whether the build directory exists or not,
 * at the end it's getting created.
 * @function clean
 * @public
 */
export function clean() {
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

  showScriptInfo(parameter.mode, 'clean', () => {
    return new Promise((resolve, reject) => {
      try {
        /** @type {string} */
        const pathBuild = config.dirBuild || parameter.dirBuild;

        // Removes the build directory if it's existing.
        if (fs.existsSync(pathBuild)) {
          // Gets all files of the build directory recursively.
          fastGlob.sync(['**/*'], {
            cwd: pathBuild,
            dot: true,
          }).forEach((fileEntry) => {
            fs.unlinkSync(path.join(pathBuild, `${fileEntry}`));
          });

          // Removes the build directory.
          fs.rmdirSync(pathBuild, { recursive: true });
        }

        // Creates a new build directory.
        fs.mkdirSync(pathBuild, {
          recursive : true,
        });

        // In the end we can resolve the promise.
        resolve();
      } catch (error) {
        // On a unpredictable we reject with the error message.
        reject(error);
      }
    });
  });
};

clean(); // Always run clean on module execution.
