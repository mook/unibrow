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
  
  _convWPL: null, /** nsIWebProgressListener for Unibrow.conversations */

  /* overrides */
  browser_addConversation: function Unibrow_browser_addConversation(aConv) {
    // we _always_ want to use the same window for everything.
    var conv = Unibrow.browser._addConversation(aConv);
    var contact = Services.Unibrow.Tag.addConversation(aConv);
    Unibrow.buddyWin.buddyList.observe(contact, "fake-buddy", null);
    Unibrow.convDeck.selectedPanel = Unibrow.conversations;
    return conv;
  },

  browser_beginRemoveTab: function Unibrow_browser_beginRemoveTab(
    aTab, aTabWillBeMoved, aCloseWindowFastpath)
  {
    // note that |this| is the tabbrowser
    // force aCloseWindowFastpath to be false and see what we get
    var result = this.__proto__._beginRemoveTab.call(
                   this, aTab, aTabWillBeMoved, false);
    if (result) {
      // closing
      Services.Unibrow.Tag.removeConversation(result[0].linkedConversation.conv);
      if (result[1]) {
        // will close window
        Unibrow.conversations.reload();
        Unibrow.convDeck.selectedPanel = Unibrow.convFacade;
        return [result[0], false];
      }
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
    
    // hook up a listener for when Unibrow.conversations reloads
    Unibrow._convWPL = {
      onStateChange: function Unibrow_WPL_onStateChange(aWebProgress,
                                                        aRequest,
                                                        aStateFlags,
                                                        aStatus)
      {
        const nsIWPL = Ci.nsIWebProgressListener;
        const FLAGS_WANTED = nsIWPL.STATE_STOP | nsIWPL.STATE_IS_WINDOW;
        if ((aStateFlags & FLAGS_WANTED) == FLAGS_WANTED) {
          Unibrow.browser.addConversation = Unibrow.browser_addConversation;
          Unibrow.browser._beginRemoveTab = Unibrow.browser_beginRemoveTab;
          Unibrow.browser.tabContainer.addEventListener("TabSelect", Unibrow.onTabSelect, false);
        }
      },
      QueryInterface: XPCOMUtils.generateQI([Ci.nsIWebProgressListener,
                                             Ci.nsISupportsWeakReference])
    };
    Unibrow.conversations
           .webProgress
           .addProgressListener(Unibrow._convWPL,
                                Ci.nsIWebProgress.NOTIFY_STATE_WINDOW);
  },

  onUnload: function Unibrow_onUnload(aEvent) {
    if (aEvent.originalTarget != document) {
      // ignore sub-document unloads
      return;
    }

    Cc['@mozilla.org/toolkit/app-startup;1']
      .getService(Ci.nsIAppStartup)
      .quit(Ci.nsIAppStartup.eAttemptQuit);
    Unibrow.conversations.webProgress.removeProgressListener(Unibrow._convWPL);
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
  
  /** getters that can't be lazy because things might change under them */
  get browser() Unibrow.conversations.contentWindow.getBrowser(),
  get browserTabs() Unibrow.browser.tabContainer,
  get buddyWin() Unibrow.buddyFrame.contentWindow
};

XPCOMUtils.defineLazyGetter(Unibrow,
                            "convDeck",
                            function()document.getElementById("conversationDeck"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "convFacade",
                            function()document.getElementById("conversationFacade"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "conversations",
                            function()document.getElementById("conversationFrame"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "buddyFrame",
                            function()document.getElementById("buddyFrame"));
XPCOMUtils.defineLazyGetter(Unibrow,
                            "strings",
                            function()Services.strings.createBundle("chrome://unibrow/locale/unibrow.properties"));

addEventListener("load", Unibrow.onLoad, false);
