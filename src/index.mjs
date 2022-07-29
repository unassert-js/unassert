/**
 * unassert
 *   Encourages programming with assertions by providing tools to compile them away.
 *
 * https://github.com/unassert-js/unassert
 *
 * Copyright (c) 2015-2022 Takuto Wada
 * Licensed under the MIT license.
 *   https://github.com/unassert-js/unassert/blob/master/LICENSE
 */
import { replace, Syntax as syntax } from 'estraverse';
import { ast as esutilsAst } from 'esutils';

function defaultOptions () {
  return {
    variables: [
    ],
    modules: [
      'assert',
      'assert/strict',
      'node:assert',
      'node:assert/strict'
    ]
  };
}

function isBodyOfIfStatement (parentNode, key) {
  return parentNode.type === syntax.IfStatement && (key === 'consequent' || key === 'alternate');
}

function isBodyOfIterationStatement (parentNode, key) {
  return esutilsAst.isIterationStatement(parentNode) && key === 'body';
}

function isNonBlockChildOfIfStatementOrLoop (currentNode, parentNode, key) {
  return currentNode.type === syntax.ExpressionStatement &&
        currentNode.expression.type === syntax.CallExpression &&
        (isBodyOfIfStatement(parentNode, key) || isBodyOfIterationStatement(parentNode, key));
}

function isLiteral (node) {
  return node && node.type === syntax.Literal;
}
function isIdentifier (node) {
  return node && node.type === syntax.Identifier;
}
function isObjectPattern (node) {
  return node && node.type === syntax.ObjectPattern;
}
function isMemberExpression (node) {
  return node && node.type === syntax.MemberExpression;
}
function isCallExpression (node) {
  return node && node.type === syntax.CallExpression;
}
function isExpressionStatement (node) {
  return node && node.type === syntax.ExpressionStatement;
}
function isImportDeclaration (node) {
  return node && node.type === syntax.ImportDeclaration;
}

function createVisitor (options) {
  const config = Object.assign(defaultOptions(), options);
  const targetModules = new Set(config.modules);
  const targetVariables = new Set(config.variables);

  function isAssertionModuleName (lit) {
    return isLiteral(lit) && targetModules.has(lit.value);
  }

  function isAssertionVariableName (id) {
    return isIdentifier(id) && targetVariables.has(id.name);
  }

  function isAssertionMethod (callee) {
    if (!isMemberExpression(callee)) {
      return false;
    }
    const obj = callee.object;
    if (isMemberExpression(obj)) {
      return isAssertionMethod(obj);
    } else {
      return isAssertionVariableName(obj);
    }
  }

  function isAssertionFunction (callee) {
    return isAssertionVariableName(callee);
  }

  function isConsoleAssert (callee) {
    if (!isMemberExpression(callee)) {
      return false;
    }
    const { object: obj, property: prop } = callee;
    return isIdentifier(obj) && obj.name === 'console' &&
      isIdentifier(prop) && prop.name === 'assert';
  }

  function handleDestructuredAssertionAssignment (objectPattern) {
    for (const { value } of objectPattern.properties) {
      if (isIdentifier(value)) {
        targetVariables.add(value.name);
      }
    }
  }

  function handleImportSpecifiers (importDeclaration) {
    for (const { local } of importDeclaration.specifiers) {
      if (isIdentifier(local)) {
        targetVariables.add(local.name);
      }
    }
  }

  // register local identifier as assertion variable
  function registerAssertionVariables (node) {
    if (isIdentifier(node)) {
      targetVariables.add(node.name);
    } else if (isObjectPattern(node)) {
      handleDestructuredAssertionAssignment(node);
    } else if (isImportDeclaration(node)) {
      handleImportSpecifiers(node);
    }
  }

  const isRequireAssert = (id, init) => {
    if (!isCallExpression(init)) {
      return false;
    }
    const callee = init.callee;
    if (!isIdentifier(callee) || callee.name !== 'require') {
      return false;
    }
    const arg = init.arguments[0];
    if (!isLiteral(arg) || !isAssertionModuleName(arg)) {
      return false;
    }
    return isIdentifier(id) || isObjectPattern(id);
  };

  const isRequireAssertStrict = (id, init) => {
    if (!isMemberExpression(init)) {
      return false;
    }
    if (!isRequireAssert(id, init.object)) {
      return false;
    }
    const prop = init.property;
    if (!isIdentifier(prop)) {
      return false;
    }
    return prop.name === 'strict';
  };

  const isRemovalTarget = (id, init) => isRequireAssert(id, init) || isRequireAssertStrict(id, init);

  const pathToRemove = {};

  return {
    enter: function (currentNode, parentNode) {
      switch (currentNode.type) {
        case syntax.ImportDeclaration: {
          const source = currentNode.source;
          if (!(isAssertionModuleName(source))) {
            return;
          }
          // target assertion module
          const espathToRemove = this.path().join('/');
          pathToRemove[espathToRemove] = true;
          this.skip();
          // register local identifier as assertion variable
          registerAssertionVariables(currentNode);
          break;
        }
        case syntax.VariableDeclarator: {
          if (isRemovalTarget(currentNode.id, currentNode.init)) {
            registerAssertionVariables(currentNode.id);
            let espathToRemove;
            if (parentNode.declarations.length === 1) {
              // remove parent VariableDeclaration
              // body/1/declarations/0 -> body/1
              espathToRemove = this.path().slice(0, -2).join('/');
            } else {
              // single var pattern
              espathToRemove = this.path().join('/');
            }
            pathToRemove[espathToRemove] = true;
            this.skip();
          }
          break;
        }
        case syntax.AssignmentExpression: {
          if (currentNode.operator !== '=') {
            return;
          }
          if (!isExpressionStatement(parentNode)) {
            return;
          }
          if (isRemovalTarget(currentNode.left, currentNode.right)) {
            registerAssertionVariables(currentNode.left);
            // remove parent ExpressionStatement
            const espathToRemove = this.path().slice(0, -1).join('/');
            pathToRemove[espathToRemove] = true;
            this.skip();
          }
          break;
        }
        case syntax.CallExpression: {
          if (!isExpressionStatement(parentNode)) {
            return;
          }
          const callee = currentNode.callee;
          if (isAssertionFunction(callee) || isAssertionMethod(callee) || isConsoleAssert(callee)) {
            // remove parent ExpressionStatement
            // body/1/body/body/0/expression -> body/1/body/body/0
            const espathToRemove = this.path().slice(0, -1).join('/');
            pathToRemove[espathToRemove] = true;
            this.skip();
          }
          break;
        }
      }
    },
    leave: function (currentNode, parentNode) {
      const path = this.path();
      if (path && pathToRemove[path.join('/')]) {
        const key = path[path.length - 1];
        if (isNonBlockChildOfIfStatementOrLoop(currentNode, parentNode, key)) {
          return {
            type: syntax.BlockStatement,
            body: []
          };
        } else {
          this.remove();
        }
      }
      return undefined;
    }
  };
}

function unassertAst (ast, options) {
  return replace(ast, createVisitor(options));
}

export {
  unassertAst,
  defaultOptions,
  createVisitor
};
