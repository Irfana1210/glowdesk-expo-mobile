module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow object exports (e.g., `export {}` or `export { something }`)",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    schema: [],
    messages: {
      noObjectExports: "Object exports are not allowed. Remove this export.",
    },
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (!node.source && node.specifiers.length > 0) {
          context.report({
            node,
            messageId: "noObjectExports",
            fix(fixer) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return fixer.remove(node);
            },
          });
        }
      },
    };
  },
};
