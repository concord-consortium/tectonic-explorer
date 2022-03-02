import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { observer, inject } from "mobx-react";
import { TabName } from "../types";
import { BaseComponent, IBaseProps } from "./base";
import { Button } from "react-toolbox/lib/button";
import FontIcon from "react-toolbox/lib/font_icon";
import config from "../config";
import { MapType } from "./keys/map-type";
import { RockTypes } from "./keys/rock-types";
import { SeismicData } from "./keys/seismic-data";
import { AdvancedOptions } from "./advanced-options";
import { log } from "../log";

import "react-tabs/style/react-tabs.less";
import css from "../../css-modules/side-container.less";


const TAB_ORDER: TabName[] = ["map-type", "seismic-data", "options"];

const OPTIONS_ENABLED = config.sidebar && config.sidebar.length > 0;

const tabEnabled = (name: TabName) => config.tabs.indexOf(name) !== -1;

interface IState { }

@inject("simulationStore")
@observer
export class SideContainer extends BaseComponent<IBaseProps, IState> {

  handleTabChange = (newTabIndex: number) => {
    const newTab = TAB_ORDER[newTabIndex];
    this.simulationStore.setSelectedTab(newTab);
    log({ action: "KeysAndOptionsTabChanged", data: { value: newTab } });
  };

  toggleKey = () => {
    const visible = !this.simulationStore.key;
    this.simulationStore.setKeyVisible(visible);
    log({ action: visible ? "KeysAndOptionsVisible" : "KeysAndOptionsHidden" });
  };

  renderKeyButton() {
    return (
      <Button className={css.keyToggleButton} onClick={this.toggleKey} ripple={false} data-test="key-toggle-button">
        <div className={css.keyIconContainer}>
          <FontIcon value="layers" />
        </div>
        <span className={css.label}>Keys and Options</span>
      </Button>
    );
  }

  renderTabs() {
    const selectedTabIndex = TAB_ORDER.indexOf(this.simulationStore.selectedTab);
    const { seismicDataVisible, planetWizard, crossSectionVisible, colormap, interaction } = this.simulationStore;
    // Don't show advanced options in Planet wizard, as user could mess up the settings that are
    // predefined for each Planet Wizard step.
    const advancedOptionsVisible = OPTIONS_ENABLED && !planetWizard && tabEnabled("options");
    const rockKeyVisible = crossSectionVisible || interaction === "crossSection" || interaction === "takeRockSample" || colormap === "rock";
    return (
      <div className={css.sideContainer}>
        <FontIcon className={css.closeIcon} value="close" onClick={this.toggleKey} data-test="key-close-button" />
        <Tabs className={css.tabs} selectedIndex={selectedTabIndex} onSelect={this.handleTabChange}>
          <TabList className={`react-tabs__tab-list ${css.tabList}`}>
            {
              tabEnabled("map-type") &&
              <Tab className={`${css.tab} ${css.mapTypeBorder}`} selectedClassName={css.tabSelected}>
                <div className={`${css.tabInsideContainer} ${css.mapType}`}>Map Type</div>
              </Tab>
            }
            {
              tabEnabled("seismic-data") &&
              <Tab className={`${css.tab} ${css.seismicDataBorder} ${seismicDataVisible ? "" : css.disabled}`} selectedClassName={css.tabSelected} disabled={!seismicDataVisible}>
                <div className={`${css.tabInsideContainer} ${css.seismicData}`}>Seismic Data</div>
              </Tab>
            }
            {
              advancedOptionsVisible &&
              <Tab className={`${css.tab} ${css.optionsBorder}`} selectedClassName={css.tabSelected}>
                <div className={`${css.tabInsideContainer} ${css.options}`}>Options</div>
              </Tab>
            }
          </TabList>
          {
            tabEnabled("map-type") &&
            <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.mapTypeBorder}`}>
              <MapType />
              { rockKeyVisible && <RockTypes /> }
            </TabPanel>
          }
          {
            tabEnabled("seismic-data") &&
            <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.seismicDataBorder}`}>
              <SeismicData />
            </TabPanel>
          }
          {
            advancedOptionsVisible &&
            <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.optionsBorder}`}>
              <AdvancedOptions />
            </TabPanel>
          }
        </Tabs>
      </div>
    );
  }

  render() {
    if (!this.simulationStore.key) {
      return this.renderKeyButton();
    }
    return this.renderTabs();
  }
}
