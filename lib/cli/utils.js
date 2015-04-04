/**
 * Check if a given condition is true and terminate the current process if so.
 */
exports.failOn = function (condition) {
    if (condition) {
        for (var i = 1; i < arguments.length; i++) {
            console.error(arguments[i]);
        }
        process.exit(1);
    }
};
