import React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { observer, inject } from "mobx-react";
import { TabName } from "../types";
import { BaseComponent, IBaseProps } from "./base";
import { Button } from "react-toolbox/lib/button";
import FontIcon from "react-toolbox/lib/font_icon";
import config from "../config";
import { MapType } from "./keys/map-type";

import "react-tabs/style/react-tabs.less";
import css from "../../css-modules/side-container.less";
import { RockTypes } from "./keys/rock-types";
import { SeismicData } from "./keys/seismic-data";
import { AdvancedOptions } from "./advanced-options";

const TAB_ORDER: TabName[] = ["map-type", "seismic-data", "options"];

const OPTIONS_ENABLED = config.sidebar && config.sidebar.length > 0;

const tabEnabled = (name: TabName) => config.tabs.indexOf(name) !== -1;

interface IState { }

@inject("simulationStore")
@observer
export class SideContainer extends BaseComponent<IBaseProps, IState> {

  handleTabChange = (newTabIndex: number) => {
    this.simulationStore.setSelectedTab(TAB_ORDER[newTabIndex]);
  };

  toggleKey = () => {
    this.simulationStore.setKeyVisible(!this.simulationStore.key);
  };

  renderKeyButton() {
    return (
      <Button className={css.keyToggleButton} onClick={this.toggleKey} data-test="key-toggle-button">
        <div className={css.keyIconContainer}>
          <FontIcon value="layers" />
        </div>
        <span className={css.label}>Keys and Options</span>
      </Button>
    );
  }

  renderTabs() {
    const selectedTabIndex = TAB_ORDER.indexOf(this.simulationStore.selectedTab);
    const { seismicDataVisible } = this.simulationStore;
    return (
      <>
        <FontIcon className={css.closeIcon} value="close" onClick={this.toggleKey} data-test="key-close-button" />
        <Tabs className={css.tabs} selectedIndex={selectedTabIndex} onSelect={this.handleTabChange}>
          <TabList className={`react-tabs__tab-list ${css.tabList}`}>
            {
              tabEnabled("map-type") &&
              <Tab className={`${css.tab} ${css.mapTypeBorder}`} selectedClassName={css.tabSelected}>
                <div className={css.tabInsideContainer}>Map Type</div>
              </Tab>
            }
            {
              tabEnabled("seismic-data") &&
              <Tab className={`${css.tab} ${css.seismicDataBorder} ${seismicDataVisible ? "" : css.disabled}`} selectedClassName={css.tabSelected} disabled={!seismicDataVisible}>
                <div className={css.tabInsideContainer}>Seismic Data</div>
              </Tab>
            }
            {
              OPTIONS_ENABLED && tabEnabled("options") &&
              <Tab className={`${css.tab} ${css.optionsBorder}`} selectedClassName={css.tabSelected}>
                <div className={css.tabInsideContainer}>Options</div>
              </Tab>
            }
          </TabList>
          {
            tabEnabled("map-type") &&
            <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.mapTypeBorder}`}>
              <MapType />
              <RockTypes />
            </TabPanel>
          }
          {
            tabEnabled("seismic-data") &&
            <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.seismicDataBorder}`}>
              <SeismicData />
            </TabPanel>
          }
          {
            OPTIONS_ENABLED && tabEnabled("options") &&
            <TabPanel className={`react-tabs__tab-panel ${css.tabPanel} ${css.optionsBorder}`}>
              <AdvancedOptions />
            </TabPanel>
          }
        </Tabs>
      </>
    );
  }

  render() {
    if (!this.simulationStore.key) {
      return this.renderKeyButton();
    }
    return this.renderTabs();
  }
}
