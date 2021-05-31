import { ExpressionKind } from 'ast-types/gen/kinds';
import {
  API,
  ASTPath,
  CallExpression,
  Collection,
  FileInfo,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
} from 'jscodeshift';
import parseAccessor from './findListAccessor';
import { isIdentifier, isLiteral, isSpreadElement } from './isType';

const LODASH_PACKAGE_NAME = 'lodash';

const enum Identifiers {
  FormItemIdentifier = 'FormItem',
  FormItemNameAttribute = 'name',
  FormItemRulesField = 'rules',
  FOrmItemInitialValueField = 'initialValue',
}
type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

type CallExpressionPredicate = (col: Collection) => DeepPartial<CallExpression>;

/**
 * find import {get} from 'lodash'
 *
 * @param ast
 */
const findDestructedImport: CallExpressionPredicate = (ast) => {
  const found = ast
    .find(ImportDeclaration, {
      source: {
        value: LODASH_PACKAGE_NAME,
      },
    })
    .find(ImportSpecifier, { imported: { name: 'get' } });

  if (found.length) {
    const node = found.get();
    return { callee: { name: node.value.imported.name } };
  }
};

/**
 * find import get (or alias) from 'lodash/get'
 * @param ast
 * @returns
 */
const findFileImport: CallExpressionPredicate = (ast) => {
  const found = ast
    .find(ImportDeclaration, {
      source: {
        value: [LODASH_PACKAGE_NAME, 'get'].join('/'),
      },
    })
    .find(ImportDefaultSpecifier);

  if (found.length) {
    const node = found.get();

    return { callee: { name: node.value.local.name } };
  }
};

/**
 * find import lodash from 'lodash'
 * @param ast
 * @returns
 */
const findDefaultImport: CallExpressionPredicate = (ast) => {
  const found = ast
    .find(ImportDeclaration, {
      source: {
        value: LODASH_PACKAGE_NAME,
      },
    })
    .find(ImportDefaultSpecifier);

  if (found.length) {
    const node = found.get();

    return {
      callee: {
        object: { name: node.value.local.name },
        property: { name: 'get' },
      },
    };
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

  [findDefaultImport, findFileImport, findDestructedImport]
    .map((func) => func(ast))
    .filter(Boolean)
    .forEach((predicate) => {
      ast.find(CallExpression, predicate).forEach((expression) => {
        const replaced = generateOptionalChainingNode(api, ast, expression);

        expression.replace(replaced);
      });
    });

  return ast.toSource();
};
