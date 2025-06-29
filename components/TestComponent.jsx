// Simple test component to verify React setup
const TestComponent = ({ message }) => {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="p-4 bg-blue-100 rounded">
      <h2 className="text-xl font-bold mb-2">Test Component</h2>
      <p>{message}</p>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  );
};

// Export to window for CDN usage
if (typeof window !== 'undefined') {
  window.TestComponent = TestComponent;
}