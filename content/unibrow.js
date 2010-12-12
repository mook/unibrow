("Cc" in this) || (this["Cc"] = Components.classes);
("Ci" in this) || (this["Ci"] = Components.interfaces);
("Cu" in this) || (this["Cu"] = Components.utils);
("Cr" in this) || (this["Cr"] = Components.results);

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/imWindows.jsm");

var Unibrow = {
  __proto__: window,
  /* members */
  conversations: null, /** <browser src=instantbird.xul> */
  browser: null,       /** <conversations> */
  browserTabs: null,   /** <xul:tabs> for the <conversations> */
  list: null,          /** <richlistbox id="unibrowList"> */
  deck: null,          /** <deck id="unibrowDeck"> */
  strings: null,       /** nsIStringBundle */

  /* */
  openSingletonWindow: function Unibrow_openSingletonWindow(aWindowType) {
    var URLS = {
      accounts: "chrome://instantbird/content/accounts.xul",
      addons: "about:addons",
      errors: "chrome://global/content/console.xul"
    };

    var type = aWindowType.replace(/./, String.toUpperCase);
    var tab = document.getElementById("unibrow" + type + "Tab");
    if (tab) {
      Unibrow.list.selectedItem = tab;
    }
    else {
      var frame = document.createElement("browser");
      frame.setAttribute("type", "chrome");
      frame.setAttribute("disablehistory", true);
      frame.setAttribute("id", "unibrow" + type);
      Unibrow.deck.appendChild(frame);
      Unibrow.list.addSingletonWindow(aWindowType, URLS[aWindowType]);
      frame.loadURI(URLS[aWindowType], null, null);
    }
  },

  /* internal methods */
  onLoad: function Unibrow_onLoad(aEvent) {
    if (aEvent.originalTarget != document) {
      // ignore sub-document loads
      return;
    }

    Conversations.registerWindow(window);

    Unibrow.convTabs.addEventListener("TabSelect", Unibrow.onTabSelect, false);
    Unibrow.convTabs.addEventListener("TabClose", Unibrow.onTabClose, false);
    Unibrow.list.addEventListener("select", Unibrow.onListSelect, false);
    document.getElementById("unibrowBuddiesTab").label =
      Unibrow.strings.GetStringFromName("unibrow.tabs.buddies.label");
    Unibrow.openSingletonWindow("buddies");
    addEventListener("unload", Unibrow.onUnload, false);
  },

  onUnload: function Unibrow_onUnload(aEvent) {
    if (aEvent.originalTarget != document) {
      // ignore sub-document unloads
      return;
    }

    Conversations.unregisterWindow(window);

    Cc['@mozilla.org/toolkit/app-startup;1']
      .getService(Ci.nsIAppStartup)
      .quit(Ci.nsIAppStartup.eAttemptQuit);
  },

  onTabSelect: function Unibrow_onTabSelect(aEvent) {
    return;
    var tab = aEvent.originalTarget;
    for (let i = 0; i < Unibrow.list.childNodes.length; ++i) {
      let item = Unibrow.list.childNodes.item(i);
      if (item.panelId == tab.linkedPanel) {
        Unibrow.list.selectedItem = item;
        return;
      }
    }
  },

  onTabClose: function Unibrow_onTabClose(aEvent) {
    var tab = aEvent.originalTarget;
    for (let i = 0; i < Unibrow.list.childNodes.length; ++i) {
      let item = Unibrow.list.childNodes.item(i);
      if (item.panelId == tab.linkedPanel) {
        Unibrow.list.removeChild(item);
        return;
      }
    }
  },

  onListSelect: function Unibrow_onListSelect(aEvent) {
    var item = Unibrow.list.selectedItem;
    if (item.hasAttribute("for")) {
      var panel = document.getElementById(item.getAttribute("for"));
      Unibrow.deck.selectedPanel = panel;
    }
    else if ("tab" in item) {
      // this is a proxy item
      Unibrow.deck.selectedPanel = Unibrow.conversations;
      Unibrow.convTabs.selectedItem = item.tab;
      return;
    }
  }
};

XPCOMUtils.defineLazyGetter(Unibrow,
                            "conversations",
                            function()document.getElementById("conversations"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "browser",
                            function()document.getElementById("conversations"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "convTabs",
                            function()Unibrow.conversations.tabContainer);
XPCOMUtils.defineLazyGetter(Unibrow,
                            "list",
                            function()document.getElementById("unibrowList"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "deck",
                            function()document.getElementById("unibrowDeck"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "strings",
                            function()Services.strings.createBundle("chrome://unibrow/locale/unibrow.properties"));

addEventListener("load", Unibrow.onLoad, false);
