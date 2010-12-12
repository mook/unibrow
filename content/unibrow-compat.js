/**
 * unibrow-compat.js
 * various things the conversation binding would expect
 */

function getBrowser() {
  return Unibrow.conversations;
}

// From http://lxr.instantbird.org/instantbird/ident?i=FillInHTMLTooltip
function FillInHTMLTooltip(tipElement)
{
  if (tipElement.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul")
    return false;

  var defView = tipElement.ownerDocument && tipElement.ownerDocument.defaultView;
  // XXX Work around bug 350679:
  // "Tooltips can be fired in documents with no view".
  if (!defView)
    return false;

  while (tipElement) {
    if (tipElement.nodeType == Node.ELEMENT_NODE) {
      let titleText = tipElement.getAttribute("title");
      if (titleText && /\S/.test(titleText)) {
        let direction = defView.getComputedStyle(tipElement, "")
                               .getPropertyValue("direction");
        let tipNode = document.getElementById("aHTMLTooltip");
        tipNode.style.direction = direction;
        // Per HTML 4.01 6.2 (CDATA section), literal CRs and tabs should be
        // replaced with spaces, and LFs should be removed entirely.
        // XXX Bug 322270: We don't preserve the result of entities like &#13;,
        // which should result in a line break in the tooltip, because we can't
        // distinguish that from a literal character in the source by this point.
        titleText = titleText.replace(/[\r\t]/g, ' ').replace(/\n/g, '');
        tipNode.setAttribute("label", titleText);
        return true;
      }
    }
    tipElement = tipElement.parentNode;
  }

  return false;
}
