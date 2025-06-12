/**
 * Module with one standalone function 'validateHtml' to validate all html files
 * in the build root directory.
 * @module html-validate
 * @exports validateHtml
 * @requires chalk
 * @requires config
 * @requires fs
 * @requires minimist
 * @requires node-fetch
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import chalk from 'chalk'; // https://github.com/chalk/chalk
import fs from 'fs'; // https://nodejs.org/api/fs.html
import htmlValidator from 'html-validator'; // https://github.com/zrrrzzt/html-validator
import minimist from 'minimist'; // https://github.com/substack/minimist
import nodeFetch from 'node-fetch'; // https://github.com/node-fetch/node-fetch

// Self-written modules
import { config } from '../config.mjs';
import {
  showError,
  showFileInfo,
  showScriptInfo,
  showWarning
} from '../utility.mjs';


/**
 * Iterates through the build root directory to validate all files via
 * html-validator.
 * @function validateHtml
 * @public
 */
export function validateHtml() {
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

  if (parameter.mode !== 'prod') { // Don't execute validator in prod mode.
    showScriptInfo(parameter.mode, 'validate-html', () => {
      return new Promise((resolve, reject) => {
        try {
          import('../config-client.mjs').then((module) => {
            if (module.configClient.localDevelopmentUrl) {
              /**
               * The user configuration of the config.mjs.
               * @type {!Object}
               */
              const configHtmlValidator = config.build.html.htmlValidator || {};
              /** @type {!string} */
              const pathBuild = config.dirBuild || parameter.dirBuild;
              /** @type {!string} */
              const localDevelopmentUrl =
                module.configClient.localDevelopmentUrl;

              /**
               * A collector for all validation results 'cause they all run
               * asynchronously.
               * @type {!Array<Promise>}
               */
              let htmlValidatorResults = [];
              /** @type {!Array<string>} */
              let files = [];
              /** @type {!Array<string>} */
              let filesHtml = [];
              /** @type {!boolean} */
              let detailedOutput = false;

              // If a file path was specified, add it to the list of files to
              // check. Otherwise validate all files located at the build root
              // directory. The option 'encoding' ensured that we only receive
              // the paths as strings.
              if (parameter.filepath) {
                files.push(parameter.filepath);
              } else {
                files = fs.readdirSync(pathBuild, { encoding: 'utf8' });
              }

              // Iterates through all collected files and check if they are
              // valid html files.
              /** @type {!Array<Promise>} */
              let requests = [];

              files.forEach((file) => {
                // Checks if the current file is an html file.
                if (file.match(/\.html$/)) {
                  requests.push(nodeFetch(localDevelopmentUrl + encodeURI(file)));
                }
              });

              // We wait for all promises to get resolved. the promises are
              // fetch requests to the html files we want to check.
              Promise.all(requests)
                .then((responses) => {
                  responses.forEach((response) => {
                    // We want to check only files that are valid html
                    // documents. That means, that we don't want to check 403
                    // error pages for example generated on defaults.
                    // If no file gets validated, could be an sign that the
                    // 'localDevelopmentUrl' option wasn't set correctly in the
                    // config-client.mjs.
                    if (response.status >= 200 && response.status < 400) {
                      filesHtml.push(response.url);
                    } else {
                      showError(`The path ${response.url} couldn't be validated 'cause of status ${response.status}.`);
                    }
                  });

                  if (responses.length && filesHtml.length === 0) {
                    reject(new Error(`No path couldn't be validated. Maybe you have to set the 'localDevelopmentUrl' option in config-client.mjs correctly.`));
                  }

                  // Single-file validation shows a more detailed validation result.
                  if (filesHtml.length === 1) detailedOutput = true;

                  /** @type {!number} */
                  let counterHtmlFiles = filesHtml.length;
                  /** @type {!number} */
                  let counter = 0;

                  filesHtml.forEach((url) => {
                    /**
                     * The static configuration for the external html-validator
                     * module.
                     * @type {!Object}
                     * @see https://github.com/zrrrzzt/html-validator#usage
                     */
                    const configHtmlValidatorStatic = {
                      url: url,
                      isLocal: true,
                    };

                    /**
                     * Runs the validator and saves the responding promise into a
                     * constant with a combination of our default and the user
                     * configuration. Our default keys can be overwritten by the
                     * user. In addition the promise contains the validation
                     * results.
                     * @type {!Promise}
                     */
                    const htmlValidatorResult = htmlValidator({
                      ...configHtmlValidatorStatic,
                      ...configHtmlValidator,
                    });

                    // Add the result to the collector.
                    htmlValidatorResults.push(htmlValidatorResult);
                  });


                  // After all we wait for each promise to resolve and display all
                  // results and finally resolve the task.
                  Promise.all(htmlValidatorResults).then((results) => {
                    // Evaluates promise of html-validate process.
                    results.forEach((validationResult) => {

                      // console.log(validationResult)
                      // console.log(JSON.parse(validationResult))
                      // Convert JSON text data in true JSON object.
                      // validationResult = JSON.parse(validationResult);

                      /** @type {!string} */
                      let file = validationResult.url;

                      // Beautify filename.
                      file = decodeURI(file.replace(localDevelopmentUrl, ''));

                      // Displays a console message.
                      showFileInfo(parameter.mode, validationResult.url, 'proceed');

                      /** @type {!number} */
                      let counterMessagesInfo = 0;
                      /** @type {!number} */
                      let counterMessagesWarning = 0;
                      /** @type {!number} */
                      let counterMessagesError = 0;
                      /** @type {!string} */
                      let textPositionIndicator = '';

                      // Collect all messages and filter them by status
                      validationResult.messages.forEach((message) => {

                        if (detailedOutput) {
                          textPositionIndicator =
                            `From line ${message.lastLine}, column ${message.firstColumn}; to line ${message.lastLine}, column ${message.lastColumn}`;
                        }

                        if (message.type === 'error') {
                          counterMessagesError++;

                          if (detailedOutput) {
                            // Displays error message.
                            console.info(chalk.white(`\n\t${textPositionIndicator}: `));
                            console.info(chalk.red(`\t${message.message}`));
                          }
                        }
                        if (message.type === 'info') {
                          if (message.subType === 'warning') {
                            counterMessagesWarning++;

                            if (detailedOutput) {
                              // Displays warning message.
                              console.info(chalk.white(`\n\t${textPositionIndicator}: `));
                              console.info(chalk.yellow(`\t${message.message}`));
                            }
                          } else {
                            counterMessagesInfo++;

                            if (detailedOutput) {
                              // Displays info message.
                              console.info(chalk.white(`\n\t${textPositionIndicator}: `));
                              console.info(chalk.blue(`\t${message.message}`));
                            }
                          }
                        }
                      });

                      // Displays the different amounts of messages.
                      if (detailedOutput)
                        console.info(chalk.white(`\n\t==============`));
                      console.info(chalk.white(`\n\tInfo: `) + chalk.blue(counterMessagesInfo) + chalk.white(` | Warnings: `) + chalk.yellow(counterMessagesWarning) + chalk.white(` | Errors: `) + chalk.red(counterMessagesError));

                      if (!detailedOutput) {
                        // Displays the command to receive more information.
                        console.info(chalk.white(`\n\tRun `) + chalk.magenta(`node --experimental-modules --no-warnings kickstart-scripts/tasks/html-validate.mjs --filepath="${file}"`) + chalk.white(` for detailed information.`));
                      }

                      // Adds an additional line break if another file output
                      // follows the current one.
                      if (++counter !== counterHtmlFiles) console.log('\n');
                    });

                    // We can easily resolve after iterating through all files 'cause
                    // on a minify error we print the error to the console. Sometimes only
                    // one file is corrupted so we can still minify the other ones.
                    // That's why we don't reject the error.
                    resolve();
                  }).catch((error) => {
                    // On a result error we will print it to the console.
                    showError(error);
                  });
                }).catch((error) => {
                  // On a fetch API error we will print it to the console.
                  showError(error);
                });
            } else {
              showWarning(`Can't find 'localDevelopmentUrl' option in 'config-client.mjs'.`);
            }
          }).catch(() => {
            showWarning(`Please provide a 'config-client.mjs' file if you want to use the validator.`);
          });
        } catch (error) {
          // On a unpredictable we reject with the error message.
          reject(error);
        }
      });
    });
  }
}

validateHtml(); // Always run minifyHtml on module execution.
