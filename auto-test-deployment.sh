#!/bin/bash

echo "Waiting 5 minutes for deployment to complete..."
sleep 300

echo "Running visual comparison test..."

# Create test HTML that will compare live vs mock
cat > /tmp/visual-comparison-test.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Comparison Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .comparison-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        iframe {
            width: 100%;
            height: 800px;
            border: 2px solid #ddd;
        }
        .result {
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .pass {
            background: #d4edda;
            color: #155724;
        }
        .fail {
            background: #f8d7da;
            color: #721c24;
        }
        h2 {
            margin-top: 0;
        }
    </style>
</head>
<body>
    <h1>Visual Comparison: Live Site vs Mock</h1>
    
    <div class="comparison-container">
        <div>
            <h2>Live Site</h2>
            <iframe src="https://starter-pack-app.vercel.app/roi-finder.html" id="live-frame"></iframe>
        </div>
        <div>
            <h2>Mock</h2>
            <iframe src="file:///home/amy/StarterPackApp/mocks/roi-finder-fixed-mock.html" id="mock-frame"></iframe>
        </div>
    </div>
    
    <div id="results"></div>
    
    <script>
        async function runComparison() {
            const results = document.getElementById('results');
            
            // Wait for iframes to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const checks = [
                {
                    name: "Sidebar Background Color",
                    description: "Should be dark gray (#111827)",
                    status: "manual"
                },
                {
                    name: "Logo Design",
                    description: "Should have gradient background with blur effect",
                    status: "manual"
                },
                {
                    name: "Active Navigation Item",
                    description: "Analytics should have gradient background",
                    status: "manual"
                },
                {
                    name: "Form Container",
                    description: "Should have rounded corners and shadow",
                    status: "manual"
                },
                {
                    name: "Tip Banner",
                    description: "Should have gradient background (indigo to purple)",
                    status: "manual"
                },
                {
                    name: "Button Styles",
                    description: "Primary button should have gradient, secondary should have border",
                    status: "manual"
                }
            ];
            
            let html = '<h2>Visual Comparison Results</h2>';
            html += '<div class="result fail">';
            html += '<p><strong>Manual Review Required:</strong> Please visually compare the following elements:</p>';
            html += '<ul>';
            checks.forEach(check => {
                html += `<li><strong>${check.name}:</strong> ${check.description}</li>`;
            });
            html += '</ul>';
            html += '</div>';
            
            results.innerHTML = html;
            
            // Log to console for debugging
            console.log('Visual comparison test completed. Manual review required.');
        }
        
        window.addEventListener('load', () => {
            setTimeout(runComparison, 5000);
        });
    </script>
</body>
</html>
EOF

echo "Visual comparison test created at /tmp/visual-comparison-test.html"
echo "Test completed. Please review the results."