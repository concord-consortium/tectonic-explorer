import React from "react";
import { Provider } from "mobx-react";
import Simulation from "./simulation";
import Authoring from "./authoring";
import IndexPage from "./index-page";
import { getURLParam } from "../utils";
import simulationStore from "../stores/simulation-store";

import "../../css/app.less";

const authoring = getURLParam("authoring");
const preset = getURLParam("preset");
const planetWizard = getURLParam("planetWizard");
const modelId = getURLParam("modelId");
const samples = getURLParam("samples");

const App = () => {
  if (authoring) {
    return <Authoring />;
  } else if (samples) {
    return <IndexPage />;
  } else if (preset || modelId || planetWizard) {
    return (
      <Provider simulationStore={simulationStore}>
        <Simulation />
      </Provider>
    );
  }

  // There are no indications of what to load, so reload the page with the planet wizard
  let url = window.location.href;
  url += (url.indexOf("?") > -1 ? "&" : "?") + "planetWizard=true";
  document.location.href = url;
  return null;
};

export default App;
