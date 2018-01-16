import React, { PureComponent } from 'react'
import config from '../config'

export default class AboutDialogContent extends PureComponent {
  render () {
    return (
      <div>
        <p>
          Geologists use models to explore the mechanisms and physical processes that shape Earth’s surface.
          How can this model help explain past and current movements tectonic plates are responsible for most surface features and events on Earth?
        </p>
        {
          config.planetWizard &&
          <p>
            Set up an Earth-like planet. Click the play button to see how plates interact. Change direction of plate motion,
            change location of continents, learn how density influences plate interactions.
          </p>
        }
        <p>
          Make a cross-section to see a three-dimensional view a region below Earth’s surface. How do interactions at
          the surface of the Earth-like planet reflect what is happening below Earth’s surface?
        </p>
        <p>
          Use this model to set up different starting scenarios to gain an understanding of how forces on Earth’s crust
          caused by plate tectonic movements have change Earth’s surface features over time.
        </p>
        <p>
          Seismic Explorer is created
          by <a href='https://github.com/pjanik' target='_blank'>Piotr Janik</a> from <a href='https://concord.org' target='_blank'>the Concord Consortium.</a>
        </p>
      </div>
    )
  }
}
