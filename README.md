# Tectonic Explorer / TecRock Projects

This project is organized as a mono-repository managed by npm workspaces and lerna.

Currently, there are three packages:
- **Tectonic Explorer** simulation, used within Activity Player and as a standalone application. Production URL:
https://tectonic-explorer.concord.org/
- **TecRock Table** interactive, used within Activity Player, linked to Tectonic Explorer. When it's used in Activity Player as a library interactive, you'll have to use versioned URL: https://tectonic-explorer.concord.org/version/v[version-number]/tecrock-table/index.html
- **TecRock Shared** package that contains common assets and helpers used by the two other packages. It's not deployed or published anywhere, as it's not useful for any other project.

## First build and browse

```
npm install
npm build
npm start
```

This will:
- install the top level package.json and dependencies in each subfolder
- copy the static folders to `dist`
- run `lerna build` which runs `npm build` in each subfolder
- run a local webserver serving the `dist` folder

## Running a single interactive

```
cd package/[interactive folder]
npm start
```

This runs the webpack dev server. It will automatically rebuild and reload the page when the sources are changed.

## Running all the interactives

In one terminal, run:
```
cd package/[interactive folder] && npm watch
```
Repeat that for all the interactives that you want to work on.


In another terminal, run:
```
npm start
```

This shows an index page listing the available interactives at: http://127.0.0.1:8080/.

Changes to the files in `[interactive folder]` will cause a rebuild.
You need to manually refresh the web browser after the build is complete.

## Testing

### Unit tests

 Run `npm test` to run Jest tests in each interactive / package.

### E2E tests (Cypress)

Cypress tests are currently defined only in Tectonic Explorer package. But this should/might change in the future.

Run `npm build` and then `npm start` in top-level directory to serve all the interactives.
Then open another terminal and run `npm run test:cypress` to start Cypress E2E tests.

## Mono Repo Setup

This repository is configured with npm workspaces and lerna to run commands on subfolders.
Individual packages specify their dependencies in their own package.json files.
npm takes care of 'hoisting' all modules into the top-level node_modules folder. This is done by the `npm install` command.
Inside of the `<subfolder>/node_modules` folder should only be a .bin folder which contains the usual dev tool executables.

### Installing a new dependency

Run `npm i <new dep> -w <interactive name>` or `npm i <new dep> -w <interactive name> --save-dev`.
If you need to add it to the workspace root run `npm i <new dep> --save`.
If you need to add it to all the workspaces run `npm i <new dep> --workspaces (--save-dev)`.

### Updating a shared dependency

When updating a dependency that is shared by multiple interactives, e.g. Webpack, it is easiest to find/replace the relevant dependencies in the editor and then run `npm install` from the root folder to synchronize the dependencies appropriately. `npm build` and `npm test` can then be used to verify that the update didn't break anything obvious.

### Import checking

Because of this hoisted dependency setup, it makes it possible to import dependencies in your code without declaring one in the subfolder's package.json file. That could happen if the top-level package.json or some other subfolder package.json added this dependency. In those two cases the dependency is now in the top-level node_modules folder. To prevent this 'undeclared dependency' problem the eslint-plugin-import module is added. It is configured to force all imports in your code to be declared in the code's package.json.

### Adding a new interactive or shared package

Use the following steps to add a new interactive:
- make a copy of the similar interactive folder (eg `tecrock-table`) and rename it with the name of the interactive in kebab-case.
  For example, if the new interactive is named "New interactive", then the folder will be named "new-interactive".
- search your newly created folder for instances of the string `tecrock-table` and replace it with the name of your interactive. For example, this string might appear in `readme.md`, and `package.json`.

## Deployment

Production releases to S3 are based on the contents of the `/dist` folder and are built automatically by GitHub Actions
for each branch pushed to GitHub and each merge into production.

Merges into production are deployed to https://models-resources.concord.org/tectonic-explorer.

Other branches are deployed to https://models-resources.concord.org/tectonic-explorer/branch/<name>.

You can view the status of all the branch deploys [here](https://github.com/concord-consortium/tectonic-explorer/actions).

To deploy a production release:

1. Update package, commit, and tag
    1. Run `npx lerna version [new-version-string] --no-git-tag-version`. This updates the version in lerna.json and package.json files in all the interactives. ` --no-git-tag-version` ensures that lerna doesn't commit and push these changes to GitHub automatically (so there's time to review them and add a commit message).
    2. Create a new commit with the changelog message
    3. Create a tag `v[new-version-string]` with the changelog message
2. Push current branch and tag to GitHub
  - `git push origin master`
  - `git push origin v<new version>`
3. Verify the build and tests in Github Actions at https://github.com/concord-consortium/tectonic-explorer/actions

4. If you need to release a new version Tectonic Explorer simulation, you should also update `production` branch and
   point it at the tagged commit.

5. TecRock table is added as a Library Interactive in LARA. To release a new version, update its URL in the LARA
   Library Interactives panel.

### Lerna versioning notes

Lerna is set to use fixed versioning. It means that all the packages will use the same version that is specified in lerna.json.
In the future, it might be useful to switch to independent versioning mode.

Also, `lerna version` tool has many options that might simplify release process. See:
https://github.com/lerna/lerna/tree/main/commands/version

## Notes

Make sure if you are using Visual Studio Code that you use the workspace version of TypeScript.
To ensure that you are open a TypeScript file in VSC and then click on the version number next to
`TypeScript React` in the status bar and select 'Use Workspace Version' in the popup menu.

## License

Question Interactives are Copyright 2020 (c) by the Concord Consortium and is distributed under the [MIT license](http://www.opensource.org/licenses/MIT).

See LICENSE for the complete license text.
