// utils/analytics.js
class Analytics {
  trackEvent(category, action, label, value) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
    
    // Custom analytics to Firebase
    db.collection('analytics').add({
      category,
      action,
      label,
      value,
      userId: auth.currentUser?.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  
  trackAnalysis(propertyAddress, roi) {
    this.trackEvent('Analysis', 'complete', propertyAddress, roi);
  }
}

export default new Analytics();
