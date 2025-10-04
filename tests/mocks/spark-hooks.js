const React = require('react')

module.exports = {
  useKV: (key, initial) => {
    // Mirror a simple React useState hook so components render reactively in tests
    const init = typeof initial === 'function' ? initial() : initial
    return React.useState(init)
  },
}
