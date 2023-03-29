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
import { replace } from 'estraverse';

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

  const nodeUpdates = new WeakMap();

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

  function removeNode (node) {
    nodeUpdates.set(node, null);
  }

  function replaceNode (node, replacement) {
    nodeUpdates.set(node, replacement);
  }

  function createNoopExpression () {
    return {
      type: 'UnaryExpression',
      operator: 'void',
      prefix: true,
      argument: {
        type: 'Literal',
        value: 0,
        raw: '0'
      }
    };
  }

  function createNoopStatement () {
    return {
      type: 'BlockStatement',
      body: []
    };
  }

  function unassertImportDeclaration (currentNode, parentNode) {
    const source = currentNode.source;
    if (!(isAssertionModuleName(source))) {
      return;
    }
    // remove current ImportDeclaration
    removeNode(currentNode);
    this.skip();
    // register local identifier(s) as assertion variable
    registerAssertionVariables(currentNode);
  }

  function unassertVariableDeclarator (currentNode, parentNode) {
    if (isRemovalTargetRequire(currentNode.id, currentNode.init)) {
      if (parentNode.declarations.length === 1) {
        // remove parent VariableDeclaration
        removeNode(parentNode);
      } else {
        // single var pattern
        // remove current VariableDeclarator
        removeNode(currentNode);
      }
      this.skip();
      // register local identifier(s) as assertion variable
      registerAssertionVariables(currentNode.id);
    }
  }

  function unassertAssignmentExpression (currentNode, parentNode) {
    if (currentNode.operator !== '=') {
      return;
    }
    if (!isExpressionStatement(parentNode)) {
      return;
    }
    if (isRemovalTargetRequire(currentNode.left, currentNode.right)) {
      // remove parent ExpressionStatement
      removeNode(parentNode);
      this.skip();
      // register local identifier(s) as assertion variable
      registerAssertionVariables(currentNode.left);
    }
  }

  function unassertCallExpression (currentNode, parentNode) {
    const callee = currentNode.callee;
    if (!isRemovalTargetAssertion(callee)) {
      return;
    }

    switch (parentNode.type) {
      case 'ExpressionStatement': {
        // remove parent ExpressionStatement
        removeNode(parentNode);
        this.skip();
        break;
      }
      case 'SequenceExpression': {
        // replace the asserstion with essentially nothing
        replaceNode(currentNode, createNoopExpression());
        break;
      }
    }
  }

  function unassertAwaitExpression (currentNode, parentNode) {
    const childNode = currentNode.argument;
    if (isExpressionStatement(parentNode) && isCallExpression(childNode)) {
      const callee = childNode.callee;
      if (isRemovalTargetAssertion(callee)) {
        // remove parent ExpressionStatement
        removeNode(parentNode);
        this.skip();
      }
    }
  }

  return {
    enter: function (currentNode, parentNode) {
      switch (currentNode.type) {
        case 'ImportDeclaration': {
          unassertImportDeclaration.bind(this)(currentNode, parentNode);
          break;
        }
        case 'VariableDeclarator': {
          unassertVariableDeclarator.bind(this)(currentNode, parentNode);
          break;
        }
        case 'AssignmentExpression': {
          unassertAssignmentExpression.bind(this)(currentNode, parentNode);
          break;
        }
        case 'CallExpression': {
          unassertCallExpression.bind(this)(currentNode, parentNode);
          break;
        }
        case 'AwaitExpression': {
          unassertAwaitExpression.bind(this)(currentNode, parentNode);
          break;
        }
      }
    },
    leave: function (currentNode, parentNode) {
      const update = nodeUpdates.get(currentNode);
      if (update === undefined) {
        return undefined;
      }
      if (update === null) {
        if (isExpressionStatement(currentNode)) {
          const path = this.path();
          const key = path[path.length - 1];
          if (isNonBlockChildOfParentNode(currentNode, parentNode, key)) {
            return createNoopStatement();
          }
        }
        this.remove();
        return undefined;
      }
      return update;
    }
  };
}

function unassertAst (ast, options) {
  return replace(ast, createVisitor(options));
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

export {
  unassertAst,
  defaultOptions,
  createVisitor
};
