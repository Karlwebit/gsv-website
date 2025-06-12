/**
 * Module with multiple helper functions.
 * @module utility
 * @exports getDirectories
 * @exports getDirectoriesRecursive
 * @exports getSshAuthorizationData
 * @exports isDirectory
 * @exports isDocker
 * @exports isWsl
 * @exports replacePlaceholder
 * @exports showError
 * @exports showWarning
 * @exports recolorScriptInfo
 * @requires chalk
 * @requires config
 * @requires config-client
 * @requires fs
 * @requires os
 * @requires path
 * @author Martin Hubrich (frontend@webit.de)
 * @author Stephan Friedrich (frontend@webit.de)
 * @author Rodger Rüdiger (frontend@webit.de)
 */

// External modules
import chalk from 'chalk'; // https://github.com/chalk/chalk
import fs from 'fs'; // https://nodejs.org/api/fs.html
import os from 'os'; // https://nodejs.org/api/os.html
import path from 'path'; // https://nodejs.org/api/path.html

// Self-written modules
import { config, configConsole } from './config.mjs';

/** @type {!string} */
const messageStartTask = '>>> Running task';
/** @type {!string} */
const messageEndTask = '<<< Finished task';
/** @type {!string} */
const messageAbortTask = '>>> Aborting task';

/**
 * Short function to receive all directories of a source.
 * @function getDirectories
 * @public
 * @param {!string} source - The path to a directory
 * @return {!Array<string>}
 */
export function getDirectories(source) {
  return fs.readdirSync(source, { encoding: 'utf8' })
    .map((name) => path.join(source, name))
    .filter(isDirectory);
};

/**
 * Get all directories recursively of a given starting point.
 * @function getDirectoriesRecursive
 * @public
 * @param {!string} source - The path to a directory
 * @return {!Array<string>}
 *
 */
export function getDirectoriesRecursive(source) {
  return [
    source,
    ...getDirectories(source)
    .map(getDirectoriesRecursive)
    .reduce((accumulator, current_Value) =>
      accumulator.concat(current_Value), [])
  ];
};

/**
 * Returns the local SSH key and if available the passphrase. It will search in
 * the home directory. If you are on Windows and if you use WSL terminal you
 * should link or copy the key into /home/[username]/*. Different paths or
 * passphrases could be configured in the config-client.mjs file.
 * @function getSshAuthorizationData
 * @public
 * @author Martin Hubrich (frontend@webit.de)
 * @author Stephan Friedrich (frontend@webit.de)
 * @return {Promise}
 */
export function getSshAuthorizationData() {
  return new Promise((resolve, reject) => {
    /** @type {string} */
    const DIR_USERHOME = os.homedir();

    /** @type {Function} */
    const getDefaultSshKey = () => {
      /** @type {!string} */
      const defaultSshKeyFile = path.join(DIR_USERHOME, '.ssh', 'id_rsa');

      return (fs.existsSync(defaultSshKeyFile)) ? defaultSshKeyFile : '';
    };

    /** @type {!Object} */
    let sshAuthorizationData = {
      /** @type {!string} */
      pathSshKey: '',
      /** @type {!string} */
      passphrase: '',
    }

    import('./config-client.mjs')
      .then((module) => {
        // Get SSH key
        if (module.configClient.privateKeyFileWithinHomeDirRoot) {
          sshAuthorizationData.pathSshKey =
            os.homedir() + module.configClient.privateKeyFileWithinHomeDirRoot
              .replace(/\/|\\/g, path.sep);
        } else {
          sshAuthorizationData.pathSshKey = getDefaultSshKey();
        }

        // Get passphrase
        if (module.configClient.passphrase) {
          sshAuthorizationData.passphrase = module.configClient.passphrase;
        }

        resolve(sshAuthorizationData);
      })
      .catch(() => {
        // Get default SSH key
        sshAuthorizationData.pathSshKey = getDefaultSshKey();

        resolve(sshAuthorizationData);
      });
  });
};

/**
 * Checks for a .dockerenv file to determine if the current environment relates
 * to Docker.
 * @function hasDockerEnv
 * @public
 * @return {boolean}
 */
