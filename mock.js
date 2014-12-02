var proxyquire = require('proxyquireify')(require);
var MockFirebase = require('mockfirebase').MockFirebase;
var Backbone = require('backbone');

var mockRef;
var stubs = {
  firebase: function(url) {
    return (mockRef = new MockFirebase(url));
  },
  backbone: Backbone
};

var BackFire = proxyquire('./dist/backbonefire', stubs);


function MockSnap(params) {
  params = params || {};

  this._key = params.key;
  this._key = params.name;
  this._val = params.val;

  this.name = function() {
    return this._key;
  };
  this.key = function() {
    return this._key;
  };
  this.val = function() {
    return this._val;
  };
  this.setKey = function(key) {
    this._key = key;
  };
  this.setVal = function(val) {
    this._val = val;
  };
}

module.exports = {
  MockSnap: MockSnap,
  getMockRef: function() {
    return mockRef;
  },
  BackFire: BackFire,
  Backbone: Backbone
};