# biotools-github-editor

fork from [https://github.com/bio-tools/biotoolsRegistry](https://github.com/bio-tools/biotoolsRegistry)

---

## Description

bio.tools content editing driven by GitHub API

### Motivation

- Transfer to Github the bio.tools entry hosted in b.t. database
- Have an editing interface to allow every kind of user to update an entry

### Architecture

We kept the 'frontend' part of biotoolsRegistry and edit:

- js/controller.js 
- index.html
- partials/toolEdit.html
- package.json 
- gulpfile.js

---

## Install

`git clone https://github.com/bio-tools/biotools-github-editor.git`

`cd biotools-github-editor/frontend`

`npm install`

## Run

`gulp browser-sync`

=> http://localhost:3000 

## Build

`gulp`

---

## Notice *[temporary]*

You will need a CORS manager to Allow-Control-Allow-Origin, otherwise the Github OAuth will no work with your local Parcel servor

Example for firefox: [https://addons.mozilla.org/fr/firefox/addon/cors-everywhere/](https://addons.mozilla.org/fr/firefox/addon/cors-everywhere/)


