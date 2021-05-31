import { ExpressionKind } from 'ast-types/gen/kinds';
import {
  API,
  ASTNode,
  ASTPath,
  CallExpression,
  Collection,
  FileInfo,
  Identifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  JSXAttribute,
  JSXElement,
  JSXIdentifier,
  JSXOpeningElement,
  Literal,
  LogicalExpression,
  StringLiteral,
  SpreadElement,
} from 'jscodeshift';
import parseAccessor from './findListAccessor';

function isJSXOpenElement(node: ASTNode): node is JSXOpeningElement {
  return node.type === 'JSXOpeningElement';
}

const LODASH_PACKAGE_NAME = 'lodash';

const enum Identifiers {
  FormItemIdentifier = 'FormItem',
  FormItemNameAttribute = 'name',
  FormItemRulesField = 'rules',
  FOrmItemInitialValueField = 'initialValue',
}

function isLiteral(node: ASTNode): node is Literal {
  return node.type === 'Literal';
}

function isIdentifier(node: ASTNode): node is Identifier {
  return node.type === 'Identifier';
}

function isJSXAttribute(node: ASTNode): node is JSXAttribute {
  return node.type === 'JSXAttribute';
}

function isSpreadElement(node: ASTNode): node is SpreadElement {
  return node.type === 'SpreadElement';
}

/**
 * find import {get} from 'lodash'
 *
 * @param ast
 */
const findDestructedImport = (ast: Collection) => {
  const found = ast
    .find(ImportDeclaration, {
      source: {
        value: LODASH_PACKAGE_NAME,
      },
    })
    .find(ImportSpecifier, { imported: { name: 'get' } });

  if (found.length) {
    const node = found.get();
    return node.value.imported.name;
  }
};

/**
 * find import get(or alias) from 'lodash/get'
 * @param ast
 * @returns
 */
const findFileImport = (ast: Collection) => {
  const found = ast
    .find(ImportDeclaration, {
      source: {
        value: [LODASH_PACKAGE_NAME, 'get'].join('/'),
      },
    })
    .find(ImportSpecifier);

  if (found.length) {
    console.log(found);
    const node = found.get();
    return node.value.name;
  }
};

/**
 * find import lodash 'lodash'
 * @param ast
 * @returns
 */
const findDefaultImport = (ast: Collection) => {
  const found = ast
    .find(ImportDeclaration, {
      source: {
        value: LODASH_PACKAGE_NAME,
      },
    })
    .find(ImportDefaultSpecifier);

  if (found.length) {
    const node = found.get();
    return node.value.name;
  }
};
const generateOptionalChainingNode = (
  api: API,
  ast: Collection,
  astPath: ASTPath<CallExpression>
) => {
  const {
    optionalMemberExpression,
    logicalExpression,
    identifier,
    numericLiteral,
  } = api.jscodeshift;

  const args = astPath.node.arguments as ExpressionKind[];

  // 暂时不处理解构的情况
  if (args.some(isSpreadElement)) {
    return astPath.node;
  }

  const hasDefaultValue = !!args[2];
  const target = args[0];
  const propertyPath = args[1];
  let ret = target;

  if (isLiteral(propertyPath)) {
    const tokens = (<string>propertyPath.value).split('.');

    while (tokens.length) {
      const token = tokens.shift();
      const { memberAccessor, propertyAccessor } = parseAccessor(token);

      if (propertyAccessor) {
        ret = optionalMemberExpression(ret, identifier(propertyAccessor));
      }

      if (memberAccessor) {
        ret = optionalMemberExpression(
          ret,
          numericLiteral(Number(memberAccessor)),
          true
        );
      }
    }
  }

  // 暂时跳过path为变量的情况   get(aaa, path, 'tt');
  if (isIdentifier(propertyPath)) {
    console.log(propertyPath);
    astPath.scope;
  }

  if (hasDefaultValue) {
    ret = logicalExpression('??', ret, args[2]);
  }

  return ret;
};

export default (fileInfo: FileInfo, api: API, options: any) => {
  const ast = api.jscodeshift(fileInfo.source);

  let found;
  found = findDestructedImport(ast);

  console.log(found);
  if (found) {
    ast
      .find(CallExpression, { callee: { name: found } })
      .forEach((expression) => {
        const replaced = generateOptionalChainingNode(api, ast, expression);

        expression.replace(replaced);
      });
  }

  findFileImport(ast);

  findDefaultImport(ast);

  return ast.toSource();
};
