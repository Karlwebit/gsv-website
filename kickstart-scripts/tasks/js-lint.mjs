/**
 * Module with one standalone function 'lintJs' to lint all js files in
 * the working app directory.
 * @module js-lint
 * @exports lintJs
 * @requires chalk
 * @requires config
 * @requires eslint
 * @requires minimist
 * @requires path
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import chalk from 'chalk'; // https://github.com/chalk/chalk
import ESLint from 'eslint'; // https://github.com/eslint/eslint
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html

// Self-written modules
import { config } from '../config.mjs';
import { showFileInfo, showScriptInfo } from '../utility.mjs';


/**
 * Iterates through the working app directory for js files to check their syntax
 * via eslint package.
 * @function lintJs
 * @public
 */
export function lintJs() {
  /**
   * Object containing the command line arguments passed when the Node.js
   * process was launched.
   * We are so careful that we set default values.
   * @see https://github.com/substack/minimist#var-argv--parseargsargs-opts
   * @type {!Object.<string, string>}
   */
  const parameter = minimist(process.argv.slice(2), {
    default: {
      dirWorking: './',
      mode: 'dev',
    },
  });

  if (parameter.mode !== 'prod') { // Don't execute linter in prod mode
    showScriptInfo(parameter.mode, 'js-lint', () => {
      return new Promise((resolve, reject) => {
        try {
          /**
           * The user configuration of the config.mjs.
           * @type {!Object}
           */
          const configEsLint = config.build.js.eslint || {};
          /**
           * The static configuration for the external eslint module.
           * We only set a default ECMA script version 'cause a configuration
           * is necessary.
           * @type {!Object}
           */
          const configEsLintStatic = {
            baseConfig: {
              parserOptions: {
                ecmaVersion: 5,
              },
            },
          };
          /** @type {!string} */
          const pathWorking = config.dirWorking || parameter.dirWorking;

          /**
           * Initialize a new ESLint instance with a combination of our default
           * and the user configuration. Our default keys can be overwritten by
           * the user.
           * @type {!ESLint}
           */
          const esLint = new ESLint.ESLint({
            ...configEsLintStatic,
            ...configEsLint,
          });

          // Displays a console message.
          console.info(chalk.white(`\tMaybe you have to run `) + chalk.magenta('npx eslint --init ') + chalk.white('first to use the detailed view and error auto-fixing.'));

          // Runs the linter. We lint all js files recursively in the working
          // components directory.
          esLint.lintFiles([
            path.join(pathWorking, 'components', '**', '*.js')
          ])
          .then((files) => {
            /** @type {!number} */
            let counterJsFiles = files.length;
            /** @type {!number} */
            let counter = 0;

            // Iterates through every file result.
            files.forEach((file) => {
              // Receives the relative path 'cause file.filePath contains the
              // full absolute path to the file.
              /** @type {!number} */
              const indexWorkingString =
                file.filePath.indexOf(path.join(pathWorking, 'components'));
              /** @type {!string} */
              const filepath = file.filePath.substring(indexWorkingString);

              // Displays a console message.
              showFileInfo(parameter.mode, filepath, 'proceed');

              // Displays the amount of (fixable) warning messages.
              console.info(chalk.white(`\n\tWarnings: `) + chalk.yellow(file.warningCount) + chalk.white(' | Fixable warnings: ') + chalk.yellow(file.fixableWarningCount));
              // Displays the amount of (fixable) error messages.
              console.info(chalk.white(`\tErrors: `) + chalk.red(file.errorCount) + chalk.white(' | Fixable errors:') + chalk.red(file.fixableErrorCount));

              // Displays the command to receive more information.
              console.info(chalk.white(`\n\tRun `) + chalk.magenta(`npx eslint "${filepath}"`) + chalk.white('for detailed information.'));

              // Adds an additional line break if another file output follows
              // the current one.
              if (++counter !== counterJsFiles) console.log('\n');
            });

            // If everything is fine we can resolve the promise.
            resolve();
          });
        } catch (error) {
          // On a unpredictable we reject with the error message.
          reject(error);
        }
      });
    });
  }
}

lintJs(); // Always run lintCss on module execution.
