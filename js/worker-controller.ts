import { EventEmitter2 } from "eventemitter2";
import { IncomingModelWorkerMsg, ModelWorkerMsg } from "./plates-model/model-worker";

export type EventName = "output" | "savedModel";

class WorkerController {
  // Plate tectonics model, handles all the aspects of simulation which are not related to view and interaction.
  modelWorker = new window.Worker(`modelWorker.js${window.location.search}`);
  modelState = "notRequested";
  // Messages to model worker are queued before model is loaded.
  modelMessagesQueue: IncomingModelWorkerMsg[] = [];
  emitter = new EventEmitter2();

  constructor() {
    this.modelWorker.addEventListener("message", event => {
      const data: ModelWorkerMsg = event.data;
      if (data.type === "output") {
        if (this.modelState === "loading") {
          this.modelState = "loaded";
          this.postQueuedModelMessages();
        }
        this.emit("output", data.data);
      } else if (data.type === "savedModel") {
        this.emit("savedModel", data.data.savedModel);
      }
    });
  }

  emit(event: EventName, data: any) {
    this.emitter.emit(event, data);
  }

  on(event: EventName, handler: (data: any) => void) {
    this.emitter.on(event, handler);
  }

  postMessageToModel(data: IncomingModelWorkerMsg) {
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
