function lexer(input) {
    const tokens = [];
    let cursor = 0;

    while (cursor < input.length) {
        let char = input[cursor];

        if (/\s/.test(char)) {
            cursor++;
            continue;
        }

        if (/[a-zA-Z]/.test(char)) {
            let word = '';
            while (/[a-zA-Z0-9]/.test(char)) {
                word += char;
                char = input[++cursor];
            }

            if (['ye', 'bol', 'if', 'else'].includes(word)) {
                tokens.push({ type: 'keyword', value: word });
            } else {
                tokens.push({ type: 'identifier', value: word });
            }
            continue;
        }

        if (/[0-9]/.test(char)) {
            let num = '';
            while (/[0-9]/.test(char)) {
                num += char;
                char = input[++cursor];
            }
            tokens.push({ type: 'number', value: parseInt(num) });
            continue;
        }

        if (char === '{' || char === '}') {
            tokens.push({ type: 'delimiter', value: char });
            cursor++;
            continue;
        }

        if (/[\+\-\*\/=()?:<>!]/.test(char)) {
            let op = char;

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

        // Handle binary expressions (but stop at statement boundaries)
        left = parseBinaryExpression(left);
        
        return left;
    }

    function parseStatement() {
        const token = peek();
        if (!token) return null;

        // Variable declaration
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

        // Print statement
        else if (token.type === 'keyword' && token.value === 'bol') {
            consume(); // consume 'bol'
            return {
                type: 'Print',
                expression: parseExpression()
            };
        }

        // If statement
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

    while (position < tokens.length) {
        const stmt = parseStatement();
        if (stmt) ast.body.push(stmt);
    }

    return ast;
}

function codeGen(node) {
    switch (node.type) {
        case "Program": 
            return node.body.map(codeGen).join('\n');
        case "Declaration": 
            return `const ${node.name} = ${node.value ? codeGen(node.value) : 'undefined'};`;
        case "Print": 
            return `console.log(${codeGen(node.expression)});`;
        case "Literal": 
            return node.value;
        case "Identifier": 
            return node.name;
        case "BinaryExpression":
            return `${codeGen(node.left)} ${node.operator} ${codeGen(node.right)}`;
        case "IfStatement":
            return `if (${codeGen(node.condition)}) {\n${node.consequent.map(stmt => '  ' + codeGen(stmt)).join('\n')}\n}`;
        case "ConditionalExpression":
            return `${codeGen(node.test)} ? ${codeGen(node.consequent)} : ${codeGen(node.alternate)}`;
        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}

function compiler(input) {
    const tokens = lexer(input);
    const ast = parser(tokens);
    const executableCode = codeGen(ast);
    return executableCode;
}

function runner(input) {
    eval(input);
}

const code = `
ye x = 10
ye y = 20

ye bigger = x > y ? x : y

bol bigger

if (x < y) {
    bol bigger
}
`;

const exec = compiler(code);
runner(exec);