const t = require("@babel/types");

// 交换二元表达式的左右两个元素  3 < a  => a > 3
const traverse_addexpress = {
    SwitchStatement(path) {
        fix(path)
    },
    IfStatement(path) {
        fix(path)
    }
}


function fix(path) {
    switch (path.node.type) {
        case "SwitchStatement":
            // isBinaryExpression 二元表达式 例如 a + b
            if (t.isBinaryExpression(path.node.discriminant)) {
                if (
                    t.isLiteral(path.node.discriminant.left) &&
                    t.isIdentifier(path.node.discriminant.right)
                ) {
                    // Swap positions
                    let temp = path.node.discriminant.left;
                    path.node.discriminant.left = path.node.discriminant.right;
                    path.node.discriminant.right = temp;
                    // Also convert the operator
                    path.node.discriminant.operator = convert_symbol(
                        path.node.discriminant.operator
                    );
                }
            }
            break;
        case "IfStatement":
            if (t.isBinaryExpression(path.node.test)) {
                if (
                    t.isLiteral(path.node.test.left) &&
                    t.isIdentifier(path.node.test.right)
                ) {
                    // Swap positions
                    let temp = path.node.test.left;
                    path.node.test.left = path.node.test.right;
                    path.node.test.right = temp;
                    // Also convert the operator
                    path.node.test.operator = convert_symbol(path.node.test.operator);
                }
            }
            break;
    }

}


function convert_symbol(operator) {
    let res;
    switch (operator) {
        case "===":
        case "==":
        case "!==":
        case "&":
            res = operator;
            break;
        case "<":
            res = ">";
            break;
        case "<=":
            res = ">=";
            break;
        case ">":
            res = "<";
            break;
        case ">=":
            res = "<=";
            break;
        default:
            throw "符号调换有新情况" + operator;

    }
    return res;
}

    exports.fix = traverse_addexpress