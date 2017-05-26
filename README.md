# Plate Tectonics 3D model

http://models-resources.concord.org/plate-tectonics-3d/branch/master/index.html

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

### CSS styles

* Browser specific prefixes are not necessary, as this project uses [autoprefixer](https://github.com/postcss/autoprefixer), which will add them automatically.
* Webpack parses URLs in CSS too, so it will either copy resources automatically to `/dist` or inline them in CSS file. That applies to images and fonts (take a look at webpack config).
* All the styles are included by related components in JS files. Please make sure that those styles are scoped to the top-level component class, so we don't pollute the whole page. It's not very important right now, but might become important if this page becomes part of the larger UI. And I believe it's a good practice anyway. 
* I would try to make sure that each component specifies all its necessary styles to look reasonably good and it doesn't depend on styles defined somewhere else (e.g. in parent components). Parent components or global styles could be used to theme components, but they should work just fine without them too.

## License 

[MIT](https://github.com/concord-consortium/seismic-explorer/blob/master/LICENSE)
