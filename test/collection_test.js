var mock = require('../mock');
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
var assert = require('assert');

var _ = require('underscore');

var BackFire = mock.BackFire;

describe('BackFire.Collection', function() {

  it('should exist', function() {
    expect(BackFire.Collection).to.be.ok;
  })

  it('should extend', function() {
    var Collection = BackFire.Collection.extend({
      url: 'Mock://'
    });
    expect(Collection).to.be.ok;
  })

  it('should construct', function() {
    var Collection = BackFire.Collection.extend({
      url: 'Mock://'
    });
    expect(new Collection()).to.be.ok;
  })

  it('should throw an error if an invalid url is provided', function() {
    var Collection = BackFire.Collection.extend({
      url: true
    });
    try {
      var collection = new Collection();
    } catch (err) {
      assert(err.message === 'url parameter required');
    }
  })

  it('should call BackFire._determineRef with url as a function', function() {
    sinon.spy(BackFire, '_determineRef');
    var Collection = BackFire.Collection.extend({
      url: function() {
        return '';
      }
    });
    var collection = new Collection();
    expect(BackFire._determineRef.calledOnce).to.be.ok;
    BackFire._determineRef.restore();
  })

  it('should call BackFire._determineRef with url as a string', function() {
    sinon.spy(BackFire, '_determineRef');
    var Collection = BackFire.Collection.extend({
      url: 'Mock://'
    });
    var collection = new Collection();
    expect(BackFire._determineRef.calledOnce).to.be.ok;
    BackFire._determineRef.restore();
  })

  it('should call BackFire._determineRef with url as a Firebase reference', function() {
    sinon.spy(BackFire, '_determineRef');
    var Collection = BackFire.Collection.extend({
      url: mock.getMockRef()
    });
    var collection = new Collection();
    expect(BackFire._determineRef.calledOnce).to.be.ok;
    BackFire._determineRef.restore();
  })

  describe('#_compareAttributes', function() {

    // should null remotely out deleted values
    var collection;
    beforeEach(function() {
      var Collection = BackFire.Collection.extend({
        url: 'Mock://',
        autoSync: true
      });

      collection = new Collection();
    })

    it('should set deleted values to null', function() {
      var remoteAttributes = {
        id: '1',
        name: 'David'
      };

      var localAttributes = {
        id: '1'
      };

      var updatedAttributes = collection._compareAttributes(remoteAttributes, localAttributes);

      assert(updatedAttributes.name === null);
    })

    it('should return updated attributes', function() {
      var remoteAttributes = {
        id: '1',
        name: 'Kato'
      };

      var localAttributes = {
        id: '1',
        name: 'David',
        age: 26
      };

      var updatedAttributes = collection._compareAttributes(remoteAttributes, localAttributes);
      expect(updatedAttributes).to.be.defined;
      expect(updatedAttributes.id).to.be.undefined;
      assert(updatedAttributes.name === 'David');
      assert(updatedAttributes.age === 26);
    })

  })

  describe('#_setWithPriority', function() {

    var collection, ref, item;
    beforeEach(function() {
      var Collection = BackFire.Collection.extend({
        url: 'Mock://',
        autoSync: true
      });

      collection = new Collection();
      item = {
        id: '1',
        '.priority': 1,
        name: 'David'
      }
    })

    it('should call setWithPriority on a Firebase reference', function() {
      sinon.spy(collection.firebase, 'setWithPriority');
      collection._setWithPriority(collection.firebase, item);
      //collection.firebase.flush();
      expect(collection.firebase.setWithPriority.calledOnce).to.be.ok;
      collection.firebase.setWithPriority.restore();
    })

    it('should delete local priority', function() {
      var setItem = collection._setWithPriority(collection.firebase, item);
      expect(setItem['.priority']).to.be.undefined;
    })

  })

  describe('#_updateToFirebase', function() {

    it('should call update on a Firebase reference', function() {
      var Collection = BackFire.Collection.extend({
        url: 'Mock://'
      });
      var collection = new Collection();
      sinon.spy(collection.firebase, 'update');
      collection._updateToFirebase(collection.firebase, { id: '1' });
      expect(collection.firebase.update.calledOnce).to.be.ok;
      collection.firebase.update.restore();
    })

  })

  describe('#_parseModels()', function() {

    var Collection = BackFire.Collection.extend({
      url: 'Mock://'
    });

    var collection = new Collection();

    it('should be a method', function() {
      expect(collection).to.have.property('_parseModels').that.is.a('function');
    })

    it('should return an empty array when called without parameters', function() {
      var result = collection._parseModels();
      expect(result).to.eql([]);
    })

    describe('calling Backbone.Collection.prototype._prepareModel', function() {

      var collection;

      beforeEach(function() {
        var Backbone = mock.Backbone;
        var User = Backbone.Model.extend({});
        var Users = BackFire.Collection.extend({
          url: 'Mock://',
          initialize: function(models, options) {
            this.model = function(attrs, opts) {
              return new User(_.extend(attrs, { addedFromCollection: true }), opts);
            };
          }
        });
        collection = new Users();
      })

      it('should call Backbone.Collection.prototype._prepareModel', function() {
        var Backbone = mock.Backbone;
        sinon.spy(Backbone.Collection.prototype, '_prepareModel');
        collection.add({ firstname: 'David' });
        expect(Backbone.Collection.prototype._prepareModel.calledOnce).to.be.ok;
        Backbone.Collection.prototype._prepareModel.restore();
      })

      it('should prepare models', function() {
        var addedArray = collection.add({ firstname: 'David' });
        var addedObject = addedArray[0];
        expect(addedObject.addedFromCollection).to.be.ok;
      })

    })

  })

  describe('SyncCollection', function() {

    var collection;
    beforeEach(function() {
      var User = mock.Backbone.Model.extend({});
      var Users = BackFire.Collection.extend({
        url: 'Mock://',
        initialize: function(models, options) {
          this.model = function(attrs, opts) {
            return new User(_.extend(attrs, { addedFromCollection: true }), opts);
          };
        }
      });
      collection = new Users();
    })

    it('should enable autoSync by default', function() {
      var Collection = BackFire.Collection.extend({
        url: 'Mock://'
      });

      var models = new Collection();
      expect(models.autoSync).to.be.ok;
    })

    it('should call sync when added', function() {
      var spy = sinon.spy();
      var Collection = BackFire.Collection.extend({
        url: 'Mock://',
        autoSync: true
      });

      var models = new Collection();

      models.on('sync', spy);

      models.add({ title: 'blah' });
      models.firebase.flush();
      expect(spy.called).to.be.ok;
    })

    describe('#create', function() {

      // ignore wait
      it('should ignore options.wait', function() {
        sinon.spy(collection, '_log');
        collection.create({ firstname: 'David' }, { wait: function(){} });
        collection.firebase.flush();

        expect(collection._log.calledOnce).to.be.ok;

        collection._log.restore();
      })

      it('should call SyncCollection.add', function() {
        sinon.spy(collection, 'add');

        collection.create({ firstname: 'David' });
        collection.firebase.flush();

        expect(collection.add.calledOnce).to.be.ok;

        collection.add.restore();
      })

      it('should return false when no model is provided', function() {
        var expectFalse = collection.create();
        collection.firebase.flush();
        expect(expectFalse).to.be.false;
      })

    })

    describe('#remove', function() {

      // call _setWithCheck
      it('should call BackFire._setWithCheck', function() {
        sinon.spy(BackFire, '_setWithCheck');

        collection.remove({ id: '1' });
        collection.firebase.flush();

        expect(BackFire._setWithCheck.calledOnce).to.be.ok;

        BackFire._setWithCheck.restore();
      })

      it('should set _suppressEvent to true when set silently', function() {
        collection.remove({ id: '1' }, { silent: true });

        expect(collection._suppressEvent).to.be.ok;
      })

    })

    describe('#_choldMoved', function() {

      it('should call _log', function() {
        sinon.spy(collection, '_log');
        var mockSnap = new mock.MockSnap({
          name: '1',
          val: {
            name: 'David'
          }
        });
        collection._childMoved(mockSnap);

        expect(collection._log.calledOnce).to.be.ok;

        collection._log.restore();
      })

    })

    describe('#reset', function() {

      it('should call SyncCollection.remove', function() {
        sinon.spy(collection, 'remove');

        collection.reset({ id: '1' });
        collection.firebase.flush();

        expect(collection.remove.calledOnce).to.be.ok;

        collection.remove.restore();
      })

      it('should call SyncCollection.add', function() {
        sinon.spy(collection, 'add');

        collection.reset({ id: '1' });
        collection.firebase.flush();

        expect(collection.add.calledOnce).to.be.ok;

        collection.add.restore();
      })

      it('should not trigger the reset event when silent is passed', function() {
        var spy = sinon.spy();

        collection.on('reset', spy);

        collection.reset({ id: '1' }, { silent: true });
        collection.firebase.flush();

        expect(spy.calledOnce).to.be.false;
      })

    })

    describe('#_log', function() {

      beforeEach(function() {
        sinon.spy(console, 'log');
      })

      afterEach(function() {
        console.log.restore();
      })

      it('should call console.log', function() {
        collection._log('logging');
        expect(console.log.calledOnce).to.be.ok;
      })

    })

    describe('#_preventSync', function() {

      var collection;
      var model = {};
      beforeEach(function() {
        var C = BackFire.Collection.extend({
          url: 'Mock://',
          autoSync: true
        });

        collection = new C();
      })

      it('should change from false to true', function() {
        collection._preventSync(model, true);
        expect(model._remoteChanging).to.be.ok;
      })

      it('should change from true to false', function() {
        collection._preventSync(model, false);
        expect(model._remoteChanging).to.be.false;
      })

    })

    describe('#_childChanged', function() {

      var collection
      beforeEach(function() {
        var C = BackFire.Collection.extend({
          url: 'Mock://',
          autoSync: true
        });

        collection = new C();

        collection.models = [
          new mock.Backbone.Model({
            id: '1',
            name: 'David',
            age: 26
          })
        ];
      })

      it('should unset local property from remote deletion', function() {
        var mockSnap = new mock.MockSnap({
          name: '1',
          val: {
            id: '1',
            name: 'David'
            // age has been removed
          }
        });

        collection._childChanged(mockSnap);

        var changedModel = collection.models[0];

        expect(changedModel.age).to.be.undefined;
      })

      it('should update local model from remote update', function() {
        var mockSnap = new mock.MockSnap({
          name: '1',
          val: {
            id: '1',
            name: 'David',
            age: 26,
            favDino: 'trex'
            // trex has been added
          }
        });

        collection._childChanged(mockSnap);

        var changedModel = collection.models[0];

        expect(changedModel.get('favDino')).to.be.ok;
      })

      it('should add when item cannot be found', function() {
        sinon.spy(collection, '_childAdded');
        var mockSnap = new mock.MockSnap({
          name: '4',
          val: {
            id: '4',
            name: 'Cash',
            age: 2
          }
        });

        collection._childChanged(mockSnap);

        expect(collection._childAdded.calledOnce).to.be.ok;

        collection._childAdded.restore();
      })

    })

    describe('#_childRemoved', function() {

      var collection;
      beforeEach(function() {
        var C = BackFire.Collection.extend({
          url: 'Mock://',
          autoSync: true
        });

        collection = new C();

        collection.models = [
          new mock.Backbone.Model({
            id: '1',
            name: 'David',
            age: 26
          })
        ];
      })

      it('should call Backbone.Collection.remove', function() {
        var Backbone = mock.Backbone;
        sinon.spy(Backbone.Collection.prototype, 'remove');
        var mockSnap = new mock.MockSnap({
          name: '1',
          val: {
            id: '1',
            name: 'David'
            // age has been removed
          }
        });

        collection._childRemoved(mockSnap);

        expect(Backbone.Collection.prototype.remove.calledOnce).to.be.ok;

        Backbone.Collection.prototype.remove.restore();
      })

      it('should call Backbone.Collection.remove silently', function() {
        var Backbone = mock.Backbone;
        sinon.spy(Backbone.Collection.prototype, 'remove');
        var mockSnap = new mock.MockSnap({
          name: '1',
          val: {
            id: '1',
            name: 'David'
            // age has been removed
          }
        });

        collection._suppressEvent = true;
        collection._childRemoved(mockSnap);

        expect(Backbone.Collection.prototype.remove.calledWith({silent: true}));

        Backbone.Collection.prototype.remove.restore();
      })

    })

    describe('#_childAdded', function() {

      var collection;
      beforeEach(function() {
        var C = BackFire.Collection.extend({
          url: 'Mock://',
          autoSync: true
        });

        collection = new C();

        collection.models = [
          new mock.Backbone.Model({
            id: '1',
            name: 'David',
            age: 26
          })
        ];
      })

      it('should call Backbone.Collection.add', function() {
        var Backbone = mock.Backbone;
        sinon.spy(Backbone.Collection.prototype, 'add');
        var mockSnap = new mock.MockSnap({
          name: '1',
          val: {
            id: '1',
            name: 'David',
            age: 26
          }
        });

        collection._childAdded(mockSnap);

        expect(Backbone.Collection.prototype.add.calledOnce).to.be.ok;

        Backbone.Collection.prototype.add.restore();
      })

      it('should call Backbone.Collection.add silently', function() {
        var Backbone = mock.Backbone;
        sinon.spy(Backbone.Collection.prototype, 'add');
        var mockSnap = new mock.MockSnap({
          name: '1',
          val: {
            id: '1',
            name: 'David',
            age: 26
          }
        });

        collection._suppressEvent = true;
        collection._childRemoved(mockSnap);

        expect(Backbone.Collection.prototype.add.calledWith({silent: true}));

        Backbone.Collection.prototype.add.restore();
      })

    })

    describe('#_updateModel', function() {

      var collection;
      var model;
      beforeEach(function() {

        var Backbone = mock.Backbone;

        var Collection = BackFire.Collection.extend({
          url: 'Mock://'
        });

        collection = new Collection();

        collection.models = [
          new Backbone.Model({
            id: '1',
            name: 'David',
            age: 26
          })
        ];

        model = new Backbone.Model({
          id: "1",
          name: 'Kato',
          age: 26
        });

      })

      it('should not update if the model\'s _remoteChanging property is true', function() {
        model._remoteChanging = true;

        collection._updateModel(model);

        var collectionModel = collection.models[0];

        // The name property should still be equal to 'David'
        // because 'model' object had _remoteChanging set to true
        // which cancels the update.  This is because _remoteChanging
        // indicates taht the item is being updated through the
        // Firebase sync listeners
        expect(collectionModel.get('name')).to.eql('David');
      })

      it('should call _setWithPriority if the .priority property is present', function() {
        sinon.spy(collection, '_setWithPriority');
        model.attributes['.priority'] = 14;
        collection._updateModel(model);
        expect(collection._setWithPriority.calledOnce).to.be.ok;
        collection._setWithPriority.restore();
      })

      it('should call _updateToFirebase if no .priority property is present', function() {
        sinon.spy(collection, '_updateToFirebase');
        collection._updateModel(model);
        expect(collection._updateToFirebase.calledOnce).to.be.ok;
        collection._updateToFirebase.restore();
      })

    })

    describe('#_removeModel', function() {

      var collection;
      beforeEach(function() {
        var Collection = BackFire.Collection.extend({
          url: 'Mock://',
          autoSync: true
        });

        collection = new Collection();

        collection.models = [
          new mock.Backbone.Model({
            id: '1',
            name: 'David',
            age: 26
          })
        ];

      })

      it('should call _setWithCheck', function() {
        var model = new mock.Backbone.Model({
          id: '1'
        });
        sinon.spy(BackFire, '_setWithCheck');
        collection._removeModel(model, collection, null);
        collection.firebase.flush();
        expect(BackFire._setWithCheck.calledOnce).to.be.ok;
        BackFire._setWithCheck.restore();
      })

    })

  })

  describe('OnceCollection', function() {

    var collection;
    beforeEach(function() {
      var Collection = BackFire.Collection.extend({
        url: 'Mock://',
        autoSync: false
      });

      collection = new Collection();
    });

    it('should not call sync when added', function() {
      var spy = sinon.spy();

      collection.on('sync', spy);

      collection.add({ title: 'blah' });

      collection.firebase.flush();

      expect(spy.called).to.be.false;
    })

    describe('#create', function() {

      it('should call Backbone.Collection.prototype.create', function() {
        var Backbone = mock.Backbone;
        sinon.spy(Backbone.Collection.prototype, 'create');

        collection.create({});
        collection.firebase.flush();

        expect(Backbone.Collection.prototype.create.calledOnce).to.be.ok;

        Backbone.Collection.prototype.create.restore();
      })

    })

    describe('#add', function() {

      it('should call Backbone.Collection.prototype.add', function() {
        var Backbone = mock.Backbone;
        sinon.spy(Backbone.Collection.prototype, 'add');

        collection.add({});
        collection.firebase.flush();

        expect(Backbone.Collection.prototype.add.calledOnce).to.be.ok;

        Backbone.Collection.prototype.add.restore();
      })

    })

    describe('#fetch', function() {

      it('should call BackFire.sync', function() {
        sinon.spy(BackFire, 'sync');

        collection.fetch();

        expect(BackFire.sync.calledOnce).to.be.ok;

        BackFire.sync.restore();
      })

    })

  })

})