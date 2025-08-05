/**
 * Hindi.js Example - Run and capture output instead of console.log
 */

const { compiler } = require('./compiler');

const hindiCode = `
ye x = 30
ye y = 10

ye bigger = x > y ? x : y

bol bigger

if (x < y) {
    bol bigger
}
`;


function runAndCaptureOutput(code) {
  const jsCode = compiler(code);

  const wrappedCode = `
    const output = [];
    function bol(...args) {
      output.push(args.join(' '));
    }
    ${jsCode}
    return output.join('\\n');
  `;

  const func = new Function(wrappedCode);
  return func();
}

const output = runAndCaptureOutput(hindiCode);

output;
