import firebase from "firebase/app";
import "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { ISerializedState } from "./stores/simulation-store";

export function initDatabase() {
  firebase.initializeApp({
    apiKey: "AIzaSyDtCksjwncWyhTsZkMkIzct--e-lo3YHZU",
    authDomain: "plate-tectonics-3d.firebaseapp.com",
    databaseURL: "https://plate-tectonics-3d.firebaseio.com",
    projectId: "plate-tectonics-3d",
    storageBucket: "plate-tectonics-3d.appspot.com",
    messagingSenderId: "89180504646"
  });
}

export function saveModelToCloud(serializedModel: ISerializedState, callback: (uuid: string) => void) {
  const db = firebase.database();
  const uuid = uuidv4();

  db.ref("models/" + uuid).set({
    // JSON.strignify + JSON.parse will remove all the undefined values from the object.
    // Firebase throws an error when a value is set to undefined explicitly.
    model: JSON.parse(JSON.stringify(serializedModel))
  }, function() {
    callback(uuid);
  });
}

export function loadModelFromCloud(modelId: string, callback: (state: ISerializedState) => void) {
  const db = firebase.database();
  const ref = db.ref("models/" + modelId);

  ref.once("value", function(data) {
    callback(data.val().model);
  });
}
