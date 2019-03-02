const { NODE_ENV } = process.env

module.exports = {
  testRegex:
    NODE_ENV === `development`
      ? `(/tests/development/.*\\.spec.js)$`
      : `/tests/enroll.spec.js`,
}