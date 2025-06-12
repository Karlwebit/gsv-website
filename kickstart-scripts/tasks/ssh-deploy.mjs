/**
 * Module to deploy a project.
 * @module ssh-deploy
 * @exports sshDeploy
 * @requires config
 * @requires config-client
 * @requires config-host
 * @requires minimist
 * @requires sshDeployRelease
 * @requires utility
 * @author Martin Hubrich (frontend@webit.de)
 * @author Rodger Rüdiger (frontend@webit.de)
 */

import minimist from 'minimist'; // https://github.com/substack/minimist
import sshDeployRelease from 'ssh-deploy-release';

// Self-written modules
import { config } from '../config.mjs';
import { configHost } from '../config-host.mjs';
import {
  getSshAuthorizationData,
  showError,
  showFileInfo,
  showScriptInfo,
} from '../utility.mjs';


/**
 * Deploys all files of the build directory.
 * @function sshDeploy
 * @public
 */
export function sshDeploy() {
  /**
   * Object containing the command line arguments passed when the Node.js
   * process was launched.
   * We are so careful that we set default values.
   * @see https://github.com/substack/minimist#var-argv--parseargsargs-opts
   * @type {!Object.<string, string>}
   */
  const parameter = minimist(process.argv.slice(2), {
    default: {
      mode: 'dev',
      stage: 'preview',
      task: 'deploy',
    },
  });

  showScriptInfo(parameter.mode, 'ssh-deploy', () => {
    return new Promise((resolve, reject) => {
      try {
        /**
         * The user configuration for the provided stage of the config.mjs.
         * @type {!Object}
         */
        const configHostStage = configHost[parameter.stage];
        /** @type {!Promise} */
        const sshAuthorizationDataPromise = getSshAuthorizationData();

        sshAuthorizationDataPromise.then((sshAuthorizationDataPromise) => {
          /**
           * We prepare the configuration for the deploy module. These are the
           * various paths to the host server, username with the password/ssh key
           * and some default options like the amount of releases we want to keep.
           * @see https://github.com/la-haute-societe/ssh-deploy-release#options
           * @type {!Object}
           */
          const optionsDeploy = {
            host: configHostStage.hostServer,
            username: configHostStage.username,
            deployPath: configHostStage.deployPath,
            localPath: config.dirBuild,
            privateKeyFile: sshAuthorizationDataPromise.pathSshKey,
            passphrase: sshAuthorizationDataPromise.passphrase,
            debug: false,
            releasesToKeep: 2,
            currentReleaseLink: 'web',
          };

          /**
           * We have to anonymise the passphrase for security reasons. So we
           * always have to overwrite it.
           * @type {!Object}
           */
          const anonymisedOptionsDeploy = {
            ...optionsDeploy,
            ...{
              passphrase: "***",
            },
          };

          // Displays a console message.
          showFileInfo(
            parameter.mode,
            'used task: ' + parameter.task,
            'message'
          );

          // Instead of converting the options into a for humans better readable
          // format, we output every single option on its own to maintain
          // our console style correctly.
          Object.keys(anonymisedOptionsDeploy).forEach((optionName) => {
            showFileInfo(
              parameter.mode,
              optionName + ': ' + anonymisedOptionsDeploy[optionName],
              'message'
            );
          });

          /** @type {!Object} */
          const sshDeployReleaseObject = new sshDeployRelease(optionsDeploy);

          // Connects to server depending on node command line parameter (task).
          switch (parameter.task) {
            case 'deploy':
              sshDeployReleaseObject.deployRelease(() => {
                // We can resolve the promise if everything was fine 'cause if a
                // critical error happens we reject anyways.
                resolve();
              }, (error) => {
                // On error we instantly reject 'cause we aren't in a iteration.
                reject(error);
              });
              break;
            case 'rollback':
              sshDeployReleaseObject.rollbackToPreviousRelease(() => {
                // We can resolve the promise if everything was fine 'cause if a
                // critical error happens we reject anyways.
                resolve();
              }, (error) => {
                // On error we instantly reject 'cause we aren't in a iteration.
                reject(error);
              });
              break;
            default:
              // We can resolve the promise if everything was fine 'cause if a
              // critical error happens we reject anyways.
              resolve();
          }
        });
      } catch (error) {
        // On a unpredictable we reject with the error message.
        reject(error);
      }
    });
  });
}

sshDeploy(); // Always run sshDeploy on module execution.
