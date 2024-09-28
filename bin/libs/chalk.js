import chalk from 'chalk';

function logMessage(message, color = 'cyan') {
    console.log(chalk[color](message));
}

export { logMessage };
