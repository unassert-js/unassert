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
import { replace, traverse } from 'estraverse';
import MagicString from 'magic-string';

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('acorn').Node}
 */
function isAcornNode (node) {
  return typeof node === 'object' && node !== null && typeof node.start === 'number' && typeof node.end === 'number';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').Literal}
 */
function isLiteral (node) {
  return node?.type === 'Literal';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').Identifier}
 */
function isIdentifier (node) {
  return node?.type === 'Identifier';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').ObjectPattern}
 */
function isObjectPattern (node) {
  return node?.type === 'ObjectPattern';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').MemberExpression}
 */
function isMemberExpression (node) {
  return node?.type === 'MemberExpression';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').CallExpression}
 */
function isCallExpression (node) {
  return node?.type === 'CallExpression';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').ExpressionStatement}
 */
function isExpressionStatement (node) {
  return node?.type === 'ExpressionStatement';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').IfStatement}
 */
function isIfStatement (node) {
  return node?.type === 'IfStatement';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').ImportDeclaration}
 */
function isImportDeclaration (node) {
  return node?.type === 'ImportDeclaration';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').Property}
 */
function isProperty (node) {
  return node?.type === 'Property';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @returns {node is import('estree').VariableDeclarator}
 */
function isVariableDeclarator (node) {
  return node?.type === 'VariableDeclarator';
}

/**
 * @param {import('estree').Node | undefined | null} node
 * @param {string | number} key
 * @returns {boolean}
 */
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

/**
 * @param {import('estree').Node | undefined | null} node
 * @param {string | number} key
 * @returns {boolean}
 */
function isBodyOfIfStatement (node, key) {
  return isIfStatement(node) && (key === 'consequent' || key === 'alternate');
}
/**
 * @param {import('estree').Node} currentNode
 * @param {import('estree').Node} parentNode
 * @param {string | number} key
 * @returns {boolean}
 */
function isNonBlockChildOfParentNode (currentNode, parentNode, key) {
  return isExpressionStatement(currentNode) && isCallExpression(currentNode.expression) &&
        (isBodyOfIfStatement(parentNode, key) || isBodyOfNodeHavingNonBlockStatementAsBody(parentNode, key));
}

/**
 * @param {import('./index.mjs').CreateVisitorOptions} [options]
 * @returns {import('estraverse').Visitor}
 */
function createVisitor (options) {
  const config = Object.assign(defaultOptions(), options);
  const targetModules = new Set(config.modules);
  const targetVariables = new Set(config.variables);
  const { code } = config;

  /**
   * @type {WeakMap<
   *   import('estree').Node,
   *   | {
   *       code: string;
   *       node: import('estree').Node
   *     }
   *   | null
   * >}
   */
  const nodeUpdates = new WeakMap();

  /**
   * @param {import('estree').Node} lit
   * @returns {boolean}
   */
  function isAssertionModuleName (lit) {
    return isLiteral(lit) && targetModules.has(/** @type {string} */ (lit.value));
  }

  /**
   * @param {import('estree').Node} id
   * @returns {boolean}
   */
  function isAssertionVariableName (id) {
    return isIdentifier(id) && targetVariables.has(id.name);
  }

  /**
   * @param {import('estree').Expression | import('estree').Super} callee
   * @returns {boolean}
   */
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

  /**
   * @param {import('estree').Expression | import('estree').Super} callee
   * @returns {boolean}
   */
  function isAssertionFunction (callee) {
    return isAssertionVariableName(callee);
  }

  /**
   * @param {import('estree').Expression | import('estree').Super} callee
   * @returns {boolean}
   */
  function isConsoleAssert (callee) {
    if (!isMemberExpression(callee)) {
      return false;
    }
    const { object: obj, property: prop } = callee;
    return isIdentifier(obj) && obj.name === 'console' &&
      isIdentifier(prop) && prop.name === 'assert';
  }

  /**
   * @param {import('estree').Node} id
   * @returns {void}
   */
  function registerIdentifierAsAssertionVariable (id) {
    if (isIdentifier(id)) {
      targetVariables.add(id.name);
    }
  }

  /**
   * @param {import('estree').ObjectPattern} objectPattern
   * @returns {void}
   */
  function handleDestructuredAssertionAssignment (objectPattern) {
    for (const property of objectPattern.properties) {
      if (isProperty(property)) {
        registerIdentifierAsAssertionVariable(property.value);
      } else {
        // TODO: handle rest element.
      }
    }
  }

  /**
   * @param {import('estree').ImportDeclaration} importDeclaration
   * @returns {void}
   */
  function handleImportSpecifiers (importDeclaration) {
    for (const { local } of importDeclaration.specifiers) {
      registerIdentifierAsAssertionVariable(local);
    }
  }

  /**
   * @param {import('estree').Node} node
   * @returns {void}
   */
  function registerAssertionVariables (node) {
    if (isIdentifier(node)) {
      registerIdentifierAsAssertionVariable(node);
    } else if (isObjectPattern(node)) {
      handleDestructuredAssertionAssignment(node);
    } else if (isImportDeclaration(node)) {
      handleImportSpecifiers(node);
    }
  }

  /**
   * @param {import('estree').Pattern} id
   * @param {import('estree').Expression | import('estree').Super | undefined | null} init
   * @returns {boolean}
   */
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

  /**
   * @param {import('estree').Pattern} id
   * @param {import('estree').Expression | import('estree').Super | undefined | null} init
   * @returns {boolean}
   */
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

  /**
   * @param {import('estree').Pattern} id
   * @param {import('estree').Expression | import('estree').Super | undefined | null} init
   * @returns {boolean}
   */
  function isRemovalTargetRequire (id, init) {
    return isRequireAssert(id, init) || isRequireAssertDotStrict(id, init);
  }

  /**
   * @param {import('estree').Expression | import('estree').Super} callee
   * @returns {boolean}
   */
  function isRemovalTargetAssertion (callee) {
    return isAssertionFunction(callee) || isAssertionMethod(callee) || isConsoleAssert(callee);
  }

  /**
   * @param {import('estree').Node} node
   * @returns {void}
   */
  function removeNode (node) {
    nodeUpdates.set(node, null);
  }

  /**
   * @param {import('estree').Node} node
   * @returns {void}
   */
  function replaceNode (node, replacement) {
    nodeUpdates.set(node, replacement);
  }

  /**
   * @param {import('acorn').Node} node
   * @param {string} code
   * @returns {{start: number; end: number;}}
   */
  function getStartAndEnd (node, code) {
    let { start, end } = node;
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
    return { start, end };
  }

  /**
   * @returns {{
   * code: string;
   * node: import('estree').Expression
   * }}
   */
  function createNoopExpression () {
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

  /**
   * @returns {{
   * code: string;
   * node: import('estree').BlockStatement
   * }}
   */
  function createNoopStatement () {
    return {
      code: '{}',
      node: {
        type: 'BlockStatement',
        body: []
      }
    };
  }

  /**
   * @this {import('estraverse').Controller}
   * @param {import('estree').ImportDeclaration} currentNode
   */
  function unassertImportDeclaration (currentNode) {
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

  /**
   * @this {import('estraverse').Controller}
   * @param {import('estree').VariableDeclarator} currentNode
   * @param {import('estree').VariableDeclaration} parentNode
   */
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

  /**
   * @this {import('estraverse').Controller}
   * @param {import('estree').AssignmentExpression} currentNode
   * @param {import('estree').Node} parentNode
   */
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

  /**
   * @this {import('estraverse').Controller}
   * @param {import('estree').CallExpression} currentNode
   * @param {import('estree').Node} parentNode
   */
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

  /**
   * @this {import('estraverse').Controller}
   * @param {import('estree').AwaitExpression} currentNode
   * @param {import('estree').Node} parentNode
   */
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
      if (code && isAcornNode(currentNode)) {
        code.addSourcemapLocation(currentNode.start);
        code.addSourcemapLocation(currentNode.end);
      }

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
          if (path) {
            const key = path[path.length - 1];
            if (parentNode && isNonBlockChildOfParentNode(currentNode, parentNode, key)) {
              const replacement = createNoopStatement();
              if (code && isAcornNode(currentNode)) {
                const { start, end } = getStartAndEnd(currentNode, code.toString());
                code.overwrite(start, end, replacement.code);
              }
              return replacement.node;
            }
          }
        }

        if (code && isAcornNode(currentNode)) {
          const { start, end } = getStartAndEnd(currentNode, code.toString());
          code.remove(start, end);
        }

        this.remove();
        return undefined;
      }

      if (code && isAcornNode(currentNode)) {
        const { start, end } = getStartAndEnd(currentNode, code.toString());
        code.overwrite(start, end, update.code);
      }

      return update.node;
    }
  };
}

/**
 * @param {import('estree').Node} ast
 * @param {import('./index.mjs').UnassertAstOptions} [options]
 * @returns {import('estree').Node}
 */
function unassertAst (ast, options) {
  return replace(ast, createVisitor(options));
}

/**
 * @overload
 * @param {string} code
 * @param {import('estree').Node} ast
 * @param {import('./index.mjs').UnassertCodeOptions} [options]
 * @returns {import('./index.mjs').UnassertCodeResult}
 */

/**
 * @overload
 * @param {MagicString} code
 * @param {import('estree').Node} ast
 * @param {import('./index.mjs').UnassertCodeOptions} [options]
 * @returns {MagicString}
 */

/**
 * @param {string|MagicString} code
 * @param {import('estree').Node} ast
 * @param {import('./index.mjs').UnassertCodeOptions} [options]
 * @returns {import('./index.mjs').UnassertCodeResult | MagicString}
 */
function unassertCode (code, ast, options) {
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
  const map = sourceMap
    ? magicCode.generateMap(sourceMap === true ? undefined : sourceMap)
    : null;

  return {
    code: unassertedCode,
    map
  };
}

/**
 * @returns {import('./index.mjs').UnassertAstOptions}
 */
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
  unassertCode,
  defaultOptions,
  createVisitor
};
