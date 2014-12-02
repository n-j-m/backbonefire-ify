var MockFirebase = require('mockfirebase').MockFirebase;
var mock = require('../mock');
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;

var MockSnap = mock.MockSnap;
var BackFire = mock.BackFire;


describe('BackFire', function() {

  it('should exist', function() {
    return expect(BackFire).to.be.ok;
  });

  describe('#_isPrimitive', function() {

    it('should return false for null', function() {
      var value = BackFire._isPrimitive(null);
      expect(value).to.be.false;
    })

    it('should return false for object', function() {
      var value = BackFire._isPrimitive({});
      expect(value).to.be.false;
    })

    it('should return true for string', function() {
      var value = BackFire._isPrimitive("");
      expect(value).to.be.true;
    })

    it('should return true for int', function() {
      var value = BackFire._isPrimitive(1);
      expect(value).to.be.true;
    })

    it('should return true for bool', function() {
      var value = BackFire._isPrimitive(true);
      expect(value).to.be.true;
    })

  })

  describe('#_checkId', function() {

    it('should add an id to a model', function() {
      var mockSnap = new MockSnap({
        name: '1',
        val: {
          firstname: 'David'
        }
      });

      var model = BackFire._checkId(mockSnap);

      expect(model.id).to.be.ok;
      expect(model.id).to.be.equal(mockSnap.name());
    })

    it('should throw an error if the model is not an object', function() {
      var mockSnap = new MockSnap({
        name: '1',
        val: 'hello'
      });
      try {
        var model = BackFire._checkId(1);
      } catch (err) {
        expect(err).to.be.ok;
      }
    })

    it('should create an object with an id for null values', function() {
      var mockSnap = new MockSnap({
        name: '1',
        val: null
      });
      var model = BackFire._checkId(mockSnap);
      expect(model.id).to.be.ok;
    })

  })

  describe('#_readOnce', function() {

    var ref;
    beforeEach(function() {
      ref = new MockFirebase('Mock://');
    });

    it('should call Firebase.once', function() {
      sinon.spy(ref, 'once');
      BackFire._readOnce(ref, function() {});
      ref.flush();
      expect(ref.once.calledOnce).to.be.ok;
      ref.once.restore();
    })

    it('should return a snapshot from a callback function', function() {
      var snapExpected;
      BackFire._readOnce(ref, function(snap) {
        snapExpected = snap;
      });
      ref.flush();
      expect(snapExpected).to.be.defined;
      expect(snapExpected).to.be.defined;
    })

  })

  describe('#_setToFirebase', function() {

    var ref;
    beforeEach(function() {
      ref = new MockFirebase('Mock://');
    });

    it('should call Firebase.set', function() {
      sinon.spy(ref, 'set');
      BackFire._setToFirebase(ref, {}, function() {});
      ref.flush();
      expect(ref.set.calledOnce).to.be.ok;
      ref.set.restore();
    })

    it('should return a response from a callback function', function() {
      var responseExpected;
      BackFire._setToFirebase(ref, {id: '1'}, function(err) {
        responseExpected = err;
      });
      ref.flush();
      expect(responseExpected).to.be.defined;
    })

  })

  describe('#_updateToFirebase', function() {

    var ref;
    beforeEach(function() {
      ref = new MockFirebase('Mock://');
    });

    it('should call Firebase.update', function() {
      sinon.spy(ref, 'update');
      BackFire._updateToFirebase(ref, {}, function() {});
      ref.flush();
      expect(ref.update.calledOnce).to.be.ok;
    })

    it('should return a response from a callback function', function() {
      var responseExpected;
      BackFire._updateToFirebase(ref, {id: '1'}, function(err) {
        responseExpected = err;
      });
      ref.flush();
      expect(responseExpected).to.be.defined;
    })

  })

  describe('#_onCompleteCheck', function() {

    var item;
    beforeEach(function() {
      item = { id: '1' };
    });

    it('should call options.error if an error exists', function() {
      var spy = sinon.spy();
      var options = {
        error: spy
      };
      BackFire._onCompleteCheck(new Error(), item, options);
      expect(options.error.calledOnce).to.be.ok;
    })

    it('should call options.success if no error exists', function() {
      var options = {
        success: sinon.spy()
      };
      BackFire._onCompleteCheck(null, item, options);
      expect(options.success.calledOnce).to.be.ok;
    })

    it('should return if no options are present', function() {
      BackFire._onCompleteCheck(null, item, null);
    })

  })

  describe('#_throwError', function() {

    it('should throw and catch an error', function() {
      try {
        BackFire._throwError('Error');
      } catch (err) {
        expect(err).to.be.defined;
      }
    })

  })

  describe('#_determineRef', function() {

    it('should create a Firebase ref if a string is provided', function() {
      var ref = BackFire._determineRef('Mock://');
      expect(ref).to.be.defined;
      expect(ref).to.be.equal(mock.getMockRef());
    })

    it('should return a Firebase ref if a ref is provided', function() {
      var ref = new MockFirebase('Mock://');
      var returnedRef = BackFire._determineRef(ref);
      expect(returnedRef).to.be.ok;
    })

    it('should throw an error if neither an object or string is provided', function() {
      try {
        BackFire._determineRef(false);
      } catch (error) {
        expect(error).to.be.ok;
      }
    })

  })

  describe('#_determineAutoSync', function() {

    it('should return an autoSync value matching the given model', function() {
      var model = { autoSync: true };
      var val = BackFire._determineAutoSync(model);
      expect(val).to.be.equal(model.autoSync);
    })

    it('should default to "true" if not present', function() {
      var model = { data: {} };
      var val = BackFire._determineAutoSync(model);
      expect(val).to.be.ok;
    })

    it('should return an autoSync value matching the given options', function() {
      var model = { data: {} };
      var options = { autoSync: false };
      var val = BackFire._determineAutoSync(model, options);
      expect(val).to.be.equal(options.autoSync);
    })

  })

  describe('#sync', function() {

    var model;
    beforeEach(function() {
      var Model = BackFire.Model.extend({
        url: 'Mock://',
        autoSync: false
      });
      model = new Model();
    });

    describe('#sync("read", ...)', function() {

      it('should call BackFire._readOnce', function() {
        sinon.spy(BackFire, '_readOnce');
        BackFire.sync('read', model, {});
        mock.getMockRef().flush();
        expect(BackFire._readOnce.calledOnce).to.be.ok;
        BackFire._readOnce.restore();
      });

      it('should call BackFire._readOnce with a success option', function() {
        var responseExpected;
        sinon.spy(BackFire, '_readOnce');
        BackFire.sync('read', model, {
          success: function(resp) {
            responseExpected = resp;
          }
        });
        model.firebase.flush();
        expect(responseExpected).to.be.defined;
        BackFire._readOnce.restore();
      })

    });

    describe('#_setWithCheck', function() {

      it('should call BackFire._setToFirebase', function() {
        sinon.spy(BackFire, '_setToFirebase');
        BackFire._setWithCheck(model.firebase, null, null);
        model.firebase.flush();
        expect(BackFire._setToFirebase.calledOnce).to.be.ok;
        BackFire._setToFirebase.restore();
      })

      it('should call BackFire._onCompleteCheck', function() {
        sinon.spy(BackFire, '_onCompleteCheck');
        BackFire._setWithCheck(model.firebase, null, null);
        model.firebase.flush();
        expect(BackFire._onCompleteCheck.calledOnce).to.be.ok;
        BackFire._onCompleteCheck.restore();
      })

    })

    describe('#sync("create", ...)', function() {

      it('should call BackFire._onCompleteCheck', function() {
        sinon.spy(BackFire, '_onCompleteCheck');
        BackFire.sync('create', model, null);
        model.firebase.flush();
        expect(BackFire._onCompleteCheck.calledOnce).to.be.ok;
        BackFire._onCompleteCheck.restore();
      })

      it('should call BackFire._setWithCheck', function() {
        sinon.spy(BackFire, '_setWithCheck');
        BackFire.sync('create', model, null);
        model.firebase.flush();
        expect(BackFire._setWithCheck.calledOnce).to.be.ok;
        BackFire._setWithCheck.restore();
      })

    })

    describe('#sync("update", ...)', function() {

      it('should call BackFire._onCompleteCheck', function() {
        sinon.spy(BackFire, '_onCompleteCheck');
        BackFire.sync('update', model, null);
        model.firebase.flush();
        expect(BackFire._onCompleteCheck.calledOnce).to.be.ok;
        BackFire._onCompleteCheck.restore();
      })

      it('should call BackFire._updateWithCheck', function() {
        sinon.spy(BackFire, '_updateWithCheck');
        BackFire.sync('update', model, null);
        model.firebase.flush();
        expect(BackFire._updateWithCheck.calledOnce).to.be.ok;
        BackFire._updateWithCheck.restore();
      })

    })

  })

})