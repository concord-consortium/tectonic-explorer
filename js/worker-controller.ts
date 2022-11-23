import { EventEmitter2 } from "eventemitter2";
import { IncomingModelWorkerMsg, isResponseMsg, ModelWorkerMsg } from "./plates-model/model-worker";
import * as THREE from "three";
import { ISerializedField } from "./plates-model/field";

export type EventName = ModelWorkerMsg["type"];
export type ResponseHandler = (response: any) => void;

let _requestId = 0;
const getRequestId = () => ++_requestId;

class WorkerController {
  // Plate tectonics model, handles all the aspects of simulation which are not related to view and interaction.
  modelWorker = new window.Worker(`modelWorker.js${window.location.search}`);
  modelState = "notRequested";
  // Messages to model worker are queued before model is loaded.
  modelMessagesQueue: IncomingModelWorkerMsg[] = [];
  emitter = new EventEmitter2();
  responseHandlers: Record<number, ResponseHandler> = {};

  constructor() {
    this.modelWorker.addEventListener("message", event => {
      const data: ModelWorkerMsg = event.data;
      if (isResponseMsg(data)) {
        this.responseHandlers[data.requestId](data.response);
        delete this.responseHandlers[data.requestId];
      } else if (data.type === "output") {
        if (this.modelState === "loading") {
          this.modelState = "loaded";
          this.postQueuedModelMessages();
        }
        this.emit("output", data.data);
      } else {
        // Other messages don't require any special handling.
        this.emit(data.type, (data as any).data);
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

  // Helper functions that wrap postMessageToModel calls.
  getFieldInfo(position: THREE.Vector3, logOnly = false): Promise<ISerializedField> {
    return new Promise<ISerializedField>(resolve => {
      const requestId = getRequestId();
      this.responseHandlers[requestId] = resolve;
      this.postMessageToModel({ type: "fieldInfo", props: { position, logOnly }, requestId });
    });
  }
}

export default new WorkerController();
