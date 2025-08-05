/**
 * Hindi.js Lexer - Tokenizes source code into tokens
 */

function lexer(input) {
    const tokens = [];
    let cursor = 0;

    while (cursor < input.length) {
        let char = input[cursor];

        // Skip whitespace
        if (/\s/.test(char)) {
            cursor++;
            continue;
        }

        // Identifiers and keywords
        if (/[a-zA-Z]/.test(char)) {
            let word = '';
            while (/[a-zA-Z0-9]/.test(char)) {
                word += char;
                char = input[++cursor];
            }

            // Check if it's a keyword
            if (['ye', 'bol', 'if', 'else'].includes(word)) {
                tokens.push({ type: 'keyword', value: word });
            } else {
                tokens.push({ type: 'identifier', value: word });
            }
            continue;
        }

        // Numbers
        if (/[0-9]/.test(char)) {
            let num = '';
            while (/[0-9]/.test(char)) {
                num += char;
                char = input[++cursor];
            }
            tokens.push({ type: 'number', value: parseInt(num) });
            continue;
        }

        // Block delimiters
        if (char === '{' || char === '}') {
            tokens.push({ type: 'delimiter', value: char });
            cursor++;
            continue;
        }

        // Operators
        if (/[\+\-\*\/=()?:<>!]/.test(char)) {
            let op = char;

            // Handle 2-char operators (==, !=, >=, <=)
            if (/[=<>!]/.test(char) && input[cursor + 1] === '=') {
                op += input[++cursor];
            }

            tokens.push({ type: 'operator', value: op });
            cursor++;
            continue;
        }

        throw new SyntaxError(`Unexpected character: ${char}`);
    }

    return tokens;
}

module.exports = lexer;