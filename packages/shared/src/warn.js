/**
 * Logs a warning message to the console with the prefix "FeatherJS Core Warning:".
 *
 * @param {string} message - The main warning message to be logged.
 * @param {...(string | number | boolean)[]} args - Additional arguments to be logged after the main message.
 * @returns {void}
 */
export function warn(message, ...args) {
    console.warn(`FeatherJS Core Warning: ${message}`, ...args);
}
