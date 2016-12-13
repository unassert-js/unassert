/**
 * unassert
 *   Encourage reliable programming by writing assertions in production code, and compiling them away from release
 *
 * https://github.com/unassert-js/unassert
 *
 * Copyright (c) 2015-2016 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/2015-2016
 */
'use strict';

var estraverse = require('estraverse');
var syntax = estraverse.Syntax;
var escallmatch = require('escallmatch');
var esutils = require('esutils');
var objectAssign = require('object-assign');
var defaultOptions = require('./lib/default-options');
var createRequireMatcher = require('./lib/create-require-matcher');
var createImportMatcher = require('./lib/create-import-matcher');

function matches (node) {
    return function (matcher) {
        return matcher.test(node);
    };
}

function isBodyOfIfStatement (parentNode, key) {
    return parentNode.type === syntax.IfStatement && (key === 'consequent' || key === 'alternate');
}

function isBodyOfIterationStatement (parentNode, key) {
    return esutils.ast.isIterationStatement(parentNode) && key === 'body';
}

function isNonBlockChildOfIfStatementOrLoop (currentNode, parentNode, key) {
    return currentNode.type === syntax.ExpressionStatement &&
        currentNode.expression.type === syntax.CallExpression &&
        (isBodyOfIfStatement(parentNode, key) || isBodyOfIterationStatement(parentNode, key));
}

function compileMatchers (options) {
    var config = objectAssign(defaultOptions(), options);
    return {
        imports: config.importPatterns.map(createImportMatcher),
        requires: config.requirePatterns.map(createRequireMatcher),
        assertions: config.assertionPatterns.map(escallmatch)
    };
}

function createVisitorByMatchers (matchers) {
    var pathToRemove = {};
    return {
        enter: function (currentNode, parentNode) {
            var espathToRemove;
            switch (currentNode.type) {
            case syntax.ImportDeclaration:
                if (matchers.imports.some(matches(currentNode))) {
                    espathToRemove = this.path().join('/');
                    pathToRemove[espathToRemove] = true;
                    this.skip();
                }
                break;
            case syntax.VariableDeclarator:
                if (matchers.requires.some(matches(currentNode))) {
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
            case syntax.AssignmentExpression:
                if (parentNode.type === syntax.ExpressionStatement &&
                    matchers.requires.some(matches(currentNode))) {
                    // remove parent ExpressionStatement
                    espathToRemove = this.path().slice(0, -1).join('/');
                    pathToRemove[espathToRemove] = true;
                    this.skip();
                }
                break;
            case syntax.CallExpression:
                if (parentNode.type === syntax.ExpressionStatement &&
                    matchers.assertions.some(matches(currentNode))) {
                    // remove parent ExpressionStatement
                    // body/1/body/body/0/expression -> body/1/body/body/0
                    espathToRemove = this.path().slice(0, -1).join('/');
                    pathToRemove[espathToRemove] = true;
                    this.skip();
                }
                break;
            }
        },
        leave: function (currentNode, parentNode) {
            var path = this.path();
            if (path && pathToRemove[path.join('/')]) {
                var key = path[path.length - 1];
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

var defaultMatchers = compileMatchers();

function unassert (ast) {
    return estraverse.replace(ast, createVisitorByMatchers(defaultMatchers));
}

function createVisitor (options) {
    return createVisitorByMatchers(compileMatchers(options));
}

unassert.defaultOptions = defaultOptions;
unassert.createVisitor = createVisitor;
module.exports = unassert;
