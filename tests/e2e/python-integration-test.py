#!/usr/bin/env python3
"""
Python-based integration test for ROI Finder
Uses http.server to avoid Vercel dev issues
"""

import os
import sys
import time
import subprocess
import socket
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

# Configuration
PORT = 8080
TEST_URL = f"http://localhost:{PORT}/roi-finder-test.html?e2e_test_mode=true"
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

class QuietHTTPRequestHandler(SimpleHTTPRequestHandler):
    """HTTP handler that suppresses log output"""
    def log_message(self, format, *args):
        pass

def start_server():
    """Start HTTP server in the project root"""
    os.chdir(PROJECT_ROOT)
    server = HTTPServer(("localhost", PORT), QuietHTTPRequestHandler)
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    return server

def wait_for_server(timeout=10):
    """Wait for server to be ready"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect(("localhost", PORT))
            sock.close()
            return True
        except:
            time.sleep(0.1)
    return False

def run_integration_test():
    """Run the integration test"""
    print("🧪 ROI Finder Integration Test (Python)")
    print("=" * 50)
    
    # Start server
    print(f"📦 Starting HTTP server on port {PORT}...")
    server = start_server()
    
    if not wait_for_server():
        print("❌ Failed to start server")
        return False
    
    print("✅ Server started successfully")
    
    # Run Playwright test
    with sync_playwright() as p:
        print("\n🌐 Launching browser...")
        browser = p.chromium.launch(headless=True)
        
        try:
            context = browser.new_context()
            page = context.new_page()
            
            # Capture console messages
            console_errors = []
            console_logs = []
            
            def handle_console(msg):
                if msg.type == "error":
                    console_errors.append(msg.text)
                    print(f"  ❌ Console Error: {msg.text}")
                elif msg.type == "log" and "[INIT]" in msg.text or "[TEST MODE]" in msg.text:
                    console_logs.append(msg.text)
                    print(f"  📝 {msg.text}")
            
            page.on("console", handle_console)
            
            def handle_pageerror(exception):
                print(f"  ❌ Page Error: {exception}")
                console_errors.append(str(exception))
            
            page.on("pageerror", handle_pageerror)
            
            # Navigate to page
            print(f"\n📂 Loading: {TEST_URL}")
            page.goto(TEST_URL)
            page.wait_for_load_state("domcontentloaded")
            
            # Check for JavaScript errors
            print("\n🔍 Checking for JavaScript errors...")
            if console_errors:
                print(f"❌ Found {len(console_errors)} console errors")
                for error in console_errors[:5]:  # Show first 5 errors
                    print(f"   - {error}")
                return False
            else:
                print("✅ No JavaScript errors detected")
            
            # Check component initialization
            print("\n🔍 Checking component initialization...")
            components_check = page.evaluate("""() => {
                return {
                    ComponentLoader: typeof window.ComponentLoader,
                    ComponentLoaderCompactModern: typeof window.ComponentLoaderCompactModern,
                    CompactModernLayout: typeof window.CompactModernLayout,
                    PropertyHeroSection: typeof window.PropertyHeroSection,
                    FinancialSummaryCompactModern: typeof window.FinancialSummaryCompactModern,
                    InvestmentVerdictCompactModern: typeof window.InvestmentVerdictCompactModern,
                    MarketComparisonCompactModern: typeof window.MarketComparisonCompactModern,
                    componentLoader: window.componentLoader ? window.componentLoader.constructor.name : 'undefined'
                };
            }""")
            
            all_components_loaded = True
            for name, type_str in components_check.items():
                status = "✅" if type_str != "undefined" else "❌"
                print(f"  {status} {name}: {type_str}")
                if type_str == "undefined" and name != "componentLoader":
                    all_components_loaded = False
            
            if not all_components_loaded:
                print("\n❌ Not all components loaded properly")
                return False
            
            # Check component loader instance
            print("\n🔍 Checking component loader instance...")
            loader_check = page.evaluate("""() => {
                if (!window.componentLoader) return { exists: false };
                return {
                    exists: true,
                    isComponentLoader: window.componentLoader instanceof window.ComponentLoader,
                    isCompactModern: window.componentLoader instanceof window.ComponentLoaderCompactModern,
                    className: window.componentLoader.constructor.name
                };
            }""")
            
            if not loader_check["exists"]:
                print("❌ Component loader not found")
                return False
            elif not loader_check["isCompactModern"]:
                print("❌ Component loader is not CompactModernLoader instance")
                return False
            else:
                print(f"✅ Component loader initialized: {loader_check['className']}")
            
            # Check UI elements
            print("\n🔍 Checking UI elements...")
            ui_elements = {
                "Form": "#property-form",
                "Submit Button": 'button[type="submit"]',
                "Address Field": "#address",
                "City Field": "#city",
                "Price Field": "#price",
                "Sidebar": ".cm-sidebar",
                "Main Content": ".cm-main-content"
            }
            
            all_ui_present = True
            for name, selector in ui_elements.items():
                element = page.query_selector(selector)
                status = "✅" if element else "❌"
                print(f"  {status} {name}")
                if not element:
                    all_ui_present = False
            
            if not all_ui_present:
                print("\n❌ Not all UI elements present")
                return False
            
            # Test form interaction
            print("\n🔍 Testing form interaction...")
            page.fill("#address", "123 Test Street")
            page.fill("#city", "Test City")
            page.fill("#price", "500000")
            
            # Submit form
            page.click('button[type="submit"]')
            
            # Wait for mock response
            page.wait_for_timeout(1500)
            
            # Check for results
            results = page.query_selector("#results-container .cm-success")
            if results:
                print("✅ Form submission handled successfully")
            else:
                print("❌ Form submission did not produce expected results")
                return False
            
            # Test mobile responsiveness
            print("\n🔍 Testing mobile responsiveness...")
            page.set_viewport_size({"width": 375, "height": 667})
            page.wait_for_timeout(500)
            
            # Check if sidebar is hidden on mobile
            sidebar_visible = page.is_visible(".cm-sidebar")
            if sidebar_visible:
                print("⚠️  Sidebar visible on mobile (should be hidden by default)")
            else:
                print("✅ Sidebar hidden on mobile")
            
            print("\n✅ All integration tests passed!")
            return True
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    success = run_integration_test()
    sys.exit(0 if success else 1)