function hasDockerEnv() {
	try {
		fs.statSync('/.dockerenv');
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Checks for control groups on Linux.
 * @function hasDockerCGroup
 * @public
 * @return {boolean}
 */
function hasDockerCGroup() {
	try {
		return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
	} catch (error) {
		return false;
	}
}

/**
 * Short function to test if the given source is a directory.
 * @function isDirectory
 * @public
 * @param {!string} source - The path to a file or directory
 * @return {boolean}
 */
export function isDirectory(source) {
  return fs.lstatSync(source).isDirectory();
};

/**
 * Checks if the current shell relates to the platform Docker.
 * @function isDocker
 * @public
 * @return {boolean}
 * @see https://github.com/sindresorhus/is-docker
 */
export function isDocker() {
  return hasDockerEnv() || hasDockerCGroup();
};

/**
 * Checks if the current shell is a WSL (Windows Subsystem for Linux).
 * @function isWsl
 * @public
 * @return {boolean}
 * @see https://github.com/sindresorhus/is-wsl
 */
export function isWsl() {
  // If the current platform is Linux, it can't be Windows.. Right?
  if (process.platform !== 'linux') {
		return false;
	}

  // If we are in WSL, the release contains the string 'Microsoft' like
  // '4.4.0-18362-Microsoft'.
	if (os.release().toLowerCase().includes('microsoft')) {
    // Check again against Docker.
		if (isDocker()) {
			return false;
		}

		return true;
	}

	try {
    // This file specifies the version of the Linux kernel, the version of gcc
    // used to compile the kernel, and the time of kernel compilation.
    // This file contains the string 'Microsoft' again if we use WSL.
    // After this check again against Docker.
    return fs.readFileSync('/proc/version', 'utf8')
      .toLowerCase().includes('microsoft') ? !isDocker() : false;
	} catch (error) {
		return false;
	}
};

/**
 * Replace recursive by a directory and file extension.
 * @function replacePlaceholder
 * @public
 * @author Stephan Friedrich (frontend@webit.de)
 * @author Martin Hubrich (frontend@webit.de)
 * @param {string} content - The text which includes {placeholders}
 * @return {string}
 */
export function replacePlaceholder(content) {
  return content.replace(
    new RegExp('{(app|deferred|svg):{([\\w|\\-]{0,})}}|{(app|deferred|svg):{(.+):{(.+)}}}',
    'g'
  ), (string) => {

    try {

      /**
       * The filepath parts
       * @type {Array<string>}
       */
      let match = string.replace(new RegExp('(\{|\})*', 'g'), '').split(':');

      /** @type {string} */
      let type = match[0];

      /** @type {boolean} */
      const isSvg = type === 'svg' ? true : false;

      /** @type {string} */
      const extension = isSvg ? '.svg' : '.html';

      /** @type {string} */
      const folder = match[1];

      /** @type {string} */
      const file = match.length > 2 ? match[2] : folder;

      /**
       * Ending comment string for includs
       * @type {string}
       */
      let end = '';

      /**
       * The whole filepath to the replacing file
       * @type {string}
       */
      let filepath = '';

      /**
       * Starting comment string for includs
       * @type {string}
       */
      let start = '';

      // Add app folder to deferred component
      type = type !== 'app' ? 'app/_' + type : type;

      // Set path to folder
      filepath = path.join('components', type, folder, file + extension);

      // If the replacing file is a svg insert the filepath comment
      if (isSvg) {
        start = '<!-- START ' + filepath + ' -->\n';
        end = '<!-- END ' + filepath + ' -->\n';
      }

      if (fs.existsSync(filepath)) {

        /**
         * Receive the replace file content. The option 'encoding' ensure that
         * we receive the content as string.
         * @type {!string}
         */
        let fileContent = fs.readFileSync(filepath, { encoding: 'utf8' });

        // Add the start and end comment
        fileContent = start + fileContent + end;

        // Return file content
        return replacePlaceholder(fileContent);
      }

      return string; // Return the replaced content

    } catch (error) {
      showError(error); // Catch a unpredictable error
    }

    return string;
  });
};

/**
 * Displays an error – That's all! Really.
 * @function showError
 * @public
 * @author Martin Hubrich (frontend@webit.de)
 * @author Stephan Friedrich (frontend@webit.de)
 * @param {!string} errorMessage - The message to display as error
 */
export function showError(errorMessage) {
  console.error(chalk.bgBlack.red(`\t${errorMessage}`));
};

/**
 * A small function to display the current file which gets proceeded.
 * @function showFileInfo
 * @public
 * @author Stephan Friedrich (frontend@webit.de)
 * @author Martin Hubrich (frontend@webit.de)
 * @param {string} mode - Receive the mode in which the current operation is
 *     running (dev|prod)
 * @param {string} filepath - The filepath to the proceeded file
 * @param {string=} operation - The current operation affecting the file
 * @param {string=} destFilepath - destination path to write the file
 */
export function showFileInfo(mode, filepath, operation = '',
    destFilepath = '') {

  if (!configConsole[mode].quiet && configConsole[mode].verbose) {

    /** @type {!string} */
    let textLog = '';

    // Display the filepath of the proceeded file depending of the
    // current operation
    switch (operation) {
      case 'message':
        textLog = chalk.white(`\t+++ ${filepath}`);
        break;
      case 'proceed':
        textLog = chalk.white(`\tProceed file `) + chalk.cyan(filepath);
        break;
      case 'copy':
        textLog = chalk.white(`\tCopy file to `) + chalk.cyan(filepath);
        break;
      case 'writeto':
        textLog = chalk.white(`\tWrite `) + chalk.cyan(filepath) +chalk.white('\u2192') + chalk.cyan(destFilepath);
        break;
      case 'write':
        textLog = chalk.white(`\tWrite file to `) + chalk.cyan(filepath);
        break;
      case 'sourcemap':
        textLog = chalk.white(`\tSourcemap generated to `) + chalk.cyan(filepath);
        break;
      case 'change':
        textLog = chalk.white(`\tFile changed: `) + chalk.cyan(filepath);
        break;
      default:
        textLog = chalk.white(`\tDid something with `) + chalk.cyan(filepath);
    }

    console.info(textLog);
  }
};

/**
 * Displays i.e. the run-time of an operation in milliseconds and some other
 * additional information while running a script.
 * @function showScriptInfo
 * @public
 * @author Martin Hubrich (frontend@webit.de)
 * @author Stephan Friedrich (frontend@webit.de)
 * @param {string} mode - Receive the mode in which the current operation is
 *     running (dev|prod)
 * @param {string} functionName - The name of the running operation
 * @param {Function} functionInstance - The function which time needs to
 *     get tracked
 */
export function showScriptInfo(mode, functionName, functionInstance) {
  /** @type {!string} */
  let textLog = '';

  /**
   * Initiation of the process start time.
   * @type {!number|Array<number>}
   */
  let processTimeStart = 0;

  /**
   * Initiation of the process end time.
   * @type {!number|Array<number>}
   */
  let processTimeEnd = 0;

  if (
    !configConsole[mode].quiet
    && configConsole[mode].verbose
  ) {
    // Set and start a timer instance.
    processTimeStart = process.hrtime();
  }

  // Display operation start with function name.
  if (configConsole[mode].quiet) {
    textLog = chalk.green(`{.${functionName}}`);
  } else {
    textLog = chalk.green.underline(`\n${messageStartTask} "${functionName}":`);
    configConsole[mode].verbose && (textLog += '\n');
  }

  console.info(textLog);

  // Call the committed function.
  functionInstance.call({}).then(() => {
    if (!configConsole[mode].quiet) {
      // Display operation end with function name.
      textLog = chalk.green.underline(`\n${messageEndTask} "${functionName}"`);

      if (configConsole[mode].verbose) {
        // Get the past time of the timer instance.
        processTimeEnd = process.hrtime(processTimeStart);

        // Display the past time at the console using node chalk to color
        // it nicely.
        textLog +=
          chalk.white(` in ${Math.round(processTimeEnd[1] / 1000000)}ms.\n`);
      }

      console.info(textLog);
    }
  }, (error) => {
    if (!configConsole[mode].quiet) {
      showError(`\n${messageAbortTask} "${functionName}" because of: ${error.message}`)
    }
  });
};

/**
 * Displays a warning like the error function.
 * @function showWarning
 * @public
 * @author Martin Hubrich (frontend@webit.de)
 * @author Stephan Friedrich (frontend@webit.de)
 * @param {!string} warningMessage - The message to display as warning
 */
export function showWarning(warningMessage) {
  console.warn(chalk.bgBlack.yellow(`\t${warningMessage}`));
};

/**
 * Adds colors to a given message to create an output similar to the output of the function showScriptInfo.
 * Especially adjusted to match the strings used in showScriptInfo.
 * @function recolorScriptInfo
 * @public
 * @author Sally Busch (frontend@webit.de)
 * @param {string} message - The message to recolor
 * @returns {string}
 */
export function recolorScriptInfo (message) {
  if (!message) return '';

  const newLineDelimiter = '\n';
  let lines = message.split(newLineDelimiter);

  lines = lines.map((line) => {
    if (line.startsWith(messageStartTask) || line.startsWith(messageEndTask)) {
      return chalk.green.underline(line);
    }

    if (line.startsWith(messageAbortTask)) {
      return chalk.red(line);
    }

    return line;
  });

  return lines.join(newLineDelimiter);
}
