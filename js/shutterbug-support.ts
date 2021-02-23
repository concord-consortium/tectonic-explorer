import Shutterbug from "shutterbug";

export function enableShutterbug(appClassName: any) {
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
  Array.from(document.querySelectorAll(".canvas-3d")).forEach(canvas => {
    if ((canvas as any).render) {
      (canvas as any).render();
    }
  });
}
