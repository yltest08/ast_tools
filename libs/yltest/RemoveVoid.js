const types = require("@babel/types");

const traverse_addexpress = {
    UnaryExpression(path) {
        fix(path)
    }
}

function fix(path) { 
    if (path.node.operator === "void" && !types.isNumericLiteral(path.node.argument, { value: 0 })) {
        path.replaceWith(path.node.argument);  
      }
}

exports.fix = traverse_addexpress