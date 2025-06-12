/**
 * Module with one standalone function 'lintCss' to lint all css files in
 * the build directory.
 * @module css-lint
 * @exports lintCss
 * @requires chalk
 * @requires config
 * @requires minimist
 * @requires path
 * @requires stylelint
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import chalk from 'chalk'; // https://github.com/chalk/chalk
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html
import stylelint from 'stylelint'; // https://github.com/stylelint/stylelint

// Self-written modules
import { config } from '../config.mjs';
import { showFileInfo, showScriptInfo } from '../utility.mjs';


/**
 * Iterates through the build directory for css files to check their syntax via
 * stylelint package.
 * @function lintCss
 * @public
 */
export function lintCss() {
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

  if (parameter.mode !== 'prod') { // Don't execute linter in prod mode.
    showScriptInfo(parameter.mode, 'css-lint', () => {
      return new Promise((resolve, reject) => {
        try {
          /**
           * The user configuration of the config.mjs.
           * @type {!Object}
           */
          const configStylelint = config.build.css.stylelint || {};
          /** @type {!string} */
          const pathBuild = config.dirBuild || parameter.dirBuild;
          /** @type {!Array<string>} */
          let pathAssetsCss = config.dirAssetsCss;

          // Adds the build path in front of the css assets path.
          pathAssetsCss.unshift(pathBuild);

          /** @type {!string} */
          const pathBuildCss = path.join.apply(this, pathAssetsCss);
          /**
           * The static configuration for the external stylelint module.
           * We only set the pre-installed standard configuration.
           * @type {!Object}
           * @see https://github.com/stylelint/stylelint-config-standard#stylelint-config-standard
           */
          const configStylelintStatic = {
            'extends': 'stylelint-config-standard',
          };

          // Runs the linter with a combination of our default and the user
          // configuration. Our default keys can be overwritten by the user.
          // We lint all css files recursively in the assets css directory.
          stylelint.lint({
            config: {
              ...configStylelintStatic,
              ...configStylelint,
            },
            files: path.join(pathBuildCss, '**', '*.css').replace(/\\/g, '/'),
          })
          .then((linterReturnedData) => {
            /** @type {!JSON} */
            const dataJson = JSON.parse(linterReturnedData.output);
            /** @type {!number} */
            let counterCssFiles = Object.keys(dataJson).length;
            /** @type {!number} */
            let counter = 0;

            // Iterates through every file result.
            Object.values(dataJson).forEach((file) => {
              // Receives the relative path 'cause file.source contains the full
              // absolute path to the file.
              /** @type {!number} */
              const indexAssetsString = file.source.indexOf(pathBuildCss);
              /** @type {!string} */
              const filepath = file.source.substring(indexAssetsString);

              // Displays a console message.
              showFileInfo(parameter.mode, filepath, 'proceed');

              // Displays the amount of deprecation and warning messages.
              console.info(chalk.white(`\n\tDeprecations: `) + chalk.red(`${file.deprecations.length}`) + chalk.white(` | Warnings: `) + chalk.yellow(`${file.warnings.length}`));

              // Displays the command to receive more information.
              console.info(chalk.white(`\n\tRun `) + chalk.magenta(`npx stylelint "${filepath.replace(/\\/g, '/')}" --config=${{...configStylelintStatic, ...configStylelint}.extends} `) + chalk.white(`for detailed information.`));

              // Adds an additional line break if another file output follows
              // the current one.
              if (++counter !== counterCssFiles) console.log('\n');
            });

            // If everything is fine we can resolve the promise.
            resolve();
          })
          .catch(function(error) {
            // On a unpredictable we reject with the error message.
            reject(error);
          });
        } catch (error) {
          // On a unpredictable we reject with the error message.
          reject(error);
        }
      });
    });
  }
}

lintCss(); // Always run lintCss on module execution.
