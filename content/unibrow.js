("Cc" in this) || (this["Cc"] = Components.classes);
("Ci" in this) || (this["Ci"] = Components.interfaces);
("Cu" in this) || (this["Cu"] = Components.utils);
("Cr" in this) || (this["Cr"] = Components.results);

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var Unibrow = {
  __proto__: window,
  /* members */
  conversations: null, /** <browser src=instantbird.xul> */
  browser: null,       /** <conversations> */
  browserTabs: null,   /** <xul:tabs> for the <conversations> */
  list: null,          /** <richlistbox id="unibrowList"> */
  deck: null,          /** <deck id="unibrowDeck"> */
  strings: null,       /** nsIStringBundle */

  /* overrides */
  browser_addConversation: function Unibrow_browser_addConversation(aConv) {
    // we _always_ want to use the same window for everything.
    var conv = Unibrow.browser._addConversation(aConv);
    var item = document.createElement("richlistitem");
    Unibrow.list.appendChild(item);
    item.setAttribute("linkedpanel", conv.tab.linkedPanel);
    item.setAttribute("label", conv.tab.label);
    return conv;
  },

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
      tab = document.createElement("richlistitem");
      tab.setAttribute("id", "unibrow" + type + "Tab");
      tab.setAttribute("for", "unibrow" + type);
      try {
        let key = "unibrow.tabs." + aWindowType + ".label";
        tab.setAttribute("label", Unibrow.strings.GetStringFromName(key));
      }
      catch (e) {
        tab.setAttribute("label", type);
      }
      Unibrow.list.insertBefore(tab, document.getElementById("unibrowSpacerTab"));
      Unibrow.list.selectedItem = tab;
      frame.loadURI(URLS[aWindowType], null, null);
    }
  },

  /* internal methods */
  onLoad: function Unibrow_onLoad(aEvent) {
    if (aEvent.originalTarget != document) {
      // ignore sub-document loads
      return;
    }

    Unibrow.browser.addConversation = Unibrow.browser_addConversation;
    Unibrow.browser.tabContainer.addEventListener("TabSelect", Unibrow.onTabSelect, false);
    Unibrow.browser.tabContainer.addEventListener("TabClose", Unibrow.onTabClose, false);
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

    Cc['@mozilla.org/toolkit/app-startup;1']
      .getService(Ci.nsIAppStartup)
      .quit(Ci.nsIAppStartup.eAttemptQuit);
  },

  onTabSelect: function Unibrow_onTabSelect(aEvent) {
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
      Unibrow.browserTabs.selectedItem = item.tab;
      return;
    }
  }
};

XPCOMUtils.defineLazyGetter(Unibrow,
                            "conversations",
                            function()document.getElementById("unibrowConversations"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "browser",
                            function()Unibrow.conversations.contentWindow.getBrowser());
XPCOMUtils.defineLazyGetter(Unibrow,
                            "browserTabs",
                            function()Unibrow.browser.tabContainer);
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
