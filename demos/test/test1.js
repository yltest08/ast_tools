const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const code = `
function r(e, r, o) {
    for (var a = 1; void 0 !== a;) {
      var t;
      var i;
      var n = 7 & a >> 3;

      switch (a & 7) {
        case 0:
          if (n == 1) {
            v = 1;
            a = 3;
          } else {
            if (n < 1) {
              h = 0;
              a = 2;
            } else {
              if (n == 2) {
                a = 5;
              } else {
                if (n > 2) {
                  a = 4;
                }
              }
            }
          }

          break;

        case 1:
          var s = 0;
          var h = r;

          if (h) {
            a = 2;
          } else {
            a = 0;
          }

          break;

        case 2:
          var c = h;
          var d = e.length;
          var v = o;

          if (v) {
            a = 3;
          } else {
            a = 8;
          }

          break;

        case 3:
          var l = v;
          a = 16;
          break;

        case 4:
          return s;

        case 5:
          var p;

          if (c < d) {
            a = 6;
          } else {
            a = 24;
          }

          break;

        case 6:
          var g;
          var C;
          s = 0 | 31 * s;
          s += e.charCodeAt(c);
          c += l;
          a = 16;
          break;
      }
    }
  }
`;

function test(code) {
  const ast = parser.parse(code, { sourceType: "module" });

  traverse(ast, {
    IfStatement(path) {
      // Check if the if statement is directly checking the variable 'n'
      if (
        t.isIdentifier(path.node.test.left, { name: "n" }) &&
        ["==", "===", "<", ">"].includes(path.node.test.operator)
      ) {
        const cases = [];
        collectCases(path.node, cases);

        // Create a switch statement with 'n' as the discriminant
        const switchStatement = t.switchStatement(
          t.identifier("n"),
          cases
        );

        // Replace the entire if-else chain with the switch statement
        path.replaceWith(switchStatement);
      }
    }
  });

  traverse(ast, {
    ForStatement(path){
      if (t.isVariableDeclaration(path.node.init) && t.isIdentifier(path.node.init.declarations[0].id, { name: 'a' })) {
        let aVal = path.node.init.declarations[0].init.value;
        let nVal = n = 7 & aVal >> 3;
        console.log(nVal);
        const cfg = new Map();
        const switchStatement = path.node.body.body.find(n => t.isSwitchStatement(n));
        if (switchStatement === undefined) return;
        switchStatement.cases.forEach((c) => {
            const testV = c.test.value;
            const body = c.consequent;
            let nextStates = undefined;
            for (const statement of body) {
              if (t.isExpressionStatement(statement) && t.isAssignmentExpression(statement.expression) && t.isIdentifier(statement.expression.left, { name: 'a' })) {
                nextStates = statement.expression.right.value;
              } else if (t.isIfStatement(statement)) {
                const test = statement.test;
                const consequent = statement.consequent;
                const alternate = statement.alternate;
                const trueState = void 0;
                const falseState = void 0;
                consequent.body.forEach((node) => {
                  if (t.isExpressionStatement(node) && t.isAssignmentExpression(node.expression) && t.isIdentifier(node.expression.left, { name: 'a' })) {
                    trueState = node.expression.right.value;
                  }
                });
                alternate.body.forEach((node) => {
                  if (t.isExpressionStatement(node) && t.isAssignmentExpression(node.expression) && t.isIdentifier(node.expression.left, { name: 'a' })) {
                    falseState = node.expression.right.value;
                  }
                });
                if (trueState !== undefined || falseState !== undefined) {
                  nextStates = [test,trueState, falseState];
                }
              } else if (t.isSwitchStatement(stmt)) {
                stmt.cases.forEach((cs) => {
                  const nTestV = cs.test.value;
                  const nBody = cs.consequent;
                  
                });
              }
            }
            if (nextStates !== undefined) {
              cfg.set(testV, {body,nextStates});
            }
          });
      }
    }
  });
  return generate(ast).code;
}

function collectCases(node, cases) {
  const operator = node.test.operator;
  const right = node.test.right;

  if (!t.isNumericLiteral(right)) return;

  let caseValue;

  // Determine the case value based on the operator
  switch (operator) {
    case "==":
    case "===":
      caseValue = t.numericLiteral(right.value);
      break;
    case "<":
      caseValue = t.numericLiteral(right.value - 1);
      break;
    case ">":
      caseValue = t.numericLiteral(right.value + 1);
      break;
    default:
      return; // Unsupported operator
  }

  let statements = [];
  if (t.isBlockStatement(node.consequent)) {
    statements = node.consequent.body.slice(); // Clone the array to avoid mutations
  } else {
    statements = [node.consequent];
  }
  statements.push(t.breakStatement());

  cases.push(t.switchCase(caseValue, statements));

  if (node.alternate && node.alternate.body && t.isIfStatement(node.alternate.body[0])) {
    collectCases(node.alternate.body[0], cases);
  }
}

const result = test(code);
console.log(result);