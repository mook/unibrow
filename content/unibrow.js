("Cc" in this) || (this["Cc"] = Components.classes);
("Ci" in this) || (this["Ci"] = Components.interfaces);
("Cu" in this) || (this["Cu"] = Components.utils);
("Cr" in this) || (this["Cr"] = Components.results);

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://unibrow/unibrow.jsm");

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
    var contact = Services.Unibrow.Tag.addConversation(aConv);
    Unibrow.buddyWin.buddyList.observe(contact, "fake-buddy", null);
    return conv;
  },

  browser_beginRemoveTab: function Unibrow_browser_beginRemoveTab(
    aTab, aTabWillBeMoved, aCloseWindowFastpath)
  {
    // note that |this| is the tabbrowser
    // force aCloseWindowFastpath to be false and see what we get
    var result = this.__proto__._beginRemoveTab.call(
                   this, aTab, aTabWillBeMoved, false);
    if (result && result[1]) {
      // will close window
      return Unibrow.conversations.reload();
    }
    return result;
  },

  /* internal methods */
  onLoad: function Unibrow_onLoad(aEvent) {
    if (aEvent.originalTarget != document) {
      // ignore sub-document loads
      return;
    }
    addEventListener("unload", Unibrow.onUnload, false);

    Unibrow.browser.addConversation = Unibrow.browser_addConversation;
    Unibrow.browser._beginRemoveTab = Unibrow.browser_beginRemoveTab;
    Unibrow.browser.tabContainer.addEventListener("TabSelect", Unibrow.onTabSelect, false);
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
  observe: function Unibrow_observe(aSubject, aTopic, aData) {
    
  }
};

XPCOMUtils.defineLazyGetter(Unibrow,
                            "conversations",
                            function()document.getElementById("conversationFrame"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "browser",
                            function()Unibrow.conversations.contentWindow.getBrowser());
XPCOMUtils.defineLazyGetter(Unibrow,
                            "browserTabs",
                            function()Unibrow.browser.tabContainer);
XPCOMUtils.defineLazyGetter(Unibrow,
                            "buddyFrame",
                            function()document.getElementById("buddyFrame"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "buddyWin",
                            function()Unibrow.buddyFrame.contentWindow);
XPCOMUtils.defineLazyGetter(Unibrow,
                            "strings",
                            function()Services.strings.createBundle("chrome://unibrow/locale/unibrow.properties"));

addEventListener("load", Unibrow.onLoad, false);
