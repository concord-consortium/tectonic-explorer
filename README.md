# Tectonic Explorer

Latest **stable** version:

https://tectonic-explorer.concord.org

A particular model can be loaded using `preset` URL parameter, e.g.:

https://tectonic-explorer.concord.org/index.html?preset=continentalCollision1

Latest **development** version:

https://tectonic-explorer.concord.org/branch/master/index.html

Old versions can be accessed via `/version/<tag>` path, e.g.:

https://tectonic-explorer.concord.org/version/0.1.0/index.html

Example models, samples and tests:

https://tectonic-explorer.concord.org?samples

## Configuration

Some options can be set using URL parameters, for example:

- use wireframe rendering: https://tectonic-explorer.concord.org/?preset=continentalCollision1&wireframe=true 
- render force arrows: https://tectonic-explorer.concord.org/?preset=continentalCollision1&renderForces=true
- disable velocity arrows: https://tectonic-explorer.concord.org/?preset=continentalCollision1&renderVelocities=false

All the available options can be seen here:

https://github.com/concord-consortium/tectonic-explorer/blob/master/js/config.js

## Model overview

This model simulates following geological processes:
- subduction and related volcanic activity
- continental collision and orogeny
- forming of a new oceanic crust at divergent boundaries

Plates are modeled as rigid bodies that rotate around the center of a planet.
Plate motion is enforced by "hot spots" - forces applied at some fixed point (torque).
Hot spots (not to be confused with geological hotspots) exist only for a brief period of 
time and they disappear later. There's very little general friction, so plates will drift for 
a long time or until two continents collide with each other. 
When two continents collide, there's a very strong drag force applied to the overlapping surface,
so plates will stop or their velocities will become the same (e.g. one plate can push another one).
Subduction doesn't generate any forces (slab pull forces can be considered in the future).
Every plate has pretty accurate moment of inertia tensor, based on its structure and shape,
so collisions and resulting motion is quite realistic.

Plates are built from small, hexagonal fields that hold various geological properties, e.g.:
- crust type (oceanic or continental)
- elevation (it can be changed by volcanic activity or orogeny)
- geological data describing processes like subduction, volcanic activity or orogeny

Every step of the simulation consists of:
1. Physics engine calculations (updates forces and torques, angular accelerations, angular velocities, mass of inertia tensors, etc.)
2. Interactions between plates and fields, e.g. collision detection
3. Geological processes update (subduction, volcanic activity or orogeny)
4. Generation of new fields at the divergent boundaries

## Presets (test cases)

All the test cases listed on the index page are defined in `js/presets.js` file.
Single test case is defined by an image file and an init script that modifies plate properties (adds hot spots).
Image file defines all the plates and initial boundaries using colors. 
While working on input data, HSV colors should be used:
- **H** component defines plate (it's rounded to nearest 10, so there are 36 different values available: 10, 20, 30, .., 350, 360)
- **S** component is ignored
- **V** component defines initial elevation:
  - 0.4 is the deepest possible ocean (0.0 value would be black, so plates couldn't be distinguished from each other)
  - 0.7 is the sea level
  - 1.0 is the highest possible mountain
  - [0.4, 0.55] is assumed to be oceanic crust
  - (0.55, 1.0] is assumed to be continental crust (note that part of the continent is below the sea level)
  
Sometimes **V** component might have values from 0 to 100 instead of [0, 1], it depends on the graphics editor.
The same rules will apply, but everything above should be multiplied by 100.
  
## Development

First, you need to make sure that webpack is installed and all the NPM packages required by this project are available:

```
npm install -g webpack
yarn
```
Then you can build the project files using:
```
webpack
```
or start webpack dev server:
```
npm install -g webpack-dev-server 
webpack-dev-server
```
and open [http://localhost:8080/](http://localhost:8080/) or [http://localhost:8080/webpack-dev-server/](http://localhost:8080/webpack-dev-server/) (auto-reload after each code change).

### Code style

This project uses StandardJS style: https://standardjs.com

Before committing your changes should run:
```
npm run lint 
```
and check if there are some errors. Most of them will be fixed automatically since we use `--fix` flag.
Also, `js/peels` directory is ignored as it's based on the external codebase and keeping it similar
to the original code might be useful in the future.

### Code overview

- `js/components` - React components.
- `js/stores` - MobX stores (and data structures used by those stores).
- `js/peels` - External library used to generate geodesic grid. It's modified source code of 
   https://github.com/G-E-O-F/peels since some changes were necessary and this projects seems to be dead already.
- `js/plates-model` - Proper model, decoupled from view and HTML.
- `js/plates-view` - Rendering code.

### MobX

This project uses [MobX](https://github.com/mobxjs/mobx). A few great features:

- All the components are observing the MobX store directly and are re-rendered only if the properties that they use are
  modified. There's no need to worry about unnecessary React re-renders and performance.
- @computed properties are great way to optimize performance and cache values.
- `autorun` and `observer` functions are used to react to the state changes without triggering React rendering.
  It is very useful when a canvas-based view needs to be updated 60 times per second.

`ModelStore`, `PlateStore` and `FieldStore` are supposed to mimic `Model`, `Plate` and `Field` classes used by
the web worker. They receive output from the web worker and synchronize themselves. Note that amount of data sent is minimal.
It should be just enough to render everything, but it's not enough to perform calculations. It has been implemented that
way as the web worker <-> main thread communication is very slow.

Also, note that only a few fields in `ModelStore` and `PlateStore` are observable. None of the `FieldStore` properties
is observable. It's due to performance reasons - MobX observable properties are very slow to write and read. There
are so many `FieldStore` instances that we can't make them observable. The view code observes just one general property of
the `PlateStore` named `dataUpdateID`. When it's incremented, the view code assumes that all its properties could
have been changed. Usually it it's true, as a single model step modifies most of the plate and fields properties.

MobX specific code should be limited to stores and React components whenever possible (there are some exceptions when it
seemed to simplify code a lot).

### CSS styles

* Browser specific prefixes are not necessary, as this project uses [autoprefixer](https://github.com/postcss/autoprefixer), which will add them automatically.
* Webpack parses URLs in CSS too, so it will either copy resources automatically to `/dist` or inline them in CSS file. That applies to images and fonts (take a look at webpack config).
* All the styles are included by related components in JS files. Please make sure that those styles are scoped to the top-level component class, so we don't pollute the whole page. It's not very important right now, but might become important if this page becomes part of the larger UI. And I believe it's a good practice anyway. 
* I would try to make sure that each component specifies all its necessary styles to look reasonably good and it doesn't depend on styles defined somewhere else (e.g. in parent components). Parent components or global styles could be used to theme components, but they should work just fine without them too.

### Physics, integration methods

There are three different integration methods available:
- basic Euler method
- modified Velocity Verlet method (so it works with velocity-dependent forces)
- Runge-Kutta RK4 method

They can be changed using `integration` option (see `js/config.js`).

It seems that the Verlet method provides best results so far (forces look pretty stable, model kinetic energy too).
RK4 is more complicated and actually kinetic energy of the model grows faster than in Verlet method. It might
be a bug in the implementation, as RK4 method should provide the best results theoretically.
Euler is the simplest, but also the worst - forces tend to oscillate and kinetic energy grows very fast, 
so it quickly becomes visible in the model.

It all becomes less important when `constantHotSpots=false`, as after some time there are no forces and plates will stop 
due to light friction.

## License 

[MIT](https://github.com/concord-consortium/tectonic-explorer/blob/master/LICENSE)
