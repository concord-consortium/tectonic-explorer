import Sphere from '../peels/sphere';
import config from '../config';
import VoronoiSphere from './voronoi-sphere';
import { toCartesian } from '../geo-utils';
import { kdTree } from 'kd-tree-javascript';

function dist(a, b) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2);
}

const VORONOI_SPHERE_PRECISION = 200000;

class Grid {
  constructor() {
    this.sphere = new Sphere({divisions: config.divisions});
    this.fields = this.populateFields();
    this.kdTree = new kdTree(this.fields, dist, ['x', 'y', 'z']);
    this.voronoiSphere = new VoronoiSphere(VORONOI_SPHERE_PRECISION, this.kdTree);
  }

  populateFields() {
    const fields = [];
    this.sphere.fields.forEach(field => {
      const pos = toCartesian(field.position);
      fields.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        i: field.i // index
      });
    });
    return fields;
  }

  // point is expected to have .x, .y, .z properties.
  nearestFieldIdx(point) {
    if (config.optimizedCollisions) {
      // O(1), less accurate:
      return this.voronoiSphere.getNearestId(point);
    }
    // O(logn), accurate:
    return this.kdTree.nearest(point, 1)[0][0].i;
  }
}

const grid = new Grid();
export default grid;
