/**
 * Hindi.js Parser - Converts tokens into Abstract Syntax Tree (AST)
 */

function parser(tokens) {
    const ast = { type: "Program", body: [] };
    let position = 0;

    function peek() {
        return tokens[position];
    }

    function consume() {
        return tokens[position++];
    }

    function expect(value) {
        const token = consume();
        if (!token || token.value !== value) {
            throw new SyntaxError(`Expected '${value}', got ${token ? token.value : 'EOF'}`);
        }
        return token;
    }

    function getOperatorPrecedence(op) {
        const precedence = {
            '?': 1,
            ':': 1,
            '==': 2, '!=': 2,
            '<': 3, '>': 3, '<=': 3, '>=': 3,
            '+': 4, '-': 4,
            '*': 5, '/': 5
        };
        return precedence[op] || 0;
    }

    function parseBinaryExpression(left, minPrec = 0) {
        while (peek() && peek().type === 'operator' && getOperatorPrecedence(peek().value) > 0) {
            const op = peek().value;
            const prec = getOperatorPrecedence(op);
            
            if (prec < minPrec) break;
            
            consume(); // consume operator
            let right = parsePrimary();
            
            while (peek() && peek().type === 'operator' && getOperatorPrecedence(peek().value) > 0) {
                const nextOp = peek().value;
                const nextPrec = getOperatorPrecedence(nextOp);
                if (nextPrec <= prec) break;
                right = parseBinaryExpression(right, nextPrec);
            }
            
            left = {
                type: 'BinaryExpression',
                left: left,
                operator: op,
                right: right
            };
        }
        return left;
    }

    function parsePrimary() {
        const token = peek();
        if (!token) return null;

        // Numbers
        if (token.type === 'number') {
            consume();
            return { type: 'Literal', value: token.value };
        }

        // Identifiers
        if (token.type === 'identifier') {
            consume();
            return { type: 'Identifier', name: token.value };
        }

        // Parenthesized expressions
        if (token.value === '(') {
            consume(); // consume '('
            const expr = parseExpression();
            expect(')');
            return expr;
        }

        throw new SyntaxError("Unexpected token in expression: " + JSON.stringify(token));
    }

    function parseExpression() {
        let left = parsePrimary();
        if (!left) return null;

        // Handle ternary operator
        if (peek() && peek().value === '?') {
            consume(); // consume '?'
            const consequent = parseExpression();
            expect(':');
            const alternate = parseExpression();
            return {
                type: 'ConditionalExpression',
                test: left,
                consequent,
                alternate
            };
        }

        // Handle binary expressions
        left = parseBinaryExpression(left);
        
        return left;
    }

    function parseStatement() {
        const token = peek();
        if (!token) return null;

        // Variable declaration: ye x = 10
        if (token.type === 'keyword' && token.value === 'ye') {
            consume(); // consume 'ye'
            const nameToken = consume();
            if (nameToken.type !== 'identifier') {
                throw new SyntaxError("Expected identifier after 'ye'");
            }

            let declaration = {
                type: "Declaration",
                name: nameToken.value,
                value: null
            };

            if (peek()?.value === '=') {
                consume(); // consume '='
                declaration.value = parseExpression();
            }

            return declaration;
        }

        // Print statement: bol x
        else if (token.type === 'keyword' && token.value === 'bol') {
            consume(); // consume 'bol'
            return {
                type: 'Print',
                expression: parseExpression()
            };
        }

        // If statement: if (condition) { ... }
        else if (token.type === 'keyword' && token.value === 'if') {
            consume(); // consume 'if'
            expect('(');
            const condition = parseExpression();
            expect(')');
            
            // Expect opening brace
            const openBrace = consume();
            if (!openBrace || openBrace.type !== 'delimiter' || openBrace.value !== '{') {
                throw new SyntaxError("Expected '{' after if condition");
            }

            const consequent = [];
            while (peek() && !(peek().type === 'delimiter' && peek().value === '}')) {
                const stmt = parseStatement();
                if (stmt) consequent.push(stmt);
            }

            // Expect closing brace
            const closeBrace = consume();
            if (!closeBrace || closeBrace.type !== 'delimiter' || closeBrace.value !== '}') {
                throw new SyntaxError("Expected '}' to close if block");
            }

            return {
                type: 'IfStatement',
                condition,
                consequent
            };
        }

        throw new SyntaxError("Unexpected token: " + JSON.stringify(token));
    }

    // Parse all statements
    while (position < tokens.length) {
        const stmt = parseStatement();
        if (stmt) ast.body.push(stmt);
    }

    return ast;
}

module.exports = parser;