const postcssPresetEnv = require('postcss-preset-env')

// This can also be stored in a separate file:
const reactToolboxVariables = {
  'preferred-font': 'museo-sans, verdana, arial, helvetica, sans-serif',
  'color-text': '#313131',
  'color-primary': '#F8C84E',
  'color-primary-dark': '#F8AB4E',
  'color-primary-contrast': '#313131'
}

const config = () => ({
  plugins: [
     postcssPresetEnv ({
      stage: 0,
      importFrom: [{
        customProperties: reactToolboxVariables
       }],
       preserve: false
    })
  ]
})

module.exports = config
