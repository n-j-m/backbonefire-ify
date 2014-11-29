var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;

describe('#require', function() {

  it('should "require" the backfire object', function() {
    var BackFire = require('../dist/backbonefire');

    console.log(BackFire);

    expect(BackFire).to.be.ok;
  })

})