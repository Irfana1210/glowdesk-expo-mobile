module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Convert inline `if` statements into scoped blocks",
      category: "Best Practices",
      recommended: false,
    },
    fixable: "code",
    schema: [],
    messages: {
      convertToScopedIf: "Convert inline `if` statement to a scoped block.",
    },
  },
  create(context) {
    return {
      IfStatement(node) {
        if (node.consequent && node.consequent.type !== "BlockStatement") {
          context.report({
            node: node.consequent,
            messageId: "convertToScopedIf",
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              const consequentText = sourceCode.getText(node.consequent);

              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return fixer.replaceText(
                node.consequent,
                `{ ${consequentText} }`,
              );
            },
          });
        }
      },
    };
  },
};
