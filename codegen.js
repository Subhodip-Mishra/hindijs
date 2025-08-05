/**
 * Hindi.js Code Generator - Converts AST to executable JavaScript code
 */

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
            const consequentCode = node.consequent
                .map(stmt => '  ' + codeGen(stmt))
                .join('\n');
            return `if (${codeGen(node.condition)}) {\n${consequentCode}\n}`;
            
        case "ConditionalExpression":
            return `${codeGen(node.test)} ? ${codeGen(node.consequent)} : ${codeGen(node.alternate)}`;
            
        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}

module.exports = codeGen;