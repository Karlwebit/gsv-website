/**
 * Module to watch the working directory and if files in it are changing start
 * the corresponding module. After build the livereload will be triggered to
 * refresh the web browser.
 * @module livereload
 * @requires child_process
 * @requires chokidar
 * @requires config
 * @requires fs
 * @requires livereload
 * @todo insert watch.add wildcards
 * @todo add additional extensions like json
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import child_process from 'child_process'; // https://nodejs.org/api/child_process.html
import chokidar from 'chokidar'; // https://github.com/paulmillr/chokidar
import fastGlob from 'fast-glob'; // https://github.com/mrmlnc/fast-glob
import fs from 'fs'; // https://nodejs.org/api/fs.html
import livereload from 'livereload'; // https://github.com/napcs/node-livereload

// Self-written modules
import { config, configWatch } from './config.mjs';
import { showWarning, showError, showFileInfo, recolorScriptInfo  } from './utility.mjs';


/**
 * Initialize livereload watcher (build directory)
 * @type {Object}
 */
const server = livereload.createServer();

/**
 * Starts the corresponding build module.
 * @param {!string} filepath - The path to the changed file
 */
const triggerNodeScript = (filepath) => {
  // Always run the statics task if the file lies in a deferred directory.
  if (filepath.includes('deferred')) {
    child_process.exec(
      `npm run build:statics`,
      (error, stdout, stderr) => {

      // If node couldn't execute the command we will show the error message.
      if (error) {
        showError(error);
        return;
      } else {
        server.refresh('build');
        if (stderr) showError(stderr);
      }

    });
  } else {
    /** @type {!string} */
    const extension = filepath.substring(filepath.lastIndexOf('.') + 1).toLowerCase();

    // Evaluate the extension of the changed file and start the corresponding.
    // build process
    Object.keys(configWatch).forEach((buildTask) => {

      /**
       * All extensions which trigger the build task.
       * @type {!Array<string>}
       */
      const correspondingExtensions = configWatch[buildTask];

      // If the changed file extension is part of the current corresponding
      // extension than execute it.
      if (correspondingExtensions.includes(extension)) {
        if (buildTask == 'js') {
          buildTask += ':watch'
        }

        child_process.exec(
          `npm run build:${buildTask}`,
          (error, stdout, stderr) => {

          // If node couldn't execute the command we will show the error message.
          if (error) {
            showError(error);
            return;
          } else {
            server.refresh('build');
            if (stderr) showError(stderr);
          }
        });
      }
    });
  }

  showFileInfo('dev', filepath, 'change');
};

try {
  /**
   * @type {!string}
   * @const
   */
  const PATH_BUILD = config.dirBuild || 'build';

  // Run whole initial build process in development mode if there isn't a build
  // directory to prevent errors.
  if (!fs.existsSync(PATH_BUILD)) {
    showWarning(`There is no ${PATH_BUILD} directory. Let me just run an initial 'npm run build:dev' for you.`);
    child_process.exec('npm run build:dev', (error, stdout, stderr) => {

      // If node couldn't execute the command we will show the error message.
      if (error) {
        showError(error.message);
        return;
      } else { // Display the *entire* stdout and stderr (buffered) if available.
        if (stdout) console.log(recolorScriptInfo(stdout));
        if (stderr) showError(stderr);
      }

    });
  }

  /**
   * File paths to watch.
   * @type {Array<string>}
   */
  const watchFiles = []

  /**
   * Unique set of extensions to watch, according to the watch config.
   * @type {Set<string>}
   */
  const extensionsToWatch = new Set();

  Object.values(configWatch).forEach((extensionsPerTask) => {
    extensionsPerTask.forEach((extension) => {
      extensionsToWatch.add(extension);
    })
  });

  extensionsToWatch.forEach((extension) => {
    watchFiles.push(`./*.${extension}`) // files directly inside root directory, not inside its subdirectories
    watchFiles.push(`./components/**/*.${extension}`) // files directly inside components directory and inside subdirectories
  });

  /**
   * Initialize chokidar watcher on our development files.
   * @type {Object}
   */
  const watcher = chokidar.watch(await fastGlob(watchFiles));

  // Add event listeners to file changes trigger the corresponding build process.
  watcher.on('change', (filepath) => triggerNodeScript(filepath));

  console.log('Tell me a story.. I will sit here and listen.');
} catch (error) {
  showError(error);
}
