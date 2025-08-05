/**
 * Hindi.js Compiler - Main compiler that orchestrates lexing, parsing, and code generation
 */

const lexer = require('./lexer');
const parser = require('./parser');
const codeGen = require('./codegen');

/**
 * Compiles Hindi.js source code to JavaScript
 * @param {string} input - The Hindi.js source code
 * @param {boolean} debug - Whether to show debug information
 * @returns {string} Generated JavaScript code
 */
function compiler(input, debug = false) {
    try {
        // Step 1: Tokenize the input
        const tokens = lexer(input);
        if (debug) {
            console.log("TOKENS:", tokens);
        }

        // Step 2: Parse tokens into AST
        const ast = parser(tokens);
        if (debug) {
            console.log("AST:", JSON.stringify(ast, null, 2));
        }

        // Step 3: Generate JavaScript code
        const executableCode = codeGen(ast);
        if (debug) {
            console.log("Generated JS Code:\n", executableCode);
        }

        return executableCode;
    } catch (error) {
        console.error("Compilation Error:", error.message);
        throw error;
    }
}

/**
 * Compiles and executes Hindi.js code
 * @param {string} input - The Hindi.js source code
 * @param {boolean} debug - Whether to show debug information
 */
function run(input, debug = false) {
    try {
        const jsCode = compiler(input, debug);
        eval(jsCode);
    } catch (error) {
        console.error("Runtime Error:", error.message);
        throw error;
    }
}

module.exports = {
    compiler,
    run,
    lexer,
    parser,
    codeGen
};