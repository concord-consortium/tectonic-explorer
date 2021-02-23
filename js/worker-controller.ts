import { EventEmitter2 } from "eventemitter2";

class WorkerController {
  // Plate tectonics model, handles all the aspects of simulation which are not related to view and interaction.
  modelWorker = new window.Worker(`modelWorker.js${window.location.search}`);
  modelState = "notRequested";
  // Messages to model worker are queued before model is loaded.
  modelMessagesQueue: any[] = [];
  emitter = new EventEmitter2();

  constructor () {
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

  emit (event: any, data: any) {
    this.emitter.emit(event, data);
  }

  on (event: any, handler: any) {
    this.emitter.on(event, handler);
  }

  postMessageToModel (data: any) {
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

  postQueuedModelMessages () {
    while (this.modelMessagesQueue.length > 0) {
      this.modelWorker.postMessage(this.modelMessagesQueue.shift());
    }
  }
}

export default new WorkerController();
