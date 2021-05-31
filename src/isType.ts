import {
  ASTNode,
  Identifier,
  JSXAttribute,
  JSXOpeningElement,
  Literal,
  SpreadElement,
} from 'jscodeshift';

export function isLiteral(node: ASTNode): node is Literal {
  return node.type === 'Literal';
}

export function isIdentifier(node: ASTNode): node is Identifier {
  return node.type === 'Identifier';
}

export function isJSXAttribute(node: ASTNode): node is JSXAttribute {
  return node.type === 'JSXAttribute';
}

export function isSpreadElement(node: ASTNode): node is SpreadElement {
  return node.type === 'SpreadElement';
}

export function isJSXOpenElement(node: ASTNode): node is JSXOpeningElement {
  return node.type === 'JSXOpeningElement';
}
