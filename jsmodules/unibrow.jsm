const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

const EXPORTED_SYMBOLS = [];

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/imServices.jsm");

function UnibrowContact(aConv) {
  this._conv = aConv;
  this._conv.addObserver(this);
  this._observers = [];
  this.id = -(Date.now() >>> 0);
}

UnibrowContact.prototype = {
  __proto__: UnibrowContact.prototype,
  _conv: null, // conversation
  _observers: [],

  /** public interface */
  get conversation() this._conv,
  destroy: function UnibrowContact_destroy() {
    this.notifyObservers(this, "contact-removed", this.id);
    this._conv.removeObserver(this);
    delete this._conv;
  },

  /** imIContact */
  id: -1,
  get alias() this._conv.title,
  getTags: function UnibrowContact_getTags(aCount) {
    if (aCount) {
      aCount.value = 1;
    }
    return [UnibrowTag];
  },
  move: function UnibrowContact_move(aOldTag, aNewTag) {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },
  get preferredBuddy() this,
  getBuddies: function UnibrowContact_getBuddies(aCount) {
    if (aCount) {
      aCount.value = 0;
    }
    return [];
  },
  remove: function UnibrowContact_remove() {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },

  addObserver: function UnibrowTag_addObserver(aObserver) {
    this.removeObserver(aObserver);
    this._observers.push(aObserver);
  },
  removeObserver: function UnibrowTag_removeObserver(aObserver) {
    this._observers = this._observers.filter(function(o) o != aObserver);
  },
  notifyObservers: function UnibrowTag_notifyObservers(aSubject, aTopic, aData) {
    this._observers.forEach(function (aObserver) {
      try {
        aObserver.observe(aSubject, aTopic, aData);
      }
      catch (e) {
        // silently ignore
      }
    });
  },
  
  /** imIStatusInfo */
  get displayName() this._conv.name,
  get buddyIconFilename() null,
  get statusType() this.available ?
                     Ci.imIStatusInfo.STATUS_AVAILABLE :
                     Ci.imIStatusInfo.STATUS_OFFLINE,
  get online() this.available,
  get available() {
    if (this._conv instanceof Ci.purpleIConvIM) {
      return this._conv.buddy ? this._conv.buddy.available : false;
    }
    else if (this._conv instanceof Ci.purpleIConvChat) {
      return !this._conv.left;
    }
    return true;
  },
  get idle() false,
  get mobile() false,
  get statusText() "(not implementeed)",
  get availabilityDetails() 0,
  get canSendMessage() true,
  get getTooltipInfo() ({hasMoreElements:function()false, getNext:function() null}),
  createConversation: function UnibrowContact_createConversation() this._conv,

  /** imIBuddy */
  // id is reused from imIContact
  get protocol() {
    return this._conv.account.protocol;
  },
  get userName() this._conv.name,
  get normalizedName() this._conv.normalizedName,
  get contact() this,
  get preferredAccountBuddy() {
    if (this._conv instanceof Ci.purpleIConvIM) {
      return this._conv.buddy;
    }
    return null;
  },
  getAccountBuddies: function(aCount) {
    if (aCount) aCount.value = 0;
    return [];
  },
  remove: function() {
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;
  },
  // addObserver is reused from imIContact
  // removeObserver is reused from imIContact
  // notifyObservers is reused from imIContact
  observe: function(aSubject, aTopic, aData) {
    switch(aTopic) {
      case "update-conv-chatleft":
        this.notifyObservers(this, "contact-availability-changed", null);
        break;
      default:
        Cu.reportError("fake contact observed " + aTopic);
    }
  },

  /** nsISupports */
  QueryInterface: XPCOMUtils.generateQI([Ci.imIContact,
                                         Ci.imIStatusInfo,
                                         Ci.imIBuddy,
                                         Ci.nsIObserver])
};


var UnibrowTag = {
  _contacts: [],
  _observers: [],

  /** public interface */
  addConversation: function UnibrowTag_addConverstation(aConv) {
    var contacts = this._contacts.filter(function(c) c.conversation == aConv);
    if (contacts.length > 0) {
      return contacts[0];
    }
    var contact = new UnibrowContact(aConv);
    this._contacts.push(contact);
    this.notifyObservers(contact, "contact-added", contact.id);
    return contact;
  },
  removeConversation: function UnibrowTag_removeConversation(aConv) {
    var removed = [];
    this._contacts = this._contacts.filter(function (c) {
      return !((c.conversation == aConv) && removed.push(c));
    });
    removed.forEach(function(contact) {
      contact.destroy();
    });
    return removed;
  },

  /** imITag */
  id: -(Date.now() >>> 0),
  name: Services.strings
                .createBundle("chrome://unibrow/locale/unibrow.properties")
                .GetStringFromName("unibrow.groups"),
  getContacts: function UnibrowTag_getContacts(aCount) {
    if (aCount) {
      aCount.value = this._contacts.length;
    }
    return Array.slice(this._contacts);
  },
  addObserver: function UnibrowTag_addObserver(aObserver) {
    this.removeObserver(aObserver);
    this._observers.push(aObserver);
  },
  removeObserver: function UnibrowTag_removeObserver(aObserver) {
    this._observers = this._observers.filter(function(o) o != aObserver);
  },
  notifyObservers: function UnibrowTag_notifyObservers(aSubject, aTopic, aData) {
    this._observers.forEach(function (aObserver) {
      try {
        aObserver.observe(aSubject, aTopic, aData);
      }
      catch (e) {
        // silently ignore
      }
    });
  },
  /** nsISupports */
  QueryInterface: XPCOMUtils.generateQI([Ci.imITag])
};

Services.Unibrow = {
  Tag: UnibrowTag
};

XPCOMUtils.defineLazyGetter(Services.Unibrow,
                            "mainWindow",
                            function()Services.wm.getMostRecentWindow("Unibrow").Unibrow);
