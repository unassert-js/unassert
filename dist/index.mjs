/**
 * unassert
 *   Encourages programming with assertions by providing tools to compile them away.
 *
 * https://github.com/unassert-js/unassert
 *
 * Copyright (c) 2015-2023 Takuto Wada
 * Licensed under the MIT license.
 *   https://github.com/unassert-js/unassert/blob/master/LICENSE
 */
import { replace, traverse } from 'estraverse';
import MagicString from 'magic-string';

function isAcornNode(node) {
  return typeof node === 'object' && node !== null && typeof node.start === 'number' && typeof node.end === 'number';
}
function isLiteral(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'Literal';
}
function isIdentifier(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'Identifier';
}
function isObjectPattern(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'ObjectPattern';
}
function isMemberExpression(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'MemberExpression';
}
function isCallExpression(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'CallExpression';
}
function isExpressionStatement(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'ExpressionStatement';
}
function isIfStatement(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'IfStatement';
}
function isImportDeclaration(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'ImportDeclaration';
}
function isProperty(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'Property';
}
function isVariableDeclarator(node) {
  return (node === null || node === void 0 ? void 0 : node.type) === 'VariableDeclarator';
}
function isBodyOfNodeHavingNonBlockStatementAsBody(node, key) {
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
function isBodyOfIfStatement(node, key) {
  return isIfStatement(node) && (key === 'consequent' || key === 'alternate');
}
function isNonBlockChildOfParentNode(currentNode, parentNode, key) {
  return isExpressionStatement(currentNode) && isCallExpression(currentNode.expression) && (isBodyOfIfStatement(parentNode, key) || isBodyOfNodeHavingNonBlockStatementAsBody(parentNode, key));
}
function createVisitor(options) {
  const config = Object.assign(defaultOptions(), options);
  const targetModules = new Set(config.modules);
  const targetVariables = new Set(config.variables);
  const {
    code
  } = config;
  const nodeUpdates = new WeakMap();
  function isAssertionModuleName(lit) {
    return isLiteral(lit) && targetModules.has( lit.value);
  }
  function isAssertionVariableName(id) {
    return isIdentifier(id) && targetVariables.has(id.name);
  }
  function isAssertionMethod(callee) {
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
  function isAssertionFunction(callee) {
    return isAssertionVariableName(callee);
  }
  function isConsoleAssert(callee) {
    if (!isMemberExpression(callee)) {
      return false;
    }
    const {
      object: obj,
      property: prop
    } = callee;
    return isIdentifier(obj) && obj.name === 'console' && isIdentifier(prop) && prop.name === 'assert';
  }
  function registerIdentifierAsAssertionVariable(id) {
    if (isIdentifier(id)) {
      targetVariables.add(id.name);
    }
  }
  function handleDestructuredAssertionAssignment(objectPattern) {
    for (const property of objectPattern.properties) {
      if (isProperty(property)) {
        registerIdentifierAsAssertionVariable(property.value);
      }
    }
  }
  function handleImportSpecifiers(importDeclaration) {
    for (const {
      local
    } of importDeclaration.specifiers) {
      registerIdentifierAsAssertionVariable(local);
    }
  }
  function registerAssertionVariables(node) {
    if (isIdentifier(node)) {
      registerIdentifierAsAssertionVariable(node);
    } else if (isObjectPattern(node)) {
      handleDestructuredAssertionAssignment(node);
    } else if (isImportDeclaration(node)) {
      handleImportSpecifiers(node);
    }
  }
  function isRequireAssert(id, init) {
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
  function isRequireAssertDotStrict(id, init) {
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
  function isRemovalTargetRequire(id, init) {
    return isRequireAssert(id, init) || isRequireAssertDotStrict(id, init);
  }
  function isRemovalTargetAssertion(callee) {
    return isAssertionFunction(callee) || isAssertionMethod(callee) || isConsoleAssert(callee);
  }
  function removeNode(node) {
    nodeUpdates.set(node, null);
  }
  function replaceNode(node, replacement) {
    nodeUpdates.set(node, replacement);
  }
  function getStartAndEnd(node, code) {
    let {
      start,
      end
    } = node;
    while (/\s/.test(code[start - 1])) {
      start -= 1;
    }
    if (isVariableDeclarator(node)) {
      let newEnd = end;
      while (/\s/.test(code[newEnd])) {
        newEnd += 1;
      }
      if (/,/.test(code[newEnd])) {
        end = newEnd + 1;
      }
    }
    return {
      start,
      end
    };
  }
  function createNoopExpression() {
    return {
      code: '(void 0)',
      node: {
        type: 'UnaryExpression',
        operator: 'void',
        prefix: true,
        argument: {
          type: 'Literal',
          value: 0,
          raw: '0'
        }
      }
    };
  }
  function createNoopStatement() {
    return {
      code: '{}',
      node: {
        type: 'BlockStatement',
        body: []
      }
    };
  }
  function unassertImportDeclaration(currentNode) {
    const source = currentNode.source;
    if (!isAssertionModuleName(source)) {
      return;
    }
    removeNode(currentNode);
    this.skip();
    registerAssertionVariables(currentNode);
  }
  function unassertVariableDeclarator(currentNode, parentNode) {
    if (isRemovalTargetRequire(currentNode.id, currentNode.init)) {
      if (parentNode.declarations.length === 1) {
        removeNode(parentNode);
      } else {
        removeNode(currentNode);
      }
      this.skip();
      registerAssertionVariables(currentNode.id);
    }
  }
  function unassertAssignmentExpression(currentNode, parentNode) {
    if (currentNode.operator !== '=') {
      return;
    }
    if (!isExpressionStatement(parentNode)) {
      return;
    }
    if (isRemovalTargetRequire(currentNode.left, currentNode.right)) {
      removeNode(parentNode);
      this.skip();
      registerAssertionVariables(currentNode.left);
    }
  }
  function unassertCallExpression(currentNode, parentNode) {
    const callee = currentNode.callee;
    if (!isRemovalTargetAssertion(callee)) {
      return;
    }
    switch (parentNode.type) {
      case 'ExpressionStatement':
        {
          removeNode(parentNode);
          this.skip();
          break;
        }
      case 'SequenceExpression':
        {
          replaceNode(currentNode, createNoopExpression());
          break;
        }
    }
  }
  function unassertAwaitExpression(currentNode, parentNode) {
    const childNode = currentNode.argument;
    if (isExpressionStatement(parentNode) && isCallExpression(childNode)) {
      const callee = childNode.callee;
      if (isRemovalTargetAssertion(callee)) {
        removeNode(parentNode);
        this.skip();
      }
    }
  }
  return {
    enter: function (currentNode, parentNode) {
      if (code && isAcornNode(currentNode)) {
        code.addSourcemapLocation(currentNode.start);
        code.addSourcemapLocation(currentNode.end);
      }
      switch (currentNode.type) {
        case 'ImportDeclaration':
          {
            unassertImportDeclaration.bind(this)(currentNode, parentNode);
            break;
          }
        case 'VariableDeclarator':
          {
            unassertVariableDeclarator.bind(this)(currentNode, parentNode);
            break;
          }
        case 'AssignmentExpression':
          {
            unassertAssignmentExpression.bind(this)(currentNode, parentNode);
            break;
          }
        case 'CallExpression':
          {
            unassertCallExpression.bind(this)(currentNode, parentNode);
            break;
          }
        case 'AwaitExpression':
          {
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
          if (path) {
            const key = path[path.length - 1];
            if (parentNode && isNonBlockChildOfParentNode(currentNode, parentNode, key)) {
              const replacement = createNoopStatement();
              if (code && isAcornNode(currentNode)) {
                const {
                  start,
                  end
                } = getStartAndEnd(currentNode, code.toString());
                code.overwrite(start, end, replacement.code);
              }
              return replacement.node;
            }
          }
        }
        if (code && isAcornNode(currentNode)) {
          const {
            start,
            end
          } = getStartAndEnd(currentNode, code.toString());
          code.remove(start, end);
        }
        this.remove();
        return undefined;
      }
      if (code && isAcornNode(currentNode)) {
        const {
          start,
          end
        } = getStartAndEnd(currentNode, code.toString());
        code.overwrite(start, end, update.code);
      }
      return update.node;
    }
  };
}
function unassertAst(ast, options) {
  return replace(ast, createVisitor(options));
}
function unassertCode(code, ast, options) {
  const {
    sourceMap,
    ...traverseOptions
  } = options ?? {};
  const usingMagic = code instanceof MagicString;
  const magicCode = usingMagic ? code : new MagicString(code);
  traverse(ast, createVisitor({
    ...traverseOptions,
    code: magicCode
  }));
  if (usingMagic) {
    return magicCode;
  }
  const unassertedCode = magicCode.toString();
  const map = sourceMap ? magicCode.generateMap(sourceMap === true ? undefined : sourceMap) : null;
  return {
    code: unassertedCode,
    map
  };
}
function defaultOptions() {
  return {
    modules: ['assert', 'assert/strict', 'node:assert', 'node:assert/strict']
  };
}

export { createVisitor, defaultOptions, unassertAst, unassertCode };
