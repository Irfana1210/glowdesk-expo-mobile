const noObjectExports = require("./no-object-exports");
const inlineIfToScoped = require("./inline-if-to-scoped");

module.exports = {
  rules: {
    "no-object-exports": noObjectExports,
    "inline-if-to-scoped": inlineIfToScoped,
  },
};
