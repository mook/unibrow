const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

const EXPORTED_SYMBOLS = [];

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/imServices.jsm");

Services.Unibrow = {
};

XPCOMUtils.defineLazyGetter(Services.Unibrow,
                            "mainWindow",
                            function()Services.wm.getMostRecentWindow("Unibrow").Unibrow);
