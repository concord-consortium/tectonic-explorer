import React, { PureComponent } from "react";
import Copyright from "./copyright";
import config from "../config";

export default class AboutDialogContent extends PureComponent {
  render() {
    return (
      <div>
        <p>
          Geologists use models to explore the mechanisms and physical processes that shape Earth’s surface. This model
          allows you to explore how the movement of tectonic plates and their interactions shape a planet’s surface
          features, such as mountains, trenches, and volcanoes. The tectonic mechanisms in this model are similar to
          the forces that continue to shape Earth today.
        </p>
        <p>
          First, choose between the Plate Tectonics and the Plate Tectonics Plus Rock Formation versions of the
          Tectonic Explorer. The Plate Tectonics version features tectonic plate interactions with a synced
          cross-section. The Plate Tectonics Plus Rock Formation version includes an exploration of rock distribution
          and the environments in which different rock types form.
        </p>
        {
          config.planetWizard &&
          <p>
            Use the Planet Wizard to set up a model planet. Select the number of plates, draw continents, assign forces
            to the plates, and change the plate densities. Click the play button to see how the plates interact with
            each other. How do density differences affect plate interactions?
          </p>
        }
        <p>
          Click the play button to see how tectonic plates interact with each other. Rotate the planet to see what’s
          happening on the other side. How does the surface change as plates interact?
        </p>
        <p>
          Make a cross-section to see a three-dimensional view of a region below the surface. How do interactions
          at the surface of the model planet reflect what is happening below the surface? Use this model to gain an
          understanding of how tectonic forces on Earth’s crust caused by plate movements have changed Earth’s surface
          features over time.
        </p>
        <p>
          Tectonic Explorer was created by&nbsp;
          <a href="https://github.com/pjanik" target="_blank" rel="noreferrer">Piotr Janik</a>
          &nbsp;from&nbsp;
          <a href="https://concord.org" target="_blank" rel="noreferrer">The Concord Consortium</a>
          &nbsp;and was developed under&nbsp;
          <a href="https://nsf.gov/" target="_blank" rel="noreferrer">National Science Foundation</a>
          &nbsp;grants DRL-1621176 and DRL-2006144.
        </p>
        <div style={{ fontSize: "13px", marginTop: "15px" }}>
          <Copyright />
        </div>
      </div>
    );
  }
}
