#!/bin/bash

webpack
cd dist
git add .
git commit -m 'Update gh-pages'
git push origin gh-pages
cd ..
