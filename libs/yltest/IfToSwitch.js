
const types = require("@babel/types");
const generator = require("@babel/generator").default;
const traverse_express = {
    SwitchStatement(path) {
        fix(path)
    }
}

function addCases(test, cases, consequent) {
    let oper = test.operator;
    let val = test.right.value;
    if (oper === '>') {
        val = val + 1;
    } else if (oper === '<') {
        val = val - 1;
    }
    // console.log("++++++++++",generator(consequent).code);
    if (!types.isBlockStatement(consequent)) {
        consequent = types.blockStatement([consequent]);
    }
    if (val === 43){
        cases.push(types.switchCase(null, [consequent, types.breakStatement()]));
    } else {
        cases.push(types.switchCase(types.numericLiteral(val), [consequent, types.breakStatement()]));
    }
}
function addCases2(test, cases, consequent) {
    let oper = test.operator;
    let val = test.right.value;
    if (oper === '>') {
        val = val - 1;
    } else if (oper === '<') {
        val = val + 1;
    }
    if (!types.isBlockStatement(consequent)) {
        consequent = types.blockStatement([consequent]);
    }
    cases.push(types.switchCase(types.numericLiteral(val), [consequent, types.breakStatement()]));
}
function handleIfStatement(path) {
    let test = path.test;
    let consequent = path.consequent;
    let alternate = path.alternate;
    let cases = [];
    // console.log("===================",generator(path).code);
    if (types.isIfStatement(consequent)) {
        if (types.isIfStatement(consequent.consequent)) {
            if (types.isBinaryExpression(consequent.consequent.test) && consequent.consequent.test.left.name === 'da') {
                cases = cases.concat(handleIfStatement(consequent.consequent));
            } else {
                addCases(test, cases, consequent.consequent);
            }
        } else {
            addCases(test, cases, consequent);
        }

    } else if (types.isBlockStatement(consequent) && types.isIfStatement(consequent.body[0]) ){
        if (types.isBinaryExpression(consequent.body[0].test) && consequent.body[0].test.left.name === 'da') {
            cases = cases.concat(handleIfStatement(consequent.body[0]));
        } else {
            if (types.isIfStatement(consequent)) {
                addCases(test, cases, consequent.consequent);
            } else {
                addCases(test, cases, consequent);
            }
        }
    } else {
        addCases(test, cases, consequent);
    }

    if (types.isIfStatement(alternate) ) {
        if (types.isBinaryExpression(alternate.test) && alternate.test.left.name === 'da') {
            cases = cases.concat(handleIfStatement(alternate));
        } else {
            addCases2(test, cases, alternate);
        }
    } else if (types.isBlockStatement(alternate) && types.isIfStatement(alternate.body[0])) {
        if (types.isBinaryExpression(alternate.body[0].test) && alternate.body[0].test.left.name === 'da'){
            cases = cases.concat(handleIfStatement(alternate.body[0]));
        } else {
            addCases2(test, cases, alternate.body[0]);
        }
    } else if (alternate){
        addCases2(test, cases, alternate);
    }
    return cases;
  }

function fix(path) {
    const node = path.node;
    const scope = path.scope;

    if (types.isIdentifier(node.discriminant) && node.discriminant.name === 'ha') {
        // console.log(generator(node.discriminant).code);
        for (var idx = 0; idx < node.cases.length; idx++) {
            let c = node.cases[idx];
            if (c.consequent.length === 2) {
                let first = c.consequent[0];
                if (types.isIfStatement(first) && types.isIdentifier(first.test.left) && first.test.left.name === 'da') {
                    let discriminant = first.test.left;
                    let cases = handleIfStatement(first);
                    
                    const newConsequent = [  
                        types.switchStatement(discriminant, cases),types.breakStatement()
                    ];  
                    // console.log(generator(types.blockStatement(newConsequent)).code);
                    node.cases[idx].consequent = newConsequent;

                } else if (types.isExpressionStatement(first) && types.isUnaryExpression(first.expression) &&
                    first.expression.operator === "!" && types.isCallExpression(first.expression.argument) && first.expression.argument.arguments.length === 0 &&
                        types.isFunctionExpression(first.expression.argument.callee) && first.expression.argument.callee.id === null &&
                        first.expression.argument.callee.params.length === 0
                    ) {
                        let _body = first.expression.argument.callee.body.body[0];
                        // console.log("++++++++++",generator(_body).code);
                        let cases = handleIfStatement(_body);
                        let discriminant = _body.test.left;
                        const newConsequent = [  
                            types.switchStatement(discriminant, cases)
                        ];  
                        first.expression.argument.callee.body.body = newConsequent;
                    }
            }
        }
    }
}

exports.fix = traverse_express