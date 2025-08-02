// Utility to safely add event listeners
function safeAddEventListener(selector, event, handler) {
    const element = typeof selector === 'string' ? document.getElementById(selector) : selector;
    if (element) {
        element.addEventListener(event, handler);
        return true;
    }
    console.warn(`Element not found: ${selector}`);
    return false;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { safeAddEventListener };
} else {
    window.safeAddEventListener = safeAddEventListener;
}