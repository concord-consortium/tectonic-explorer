import { EventEmitter2 } from "eventemitter2";
import { ModelWorkerMsg } from "./plates-model/model-worker";

export type EventName = "output" | "savedModel";

class WorkerController {
  // Plate tectonics model, handles all the aspects of simulation which are not related to view and interaction.
  modelWorker = new window.Worker(`modelWorker.js${window.location.search}`);
  modelState = "notRequested";
  // Messages to model worker are queued before model is loaded.
  modelMessagesQueue: ModelWorkerMsg[] = [];
  emitter = new EventEmitter2();

  constructor() {
    this.modelWorker.addEventListener("message", event => {
      const type = event.data.type;
      if (type === "output") {
        if (this.modelState === "loading") {
          this.modelState = "loaded";
          this.postQueuedModelMessages();
        }
        this.emit("output", event.data.data);
      } else if (type === "savedModel") {
        this.emit("savedModel", event.data.data.savedModel);
      }
    });
  }

  emit(event: EventName, data: (data: any) => void) {
    this.emitter.emit(event, data);
  }

  on(event: EventName, handler: (data: any) => void) {
    this.emitter.on(event, handler);
  }

  postMessageToModel(data: ModelWorkerMsg) {
    // Most of the messages require model to exist. If it doesn't, queue messages and send them when it's ready.
    if (this.modelState === "loaded" || data.type === "loadModel" || data.type === "loadPreset" || data.type === "unload") {
      this.modelWorker.postMessage(data);
      if (data.type === "loadModel" || data.type === "loadPreset") {
        this.modelState = "loading";
      }
    } else {
      this.modelMessagesQueue.push(data);
    }
  }

  postQueuedModelMessages() {
    while (this.modelMessagesQueue.length > 0) {
      this.modelWorker.postMessage(this.modelMessagesQueue.shift());
    }
  }
}

export default new WorkerController();
