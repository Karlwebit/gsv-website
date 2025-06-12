# webit-testprojekt

## Team

Project manager: Karl Pommer

Design: Karl Pommer

Frontend: Karl Pommer

## Installed Components



## Understanding the Configurations

At the different files like ```config.mjs``` you can configure different paths to the development or build directory, external modules or adjust the build processes and many more. We recommend to don't change the different default values. But feel free to do some experiments! All of the following options are required! The program won't crush instantly but we want to ensure a correct running project.

### Client configuration (config-client.mjs)

Don't push this configuration! It contains sensitive data about passwords and logins.

| Option                          | Function                            | Type    |
|---------------------------------|-------------------------------------|---------|
| passphrase                   git reset --soft HEAD   | An alternative to the SSH login.    | !string |
| privateKeyFileWithinHomeDirRoot | The path to the local SSH key file. | !string |
| localDevelopmentUrl             | The address to your local development system. Used to validate the generated html | !string |

### Host configuration (config-host.mjs)

| Option              | Function                                                                                                                                                                            | Type    |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| Stage configuration | The key represents the name of the stage to deploy to. The value is another object which retrieves three options to log into the remote server: username, hostname and deploy path. | !Object |

### General configuration (config.mjs)

Please take a look at [the configuration file](./kickstart-scripts/config.mjs). There are too many options to handle them at two points. If a configuration paramater gets changed we will update the comments so you won't miss something.

### Scripts

There are multiple npm scripts available to run from either an IDE or via a command line tool. Please take a look at the [package.json](./package.json) for more information.
