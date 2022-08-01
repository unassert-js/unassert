'use strict';

const estraverse = require('estraverse');

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

function isLiteral (node) {
  return node && node.type === 'Literal';
}
function isIdentifier (node) {
  return node && node.type === 'Identifier';
}
function isObjectPattern (node) {
  return node && node.type === 'ObjectPattern';
}
function isMemberExpression (node) {
  return node && node.type === 'MemberExpression';
}
function isCallExpression (node) {
  return node && node.type === 'CallExpression';
}
function isExpressionStatement (node) {
  return node && node.type === 'ExpressionStatement';
}
function isIfStatement (node) {
  return node && node.type === 'IfStatement';
}
function isImportDeclaration (node) {
  return node && node.type === 'ImportDeclaration';
}

function isBodyOfNodeHavingNonBlockStatementAsBody (node, key) {
  if (!node) {
    return false;
  }
  if (key !== 'body') {
    return false;
  }
  switch (node.type) {
    case 'DoWhileStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'ForStatement':
    case 'LabeledStatement':
    case 'WithStatement':
    case 'WhileStatement':
      return true;
  }
  return false;
}

function isBodyOfIfStatement (node, key) {
  return isIfStatement(node) && (key === 'consequent' || key === 'alternate');
}

function isNonBlockChildOfParentNode (currentNode, parentNode, key) {
  return isExpressionStatement(currentNode) && isCallExpression(currentNode.expression) &&
        (isBodyOfIfStatement(parentNode, key) || isBodyOfNodeHavingNonBlockStatementAsBody(parentNode, key));
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

  function registerIdentifierAsAssertionVariable (id) {
    if (isIdentifier(id)) {
      targetVariables.add(id.name);
    }
  }

  function handleDestructuredAssertionAssignment (objectPattern) {
    for (const { value } of objectPattern.properties) {
      registerIdentifierAsAssertionVariable(value);
    }
  }

  function handleImportSpecifiers (importDeclaration) {
    for (const { local } of importDeclaration.specifiers) {
      registerIdentifierAsAssertionVariable(local);
    }
  }

  function registerAssertionVariables (node) {
    if (isIdentifier(node)) {
      registerIdentifierAsAssertionVariable(node);
    } else if (isObjectPattern(node)) {
      handleDestructuredAssertionAssignment(node);
    } else if (isImportDeclaration(node)) {
      handleImportSpecifiers(node);
    }
  }

  function isRequireAssert (id, init) {
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
  }

  function isRequireAssertDotStrict (id, init) {
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
  }

  function isRemovalTargetRequire (id, init) {
    return isRequireAssert(id, init) || isRequireAssertDotStrict(id, init);
  }

  function isRemovalTargetAssertion (callee) {
    return isAssertionFunction(callee) || isAssertionMethod(callee) || isConsoleAssert(callee);
  }

  const nodeToRemove = new WeakSet();

  return {
    enter: function (currentNode, parentNode) {
      switch (currentNode.type) {
        case 'ImportDeclaration': {
          const source = currentNode.source;
          if (!(isAssertionModuleName(source))) {
            return;
          }
          // remove current ImportDeclaration
          nodeToRemove.add(currentNode);
          this.skip();
          // register local identifier(s) as assertion variable
          registerAssertionVariables(currentNode);
          break;
        }
        case 'VariableDeclarator': {
          if (isRemovalTargetRequire(currentNode.id, currentNode.init)) {
            if (parentNode.declarations.length === 1) {
              // remove parent VariableDeclaration
              nodeToRemove.add(parentNode);
            } else {
              // single var pattern
              // remove current VariableDeclarator
              nodeToRemove.add(currentNode);
            }
            this.skip();
            // register local identifier(s) as assertion variable
            registerAssertionVariables(currentNode.id);
          }
          break;
        }
        case 'AssignmentExpression': {
          if (currentNode.operator !== '=') {
            return;
          }
          if (!isExpressionStatement(parentNode)) {
            return;
          }
          if (isRemovalTargetRequire(currentNode.left, currentNode.right)) {
            // remove parent ExpressionStatement
            nodeToRemove.add(parentNode);
            this.skip();
            // register local identifier(s) as assertion variable
            registerAssertionVariables(currentNode.left);
          }
          break;
        }
        case 'CallExpression': {
          if (!isExpressionStatement(parentNode)) {
            return;
          }
          const callee = currentNode.callee;
          if (isRemovalTargetAssertion(callee)) {
            // remove parent ExpressionStatement
            nodeToRemove.add(parentNode);
            this.skip();
          }
          break;
        }
        case 'AwaitExpression': {
          const childNode = currentNode.argument;
          if (isExpressionStatement(parentNode) && isCallExpression(childNode)) {
            const callee = childNode.callee;
            if (isRemovalTargetAssertion(callee)) {
              // remove parent ExpressionStatement
              nodeToRemove.add(parentNode);
              this.skip();
            }
          }
          break;
        }
      }
    },
    leave: function (currentNode, parentNode) {
      switch (currentNode.type) {
        case 'ImportDeclaration':
        case 'VariableDeclarator':
        case 'VariableDeclaration':
        case 'ExpressionStatement':
          break;
        default:
          return undefined;
      }
      if (nodeToRemove.has(currentNode)) {
        if (isExpressionStatement(currentNode)) {
          const path = this.path();
          const key = path[path.length - 1];
          if (isNonBlockChildOfParentNode(currentNode, parentNode, key)) {
            return {
              type: 'BlockStatement',
              body: []
            };
          }
        }
        this.remove();
      }
      return undefined;
    }
  };
}

function unassertAst (ast, options) {
  return estraverse.replace(ast, createVisitor(options));
}

function defaultOptions () {
  return {
    modules: [
      'assert',
      'assert/strict',
      'node:assert',
      'node:assert/strict'
    ]
  };
}

exports.createVisitor = createVisitor;
exports.defaultOptions = defaultOptions;
exports.unassertAst = unassertAst;
