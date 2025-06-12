/**
 * Module with one standalone function 'svgSprite' to combine svg files to one
 * sprite of a specific directory.
 * @module svg-sprite
 * @exports svgSprite
 * @requires utility
 * @requires config
 * @requires fs
 * @requires minimist
 * @requires path
 * @requires svgstore
 * @requires underscore.string
 * @author Martin Hubrich (frontend@webit.de)
 */

// External modules
import fs from 'fs'; // https://nodejs.org/api/fs.html
import minimist from 'minimist'; // https://github.com/substack/minimist
import path from 'path'; // https://nodejs.org/api/path.html
import underscoreString from 'underscore.string'; // https://github.com/esamattis/underscore.string
import svgstore from 'svgstore'; // https://github.com/svgstore/svgstore

// Self-written modules
import { config } from '../config.mjs';
import { showFileInfo, showScriptInfo, showWarning } from '../utility.mjs';


/**
 * Collects all svg images and bundles it to one svg sprite.
 * @function svgSprite
 * @public
 */
export function svgSprite() {
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

  showScriptInfo(parameter.mode, 'svg-sprite', () => {
    return new Promise((resolve, reject) => {
      try {
        /** @type {!string} */
        const pathWorking = config.dirWorking || parameter.dirWorking;
        /**
         * The user configuration of the config.mjs.
         * @type {!Object}
         */
        const configSvgSprite = config.build.statics.svgSprite;

        // Only proceed if the svg store configuration is available. Otherwise
        // throw an error to ensure backwards compatibility.
        if (configSvgSprite !== undefined) {
          /**
           * The user configuration of the config.mjs.
           * @type {!Object}
           */
          const configSvgStore = config.build.statics.svgstore || {};

          // Iterates through every sprite item configuration.
          configSvgSprite.forEach((configuration) => {
            /** @type {!Array<string>} */
            const pathSourceDir = configuration.sourceDir;
            /** @type {!string} */
            const lastPartOfSource =
              pathSourceDir[pathSourceDir.length - 1];
            /** @type {!Array<string>} */
            const pathDestinationDir = configuration.destinationFile;
            /** @type {!string} */
            const lastPartOfDestination =
              pathDestinationDir[pathDestinationDir.length - 1];
            /** @type {!string|Array<string>} */
            let pathWorkingSvgSprite = pathDestinationDir;
            /** @type {!string} */
            let spriteFilename;

            // Checks if a .svg name is provided. Otherwise generate and add a
            // default.
            if (lastPartOfDestination.endsWith('.svg')) {
              spriteFilename = lastPartOfDestination;
              pathWorkingSvgSprite.pop();
            } else {
              spriteFilename =
                `${underscoreString.slugify(lastPartOfSource)}.svg`;
            }
            pathWorkingSvgSprite.unshift(pathWorking);

            /** @type {!Array<string>} */
            let pathWorkingSpriteItems = configuration.sourceDir;

            // Adds the working path in front of the svg sprite path.
            pathWorkingSpriteItems.unshift(pathWorking);

            /** @type {!string} */
            const pathWorkingSvgSpriteItems =
              path.join.apply(this, pathWorkingSpriteItems);

            pathWorkingSvgSprite = path.join.apply(this, pathWorkingSvgSprite);

            // Only do something if the sprite items directory exists.
            if (fs.existsSync(pathWorkingSvgSpriteItems)) {
              /**
               * The svg items of the sprite items directory. The option
               * 'encoding' ensure that we only receive the paths as strings.
               * @type {!Array<string>}
               */
              const filesSpriteItems =
                fs.readdirSync(pathWorkingSvgSpriteItems, {
                  encoding: 'utf8',
                });

              // Only do something if the directory contains at least one file.
              if (filesSpriteItems.length >= 1) {
                // Create the various svg directory into the working directory.
                fs.mkdirSync(pathWorkingSvgSprite, {
                  recursive: true,
                });

                /** @type {!Object} */
                let sprite = svgstore(configSvgStore);

                // Iterate through all sprite item files.
                filesSpriteItems.forEach((file) => {
                  /**
                   * The generated svg name id out of the filename (e.g.
                   * button.classic.svg turns into button.classic).
                   * @type {!string}
                   */
                  const spriteItemId = file.split('.').slice(0, -1).join('.');

                  /** @type {!string} */
                  const filepath = path.join(pathWorkingSvgSpriteItems, file);

                  // Displays a console message.
                  showFileInfo(parameter.mode, filepath, 'proceed');

                  // Adds the sprite item to the svgstore object.
                  sprite.add(
                    spriteItemId,
                    fs.readFileSync(filepath, { encoding: 'utf8' })
                  );
                });

                // Displays a console message.
                showFileInfo(
                  parameter.mode,
                  path.join(pathWorkingSvgSprite, spriteFilename),
                  'write'
                );

                // Writes the new svg sprite file into the svg various
                // directory.
                fs.writeFileSync(
                  path.join(pathWorkingSvgSprite, spriteFilename),
                  sprite.toString()
                );
              } else {
                showWarning(`Looks like ${pathWorkingSvgSpriteItems} is empty.`);
              }
            } else {
              showWarning(`The path ${pathWorkingSvgSpriteItems} doesn't exist.`);
            }
          });

          // We can easily resolve after iterating through all files 'cause
          // on a errors we print the error to the console. Sometimes only
          // one file is corrupted so we can still minify the other ones.
          // That's why we don't reject the error.
          resolve();
        } else {
          throw new Error(`Please add the svgSprite option to your package.json.`);
        }
      } catch (error) {
        // On a unpredictable we reject with the error message.
        reject(error);
      }
    });
  });
}

svgSprite(); // Always run svgSprite on module execution.
