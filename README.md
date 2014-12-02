backbonefire-ify
================

## CommonJS version of BackFire

Using the [firebase's backbonefire repo](https://github.com/firebase/backbonefire) as a submodule, provides a build process to create a backbonefire.js file that can be consumed by browserify, used in a Node.js environment, or included via script tag on a web page.

## Run Tests

```bash
$ npm test
```

## Build Process

**Make sure to pull the backbonefire submodule**

```bash
$ git submodule init
$ git submodule update
```

**Run the Build Process**

```bash
$ gulp build
```