import { TokenServiceClient, S3Resource } from "@concord-consortium/token-service";
import { FirebaseApp, initializeApp } from "firebase/app";
import { ref, onValue, getDatabase } from "firebase/database";
import pako from "pako";
import S3 from "aws-sdk/clients/s3";
import { ISerializedState } from "./stores/simulation-store";

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

function showError(message: string, error: any) {
  console.error(`⚠️ ${message}`, error);
  alert(`${message} ${error}`);
}

export function saveModelToCloud(serializedModel: ISerializedState, callback: (id: string) => void) {
  saveCompressedModelToS3(serializedModel)
    .then((id) => {
      callback(id);
    })
    .catch((error) => {
      showError("Failed to save model to the cloud.", error);
    });
}

export function loadModelFromCloud(modelId: string, callback: (state?: ISerializedState) => void) {
  const url = `https://models-resources.concord.org/te-models/${modelId}/model.json.gz`;

  console.info("📦 Attempting to load model from S3...");

  fetch(url)
  .then((response) => {
    if (response.ok) {
      console.info("📦 Loaded model from S3.");
      return response.json();
    } else {
      console.info("🔥 Falling back to loading model from Firebase...");
      return fallbackToLoadFromFirebase(modelId);
    }
  })
  .then((data) => {
    callback(data);
  })
  .catch((error) => {
    showError("Failed to load model from the cloud.", error);
  });
}

// THIS WILL BE REMOVED IN PHASE 2
function fallbackToLoadFromFirebase(modelId: string): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    if (!app) {
      reject("Firebase app is not initialized.");
      return;
    }
    const db = getDatabase(app);
    const dbRef = ref(db, "models/" + modelId);

    onValue(dbRef, (data) => {
      if (data.exists()) {
        console.info("🔥 Loaded model from Firebase.");
        resolve(data.val().model);
      } else {
        reject("Model not found.");
      }
    }, {
      onlyOnce: true
    })
  });
}

async function saveCompressedModelToS3(serializedModel: ISerializedState): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    try {
      const client = new TokenServiceClient({ env: "production" });
      const filename = "model.json.gz";
      const resource: S3Resource = await client.createResource({
        tool: "te-models",
        type: "s3Folder",
        name: filename,
        description: "Created by TE simulation",
        accessRuleType: "readWriteToken"
      }) as S3Resource;
      const readWriteToken = client.getReadWriteToken(resource) || "";
      const credentials = await client.getCredentials(resource.id, readWriteToken);

      // S3 configuration is based both on resource and credentials info.
      const { bucket, region } = resource;
      const { accessKeyId, secretAccessKey, sessionToken } = credentials;
      const s3 = new S3({ region, accessKeyId, secretAccessKey, sessionToken });
      const publicPath = client.getPublicS3Path(resource, filename);

      // Compress the model using pako (Gzip) into a blob for uploading
      const data = JSON.stringify(serializedModel);
      const compressedData = pako.gzip(data);
      const blob = new Blob([compressedData], { type: "application/gzip" });

      await s3.upload({
        Bucket: bucket,
        Key: publicPath,
        Body: blob,
        ContentType: "application/json",
        ContentEncoding: "gzip",
        CacheControl: "public, max-age=31536000, immutable", // Cache forever (1 year)
      }).promise();

      resolve(resource.id);
    } catch (error) {
      reject(error);
    }
  });
}