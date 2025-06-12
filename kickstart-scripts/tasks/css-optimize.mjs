/**
 * Module with one standalone function 'optimizeCss' to optimize the css files
 * in the build directory. At the moment it only purges the files from
 * selectors which aren't in use. We use the html files as reference.
 * @module css-optimize
 * @exports optimizeCss
 * @requires css
 * @requires config
 * @requires fs
 * @requires jsdom
 * @requires minimist
 * @requires path
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 * @todo Optimize purge process
 */

// External modules
import css from 'css'; // https://github.com/reworkcss/css
import fs from 'fs'; // https://nodejs.org/api/fs.html
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html
import jsdom from 'jsdom'; // https://github.com/jsdom/jsdom

// Self-written modules
import { config } from '../config.mjs';
import { showFileInfo, showScriptInfo } from '../utility.mjs';


/**
 * This function optimizes css code. For example it removes unused css
 * selectors. In the future we will extend the functionality.
 * @function optimizeCss
 * @public
 */
export function optimizeCss() {
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

  if (parameter.mode !== 'dev') { // Don't execute minify in dev mode.
    showScriptInfo(parameter.mode, 'css-optimize', () => {
      return new Promise((resolve, reject) => {
        try {
          /** @type {!string} */
          const pathBuild = config.dirBuild || parameter.dirBuild;
          /** @type {!Array<string>} */
          let pathAssetsCss = config.dirAssetsCss;

          // Adds the build path in front of the css assets path.
          pathAssetsCss.unshift(pathBuild);

          /** @type {!string} */
          const pathBuildCss = path.join.apply(this, pathAssetsCss);

          // To optimization 1: Collects all html to prevent multiple
          // collections when iterating through all css files.
          if (config.build.css.cssPurge === true) {
            /** @type {!string} */
            var htmlCode = '';

            // Iterates through all files located at the root directory.
            // The option 'encoding' ensure that we only receive the paths as
            // strings.
            fs.readdirSync(pathBuild, { encoding: 'utf8' })
              .forEach((file) => {

                // Checks if the current file is an html file.
                if (file.match(/\.html$/)) {
                  /** @type {!string} */
                  const filepathHtml = path.join(pathBuild, file);
                  /**
                   * The html code of the current file. The option 'encoding'
                   * ensure that we receive the content as string.
                   * @type {!string}
                   */
                  const currentHtmlCode =
                    fs.readFileSync(filepathHtml, { encoding: 'utf8' });

                  // Displays a console message.
                  showFileInfo(
                    parameter.mode,
                    `HTML file read for purging: ${filepathHtml}`,
                    'message'
                  );

                  // Adds the current html code to the global collector.
                  htmlCode += currentHtmlCode;
                }
              });
          }

          // Iterates through all files located at the assets css directory at
          // the build directory. The option 'encoding' ensure that we only
          // receive the paths as strings.
          fs.readdirSync(pathBuildCss, { encoding: 'utf8' })
            .forEach((file) => {
              // Checks if the current file is a css file.
              if (file.match(/\.css$/)) {
                /** @type {!string} */
                const filepathCss = path.join(pathBuildCss, file);

                // Optimization 1: Removes unused css selectors from file (all
                // html files serve as reference). For this we create a virtual
                // dom object via jsdom module to determine if a selector exists
                // or not.
                if (config.build.css.cssPurge === true) {
                  /** @type {!Object} */
                  const configCssParse = config.build.css.cssParse || {};
                  /** @type {!Object} */
                  const configCssStringify = config.build.css.cssStringify || {};
                  /**
                   * The user configuration of the config.mjs.
                   * @type {!Object}
                   */
                  const configJsDom = config.build.css.jsdom || {};
                  /**
                   * The css code of the current file as string. The option
                   * 'encoding' ensure that we receive the content as string.
                   * @type {!string}
                   */
                  const codeCss =
                    fs.readFileSync(filepathCss, { encoding: 'utf8' });
                  /**
                   * The static configuration for the external css module.
                   * @type {!Object}
                   */
                  const configCssParseStatic = {
                    source: filepathCss,
                  };

                  // Displays a console message.
                  showFileInfo(parameter.mode, filepathCss, 'proceed');

                  /**
                   * The jsdom object to search via 'querySelector'.
                   * @type {Object}
                   */
                  const virtualDom = new jsdom.JSDOM(htmlCode, configJsDom);

                  /**
                   * The css code parsed as object via external css module with
                   * a combination of our default and the user configuration.
                   * Our default keys can be overwritten by the user.
                   * @type {!Object}
                   */
                  const cssParsed = css.parse(codeCss, {
                    ...configCssParseStatic,
                    ...configCssParse,
                  });

                  // Iterates through the selectors and test against the virtual
                  // dom.
                  cssParsed.stylesheet.rules.forEach((rule) => {
                    /** @type {!string} */
                    let purgedSelector;
                    /** @type {!number} */
                    let selectorIndex;
                    /** @type {Object} */
                    let matchingElements;

                    rule.selectors && rule.selectors.forEach((selector) => {
                      // We always check the selector and not his pseudo
                      // classes. Sometimes there are only pseudo classes
                      // without any 'normal' selector and so we would remove
                      // them accidentally. If the querySelector can't find any
                      // object we remove the selector out of the css file.
                      // E.g.: .red-button::after -> .red-button
                      purgedSelector = selector.replace(/::?[^ ,:.]+/g, '');

                      // Gets elements of the dom with the current selector.
                      matchingElements =
                        virtualDom.window.document.querySelector(purgedSelector);

                      // If no element was found we delete it from the selector
                      // object.
                      if (!matchingElements) {
                        selectorIndex = rule.selectors.indexOf(selector);

                        if (selectorIndex !== -1) {
                          rule.selectors.splice(selectorIndex, 1);
                        }
                      }
                    });
                  });

                  // Write the pursed css code into the css file.
                  fs.writeFileSync(
                    filepathCss,
                    css.stringify(cssParsed, configCssStringify)
                  );

                  // Displays a console message.
                  showFileInfo(parameter.mode, filepathCss, 'write');
                }
              }
            });

          // If we finished all optimizations we can resolve the promise.
          resolve();
        } catch (error) {
          // On a unpredictable we reject with the error message.
          reject(error);
        }
      });
    });
  }
}

optimizeCss(); // Always run optimizeCss on module execution.
