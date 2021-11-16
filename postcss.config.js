// This can also be stored in a separate file:
const reactToolboxVariables = {
  'preferred-font': 'Lato, verdana, arial, helvetica, sans-serif',
  'color-text': '#313131',
  'color-primary': '#F8C84E',
  'color-primary-dark': '#F8AB4E',
  'color-primary-contrast': '#313131'
}

module.exports = {
  plugins: {
    'postcss-cssnext': {
      features: {
        customProperties: {
          variables: reactToolboxVariables
        }
      }
    }
  }
}
