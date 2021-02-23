import React, { Component } from "react";
import { autorun, observable, action, makeObservable } from "mobx";
import { inject, observer } from "mobx-react";
// Check performance every X second (when config.benchmark = true)
const BENCHMARK_INTERVAL = 3000; // ms
@inject("simulationStore")
@observer
export default class Benchmark extends Component {
    benchmarkPrevStepIdx: any;
    benchmarkPrevTime: any;
    disposeObserver: any;
    @observable
    stepsPerSecond = 0;

    constructor(props: any) {
      super(props);
      makeObservable(this);
    }

    componentDidMount() {
      this.benchmarkPrevStepIdx = 0;
      this.benchmarkPrevTime = 0;
      this.disposeObserver = autorun(() => {
        this.updateBenchmark((this.props as any).simulationStore.model.stepIdx);
      });
    }

    componentWillUnmount() {
      this.disposeObserver();
    }

    updateBenchmark(stepIdx: any) {
      action(() => {
        const now = window.performance.now();
        if (now - this.benchmarkPrevTime > BENCHMARK_INTERVAL) {
          this.stepsPerSecond = 1000 * (stepIdx - this.benchmarkPrevStepIdx) / (now - this.benchmarkPrevTime);
          this.benchmarkPrevStepIdx = stepIdx;
          this.benchmarkPrevTime = now;
        }
      })();
    }

    render() {
      return (<div className="benchmark">model steps per second: { this.stepsPerSecond.toFixed(2) }</div>);
    }
}
