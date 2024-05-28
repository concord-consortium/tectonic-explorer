import { FirebaseApp, initializeApp } from "firebase/app";
import { set, ref, onValue, getDatabase } from "firebase/database";
import { ISerializedState } from "./stores/simulation-store";
import { v4 as uuidv4 } from "uuid";

let app: FirebaseApp | null = null;

export function initDatabase() {
  app = initializeApp({
    apiKey: atob("QUl6YVN5RHRDa3Nqd25jV3loVHNaa01rSXpjdC0tZS1sbzNZSFpV"),
    authDomain: "plate-tectonics-3d.firebaseapp.com",
    databaseURL: "https://plate-tectonics-3d.firebaseio.com",
    projectId: "plate-tectonics-3d",
    storageBucket: "plate-tectonics-3d.appspot.com",
    messagingSenderId: "89180504646"
  });
}

export function saveModelToCloud(serializedModel: ISerializedState, callback: (uuid: string) => void) {
  if (!app) {
    return;
  }
  const db = getDatabase(app);
  const uuid = uuidv4();

  const dbRef = ref(db, "models/" + uuid);
  set(dbRef, {
    // JSON.stringify + JSON.parse will remove all the undefined values from the object.
    // Firebase throws an error when a value is set to undefined explicitly.
    model: JSON.parse(JSON.stringify(serializedModel))
  }).then(() => {
    callback(uuid);
  });
}

export function loadModelFromCloud(modelId: string, callback: (state: ISerializedState) => void) {
  if (!app) {
    return;
  }
  const db = getDatabase(app);
  const dbRef = ref(db, "models/" + modelId);

  onValue(dbRef, (data) => {
    callback(data.val().model);
  }, {
    onlyOnce: true
  });
}
