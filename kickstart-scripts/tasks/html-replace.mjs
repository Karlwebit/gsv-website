/**
 * Module with one standalone function 'replaceHtml' to replace all curly
 * bracket placeholders in html files in the build root directory.
 * @module html-replace
 * @exports replaceHtml
 * @requires config
 * @requires fs
 * @requires minimist
 * @requires path
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import fs from 'fs'; // https://nodejs.org/api/fs.html
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html

// Self-written modules
import { config } from '../config.mjs';
import {
  replacePlaceholder,
  showFileInfo,
  showScriptInfo,
} from '../utility.mjs';


/**
 * Copies html files into the build directory and replaces their placeholders.
 * @function replaceHtml
 * @public
 */
export function replaceHtml() {
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

  showScriptInfo(parameter.mode, 'html-replace', () => {
    return new Promise((resolve, reject) => {
      try {
        /** @type {!string} */
        const pathBuild = config.dirBuild || parameter.dirBuild;
        /** @type {!string} */
        const pathWorking = config.dirWorking || parameter.dirWorking;

        // Iterates through all files located at the working root directory.
        // The option 'encoding' ensure that we only receive the paths as
        // strings.
        fs.readdirSync(pathWorking, { encoding: 'utf8' }).forEach((file) => {

          // Checks if the current file is an html file.
          if (file.match(/\.html$/)) {
            /** @type {!string} */
            const fileSource = path.join(pathWorking, file);
            /** @type {!string} */
            const fileDestination = path.join(pathBuild, file);
            /**
             * The html code of the current file. The option 'encoding'
             * ensure that we receive the content as string.
             * @type {!string}
             */
            let htmlCode = fs.readFileSync(fileSource, { encoding: 'utf8' });

            // Replaces placeholders with a self-written placeholder function.
            htmlCode = replacePlaceholder(htmlCode);

            // Displays a console message.
            showFileInfo(parameter.mode, fileSource, 'writeto', fileDestination);

            // Writes the new html code into the new file located at the build
            // directory.
            fs.writeFileSync(fileDestination, htmlCode.toString());
          }
        });

        // After copying every file we can resolve the promise.
        resolve();
      } catch (error) {
        // On a unpredictable we reject with the error message.
        reject(error);
      }
    });
  });
}

replaceHtml(); // Always run replaceHtml on module execution.
