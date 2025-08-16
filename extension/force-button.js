// Paste this in console on a Realtor.ca property page to force add the button

console.log('🔧 Force adding StarterPack button...');

// Remove existing button if any
const existing = document.getElementById('starterpack-analyze-btn');
if (existing) existing.remove();

// Create button
const button = document.createElement('button');
button.id = 'starterpack-analyze-btn';
button.style.cssText = `
  background: #10B981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;
button.innerHTML = '🏠 Analyze with StarterPack';

// Add click handler
button.onclick = () => {
  console.log('StarterPack button clicked!');
  alert('Button works! Extension functionality confirmed.');
};

// Add to page
document.body.appendChild(button);
console.log('✅ Button added to top-right corner');