import React from "react";
import { Provider } from "mobx-react";
import Simulation from "./simulation";
import Authoring from "./authoring";
import IndexPage from "./index-page";
import { ModeWizard } from "./mode-wizard";
import { getURLParam } from "../utils";
import simulationStore from "../stores/simulation-store";

import "../../css/app.less";

const authoring = getURLParam("authoring");
const geode = getURLParam("geode");
const rocks = getURLParam("rocks");
const preset = getURLParam("preset");
const planetWizard = getURLParam("planetWizard");
const modelId = getURLParam("modelId");
const samples = getURLParam("samples");

function updateUrl(rocksMode?: boolean) {
  let url = window.location.href;
  if (rocksMode != null) {
    url = `${url}${url.indexOf("?") < 0 ? "?" : "&"}rocks=${rocksMode ? "true" : "false"}`;
  }
  // if there are no indications of what to load, reload the page with the planet wizard
  if (!preset && !modelId && !planetWizard) {
    url = `${url}${url.indexOf("?") < 0 ? "?" : "&"}planetWizard=true`;
  }
  document.location.href = url;
}

function handleSetRocksMode(rocksMode: boolean) {
  // give button highlight a chance to propagate
  setTimeout(() => updateUrl(rocksMode), 200);
}

const App = () => {
  if (authoring) {
    return <Authoring />;
  } else if (samples) {
    return <IndexPage />;
  } else if ((geode == null) && (rocks == null)) {
    return <ModeWizard onSetRocksMode={handleSetRocksMode}/>;
  } else if (preset || modelId || planetWizard) {
    return (
      <Provider simulationStore={simulationStore}>
        <Simulation />
      </Provider>
    );
  }

  // There are no indications of what to load, so reload the page with the planet wizard
  updateUrl();
  return null;
};

export default App;
