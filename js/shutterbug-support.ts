import Shutterbug from "shutterbug";
import { CROSS_SECTION_CANVAS_ID } from "./plates-view/cross-section-3d";
import { PLANET_VIEW_CANVAS_ID } from "./plates-view/planet-view";

export function enableShutterbug(appClassName: string) {
  Shutterbug.enable("." + appClassName);
  Shutterbug.on("saycheese", beforeSnapshotHandler);
}

export function disableShutterbug() {
  Shutterbug.disable();
  Shutterbug.off("saycheese", beforeSnapshotHandler);
}

function beforeSnapshotHandler() {
  // It's necessary re-render 3D canvas when snapshot is taken, so .toDataUrl returns the correct image.
  // All the WebGL canvases should have class canvas-3d and expose .render() function.
  Array.from(document.querySelectorAll(".canvas-3d")).forEach((canvas: HTMLCanvasElement) => {
    if ((canvas as any).render) {
      (canvas as any).render();
    }
  });
}

export function takeSnapshot(selectorOrDomElement: string | HTMLElement) {
  return new Promise((resolve, reject) => {
    Shutterbug.snapshot({
      selector: selectorOrDomElement,
      done: (snapshotUrl: string) => {
        resolve(snapshotUrl);
      },
      fail: (jqXHR: any, textStatus: string, errorThrown: any) => {
        console.error("Shutterbug request failed", textStatus, errorThrown);
        reject(errorThrown);
      }
    });
  });
}

export function takePlanetViewSnapshot() {
  return takeSnapshot(`#${PLANET_VIEW_CANVAS_ID}`);
}

export function takeCrossSectionSnapshot() {
  const canvas = document.getElementById(CROSS_SECTION_CANVAS_ID);
  let oldBgColor = "";
  if (canvas) {
    oldBgColor = canvas.style.backgroundColor;
    canvas.style.backgroundColor = "black";
  }
  const promise = takeSnapshot(`#${CROSS_SECTION_CANVAS_ID}`);
  if (canvas) {
    canvas.style.backgroundColor = oldBgColor;
  }
  return promise;
}

