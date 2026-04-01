import streamlit as st
import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFilter
import os
import json
import re
import time
import random
from dotenv import load_dotenv
import pandas as pd
import plotly.express as px
from fpdf import FPDF
import io
import asyncio
from playwright.async_api import async_playwright
import tempfile
import cv2
import numpy as np
import sys
import pathlib
import subprocess
import base64

# Optional Firebase integration - gracefully handle if module doesn't exist
try:
    from db_firebase import save_scan
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    def save_scan(*args, **kwargs):
        """Placeholder function when Firebase is not available"""
        return None

from insight_layers import generate_insight_layers_with_model

# CLOUD FIX: Install Playwright browsers automatically on startup
try:
    # Check if running on Streamlit Cloud (Linux)
    if sys.platform == "linux":
        # Install chromium browser (non-blocking, don't fail if already installed)
        result = subprocess.run(
            ["playwright", "install", "chromium"], 
            capture_output=True, 
            text=True,
            timeout=120
        )
        if result.returncode != 0:
            print(f"Playwright install warning: {result.stderr[:200]}")
        
        # Install system dependencies (non-blocking)
        result = subprocess.run(
            ["playwright", "install-deps", "chromium"], 
            capture_output=True, 
            text=True,
            timeout=120
        )
        if result.returncode != 0:
            print(f"Playwright deps warning: {result.stderr[:200]}")
except subprocess.TimeoutExpired:
    print("Browser install timed out (may already be installed)")
except Exception as e:
    print(f"Browser Install Error (non-critical): {str(e)[:200]}")

# Fix Windows console encoding for Unicode characters
if sys.platform == 'win32':
    try:
        # Set console to UTF-8 encoding on Windows
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8')
    except:
        # If reconfiguration fails, continue without it
        pass

# Load environment variables from .env.local or .env file
# Use absolute paths and override=True to ensure variables are loaded
env_path = pathlib.Path(__file__).parent / '.env.local'
env_path_default = pathlib.Path(__file__).parent / '.env'

# Load .env.local first (takes precedence), then .env as fallback
if env_path.exists():
    load_dotenv(env_path, override=True)
if env_path_default.exists():
    load_dotenv(env_path_default, override=False)  # Don't override if .env.local already set it

def get_api_key():
    """
    Get API key from Streamlit secrets (for cloud) or environment variables (for local).
    Returns the API key string or None if not found.
    """
    # First try Streamlit secrets (for Streamlit Cloud)
    try:
        if hasattr(st, 'secrets') and 'GOOGLE_GENAI_API_KEY' in st.secrets:
            api_key = st.secrets['GOOGLE_GENAI_API_KEY']
            if api_key:
                return api_key.strip().strip('"').strip("'")
    except Exception:
        pass
    
    # Fallback to environment variable (for local development)
    api_key = os.getenv("GOOGLE_GENAI_API_KEY")
    if api_key:
        return api_key.strip().strip('"').strip("'")
    
    return None

# Page Configuration
st.set_page_config(
    page_title="SiteRoast - Brutal Conversion Audits",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Professional SaaS Look
css = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
    
    /* Hide Default Streamlit Elements */
    #MainMenu {visibility: hidden !important;}
    footer {visibility: hidden !important;}
    header {visibility: hidden !important;}
    .stDeployButton {display: none !important;}
    [data-testid="stHeader"] {visibility: hidden !important; height: 0 !important;}
    [data-testid="stToolbar"] {display: none !important;}
    
    /* Hero Section Styling */
    .main-title,
    h1.main-title,
    h1#site-roast-ai,
    h1.main-title#site-roast-ai {
        text-align: center !important;
        font-size: 3.2rem !important;
        font-weight: bold !important;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 25%, #c44569 50%, #8b5cf6 75%, #667eea 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        background-color: transparent !important;
        margin: 0 auto 0.5rem auto !important;
        letter-spacing: -0.02em !important;
        text-shadow: 0 0 30px rgba(102, 126, 234, 0.3) !important;
        position: relative !important;
        display: block !important;
        width: 100% !important;
        left: 0 !important;
        right: 0 !important;
    }
    
    /* Remove background glow effect - keep transparent */
    .main-title::before {
        display: none !important;
    }
    
    .main-title::after {
        display: none !important;
    }
    .sub-header {
        text-align: center;
        font-size: 1.3rem;
        color: #64748b;
        margin-bottom: 2rem;
    }
    
    /* Input Field Styling */
    .stTextInput,
    [data-testid="stTextInput"] {
        overflow: visible !important;
        padding-bottom: 2px !important;
        margin-bottom: 4px !important;
    }
    
    .stTextInput > div,
    [data-testid="stTextInput"] > div {
        overflow: visible !important;
        padding-bottom: 2px !important;
        margin-bottom: 2px !important;
    }
    
    .stTextInput > div > div,
    [data-testid="stTextInput"] > div > div {
        height: 52px !important;
        min-height: 52px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        overflow: visible !important;
        padding: 1px !important;
        margin: 0 !important;
    }
    
    /* Fix for Streamlit's input wrapper */
    [data-testid="stTextInput"] > div > div > div {
        height: 52px !important;
        min-height: 52px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        overflow: visible !important;
        padding: 1px !important;
    }
    
    .stTextInput > div > div > input,
    input[type="text"][id*="text_input"],
    input[aria-label*="URL"],
    input[data-cursor-element-id] {
        height: 50px !important;
        min-height: 50px !important;
        max-height: 50px !important;
        border-radius: 12px !important;
        padding: 0 16px !important;
        font-size: 16px !important;
        line-height: 50px !important;
        border: 1px solid #E0E0E0 !important;
        transition: border-color 0.3s ease;
        vertical-align: middle !important;
        text-align: left !important;
        display: block !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        overflow: visible !important;
        outline: none !important;
        box-shadow: none !important;
    }
    
    /* Remove red borders from input fields */
    input[type="text"][id*="text_input"]:invalid,
    input[aria-label*="URL"]:invalid,
    input[data-cursor-element-id]:invalid,
    input[type="text"][id*="text_input"].error,
    input[aria-label*="URL"].error,
    input[data-cursor-element-id].error {
        border: 1px solid #E0E0E0 !important;
        outline: none !important;
        box-shadow: none !important;
    }
    
    /* Remove any red borders, outlines, or overlays from cursor/extension overlays */
    input[data-cursor-element-id]::before,
    input[data-cursor-element-id]::after,
    input[type="text"][id*="text_input"]::before,
    input[type="text"][id*="text_input"]::after,
    input[aria-label*="URL"]::before,
    input[aria-label*="URL"]::after {
        display: none !important;
        content: none !important;
    }
    
    /* Aggressively remove any red rectangle overlays from cursor IDE or extensions */
    [data-cursor-element-id],
    *[data-cursor-element-id],
    div[data-cursor-element-id],
    span[data-cursor-element-id],
    input[data-cursor-element-id],
    input[data-cursor-element-id="cursor-el-60"],
    input[id="text_input_1"][data-cursor-element-id],
    [id*="cursor-el"] {
        outline: none !important;
        border: 1px solid #E0E0E0 !important;
        box-shadow: none !important;
        background: transparent !important;
    }
    
    /* Remove white borders on selection */
    *::selection,
    *::-moz-selection,
    *:focus,
    *:focus-visible,
    *:focus-within {
        outline: none !important;
        border: none !important;
        box-shadow: none !important;
    }
    
    /* Remove white borders from selected elements */
    div[style*="border"],
    div[style*="outline"],
    div[style*="white"],
    *[style*="border: white"],
    *[style*="border-color: white"],
    *[style*="outline: white"] {
        border: none !important;
        outline: none !important;
    }
    
    /* Hide any overlay divs that are absolutely/fixed positioned with borders */
    div[style*="position: absolute"],
    div[style*="position: fixed"],
    div[style*="absolute"],
    div[style*="fixed"] {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
    }
    
    /* Hide any overlay elements that might be creating red/white rectangles */
    *[style*="red"],
    *[style*="border.*red"],
    *[style*="outline.*red"],
    *[style*="white"],
    *[style*="border.*white"],
    *[style*="background.*white"],
    *[style*="background-color.*white"],
    *[style*="background-color.*#fff"],
    *[style*="background-color.*#ffffff"],
    *[class*="cursor"],
    div[style*="position: absolute"][style*="border"],
    div[style*="position: fixed"][style*="border"],
    div[style*="position: absolute"][style*="background"],
    div[style*="position: fixed"][style*="background"] {
        outline: none !important;
        border: none !important;
        background: transparent !important;
    }
    
    /* Ensure input elements don't have red borders/outlines */
    input:not(:focus) {
        outline: none !important;
        border-color: #E0E0E0 !important;
    }
    
    /* Remove any red box-shadows or outlines on inputs */
    input[type="text"],
    input[type="text"][data-cursor-element-id] {
        box-shadow: none !important;
        border: 1px solid #E0E0E0 !important;
    }
    
    input[type="text"]:not(:focus),
    input[type="text"][data-cursor-element-id]:not(:focus) {
        outline: 0 !important;
        border: 1px solid #E0E0E0 !important;
        box-shadow: none !important;
    }
    
    /* Hide any absolutely positioned overlays that might be red/white rectangles */
    div[style*="position: absolute"][style*="border"],
    div[style*="position: fixed"][style*="border"],
    div[style*="position: absolute"][style*="background"],
    div[style*="position: fixed"][style*="background"],
    span[style*="position: absolute"][style*="border"],
    span[style*="position: fixed"][style*="border"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        border: none !important;
        background: transparent !important;
    }
    
    /* Hide white rectangle overlays from element selector - aggressive targeting */
    div[style*="background-color: white"],
    div[style*="background-color:#fff"],
    div[style*="background-color:#ffffff"],
    div[style*="background-color:rgb(255, 255, 255)"],
    div[style*="background-color:rgb(255,255,255)"],
    div[style*="background: white"],
    div[style*="background:#fff"],
    div[style*="background:#ffffff"],
    div[style*="background:rgb(255, 255, 255)"],
    div[style*="background:rgb(255,255,255)"],
    div[style*="background-color: white"],
    span[style*="background-color: white"],
    span[style*="background-color:#fff"],
    span[style*="background-color:#ffffff"],
    *[style*="background-color: white"],
    *[style*="background-color:#fff"],
    *[style*="background-color:#ffffff"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        background: transparent !important;
        background-color: transparent !important;
    }
    
    .stTextInput > div > div > input:focus,
    input[type="text"][id*="text_input"]:focus,
    input[aria-label*="URL"]:focus,
    input[data-cursor-element-id]:focus,
    .stTextInput > div > div > input:focus-visible,
    input[type="text"][id*="text_input"]:focus-visible,
    input[aria-label*="URL"]:focus-visible,
    input[data-cursor-element-id]:focus-visible,
    .stTextInput > div > div > input:active,
    input[type="text"][id*="text_input"]:active,
    input[aria-label*="URL"]:active,
    input[data-cursor-element-id]:active {
        border: 1px solid #E0E0E0 !important;
        border-color: #E0E0E0 !important;
        outline: none !important;
        box-shadow: none !important;
    }
    
    /* Aggressively remove ALL red borders and outlines in all states */
    input[type="text"],
    input[aria-label*="URL"],
    input[id*="text_input"],
    input[data-cursor-element-id],
    input[type="text"]:focus,
    input[aria-label*="URL"]:focus,
    input[id*="text_input"]:focus,
    input[data-cursor-element-id]:focus,
    input[type="text"]:focus-within,
    input[aria-label*="URL"]:focus-within,
    input[id*="text_input"]:focus-within,
    input[data-cursor-element-id]:focus-within,
    input[type="text"]:invalid,
    input[aria-label*="URL"]:invalid,
    input[id*="text_input"]:invalid,
    input[data-cursor-element-id]:invalid,
    input[type="text"]:invalid:focus,
    input[aria-label*="URL"]:invalid:focus,
    input[id*="text_input"]:invalid:focus,
    input[data-cursor-element-id]:invalid:focus {
        border: 1px solid #E0E0E0 !important;
        border-color: #E0E0E0 !important;
        outline: none !important;
        box-shadow: none !important;
    }
    
    /* Remove any red color from borders in all states */
    *[style*="border.*red"],
    *[style*="border-color.*red"],
    *[style*="outline.*red"],
    input[style*="border.*red"],
    input[style*="border-color.*red"],
    input:focus[style*="border.*red"],
    input:focus[style*="border-color.*red"] {
        border: 1px solid #E0E0E0 !important;
        border-color: #E0E0E0 !important;
        outline: none !important;
    }
    
    /* Remove red borders from parent containers when input is focused */
    .stTextInput:has(input:focus),
    .stTextInput:has(input:focus-visible),
    div:has(input[aria-label*="URL"]:focus),
    div:has(input[id*="text_input"]:focus) {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
    }
    
    /* Remove any validation error styling */
    input:required:invalid:focus,
    input:required:invalid:not(:placeholder-shown):focus {
        border: 1px solid #E0E0E0 !important;
        border-color: #E0E0E0 !important;
        outline: none !important;
        box-shadow: none !important;
    }
    
    /* Card Styling - Thin separator instead of white rectangles */
    .css-card {
        background-color: transparent;
        border-radius: 0;
        padding: 0;
        box-shadow: none;
        border: none;
        border-bottom: 2px solid #e0e0e0;
        margin-bottom: 0.5rem;
    }
    
    /* Heatmap Image Rounded Corners */
    .stImage img {
        border-radius: 12px !important;
    }
    
    /* Metric Cards Enhancement */
    [data-testid="stMetricValue"] {
        font-size: 2rem !important;
        font-weight: 700 !important;
        color: #667eea !important;
    }
    
    /* Highlight ROI and revenue metrics */
    .roi-card [data-testid="stMetricValue"],
    .css-card [data-testid="stMetricValue"] {
        color: #667eea !important;
    }
    
    /* Ensure button is always visible, enabled, and has proper color */
    button[data-testid="stBaseButton-primary"],
    button[data-testid="stBaseButton-primary"]:not(:disabled),
    button[type="button"][data-testid="stBaseButton-primary"],
    button[key="roast_button"] {
        visibility: visible !important;
        display: block !important;
        opacity: 1 !important;
        cursor: pointer !important;
        background-color: rgb(103, 58, 255) !important;
        color: white !important;
        border: none !important;
    }
    
    button[data-testid="stBaseButton-primary"]:disabled,
    button[key="roast_button"]:disabled {
        background-color: rgb(103, 58, 255) !important;
        color: white !important;
        opacity: 1 !important;
        cursor: pointer !important;
    }
    
    button[data-testid="stBaseButton-primary"]:hover,
    button[key="roast_button"]:hover {
        background-color: rgb(85, 48, 220) !important;
    }
</style>
<script>
    // Auto-trigger button on Enter key press in URL input
    (function() {
        function setupEnterKeyHandler() {
            const urlInputs = document.querySelectorAll('input[aria-label*="URL"], input[placeholder*="example.com"], input[type="text"]');
            const roastButton = document.querySelector('button[data-testid="stBaseButton-primary"]');
            
            urlInputs.forEach(function(urlInput) {
                // Remove existing listeners to avoid duplicates
                const newInput = urlInput.cloneNode(true);
                urlInput.parentNode.replaceChild(newInput, urlInput);
                
                newInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && newInput.value.trim() !== '') {
                        e.preventDefault();
                        // Find and click the roast button
                        const btn = document.querySelector('button[data-testid="stBaseButton-primary"]');
                        if (btn && !btn.disabled) {
                            btn.click();
                        }
                    }
                });
            });
        }
        
        // Try immediately
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupEnterKeyHandler);
        } else {
            setupEnterKeyHandler();
        }
        
        // Also try after delays (Streamlit renders elements dynamically)
        setTimeout(setupEnterKeyHandler, 500);
        setTimeout(setupEnterKeyHandler, 1500);
        
        // Use MutationObserver to catch dynamically added elements
        const observer = new MutationObserver(function(mutations) {
            let shouldSetup = false;
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    shouldSetup = true;
                }
            });
            if (shouldSetup) {
                setTimeout(setupEnterKeyHandler, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    })();
    
    // Aggressively remove any red/white rectangle overlays from cursor IDE or extensions
    (function() {
        function removeRedOverlays() {
            // Remove red borders/outlines from all cursor elements
            const cursorElements = document.querySelectorAll('[data-cursor-element-id]');
            cursorElements.forEach(function(el) {
                el.style.border = 'none';
                el.style.outline = 'none';
                el.style.boxShadow = 'none';
                el.style.backgroundColor = 'transparent';
                
                // If it's an input, restore proper styling
                if (el.tagName === 'INPUT') {
                    el.style.border = '1px solid #E0E0E0';
                }
            });
            
            // Find and hide ANY elements with white backgrounds (more aggressive)
            const allElements = document.querySelectorAll('*');
            allElements.forEach(function(el) {
                // Skip input elements and the body/html
                if (el.tagName === 'INPUT' || el.tagName === 'BODY' || el.tagName === 'HTML' || el === document.activeElement) {
                    return;
                }
                
                const style = window.getComputedStyle(el);
                const backgroundColor = style.backgroundColor;
                const position = style.position;
                const display = style.display;
                const zIndex = style.zIndex;
                
                // Check for white background - be very aggressive
                const bgColorStr = backgroundColor.toLowerCase();
                const hasWhiteBackground = bgColorStr.includes('rgb(255, 255, 255)') || 
                                          bgColorStr.includes('rgb(255,255,255)') ||
                                          bgColorStr.includes('#ffffff') || 
                                          bgColorStr.includes('#fff') ||
                                          bgColorStr === 'white' ||
                                          bgColorStr.startsWith('rgba(255, 255, 255') ||
                                          bgColorStr.startsWith('rgba(255,255,255');
                
                // Hide any absolutely/fixed positioned elements with white backgrounds (overlays)
                if (hasWhiteBackground && (position === 'absolute' || position === 'fixed') && display !== 'none') {
                    // Only hide if it's likely an overlay (has high z-index or is positioned absolutely/fixed)
                    if (parseInt(zIndex) > 1000 || position === 'absolute' || position === 'fixed') {
                        el.style.display = 'none';
                        el.style.visibility = 'hidden';
                        el.style.opacity = '0';
                        el.style.pointerEvents = 'none';
                        el.style.background = 'transparent';
                        el.style.backgroundColor = 'transparent';
                    }
                }
                
                // Also check for red borders (original functionality)
                const borderColor = style.borderColor;
                const hasRedBorder = borderColor.includes('rgb(255, 0, 0)') || borderColor.includes('rgb(255,0,0)') || 
                                     borderColor.includes('#ff0000') || borderColor.includes('#f00');
                
                if (hasRedBorder && (position === 'absolute' || position === 'fixed') && display !== 'none') {
                    if (el.tagName === 'DIV' || el.tagName === 'SPAN') {
                        el.style.display = 'none';
                        el.style.visibility = 'hidden';
                        el.style.opacity = '0';
                        el.style.pointerEvents = 'none';
                        el.style.border = 'none';
                        el.style.outline = 'none';
                        el.style.boxShadow = 'none';
                        el.style.background = 'transparent';
                        el.style.backgroundColor = 'transparent';
                    }
                }
            });
            
            // Force remove borders/outlines from input elements
            const inputs = document.querySelectorAll('input[type="text"]');
            inputs.forEach(function(input) {
                input.style.outline = 'none';
                input.style.boxShadow = 'none';
                if (!input.matches(':focus')) {
                    input.style.border = '1px solid #E0E0E0';
                }
            });
        }
        
        // Run immediately
        removeRedOverlays();
        
        // Run after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', removeRedOverlays);
        }
        
        // Run multiple times to catch dynamically added elements
        setTimeout(removeRedOverlays, 50);
        setTimeout(removeRedOverlays, 100);
        setTimeout(removeRedOverlays, 250);
        setTimeout(removeRedOverlays, 500);
        setTimeout(removeRedOverlays, 1000);
        
        // Use MutationObserver to catch dynamically added overlays
        const overlayObserver = new MutationObserver(function(mutations) {
            removeRedOverlays();
        });
        
        overlayObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'data-cursor-element-id']
        });
        
        // Also observe style changes
        const styleObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    removeRedOverlays();
                }
            });
        });
        
        styleObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['style'],
            subtree: true
        });
        
        // Run periodically as a fallback
        setInterval(removeRedOverlays, 500);
    })();
</script>
"""
st.markdown(css, unsafe_allow_html=True)

def repair_json(text, error_pos=None):
    """
    Repair common JSON syntax errors.
    Tries multiple strategies to fix malformed JSON, especially missing commas.
    """
    if error_pos is not None and error_pos < len(text):
        # Get context around the error position
        start_ctx = max(0, error_pos - 100)
        end_ctx = min(len(text), error_pos + 100)
        context = text[start_ctx:end_ctx]
        safe_print(f"[DEBUG] Error context (pos {error_pos}): {safe_error_message(context)}")
    
    fixed = text
    
    # Strategy 1: Remove trailing commas before } or ]
    fixed = re.sub(r',(\s*[}\]])', r'\1', fixed)
    
    # Strategy 2: Fix missing comma after closing bracket before quote (CRITICAL - most common issue)
    # Pattern: ] "key": -> ], "key":  OR  ]\n    "key": -> ],\n    "key":
    fixed = re.sub(r'\]\s+"(\w+)":', r'], "\1":', fixed)
    fixed = re.sub(r'\]\s*\n\s*"(\w+)":', r'],\n    "\1":', fixed)
    
    # Strategy 3: Fix missing comma after closing quote before quote (array/object property)
    # Pattern: "value" "key": -> "value", "key":
    fixed = re.sub(r'"\s+"(\w+)":', r'", "\1":', fixed)
    
    # Strategy 4: Fix missing comma after closing brace/bracket before quote
    # Pattern: } "key": -> }, "key":  OR  ] "key": -> ], "key":
    fixed = re.sub(r'([}\]])"(\w+)":', r'\1, "\2":', fixed)
    
    # Strategy 5: Fix missing comma after string values with newlines
    # Pattern: "string"\n    "key": -> "string",\n    "key":
    fixed = re.sub(r'"\s*\n\s*"(\w+)":', r'",\n    "\1":', fixed)
    
    # Strategy 6: Fix missing comma after closing bracket before opening brace
    # Pattern: ] { -> ], {
    fixed = re.sub(r'\]\s*{', r'], {', fixed)
    
    # Strategy 7: Fix missing comma between array elements (after closing bracket)
    # Pattern: ]"key": -> ], "key":  (array ending before property)
    fixed = re.sub(r'\]"(\w+)":', r'], "\1":', fixed)
    
    # Strategy 8: Fix missing comma after number/boolean before quote
    # Pattern: 123 "key": -> 123, "key":  OR  true "key": -> true, "key":
    fixed = re.sub(r'(\d+|true|false|null)\s+"(\w+)":', r'\1, "\2":', fixed)
    
    # Strategy 9: Fix missing comma after closing quote before opening brace (nested objects)
    # Pattern: "value" { -> "value", {
    fixed = re.sub(r'"\s*{', r'", {', fixed)
    
    # Strategy 10: Fix missing comma after closing quote before opening bracket (nested arrays)
    # Pattern: "value" [ -> "value", [
    fixed = re.sub(r'"\s*\[', r'", [', fixed)
    
    # Strategy 11: Fix missing comma after closing quote in arrays (common pattern)
    # Pattern: "item"\n      "key": -> "item",\n      "key":
    fixed = re.sub(r'"\s*\n\s+"(\w+)":', r'",\n    "\1":', fixed)
    
    # Strategy 12: More aggressive - fix any quote-space-quote that looks like property boundary
    # But only if it's followed by a word and colon (property name pattern)
    fixed = re.sub(r'(")\s+(")(\w+)":', r'\1, \2\3":', fixed)
    
    return fixed

def clean_json_text(text):
    """
    The 'Janitor' cleaner: strip Markdown formatting and extract clean JSON.
    Removes markdown code blocks and extracts the JSON object using balanced braces.
    Handles truncated JSON by finding the deepest complete JSON object.
    """
    # Remove markdown code blocks
    text = text.replace("```json", "").replace("```", "")
    text = text.strip()
    
    # Find the first open bracket
    start = text.find("{")
    if start == -1:
        return text
    
    # Find the last close bracket that balances with the first {
    # This handles truncated JSON better than just finding last }
    brace_count = 0
    last_balanced_brace = -1
    
    for i in range(start, len(text)):
        if text[i] == '{':
            brace_count += 1
        elif text[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                last_balanced_brace = i
                break  # Found the matching closing brace
    
    # If we found a balanced JSON object, return it
    if last_balanced_brace != -1:
        return text[start:last_balanced_brace + 1]
    
    # Fallback: if no balanced brace found, try to find last } (might be truncated)
    end = text.rfind("}")
    if end != -1 and end > start:
        return text[start:end + 1]
    
    # Last resort: return from first { to end (truncated JSON - will be completed later)
    return text[start:]

def analyze_visuals(images, model):
    """
    Worker 1: Analyze visual design elements from screenshots.
    Returns unified JSON schema with items array containing: Visual Hierarchy, Aesthetics, CTA Visibility, Trust Signals, Mobile Layout.
    """
    try:
        # Optimize images before sending to Gemini
        optimized_images = []
        for img in images:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            if img.width > 1024:
                ratio = 1024 / img.width
                new_height = int(img.height * ratio)
                img = img.resize((1024, new_height), Image.Resampling.LANCZOS)
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG', quality=80, optimize=True)
            img_bytes.seek(0)
            optimized_img = Image.open(img_bytes)
            optimized_images.append(optimized_img)
        
        prompt = """Act as a Senior UX Designer. Analyze these screenshots of a landing page.

Return ONLY valid JSON in this exact format (NO other keys, NO commentary):
{
  "items": [
    {
      "elementName": "Visual Hierarchy & Layout",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation",
      "workingWell": ["Specific thing that works", "Another positive"],
      "notWorking": ["Specific problem with exact details", "Another issue"],
      "conversionImpact": "How this affects conversions (1 sentence)",
      "fix": {
        "quickFix": "Actionable fix explanation with exact values",
        "example": "Code snippet or concrete example",
        "expectedImpact": "Expected conversion impact"
      }
    },
    {
      "elementName": "Navigation Clarity",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation. Is the menu intuitive? Check menu structure, labeling clarity, and user navigation flow.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with navigation structure"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Readability",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation. Check font sizes, line height, and contrast. Assess text legibility and reading comfort.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with font sizes, line height, or contrast"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix with exact font sizes, line heights, and contrast ratios",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Scroll Experience",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation. Assess if the scroll experience is guided flow vs chaotic. Check for visual breaks, section transitions, and content organization.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with scroll flow"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Aesthetics & Image Quality",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "visuals",
      "rationale": "1-2 sentence explanation. Check logo visibility and stock image authenticity. Assess image quality, relevance, and brand consistency.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with logo visibility or stock image authenticity"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "CTA Visibility",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "conversion",
      "rationale": "1-2 sentence explanation",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Trust Signals",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "trust",
      "rationale": "1-2 sentence explanation",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    },
    {
      "elementName": "Mobile Layout",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem"],
      "conversionImpact": "How this affects conversions",
      "fix": {
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }
    }
  ]
}

CRITICAL RULES:
- Use AT MOST 3 items per element analyzed (aim for 8 items total as shown above)
- radarCategory MUST be exactly: "ux", "conversion", "visuals", "trust", "speed" (lowercase)
- status MUST be exactly: "Excellent", "Good", "Satisfactory", "Needs Improvement", or "Failed"
- impact MUST be exactly: "HI", "MI", or "LI"
- Be specific: include exact measurements, colors (hex codes), sizes, positions
- Use professional UX terminology
- MANDATORY CHECKS: Navigation clarity (Is the menu intuitive?), Readability (Font sizes, line height, and contrast check), Scroll experience (Guided flow vs chaotic), Logo visibility & stock image authenticity check"""
        
        response = model.generate_content(
            [prompt] + optimized_images,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
                "response_mime_type": "application/json"
            }
        )
        
        text = response.text.strip()
        text = clean_json_text(text)
        
        # Parse JSON
        try:
            result = json.loads(text)
        except json.JSONDecodeError as e:
            fixed_text = repair_json(text, getattr(e, 'pos', None))
            result = json.loads(fixed_text)
        
        # Ensure items array exists
        if "items" not in result:
            result["items"] = []
        
        return result
    except Exception as e:
        safe_print(f"[ERROR] analyze_visuals failed: {safe_error_message(e)}")
        return {"items": []}

def analyze_copy(text_content, model):
    """
    Worker 2: Analyze copywriting and messaging from text content.
    Returns unified JSON schema with items array containing: Headline Impact, Value Proposition, Persuasion/Tone, One Page One Goal.
    """
    try:
        # Clean and truncate text content if too long
        clean_text = text_content[:5000] if len(text_content) > 5000 else text_content
        
        prompt = f"""Act as a Lead Copywriter. Analyze this landing page text content:

{clean_text}

Return ONLY valid JSON in this exact format (NO other keys, NO commentary):
{{
  "items": [
    {{
      "elementName": "Headline Impact",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation of headline clarity and benefit-driven nature",
      "workingWell": ["Specific thing that works", "Another positive"],
      "notWorking": ["Specific problem with exact copy examples", "Another issue"],
      "conversionImpact": "How this affects conversions (1 sentence)",
      "fix": {{
        "quickFix": "Actionable fix with exact copy rewrite suggestions",
        "example": "BEFORE: [current copy] AFTER: [improved copy]",
        "expectedImpact": "Expected conversion impact"
      }}
    }},
    {{
      "elementName": "Value Proposition",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation of value prop clarity and differentiation. Check for differentiation vs generic claims. Assess if the value prop is unique and specific rather than generic industry language.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with differentiation vs generic claims"],
      "conversionImpact": "How this affects conversions",
      "fix": {{
        "quickFix": "Actionable fix with specific differentiation suggestions",
        "example": "Example",
        "expectedImpact": "Impact"
      }}
    }},
    {{
      "elementName": "Persuasion & Tone",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation of persuasion techniques and tone appropriateness. Check for Authority (expertise, credentials, social proof) and Specificity (concrete details, numbers, specific benefits).",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with authority or specificity"],
      "conversionImpact": "How this affects conversions",
      "fix": {{
        "quickFix": "Actionable fix with authority and specificity improvements",
        "example": "Example",
        "expectedImpact": "Impact"
      }}
    }},
    {{
      "elementName": "Objection Handling",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation. Specifically look for Price, Risk, Effort, and Time addresses. Check if objections are proactively addressed in the copy.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with Price, Risk, Effort, or Time objection handling"],
      "conversionImpact": "How this affects conversions",
      "fix": {{
        "quickFix": "Actionable fix addressing Price, Risk, Effort, and Time objections",
        "example": "Example",
        "expectedImpact": "Impact"
      }}
    }},
    {{
      "elementName": "Lead Capture",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "conversion",
      "rationale": "1-2 sentence explanation. Check clarity of what happens after submit. Assess if the post-submit process is clearly communicated.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with clarity of what happens after submit"],
      "conversionImpact": "How this affects conversions",
      "fix": {{
        "quickFix": "Actionable fix clarifying post-submit process",
        "example": "Example",
        "expectedImpact": "Impact"
      }}
    }},
    {{
      "elementName": "One Page One Goal",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "conversion",
      "rationale": "1-2 sentence explanation of competing CTAs and goal clarity",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem"],
      "conversionImpact": "How this affects conversions",
      "fix": {{
        "quickFix": "Actionable fix",
        "example": "Example",
        "expectedImpact": "Impact"
      }}
    }}
  ]
}}

CRITICAL RULES:
- Use AT MOST 3 items per element analyzed (aim for 6 items total as shown above)
- radarCategory MUST be exactly: "ux", "conversion", "copy", "visuals", "trust", "speed" (lowercase)
- status MUST be exactly: "Excellent", "Good", "Satisfactory", "Needs Improvement", or "Failed"
- impact MUST be exactly: "HI", "MI", or "LI"
- Be specific: include exact copy examples, suggest rewrites, identify jargon vs benefits
- Use professional copywriting terminology
- MANDATORY CHECKS: Lead Capture (Clarity of what happens after submit), Value Prop (Differentiation vs generic claims), Objection Handling (Price, Risk, Effort, and Time addresses), Persuasive Techniques (Authority and Specificity)"""
        
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
                "response_mime_type": "application/json"
            }
        )
        
        text = response.text.strip()
        text = clean_json_text(text)
        
        # Parse JSON
        try:
            result = json.loads(text)
        except json.JSONDecodeError as e:
            fixed_text = repair_json(text, getattr(e, 'pos', None))
            result = json.loads(fixed_text)
        
        # Ensure items array exists
        if "items" not in result:
            result["items"] = []
        
        return result
    except Exception as e:
        safe_print(f"[ERROR] analyze_copy failed: {safe_error_message(e)}")
        return {"items": []}

def analyze_tech(html_source, model):
    """
    Worker 3: Analyze technical SEO and compliance from HTML source.
    Returns unified JSON schema with items array containing: Page Speed Indicators, SEO Tags, Legal Compliance.
    """
    try:
        # Clean HTML - remove scripts to reduce token usage
        import re as regex_module
        clean_html = regex_module.sub(r'<script[^>]*>.*?</script>', '', html_source, flags=regex_module.DOTALL | regex_module.IGNORECASE)
        clean_html = regex_module.sub(r'<style[^>]*>.*?</style>', '', clean_html, flags=regex_module.DOTALL | regex_module.IGNORECASE)
        
        # Truncate if too long
        clean_html = clean_html[:3000] if len(clean_html) > 3000 else clean_html
        
        prompt = f"""Act as a Technical SEO Expert. Analyze this HTML source code:

{clean_html}

Return ONLY valid JSON in this exact format (NO other keys, NO commentary):
{{
  "items": [
    {{
      "elementName": "Page Speed Indicators",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "speed",
      "rationale": "1-2 sentence explanation of heavy scripts, image optimization, load time. Check for Caching & CDN usage (if detectable from HTML headers, cache-control tags, or CDN references).",
      "workingWell": ["Specific thing that works", "Another positive"],
      "notWorking": ["Specific problem with exact technical details", "Caching or CDN issues if detectable"],
      "conversionImpact": "How this affects conversions (1 sentence)",
      "fix": {{
        "quickFix": "Actionable fix with technical specifics including caching and CDN recommendations",
        "example": "Code snippet or configuration example",
        "expectedImpact": "Expected conversion impact"
      }}
    }},
    {{
      "elementName": "SEO Tags",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "copy",
      "rationale": "1-2 sentence explanation of H1 structure, meta description quality",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with tag names and attributes"],
      "conversionImpact": "How this affects conversions",
      "fix": {{
        "quickFix": "Actionable fix",
        "example": "Example HTML tags",
        "expectedImpact": "Impact"
      }}
    }},
    {{
      "elementName": "Legal Compliance",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "trust",
      "rationale": "1-2 sentence explanation. Check specifically for Privacy Policy, Terms & Conditions, Cookie Policy, AND Disclaimers. Verify presence and accessibility of all required legal links.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with Privacy Policy, Terms & Conditions, Cookie Policy, or Disclaimers"],
      "conversionImpact": "How this affects conversions",
      "fix": {{
        "quickFix": "Actionable fix ensuring Privacy Policy, Terms & Conditions, Cookie Policy, and Disclaimers are present",
        "example": "Example link structure for all legal pages",
        "expectedImpact": "Impact"
      }}
    }},
    {{
      "elementName": "Mobile Form Usability",
      "status": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Failed",
      "impact": "HI" | "MI" | "LI",
      "radarCategory": "ux",
      "rationale": "1-2 sentence explanation. Check form usability for mobile devices. Verify keyboard types for email/number inputs (type='email', type='tel', type='number'). Assess if forms are mobile-friendly.",
      "workingWell": ["Specific thing that works"],
      "notWorking": ["Specific problem with keyboard types for email/number inputs or mobile form usability"],
      "conversionImpact": "How this affects conversions",
      "fix": {{
        "quickFix": "Actionable fix with proper input types (email, tel, number) and mobile form optimization",
        "example": "Example HTML form with correct input types",
        "expectedImpact": "Impact"
      }}
    }}
  ]
}}

CRITICAL RULES:
- Use AT MOST 3 items per element analyzed (aim for 4 items total as shown above)
- radarCategory MUST be exactly: "ux", "conversion", "copy", "visuals", "trust", "speed" (lowercase)
- status MUST be exactly: "Excellent", "Good", "Satisfactory", "Needs Improvement", or "Failed"
- impact MUST be exactly: "HI", "MI", or "LI"
- Be specific: include tag names, attribute values, link URLs
- Use professional SEO terminology
- MANDATORY CHECKS: Speed (Caching & CDN usage if detectable), Legal (Privacy Policy, Terms & Conditions, Cookie Policy, AND Disclaimers), Mobile (Form usability - keyboard types for email/number)"""
        
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
                "response_mime_type": "application/json"
            }
        )
        
        text = response.text.strip()
        text = clean_json_text(text)
        
        # Parse JSON
        try:
            result = json.loads(text)
        except json.JSONDecodeError as e:
            fixed_text = repair_json(text, getattr(e, 'pos', None))
            result = json.loads(fixed_text)
        
        # Ensure items array exists
        if "items" not in result:
            result["items"] = []
        
        return result
    except Exception as e:
        safe_print(f"[ERROR] analyze_tech failed: {safe_error_message(e)}")
        return {"items": []}

def compile_roast(images, text_content, html_source, progress_manager=None):
    """
    Manager function: Orchestrates the 3 workers and merges their unified JSON outputs
    into the final God Mode JSON schema with scoring, roast summary, and aggregation.
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("GOOGLE_GENAI_API_KEY not found. For Streamlit Cloud, add it to Secrets. For local, add it to .env.local file.")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-001')
    except Exception as e:
        raise ValueError(f"Failed to configure Gemini API: {str(e)}")
    
    # Worker 1: Analyze Visuals (Progress step 13)
    if progress_manager:
        progress_manager.update(13)
    try:
        visuals_data = analyze_visuals(images, model)
        visuals_items = visuals_data.get("items", [])
    except Exception as e:
        safe_print(f"[ERROR] Visuals worker failed: {safe_error_message(e)}")
        visuals_items = []
    
    # Worker 2: Analyze Copy (Progress step 15)
    if progress_manager:
        progress_manager.update(15)
    try:
        copy_data = analyze_copy(text_content, model)
        copy_items = copy_data.get("items", [])
    except Exception as e:
        safe_print(f"[ERROR] Copy worker failed: {safe_error_message(e)}")
        copy_items = []
    
    # Worker 3: Analyze Tech (Progress step 17)
    if progress_manager:
        progress_manager.update(17)
    try:
        tech_data = analyze_tech(html_source, model)
        tech_items = tech_data.get("items", [])
    except Exception as e:
        safe_print(f"[ERROR] Tech worker failed: {safe_error_message(e)}")
        tech_items = []
    
    # Merge all items
    all_items = visuals_items + copy_items + tech_items
    
    # Scoring logic: Status points and impact multipliers
    status_points = {
        "Excellent": 95,
        "Good": 80,
        "Satisfactory": 60,
        "Needs Improvement": 35,
        "Failed": 5
    }
    impact_multipliers = {
        "HI": 1.5,
        "MI": 1.0,
        "LI": 0.5
    }
    
    # Group items by radarCategory and calculate scores
    radar_categories = ["ux", "conversion", "copy", "visuals", "trust", "speed"]
    radar_metrics = {}
    
    for category in radar_categories:
        category_items = [item for item in all_items if item.get("radarCategory", "").lower() == category.lower()]
        if category_items:
            weighted_sum = 0
            weight_sum = 0
            for item in category_items:
                status = item.get("status", "Satisfactory")
                impact = item.get("impact", "MI")
                points = status_points.get(status, 60)
                multiplier = impact_multipliers.get(impact, 1.0)
                weighted_sum += points * multiplier
                weight_sum += 95 * multiplier
            radar_metrics[category] = round((weighted_sum / weight_sum) * 100) if weight_sum > 0 else 50
        else:
            radar_metrics[category] = 50
    
    # Calculate overall score (average of radar scores)
    overall_score = round(sum(radar_metrics.values()) / len(radar_metrics))
    
    # Generate roast summary using AI (Progress step 18)
    if progress_manager:
        progress_manager.update(18)
    
    roast_summary_json = {
        "executiveSummary": "Overall analysis complete. Review detailed findings below.",
        "roastAnalysis": "Comprehensive audit completed across all key areas."
    }
    
    # Always generate roast summary - explicitly call API if missing or empty
    if all_items:
        try:
            # Build audit_dump with failed/needs improvement items
            failed_items = [
                item for item in all_items 
                if item.get("status") in ["Failed", "Needs Improvement"]
            ]
            
            audit_dump = []
            for item in failed_items[:15]:  # Limit to 15 items for token efficiency
                element_name = item.get("elementName", "Unknown Element")
                status = item.get("status", "Unknown")
                audit_dump.append(f"- {element_name}: {status}")
            
            audit_dump_str = "\n".join(audit_dump) if audit_dump else "No critical issues found."
            
            roast_prompt = f"""You are a senior conversion strategist. Tone: sharp, analytical, confident, business-focused. No sarcasm or mockery.

Input: Failed / needs-improvement audit items:
{audit_dump_str}

Task: Return ONLY valid JSON for roastSummary:

hook: Executive summary for a stakeholder. Include: (1) One direct line that the page is underperforming on key conversion signals vs these audit themes. (2) Numbered list of 2-3 critical failures tied to the audit items. (3) One sentence on business impact (conversion, trust, clarity — qualitative; do not invent dollar amounts). (4) One sentence giving clear direction on what to fix first. Use newlines between logical blocks. Minimum ~55 words.

analysis: Layered diagnostic in prose (no bullet list required, but clear paragraphs): observations tied to the audit, implications for conversion, prioritized actions. Minimum ~120 words. Professional only.

Return ONLY valid JSON in this format:
{{
  "hook": "…",
  "analysis": "…"
}}

Focus on conversion impact and decision clarity."""
            
            roast_response = model.generate_content(
                roast_prompt,
                generation_config={
                    "temperature": 0.8,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 512,
                    "response_mime_type": "application/json"
                }
            )
            
            roast_text = roast_response.text.strip()
            roast_text = clean_json_text(roast_text)
            try:
                roast_summary_json = json.loads(roast_text)
                # Convert new format to legacy format for backward compatibility
                if "hook" in roast_summary_json and "analysis" in roast_summary_json:
                    roast_summary_json["executiveSummary"] = roast_summary_json.get("hook", "")
                    roast_summary_json["roastAnalysis"] = roast_summary_json.get("analysis", "")
            except json.JSONDecodeError as e:
                fixed_text = repair_json(roast_text, getattr(e, 'pos', None))
                roast_summary_json = json.loads(fixed_text)
                # Convert new format to legacy format
                if "hook" in roast_summary_json and "analysis" in roast_summary_json:
                    roast_summary_json["executiveSummary"] = roast_summary_json.get("hook", "")
                    roast_summary_json["roastAnalysis"] = roast_summary_json.get("analysis", "")
        except Exception as e:
            safe_print(f"[WARN] Roast summary generation failed: {safe_error_message(e)}")
            # Fallback: generate a basic summary from items
            if failed_items:
                failed_names = [item.get("elementName", "Issue") for item in failed_items[:3]]
                roast_summary_json = {
                    "hook": f"Found {len(failed_items)} areas needing attention.\nFocus on: {', '.join(failed_names)}.\nThese improvements can boost conversions.",
                    "analysis": f"Analysis identified {len(failed_items)} critical issues that impact conversion rates. Addressing these top priorities will improve user experience and drive better results. The audit reveals both strengths and weaknesses across key conversion elements.",
                    "executiveSummary": f"Found {len(failed_items)} areas needing attention.\nFocus on: {', '.join(failed_names)}.\nThese improvements can boost conversions.",
                    "roastAnalysis": f"Analysis identified {len(failed_items)} critical issues that impact conversion rates. Addressing these top priorities will improve user experience and drive better results."
                }
    
    # Ensure roastSummary is always set with both new and legacy formats
    if not roast_summary_json.get("hook") and not roast_summary_json.get("executiveSummary"):
        roast_summary_json = {
            "hook": f"Site Score: {overall_score}/100\nAnalysis complete across all key areas.\nReview detailed findings below.",
            "analysis": "Comprehensive audit completed. Review the detailed findings to identify improvement opportunities. The analysis covers all critical conversion elements and provides actionable insights.",
            "executiveSummary": f"Site Score: {overall_score}/100\nAnalysis complete across all key areas.\nReview detailed findings below.",
            "roastAnalysis": "Comprehensive audit completed. Review the detailed findings to identify improvement opportunities."
        }
    elif "hook" in roast_summary_json and "executiveSummary" not in roast_summary_json:
        roast_summary_json["executiveSummary"] = roast_summary_json.get("hook", "")
        roast_summary_json["roastAnalysis"] = roast_summary_json.get("analysis", "")
    
    revenue_leak_estimate, first_impression_score, trust_gap_index, messaging_clarity_score = (
        generate_insight_layers_with_model(
            model,
            html_source,
            text_content,
            all_items,
            radar_metrics,
            radar_categories,
            clean_json_text,
            repair_json,
            safe_error_message,
            log_warn=safe_print,
        )
    )

    # Build quick wins: Use Badness Score system to always return top 3 priorities
    def calculate_badness_score(item):
        """Calculate badness score for an item. Higher score = higher priority."""
        status = item.get("status", "Satisfactory")
        impact = item.get("impact", "MI")
        
        # Badness Score calculation
        if status == "Failed" and impact == "HI":
            return 100
        elif status == "Failed" and impact == "MI":
            return 80
        elif status == "Needs Improvement" and impact == "HI":
            return 60
        elif status == "Needs Improvement" and impact == "MI":
            return 40
        elif status == "Satisfactory":
            return 10
        elif status == "Good":
            return 5
        elif status == "Excellent":
            return 0
        else:
            # Default for unknown status/impact combinations
            if status in ["Failed", "Needs Improvement"]:
                return 50
            return 10
    
    # Calculate badness score for all items and sort by score (descending)
    items_with_scores = [(item, calculate_badness_score(item)) for item in all_items]
    sorted_items = sorted(items_with_scores, key=lambda x: x[1], reverse=True)
    
    # Always take top 3 items (guarantees we always have 3 quick wins)
    quick_wins = []
    for item, score in sorted_items[:3]:
        quick_wins.append({
            "title": item.get("elementName", "Fix Required"),
            "elementName": item.get("elementName", "Fix Required"),
            "problem": "; ".join(item.get("notWorking", [])[:2]) if item.get("notWorking") else "Review and improve",
            "fix": item.get("fix", {}).get("quickFix", "Review and improve") if isinstance(item.get("fix"), dict) else str(item.get("fix", "Review and improve")),
            "example": item.get("fix", {}).get("example", "") if isinstance(item.get("fix"), dict) else "",
            "effort": "15min",
            "lift": item.get("fix", {}).get("expectedImpact", "Expected conversion improvement") if isinstance(item.get("fix"), dict) else "Expected conversion improvement"
        })
    
    # Build detailedAudit: Group items by radarCategory (case-insensitive matching)
    detailed_audit = {}
    for category in radar_categories:
        # Normalize category to lowercase for consistent matching
        cat_lower = category.lower()
        category_items = [
            item for item in all_items 
            if item.get("radarCategory", "").lower() == cat_lower
        ]
        
        # Data validity check: If Visuals category is empty, add placeholder
        if category.lower() == "visuals" and not category_items:
            category_items = [{
                "elementName": "Visual Analysis",
                "status": "Satisfactory",
                "impact": "MI",
                "radarCategory": "visuals",
                "rationale": "Visual analysis data was not available. This may indicate the visuals worker did not return structured findings.",
                "workingWell": ["Visual elements present on page"],
                "notWorking": ["Unable to perform detailed visual analysis"],
                "fix": {
                    "quickFix": "Review visual elements manually. Ensure images, colors, and layout align with brand guidelines.",
                    "expectedImpact": "Maintains visual consistency"
                }
            }]
        
        detailed_audit[category] = category_items
    
    # Build final JSON structure (backward compatible with existing display_dashboard and generate_pdf)
    final_json = {
        "overview": {
            "overallScore": overall_score,
            "executiveSummary": roast_summary_json.get("executiveSummary", "Analysis complete."),
            "roastAnalysis": roast_summary_json.get("roastAnalysis", "Review findings below.")
        },
        "roastSummary": roast_summary_json.get("executiveSummary", "Analysis complete."),
        "headline_roast": f"Site Score: {overall_score}/100",
        "radarMetrics": radar_metrics,
        "quickWins": quick_wins,
        "detailedAudit": detailed_audit,
        # Backward compatibility fields
        "overall_score": overall_score,
        "quick_wins": quick_wins,
        "summary_bullets": [
            f"✅ {item.get('elementName')}" for item in all_items if item.get("status") in ["Excellent", "Good"]
        ][:10] + [
            f"❌ {item.get('elementName')}" for item in all_items if item.get("status") in ["Needs Improvement", "Failed"]
        ][:10],
        "sections": [],  # Empty for now, can be populated if needed
        "radar_scores": {
            "UX": radar_metrics.get("ux", 50),
            "Conversion": radar_metrics.get("conversion", 50),
            "Copy": radar_metrics.get("copy", 50),
            "Visuals": radar_metrics.get("visuals", 50),
            "Trust": radar_metrics.get("trust", 50),
            "Speed": radar_metrics.get("speed", 50)
        },
        "categories": [],
        "audit_items": [
            {
                "element": item.get("elementName", ""),
                "status": item.get("status", "Satisfactory"),
                "rationale": item.get("rationale", ""),
                "working": item.get("workingWell", []),
                "not_working": item.get("notWorking", []),
                "fix": item.get("fix", {}).get("quickFix", ""),
                "expected_impact": item.get("conversionImpact", "")
            }
            for item in all_items
        ],
        "revenueLeakEstimate": revenue_leak_estimate,
        "firstImpressionScore": first_impression_score,
        "trustGapIndex": trust_gap_index,
        "messagingClarityScore": messaging_clarity_score,
    }
    
    return final_json

def generate_roast(images, html_content="", page_text="", progress_manager=None):
    """
    Main entry point for website analysis. Uses Assembly Line architecture:
    - Worker 1: analyze_visuals (screenshots)
    - Worker 2: analyze_copy (text content)
    - Worker 3: analyze_tech (HTML source)
    - Manager: compile_roast (merges results)
    """
    return compile_roast(images, page_text, html_content, progress_manager)

async def capture_screenshot_from_url(url: str, device: str = 'desktop'):
    """
    Capture rolling screenshots from a URL using Playwright with stealth mode.
    Supports both desktop and mobile device emulation.
    
    Args:
        url: The URL to capture (supports all TLDs)
        device: 'desktop' or 'mobile' (default: 'desktop')
    
    Returns:
        (screenshots: list, html_content: str, page_text: str)
    """
    browser = None
    max_retries = 3
    retry_delay = 2  # seconds
    
    # Normalize device parameter
    device = device.lower() if device else 'desktop'
    if device not in ['desktop', 'mobile']:
        device = 'desktop'
    
    # Ensure URL has protocol (handles all TLDs: .com, .ai, .io, .co, etc.)
    if not url.startswith(('http://', 'https://')):
        # Remove www. if present, then add https://
        url = url.replace('www.', '')
        url = 'https://' + url
    
    safe_print(f"[DEBUG] Normalized URL: {url}")
    safe_print(f"[DEBUG] Device mode: {device}")
    safe_print(f"[DEBUG] Starting playwright for URL: {url}")
    
    # Device-specific configuration
    if device == 'mobile':
        # Mobile device configuration (iPhone 14)
        viewport_config = {'width': 390, 'height': 844}
        screen_config = {'width': 390, 'height': 844}
        user_agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        is_mobile = True
        has_touch = True
        device_scale_factor = 3
    else:
        # Desktop configuration
        viewport_config = {'width': 1920, 'height': 1080}
        screen_config = {'width': 1920, 'height': 1080}
        user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        is_mobile = False
        has_touch = False
        device_scale_factor = 1
    
    # Realistic browser headers to avoid detection
    realistic_headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    }
    
    # Enhanced stealth browser launch arguments (The 'Human' Mask)
    stealth_args = [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certificate-errors-spki-list',
        '--user-agent=' + user_agent,  # Use device-specific user agent
    ]
    
    # Try headless first, fallback to headless=False if needed
    headless_mode = True
    
    for attempt in range(max_retries):
        try:
            async with async_playwright() as p:
                safe_print(f"[DEBUG] Launching Chromium browser (attempt {attempt + 1}/{max_retries}, headless={headless_mode})...")
                
                # Launch Chromium with enhanced stealth mode
                try:
                    browser = await p.chromium.launch(
                        headless=headless_mode,
                        args=stealth_args
                    )
                except Exception as launch_error:
                    error_msg = str(launch_error).lower()
                    if 'executable' in error_msg or 'doesn\'t exist' in error_msg or 'not found' in error_msg:
                        raise Exception(
                            'Critical Error: Browser not found. Run "playwright install chromium" in terminal.\n'
                            'If that doesn\'t work, try "python -m playwright install chromium"'
                        )
                    raise launch_error
                
                safe_print("[DEBUG] Creating context with stealth configuration...")
                context = await browser.new_context(
                    viewport=viewport_config,
                    user_agent=user_agent,
                    extra_http_headers=realistic_headers,
                    locale='en-US',
                    timezone_id='America/New_York',
                    permissions=['geolocation'],
                    color_scheme='light',
                    screen=screen_config,
                    has_touch=has_touch,
                    is_mobile=is_mobile,
                    device_scale_factor=device_scale_factor,
                )
                page = await context.new_page()
                
                # Set additional headers on the page
                await page.set_extra_http_headers(realistic_headers)
                
                # Enhanced stealth JavaScript injection (before navigation)
                await page.add_init_script("""
                    // Remove webdriver flag completely
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                        configurable: true
                    });
                    delete navigator.__proto__.webdriver;
                    
                    // Mock plugins with realistic data
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5],
                        configurable: true
                    });
                    
                    // Mock languages
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['en-US', 'en'],
                        configurable: true
                    });
                    
                    // Override permissions API
                    const originalQuery = window.navigator.permissions.query;
                    window.navigator.permissions.query = (parameters) => (
                        parameters.name === 'notifications' ?
                            Promise.resolve({ state: Notification.permission }) :
                            originalQuery(parameters)
                    );
                    
                    // Mock chrome object (essential for Chrome detection)
                    if (!window.chrome) {
                        window.chrome = {};
                    }
                    if (!window.chrome.runtime) {
                        window.chrome.runtime = {};
                    }
                    if (!window.chrome.runtime.onConnect) {
                        window.chrome.runtime.onConnect = undefined;
                    }
                    
                    // Override WebGL vendor and renderer
                    const getParameter = WebGLRenderingContext.prototype.getParameter;
                    WebGLRenderingContext.prototype.getParameter = function(parameter) {
                        if (parameter === 37445) {
                            return 'Intel Inc.';
                        }
                        if (parameter === 37446) {
                            return 'Intel Iris OpenGL Engine';
                        }
                        return getParameter.call(this, parameter);
                    };
                    
                    // Override canvas fingerprinting
                    const toBlob = HTMLCanvasElement.prototype.toBlob;
                    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
                    const getImageData = CanvasRenderingContext2D.prototype.getImageData;
                    
                    // Mock notification permissions
                    Object.defineProperty(Notification, 'permission', {
                        get: () => 'default'
                    });
                    
                    // Override iframe contentWindow
                    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
                        get: function() {
                            return window;
                        }
                    });
                """)
                
                # Additional CDP commands for Chromium to hide automation
                try:
                    cdp_session = await context.new_cdp_session(page)
                    # Hide webdriver property via CDP (executes before page scripts)
                    await cdp_session.send('Page.addScriptToEvaluateOnNewDocument', {
                        'source': '''
                            Object.defineProperty(navigator, 'webdriver', {
                                get: () => false
                            });
                            // Override Chrome runtime
                            if (!window.chrome) {
                                window.chrome = {};
                            }
                            if (!window.chrome.runtime) {
                                window.chrome.runtime = {};
                            }
                        '''
                    })
                except Exception as cdp_error:
                    # CDP is optional, don't fail if it doesn't work
                    safe_print(f"[WARN] CDP stealth injection failed (non-critical): {safe_error_message(str(cdp_error))}")
                
                safe_print(f"[DEBUG] Navigating to {url}...")
                # Navigate to URL with retry logic - try different wait strategies
                wait_strategies = ['domcontentloaded', 'load', 'networkidle']
                wait_strategy = wait_strategies[min(attempt, len(wait_strategies) - 1)]
                
                try:
                    # Try navigation with different strategies on retries
                    await page.goto(
                        url, 
                        wait_until=wait_strategy, 
                        timeout=60000,
                        referer='https://www.google.com/'  # Add referer to look more legitimate
                    )
                    safe_print(f"[DEBUG] Navigation complete (used {wait_strategy} wait strategy)")
                except Exception as nav_error:
                    error_msg = str(nav_error).lower()
                    # Check if it's an HTTP/2 error or network error
                    is_network_error = (
                        'http2' in error_msg or 
                        'protocol_error' in error_msg or 
                        'err_http2' in error_msg or
                        'net::' in error_msg or
                        'timeout' in error_msg
                    )
                    
                    if is_network_error:
                        safe_print(f"[WARN] Network/protocol error detected (attempt {attempt + 1}/{max_retries}): {error_msg[:100]}")
                        if attempt < max_retries - 1:
                            await browser.close()
                            # If headless failed, try non-headless on next attempt
                            if headless_mode and attempt == max_retries - 2:
                                safe_print("[DEBUG] Attempting fallback with headless=False...")
                                headless_mode = False
                            await asyncio.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                            continue  # Retry with next attempt
                        else:
                            safe_print("[DEBUG] All retry attempts exhausted")
                            # If still in headless mode and all retries failed, try one more time with headless=False
                            if headless_mode:
                                safe_print("[DEBUG] Final attempt: trying with headless=False...")
                                await browser.close()
                                headless_mode = False
                                await asyncio.sleep(2)
                                continue
                            raise nav_error
                    else:
                        raise nav_error
                
                # CRITICAL: Wait 3 seconds for firewall/security analysis to complete
                safe_print("[DEBUG] Waiting 3 seconds for firewall analysis...")
                await page.wait_for_timeout(3000)
                
                # Human-like behavior: Random mouse movement to prove we're not a robot
                try:
                    # Move mouse to random position (human-like behavior)
                    viewport_height = viewport_config['height']
                    viewport_width = viewport_config['width']
                    random_x = random.randint(100, viewport_width - 100)
                    random_y = random.randint(100, viewport_height - 100)
                    await page.mouse.move(random_x, random_y)
                    safe_print("[DEBUG] Performed human-like mouse movement")
                    await asyncio.sleep(random.uniform(0.5, 1.5))  # Random delay
                except Exception as mouse_error:
                    safe_print(f"[WARN] Mouse movement failed (non-critical): {safe_error_message(str(mouse_error))}")
                
                # Hard sleep to let images settle (prevents hanging on background scripts)
                await asyncio.sleep(2)
                
                # Human-like scrolling to trigger lazy loading (proves we're not a robot)
                safe_print("[DEBUG] Performing human-like scroll to trigger lazy loading...")
                await page.evaluate("""
                    async () => {
                        await new Promise((resolve) => {
                            let totalHeight = 0;
                            const distance = 100;
                            const timer = setInterval(() => {
                                const scrollHeight = document.body.scrollHeight;
                                window.scrollBy(0, distance);
                                totalHeight += distance;
                                if(totalHeight >= scrollHeight || totalHeight > 50000){
                                    clearInterval(timer);
                                    resolve();
                                }
                            }, 100);
                        });
                    }
                """)
                
                # Scroll back to top - use instant scroll to ensure we're at the very top
                await page.evaluate("window.scrollTo(0, 0)")
                await asyncio.sleep(1)  # Wait 1 second to ensure scroll completes
                
                # Double-check we're at the top
                scroll_position = await page.evaluate("window.pageYOffset || window.scrollY")
                if scroll_position > 0:
                    safe_print(f"[DEBUG] Still not at top (scroll={scroll_position}), forcing scroll to 0...")
                    await page.evaluate("window.scrollTo({ top: 0, left: 0, behavior: 'instant' })")
                    await asyncio.sleep(0.5)
                
                safe_print("[DEBUG] Confirmed at top of page, starting screenshot capture")
                
                # Extract HTML content and visible text
                safe_print("[DEBUG] Extracting HTML and text content...")
                html_content = await page.content()
                page_text = await page.evaluate("document.body.innerText")
                safe_print(f"[DEBUG] Extracted {len(html_content)} chars of HTML and {len(page_text)} chars of text")
                
                # Get dynamic viewport height
                viewport_height = await page.evaluate("window.innerHeight")
                safe_print(f"[DEBUG] Viewport height: {viewport_height}px")
                
                # Hide sticky/fixed elements for cleaner stitching (Optional Pro feature)
                await page.evaluate("""
                    () => {
                        const fixedElements = document.querySelectorAll('*');
                        fixedElements.forEach(el => {
                            const style = window.getComputedStyle(el);
                            if (style.position === 'fixed' || style.position === 'sticky') {
                                el.dataset.originalDisplay = style.display;
                                el.style.display = 'none';
                            }
                        });
                    }
                """)
                safe_print("[DEBUG] Hidden sticky/fixed elements for seamless stitching")
                
                # Precise Rolling Screenshot Capture (No overlap for stitching)
                screenshots = []
                sanity_limit = 15
                current_scroll = 0
                chunk_index = 0
                
                total_height = await page.evaluate("document.body.scrollHeight")
                
                while current_scroll < total_height and chunk_index < sanity_limit:
                    # Ensure we're at the correct scroll position before taking screenshot
                    if chunk_index == 0:
                        # First screenshot - make absolutely sure we're at top
                        await page.evaluate("window.scrollTo(0, 0)")
                        await asyncio.sleep(0.3)
                    
                    # Take screenshot of current viewport
                    screenshot_bytes = await page.screenshot(type='png', full_page=False)
                    
                    # Convert to PIL Image
                    from io import BytesIO
                    img = Image.open(BytesIO(screenshot_bytes))
                    screenshots.append(img)
                    
                    # Break condition: Do not scrape infinite scroll pages forever
                    chunk_index += 1
                    if chunk_index >= 2:  # Limited to 2 chunks while resolving errors
                        break
                    
                    # Precise scroll (exactly viewport_height, no overlap)
                    current_scroll += viewport_height
                    await page.mouse.wheel(0, viewport_height)  # Precise mouse wheel scroll
                    await asyncio.sleep(1)
                    
                    # Recalculate total height (in case of dynamic content)
                    total_height = await page.evaluate("document.body.scrollHeight")
                
                safe_print(f"[DEBUG] Captured {len(screenshots)} chunks successfully")
                await browser.close()
                
                return screenshots, html_content, page_text
                
        except Exception as e:
            error_msg = str(e).lower()
            is_network_error = (
                'http2' in error_msg or 
                'protocol_error' in error_msg or 
                'err_http2' in error_msg or
                'net::' in error_msg or
                'timeout' in error_msg or
                'navigation' in error_msg
            )
            
            if is_network_error and attempt < max_retries - 1:
                safe_print(f"[WARN] Network error on attempt {attempt + 1}, retrying in {retry_delay * (attempt + 1)}s...")
                if browser:
                    try:
                        await browser.close()
                    except:
                        pass
                # If headless failed, try non-headless on next attempt
                if headless_mode and attempt == max_retries - 2:
                    safe_print("[DEBUG] Attempting fallback with headless=False...")
                    headless_mode = False
                await asyncio.sleep(retry_delay * (attempt + 1))
                continue  # Retry
            else:
                # Final attempt failed or non-network error
                if browser:
                    try:
                        await browser.close()
                    except:
                        pass
                
                # If still in headless mode and it's a network error, try one final time with headless=False
                if is_network_error and headless_mode:
                    safe_print("[DEBUG] Final attempt: trying with headless=False...")
                    headless_mode = False
                    await asyncio.sleep(2)
                    continue
                
                import traceback
                error_details = traceback.format_exc()
                safe_print(f"[ERROR] Screenshot capture failed after {attempt + 1} attempts:")
                safe_print(safe_error_message(error_details))
                
                # Provide helpful error message
                if is_network_error:
                    error_message = (
                        f"Target site has Enterprise Blocking active. Please try a different URL.\n\n"
                        f"Network/protocol error when accessing {url}. "
                        f"This can happen if the website blocks automated browsers or has strict security. "
                        f"Tried {max_retries} times with different configurations (including visible browser mode). "
                        f"Consider trying again later or using a different URL."
                    )
                else:
                    safe_error = safe_error_message(e)
                    error_message = f"Failed to capture screenshot: {safe_error}"
                
                safe_error_details = safe_error_message(error_details)
                raise Exception(f"{error_message}\n\nFull traceback:\n{safe_error_details}")
    
    # Should never reach here, but just in case
    raise Exception(f"Failed to capture screenshot from {url} after {max_retries} attempts")

def update_vibe_progress(bar, status, step_index, total_steps=20):
    """
    Update progress bar to a specific step (instant update, no sleep).
    Used during actual work to show progress in real-time.
    """
    vibe_messages = [
        "🌐 Initiating 'Ghost Browser' session...",
        "📡 Pinging server for response time...",
        "👻 Simulating new visitor arrival...",
        "📸 Scanning 'Above the Fold' area...",
        "⏱️ Testing the 3-Second Rule (First Impression)...",
        "🖼️ Analyzing Hero Image for emotional impact...",
        "📝 Reading Headline (checking for 'boring' keywords)...",
        "🎯 Hunting for the Call-to-Action (CTA)...",
        "🔍 Checking CTA contrast and visibility...",
        "📜 Scrolling down... analyzing User Flow...",
        "✍️ Reading copy for jargon vs. benefits...",
        "🛡️ Looking for Trust Signals (Testimonials/Logos)...",
        "🎨 Scanning visuals (Visual Hierarchy, Aesthetics, CTAs, Trust, Mobile)...",
        "👁️ Simulating eye-tracking patterns (Heatmap generation)...",
        "✍️ Roasting your copy (Headline, Value Prop, Tone, One Page One Goal)...",
        "📱 Checking Mobile Responsiveness logic...",
        "⚡ Checking speed & legal stuff (Page Speed, SEO Tags, Compliance)...",
        "⚖️ Verifying Legal compliance (Privacy/Terms links)...",
        "📊 Generating executive summary...",
        "🔥 Calculating final Roast Score..."
    ]
    
    if step_index < len(vibe_messages):
        progress = int((step_index + 1) / total_steps * 90)  # 0-90%
        message = vibe_messages[step_index]
        status.markdown(f'<p style="text-align: center; font-size: 1.1rem; color: #667eea;">{message}</p>', unsafe_allow_html=True)
        bar.progress(progress)
    elif step_index >= total_steps:
        # Finale (90-100%)
        status.markdown('<p style="text-align: center; font-size: 1.3rem; font-weight: bold; color: #764ba2;">✨ The wait is over. Finalizing your report...</p>', unsafe_allow_html=True)
        bar.progress(min(100, 90 + (step_index - total_steps) * 2))

class ProgressManager:
    """Manages progress bar updates during async operations"""
    def __init__(self, bar, status):
        self.bar = bar
        self.status = status
        self.current_step = 0
    
    def update(self, step):
        """Update to specific step"""
        self.current_step = step
        update_vibe_progress(self.bar, self.status, step)
    
    def advance(self):
        """Advance to next step"""
        self.current_step += 1
        update_vibe_progress(self.bar, self.status, self.current_step)
    
    def finalize(self):
        """Show completion message"""
        update_vibe_progress(self.bar, self.status, 21)
        time.sleep(0.5)
        self.bar.empty()
        self.status.empty()

async def quick_scan(url: str):
    """
    Light scraper: Fast scan without screenshots.
    Returns: dict with page_height, price_guess, industry_guess
    """
    try:
        if not url.startswith(('http://', 'https://')):
            url = url.replace('www.', '')
            url = 'https://' + url
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': 1440, 'height': 900},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            page = await context.new_page()
            
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(2)
            
            page_height = await page.evaluate("document.body.scrollHeight")
            page_text = await page.evaluate("document.body.innerText")
            title = await page.evaluate("document.title")
            
            meta_desc = ""
            try:
                meta_desc = await page.evaluate("document.querySelector('meta[name=\"description\"]')?.content || ''")
            except:
                pass
            
            await browser.close()
            
            price_pattern = r'\$(\d+(?:\.\d{2})?)(?:\s*/\s*(?:mo|month|yr|year|wk|week))?'
            prices = re.findall(price_pattern, page_text, re.IGNORECASE)
            
            price_values = []
            for price_str in prices:
                try:
                    price_val = float(price_str)
                    if 1 <= price_val <= 10000:
                        price_values.append(price_val)
                except:
                    continue
            
            price_guess = 50.0
            if price_values:
                price_values.sort()
                median_idx = len(price_values) // 2
                price_guess = price_values[median_idx]
            
            industry_guess = 'SaaS'
            text_lower = (page_text + " " + title + " " + meta_desc).lower()
            
            if any(kw in text_lower for kw in ['agency', 'marketing agency', 'digital agency']):
                industry_guess = 'Agency'
            elif any(kw in text_lower for kw in ['e-commerce', 'ecommerce', 'shop', 'store', 'cart', 'checkout']):
                industry_guess = 'E-commerce'
            elif any(kw in text_lower for kw in ['saas', 'software', 'subscription', 'platform']):
                industry_guess = 'SaaS'
            
            return {
                'page_height': page_height,
                'price_guess': price_guess,
                'industry_guess': industry_guess
            }
    except Exception as e:
        safe_print(f"[ERROR] quick_scan failed: {safe_error_message(str(e))}")
        return {
            'page_height': 3000,
            'price_guess': 50.0,
            'industry_guess': 'SaaS'
        }

def render_roi_dashboard(url: str, scan_data: dict = None):
    """
    Render the ROI & Competitor Audit as a Single-Screen Dashboard (3x2 Grid Layout).
    Takes URL and optional scan_data (if already scanned).
    """
    if scan_data is None:
        if "roi_dashboard_data" in st.session_state:
            scan_data = st.session_state.roi_dashboard_data
        else:
            st.warning("Scanning in progress...")
            return
    
    page_height = scan_data.get('page_height', 3000)
    default_price = scan_data.get('price_guess', 50.0)
    default_industry = scan_data.get('industry_guess', 'SaaS')
    
    st.markdown("""
    <style>
    .roi-card {
        background: transparent;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    .roi-card h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.2rem;
    }
    </style>
    """, unsafe_allow_html=True)
    
    default_traffic = 1000
    if "roi_traffic" in st.session_state:
        default_traffic = st.session_state.roi_traffic
    if "roi_price" in st.session_state:
        default_price = st.session_state.roi_price
    
    price = st.session_state.get("roi_price", default_price)
    traffic = st.session_state.get("roi_traffic", default_traffic)
    industry = st.session_state.get("roi_industry", default_industry)
    
    lift = 0.02
    lost_revenue = (traffic * lift * price * 12)
    
    row1_col1, row1_col2, row1_col3 = st.columns(3)
    
    with row1_col1:
        st.markdown('<div class="roi-card">', unsafe_allow_html=True)
        st.markdown("### 💸 The Cost of Inaction")
        st.markdown(f'<div style="font-size: 2.4rem; font-weight: 700; color: #667eea; margin: 0.5rem 0;">${lost_revenue:,.0f}</div>', unsafe_allow_html=True)
        st.caption("Revenue you leave on the table annually")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with row1_col2:
        st.markdown('<div class="roi-card">', unsafe_allow_html=True)
        fold_height = 800
        below_fold = max(0, page_height - fold_height)
        below_fold_percent = (below_fold / page_height * 100) if page_height > 0 else 0
        st.markdown(f"### 📉 The Scroll of Death  \n<small style='color: #64748b;'>Your page is {page_height:,}px deep. {below_fold_percent:.0f}% of users never see your bottom CTA.</small>", unsafe_allow_html=True)
        
        scroll_html = f"""
        <div style="position: relative; width: 100%; height: 200px; border: 2px solid #333; border-radius: 8px; margin: 1rem 0;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: {min(100, (fold_height / page_height * 100))}%; background: linear-gradient(180deg, #00ff00 0%, #00cc00 100%); border-radius: 8px 8px 0 0;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; font-size: 0.9rem;">Above Fold ({fold_height}px)</div>
            </div>
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: {max(0, (below_fold / page_height * 100))}%; background: linear-gradient(180deg, #ff0000 0%, #cc0000 100%); border-radius: 0 0 8px 8px;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; font-size: 0.9rem;">Below Fold ({below_fold_percent:.0f}%)</div>
            </div>
            <div style="position: absolute; top: {min(100, (fold_height / page_height * 100))}%; left: 0; width: 100%; height: 2px; background: yellow; z-index: 10;"></div>
        </div>
        """
        st.markdown(scroll_html, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    with row1_col3:
        st.markdown('<div class="roi-card">', unsafe_allow_html=True)
        st.markdown("### 🥊 The Competitor Gap")
        
        # Calculate competitor traffic as a multiple of user traffic based on industry
        # Industry-specific multipliers: SaaS (2.5x), Agency (3x), E-commerce (2x)
        industry_multipliers = {
            "SaaS": 2.5,
            "Agency": 3.0,
            "E-commerce": 2.0
        }
        multiplier = industry_multipliers.get(industry, 2.5)
        competitor_traffic = int(traffic * multiplier)
        
        # Ensure minimum competitor traffic for visual clarity
        if competitor_traffic < 1000:
            competitor_traffic = 1000
        
        chart_data = pd.DataFrame({
            'Source': ['You', 'Top Competitor'],
            'Monthly Visits': [traffic, competitor_traffic]
        })
        
        max_visits = max(traffic, competitor_traffic)
        y_max = int(max_visits * 1.40)  # 40% headroom
        
        fig = px.bar(chart_data, x='Source', y='Monthly Visits',
                     color='Source',
                     color_discrete_map={'You': '#888888', 'Top Competitor': '#ff0000'},
                     text='Monthly Visits',
                     labels={'Monthly Visits': '', 'Source': ''})
        fig.update_traces(texttemplate='%{text:,}', textposition='outside')
        fig.update_layout(
            showlegend=False,
            height=200,
            yaxis=dict(range=[0, y_max]),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            margin=dict(l=0, r=0, t=0, b=0)
        )
        st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})
        
        st.caption(f"Competitors get {multiplier:.1f}x your traffic.")
        st.markdown('</div>', unsafe_allow_html=True)
    
    row2_col1, row2_col2, row2_col3 = st.columns(3)
    
    with row2_col1:
        st.markdown('<div class="roi-card">', unsafe_allow_html=True)
        st.markdown("### 🧠 Industry Insider")
        
        industry_facts = {
            'SaaS': [
                'SaaS pages with video convert 80% higher',
                'Top SaaS sites use social proof in hero section',
                'SaaS landing pages with clear pricing convert 2.5x better'
            ],
            'Agency': [
                'Agency sites with case studies convert 3x higher',
                'Top agencies showcase client logos above fold',
                'Agency pages with testimonials convert 60% better'
            ],
            'E-commerce': [
                'E-com sites with trust badges convert 40% more',
                'Product pages with reviews convert 2.8x better',
                'E-com sites with free shipping convert 30% more'
            ]
        }
        
        facts = industry_facts.get(industry, industry_facts['SaaS'])
        random_fact = random.choice(facts)
        
        st.info(f"💡 {random_fact}")
        st.caption("You are missing critical elements found on top sites.")
        st.markdown('</div>', unsafe_allow_html=True)
    
    with row2_col2:
        st.markdown('<div class="roi-card">', unsafe_allow_html=True)
        st.markdown("### 🚀 The No-Brainer ROI")
        
        cost = 19
        roi_percent = (lost_revenue / cost * 100) if cost > 0 else 0
        
        st.markdown(f'<div style="font-size: 2.4rem; font-weight: 700; color: #667eea; margin: 0.5rem 0; text-align: center;">{roi_percent:,.0f}%</div>', unsafe_allow_html=True)
        st.markdown(f'<div style="text-align: center; color: #64748b; margin-bottom: 0.5rem;">ROI</div>', unsafe_allow_html=True)
        st.markdown(f'<p><strong>Spend:</strong> ${cost}<br><span style="font-size: 1.2em;"><strong>Recover:</strong></span> <span style="color: #667eea; font-weight: bold; font-size: 1.4em;">${lost_revenue:,.0f}</span></p>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    with row2_col3:
        st.markdown('<div class="roi-card">', unsafe_allow_html=True)
        st.markdown("### ⚙️ Price Detector")
        
        new_price = st.number_input("Detected Price ($)", min_value=1.0, max_value=10000.0, 
                                    value=float(price), step=1.0, key="dashboard_price")
        new_traffic = st.number_input("Monthly Traffic", min_value=100, max_value=1000000, 
                                      value=int(traffic), step=100, key="dashboard_traffic")
        new_industry = st.selectbox("Industry", ["SaaS", "Agency", "E-commerce"], 
                                   index=["SaaS", "Agency", "E-commerce"].index(industry) if industry in ["SaaS", "Agency", "E-commerce"] else 0,
                                   key="dashboard_industry")
        
        if new_price != price or new_traffic != traffic or new_industry != industry:
            st.session_state.roi_price = new_price
            st.session_state.roi_traffic = new_traffic
            st.session_state.roi_industry = new_industry
            st.rerun()
        
        st.markdown('</div>', unsafe_allow_html=True)

def render_roi_page():
    """
    Render the Free ROI Simulator page with shocking visuals.
    """
    st.markdown('<h1 class="main-title">💰 Free Revenue Check</h1>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">See How Much Money Your Landing Page is Losing</p>', unsafe_allow_html=True)
    
    site_url = st.text_input("Enter your website URL", placeholder="https://example.com", key="roi_url")
    
    scan_data = None
    if site_url and site_url.strip():
        is_valid, error_msg = validate_url(site_url)
        if not is_valid:
            st.error(f"⚠️ {error_msg}")
        else:
            if st.button("🔍 Quick Scan", key="scan_button", use_container_width=True):
                with st.spinner("Scanning your site (no screenshots, super fast)..."):
                    try:
                        if os.name == 'nt':
                            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                        scan_data = asyncio.run(quick_scan(site_url))
                        st.session_state.roi_scan_data = scan_data
                    except Exception as e:
                        st.error(f"Scan failed: {str(e)}")
    
    if "roi_scan_data" in st.session_state:
        scan_data = st.session_state.roi_scan_data
    
    if scan_data:
        page_height = scan_data.get('page_height', 3000)
        default_price = scan_data.get('price_guess', 50.0)
        default_industry = scan_data.get('industry_guess', 'SaaS')
        
        st.markdown("---")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            price = st.number_input("Product Price ($)", min_value=1.0, max_value=10000.0, value=float(default_price), step=1.0, key="roi_price")
        with col2:
            traffic = st.number_input("Monthly Traffic", min_value=100, max_value=1000000, value=1000, step=100, key="roi_traffic")
        with col3:
            industry = st.selectbox("Industry", ["SaaS", "Agency", "E-commerce"], index=["SaaS", "Agency", "E-commerce"].index(default_industry) if default_industry in ["SaaS", "Agency", "E-commerce"] else 0, key="roi_industry")
        
        lift = 0.015
        lost_revenue = (traffic * lift * price * 12)
        
        st.markdown("---")
        
        st.markdown('<div style="background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%); padding: 2rem; border-radius: 12px; text-align: center; margin: 2rem 0;">', unsafe_allow_html=True)
        st.markdown(f'<h2 style="color: white; font-size: 3rem; margin: 0;">⚠️ Estimated Yearly Loss: ${lost_revenue:,.0f}</h2>', unsafe_allow_html=True)
        st.markdown(f'<p style="color: #ffcccc; font-size: 1.2rem; margin-top: 1rem;">Based on your detected price of ${price:.2f} and avg industry traffic of {traffic:,} visitors/month</p>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
        
        st.markdown("---")
        
        st.markdown("### 📏 The 'Underworld' Scroll Visualizer")
        
        money_zone_height = 1500
        underworld_start = money_zone_height
        underworld_height = max(0, page_height - money_zone_height)
        underworld_percent = (underworld_height / page_height * 100) if page_height > 0 else 0
        
        st.markdown(f"**Your page is {page_height:,}px long. {underworld_percent:.0f}% of your content is in the Underworld where <5% of users go.**")
        
        progress_html = f"""
        <div style="position: relative; width: 100%; height: 400px; border: 2px solid #333; border-radius: 8px; margin: 1rem 0;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: {min(100, (money_zone_height / page_height * 100))}%; background: linear-gradient(180deg, #00ff00 0%, #00cc00 100%); border-radius: 8px 8px 0 0;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; font-size: 1.2rem;">Money Zone (Top {money_zone_height}px)</div>
            </div>
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: {max(0, (underworld_height / page_height * 100))}%; background: linear-gradient(180deg, #ff0000 0%, #cc0000 100%); border-radius: 0 0 8px 8px;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; font-size: 1.2rem;">The Underworld ({underworld_percent:.0f}%)</div>
            </div>
            <div style="position: absolute; top: {min(100, (money_zone_height / page_height * 100))}%; left: 0; width: 100%; height: 2px; background: yellow; z-index: 10;">
                <div style="position: absolute; left: 50%; transform: translateX(-50%); background: yellow; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold;">{money_zone_height}px Marker</div>
            </div>
        </div>
        """
        st.markdown(progress_html, unsafe_allow_html=True)
        
        st.markdown("---")
        
        st.markdown("### 📊 The 'Jealousy' Graph (Competitors)")
        
        competitor_traffic = 8500 if industry == "SaaS" else (12000 if industry == "Agency" else 6000)
        
        chart_data = pd.DataFrame({
            'Source': ['You', 'Top Competitor'],
            'Monthly Visits': [traffic, competitor_traffic],
            'Color': ['#888888', '#ff0000']
        })
        
        max_visits = max(traffic, competitor_traffic)
        y_max = int(max_visits * 1.40)  # 40% headroom
        
        fig = px.bar(chart_data, x='Source', y='Monthly Visits', 
                     color='Source',
                     color_discrete_map={'You': '#888888', 'Top Competitor': '#ff0000'},
                     text='Monthly Visits',
                     labels={'Monthly Visits': 'Monthly Visits', 'Source': ''})
        fig.update_traces(texttemplate='%{text:,}', textposition='outside')
        fig.update_layout(
            showlegend=False,
            height=400,
            yaxis=dict(range=[0, y_max]),
            yaxis_title="Monthly Visits",
            xaxis_title="",
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)'
        )
        st.plotly_chart(fig, use_container_width=True)
        
        multiplier = competitor_traffic / traffic if traffic > 0 else 1
        st.markdown(f"**Top {industry} players get {multiplier:.1f}x your traffic. A better landing page captures this demand.**")
        
        st.markdown("---")
        
        st.markdown("### 💎 The 'No-Brainer' CTA")
        
        st.markdown('<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 12px; text-align: center; margin: 2rem 0;">', unsafe_allow_html=True)
        st.markdown('<h2 style="color: white; margin: 0 0 1rem 0; font-size: 1.44em;">Recover this revenue for $19</h2>', unsafe_allow_html=True)
        
        roi_percent = (lost_revenue / 19 * 100) if 19 > 0 else 0
        st.markdown(f'<p style="color: white; font-size: 1.1rem; margin: 0.5rem 0;"><strong>Cost:</strong> $19 | <strong>Potential Gain:</strong> <span style="font-size: 1.2em; font-weight: bold;">${lost_revenue:,.0f}</span> | <strong>ROI:</strong> <span style="font-size: 1.2em; font-weight: bold;">{roi_percent:.0f}%</span></p>', unsafe_allow_html=True)
        
        if st.button("🚀 Unlock Full Audit Now", key="upgrade_cta", use_container_width=True):
            st.session_state.page_mode = "full_audit"
            st.rerun()
        
        st.markdown('</div>', unsafe_allow_html=True)
    else:
        st.info("👆 Enter a URL and click 'Quick Scan' to see your revenue loss estimate")

def stitch_images(image_list, max_images=3):
    """
    Stitch multiple images vertically (top to bottom).
    Takes first N images from the list.
    Returns: Single PIL Image
    """
    try:
        images_to_stitch = image_list[:min(len(image_list), max_images)]
        if not images_to_stitch:
            return None
        
        # Convert all to RGB and get dimensions
        rgb_images = [img.convert('RGB') for img in images_to_stitch]
        
        # Calculate total dimensions
        max_width = max(img.width for img in rgb_images)
        total_height = sum(img.height for img in rgb_images)
        
        # Create new image
        stitched = Image.new('RGB', (max_width, total_height))
        
        # Paste images vertically
        current_y = 0
        for img in rgb_images:
            stitched.paste(img, (0, current_y))
            current_y += img.height
        
        safe_print(f"[DEBUG] Stitched {len(rgb_images)} images into {max_width}x{total_height}px")
        return stitched
    except Exception as e:
        error_msg = safe_error_message(e)
        print(f"[ERROR] Image stitching failed: {error_msg}")
        return image_list[0] if image_list else None

def generate_heatmap(image_pil):
    """
    Generate a predictive focus heatmap using Visual Saliency detection.
    Shows areas of high visual contrast/clutter.
    Returns: PIL Image with heatmap overlay
    """
    try:
        # Ensure image is RGB
        if image_pil.mode != 'RGB':
            image_pil = image_pil.convert('RGB')
        
        # Convert PIL to CV2
        img_array = np.array(image_pil)
        
        # Check if image is valid
        if img_array.size == 0:
            safe_print("[WARNING] Empty image array, returning original")
            return image_pil
        
        # Convert to grayscale
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # Apply Canny edge detection to find high-contrast areas (bright spots)
        edges = cv2.Canny(gray, 50, 150)
        
        # Blur edges to create heat effect (visual saliency)
        blurred = cv2.GaussianBlur(edges, (21, 21), 0)
        
        # Normalize to 0-255 range
        heatmap = cv2.normalize(blurred, None, 0, 255, cv2.NORM_MINMAX)
        
        # Apply color map (hot areas = red/yellow, cold = blue/green)
        heatmap_colored = cv2.applyColorMap(heatmap.astype(np.uint8), cv2.COLORMAP_JET)
        
        # Convert back to PIL
        heatmap_pil = Image.fromarray(cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB))
        
        # Blend with original (50% opacity for overlay effect)
        result = Image.blend(image_pil, heatmap_pil, alpha=0.5)
        
        return result
    except Exception as e:
        error_msg = safe_error_message(e)
        safe_print(f"[ERROR] Heatmap generation failed: {error_msg}")
        # Return original image if heatmap fails
        return image_pil.convert('RGB') if image_pil.mode != 'RGB' else image_pil

# --- START OF MASTER PDF CLASS ---
class PDFReport(FPDF):
    def __init__(self):
        super().__init__()
        self.set_margins(15, 15, 15)
        self.set_auto_page_break(auto=True, margin=15)
        self.is_cover_page = False
    
    def header(self):
        if getattr(self, 'is_cover_page', False): return
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(128, 128, 128) # Grey
        self.cell(0, 10, 'SiteRoast.ai - Conversion Audit Report', 0, 0, 'L')
        self.ln(15)
    
    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')
    
    def chapter_title(self, label):
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(33, 33, 33) # Charcoal
        self.cell(0, 10, label, 0, 1, 'L')
        self.ln(5)
    
    def draw_badge(self, text, status):
        # Professional Color Scheme
        if status in ['Excellent', 'Good']:
            self.set_fill_color(220, 255, 220) # Pale Green
            self.set_text_color(0, 100, 0)     # Dark Green
        elif status == 'Satisfactory':
            self.set_fill_color(255, 245, 220) # Pale Orange
            self.set_text_color(150, 100, 0)   # Dark Orange
        else:
            self.set_fill_color(255, 220, 220) # Pale Red
            self.set_text_color(150, 0, 0)     # Dark Red
        
        self.set_font('Helvetica', 'B', 9)
        w = self.get_string_width(text) + 6
        self.cell(w, 6, text, 0, 0, 'C', fill=True)
        # Reset to Neutral
        self.set_fill_color(255, 255, 255)
        self.set_text_color(0, 0, 0)
    
    def add_cover_page(self, metadata, score):
        """Cover page - vertically centered"""
        self.set_text_color(0, 0, 0)
        self.add_page()
        self.is_cover_page = True
        
        # Vertical Center
        self.set_y(110)
        
        # Title
        self.set_font("Courier", "", 10)
        self.set_text_color(255, 0, 0)  # Bright Red
        self.set_fill_color(0, 0, 0)  # Black Background
        self.set_text_color(0, 0, 0)
        self.cell(0, 15, clean_text("SiteRoast Conversion Audit Report"), ln=True, align="C")
        self.ln(10)
        
        # Client Info
        self.set_font("Courier", "", 10)
        self.set_text_color(255, 0, 0)  # Bright Red
        self.set_fill_color(0, 0, 0)  # Black Background
        self.set_text_color(0, 0, 0)
        scanned_url = clean_text(str(metadata.get('scannedUrl', 'N/A')))
        scanned_at = clean_text(str(metadata.get('scannedAt', 'N/A')))
        self.cell(0, 8, clean_text(f"Client: {scanned_url}"), ln=True, align="C")
        self.cell(0, 8, clean_text(f"Generated: {scanned_at}"), ln=True, align="C")
        
        self.is_cover_page = False
    
    def add_roast_section(self, roast_data, overall_score, detailed_audit=None):
        """Executive summary section with proper text wrapping - Page 2"""
        # Force black text at start - MUST BE FIRST LINE
        self.set_text_color(0, 0, 0)  # Force Black
        
        self.add_page()  # Force Page 2
        
        # Header
        self.set_font("Courier", "B", 16)
        self.set_text_color(0, 0, 0)  # Force black text
        self.cell(0, 10, clean_text("Executive Summary"), ln=True)
        self.ln(5)
        
        # Score Badge (DISABLED: Background fill - may cause layering issues)
        # self.set_fill_color(240, 240, 240)
        self.set_font("Courier", "B", 14)
        self.set_text_color(0, 0, 0)  # Force Black
        score_text = clean_text(f"  Site Score: {overall_score}/100  ")
        self.cell(0, 12, score_text, ln=True, fill=False)
        self.ln(10)
        
        # Content - MUST MATCH HTML REPORT EXACTLY
        # HTML uses: data.get('roast_summary') or data.get('headline_roast') or data.get('overview', {}).get('executiveSummary', 'No summary available.')
        summary_text = roast_data.get('roast_summary') or roast_data.get('headline_roast') or roast_data.get('overview', {}).get('executiveSummary', 'No summary available.')
        analysis_text = roast_data.get('roastAnalysis', '') or roast_data.get('analysis', '')
        
        # Write Summary - Always show Executive Summary section
        self.set_font("Courier", "B", 12)
        self.set_text_color(0, 0, 0)
        self.cell(0, 8, clean_text("Summary:"), ln=True)
        self.set_font("Courier", "", 11)
        if summary_text and len(str(summary_text).strip()) > 5:
            cleaned_summary = clean_text(str(summary_text))
            summary_paragraphs = cleaned_summary.split('\n')
            for para in summary_paragraphs:
                para = para.strip()
                if para:
                    self.set_text_color(0, 0, 0)
                    self.multi_cell(0, 6, clean_text(para))
                    self.ln(3)
        else:
            # Fallback if no summary available
            self.set_text_color(0, 0, 0)
            self.multi_cell(0, 6, clean_text("Executive summary analysis completed. See detailed findings below."))
        self.ln(5)
        
        # Write Analysis - Split into multiple paragraphs (2-3 sentences each)
        if analysis_text and len(str(analysis_text).strip()) > 5:
            self.set_font("Courier", "", 10)
            self.set_text_color(255, 0, 0)  # Bright Red
            self.set_fill_color(0, 0, 0)  # Black Background
            self.set_text_color(0, 0, 0)
            self.cell(0, 8, clean_text("Analysis:"), ln=True)
            self.set_font("Courier", "", 10)
            self.set_text_color(255, 0, 0)  # Bright Red
            self.set_fill_color(0, 0, 0)  # Black Background
            cleaned_analysis = clean_text(str(analysis_text))
            
            # Split analysis into sentences and group into paragraphs of 2-3 sentences
            import re
            sentences = re.split(r'(?<=[.!?])\s+', cleaned_analysis)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            # Group into paragraphs of 2-3 sentences
            para_sentences = []
            current_para = []
            for i, sentence in enumerate(sentences):
                current_para.append(sentence)
                if len(current_para) >= 3 or (len(current_para) >= 2 and i == len(sentences) - 1):
                    para_sentences.append(' '.join(current_para))
                    current_para = []
            if current_para:
                para_sentences.append(' '.join(current_para))
            
            # Write paragraphs
            for para in para_sentences:
                if para:
                    self.set_text_color(0, 0, 0)
                    self.multi_cell(0, 6, clean_text(para))
                    self.ln(3)
        
        self.ln(10)
        
        # Priority Matrix and Status Table
        if detailed_audit:
            # Flatten all items from detailedAudit
            all_items = []
            for category, items in detailed_audit.items():
                if isinstance(items, list):
                    all_items.extend(items)
            
            # Add Priority Matrix
            self.add_priority_matrix(all_items)
            self.ln(10)
            
            # Add Status Summary Table
            self.add_status_table(all_items)
    
    def add_priority_matrix(self, all_items):
        """Priority Matrix (The 'Where to Start' Grid) - 3x5 grid showing Impact vs Status"""
        # Group items by Impact and Status
        matrix = {}
        impact_levels = ['HI', 'MI', 'LI']
        status_levels = ['Failed', 'Needs Improvement', 'Satisfactory', 'Good', 'Excellent']
        
        # Initialize matrix
        for impact in impact_levels:
            matrix[impact] = {}
            for status in status_levels:
                matrix[impact][status] = 0
        
        # Count items in each bucket
        for item in all_items:
            impact = item.get('impact', 'MI')
            status = item.get('status', 'Satisfactory')
            if impact in matrix and status in matrix[impact]:
                matrix[impact][status] += 1
        
        # Draw matrix title
        self.set_font("Courier", "B", 12)
        self.set_text_color(0, 0, 0)  # Force black text
        self.cell(0, 8, clean_text("Priority Matrix: Where to Start"), ln=True)
        self.ln(3)
        
        # Matrix dimensions
        cell_width = 180 / 6  # 5 status columns + 1 impact label column
        cell_height = 6
        start_x = 15
        start_y = self.get_y()
        
        # Draw header row (Status labels)
        self.set_font("Courier", "B", 9)
        self.set_text_color(0, 0, 0)  # Force black text
        x_pos = start_x + cell_width  # Skip first column (for impact labels)
        
        # Shortened status labels for fit (must match status_levels order)
        status_labels_display = ['Failed', 'Needs Imp.', 'Satisf.', 'Good', 'Excellent']
        for i, status_label in enumerate(status_labels_display):
            self.set_xy(x_pos + (i * cell_width), start_y)
            # DISABLED: Background fill (may cause layering issues)
            # self.set_fill_color(240, 240, 240)
            self.cell(cell_width, cell_height, clean_text(status_label), border=1, fill=False, align='C')
        
        # Draw matrix rows (Impact levels)
        impact_labels = ['High', 'Medium', 'Low']
        impact_map = {'HI': 0, 'MI': 1, 'LI': 2}
        
        for impact_code, impact_row in impact_map.items():
            row_y = start_y + cell_height + (impact_row * cell_height)
            
            # Impact label (left column)
            self.set_xy(start_x, row_y)
            # DISABLED: Background fill (may cause layering issues)
            # self.set_fill_color(245, 245, 245)
            self.set_font("Courier", "", 10)
            self.set_text_color(255, 0, 0)  # Bright Red
            self.set_fill_color(0, 0, 0)  # Black Background
            self.set_text_color(0, 0, 0)  # Force Black
            self.cell(cell_width, cell_height, clean_text(impact_labels[impact_row]), border=1, fill=False, align='C')
            
            # Status cells (counts) - iterate through status_levels in same order
            self.set_font("Courier", "", 10)
            self.set_text_color(255, 0, 0)  # Bright Red
            self.set_fill_color(0, 0, 0)  # Black Background
            x_pos = start_x + cell_width
            for i, status in enumerate(status_levels):
                count = matrix[impact_code][status]
                
                # DISABLED: Background fill colors (may cause layering issues)
                # if impact_code == 'HI' and status == 'Failed':
                #     self.set_fill_color(255, 200, 200)  # Light red
                # elif count > 0:
                #     self.set_fill_color(255, 255, 255)  # White
                # else:
                #     self.set_fill_color(250, 250, 250)  # Very light gray
                
                self.set_xy(x_pos + (i * cell_width), row_y)
                
                # Color coding - Match HTML colors
                if impact_code == 'HI' and status == 'Failed':
                    self.set_fill_color(255, 200, 200)  # Light red for High Impact + Failed
                    fill = True
                elif count > 0:
                    # Color by status
                    if status == 'Excellent':
                        self.set_fill_color(220, 255, 220)  # Light green
                    elif status == 'Good':
                        self.set_fill_color(240, 255, 240)  # Very light green
                    elif status == 'Satisfactory':
                        self.set_fill_color(255, 245, 220)  # Light orange/yellow
                    elif status == 'Needs Improvement':
                        self.set_fill_color(255, 230, 200)  # Light orange
                    elif status == 'Failed':
                        self.set_fill_color(255, 220, 220)  # Light red
                    else:
                        self.set_fill_color(255, 255, 255)  # White
                    fill = True
                else:
                    self.set_fill_color(250, 250, 250)  # Very light gray for empty
                    fill = True
                
                self.set_text_color(0, 0, 0)  # Force Black
                count_text = str(count) if count > 0 else '-'
                self.cell(cell_width, cell_height, clean_text(count_text), border=1, fill=fill, align='C')
                self.set_fill_color(255, 255, 255)  # Reset fill
        
        # Move cursor below matrix
        self.set_y(start_y + (4 * cell_height))
        self.ln(3)
    
    def add_status_table(self, all_items):
        """Status Summary Table - Dashboard-style table with colored cells"""
        # Count items by status
        status_counts = {
            'Excellent': 0,
            'Good': 0,
            'Satisfactory': 0,
            'Needs Improvement': 0,
            'Failed': 0
        }
        
        for item in all_items:
            status = item.get('status', 'Satisfactory')
            if status in status_counts:
                status_counts[status] += 1
        
        # Draw table
        table_width = 180
        num_cols = 5
        col_width = table_width / num_cols
        table_height = 8
        table_x = 15
        table_y = self.get_y()
        
        # Status labels and colors
        status_config = [
            ('Failed', status_counts.get('Failed', 0), (255, 200, 200)),  # Red
            ('Needs Work', status_counts.get('Needs Improvement', 0), (255, 230, 200)),  # Orange
            ('Satisfactory', status_counts.get('Satisfactory', 0), (240, 240, 240)),  # Gray
            ('Good', status_counts.get('Good', 0), (200, 255, 200)),  # Light green
            ('Excellent', status_counts.get('Excellent', 0), (150, 255, 150))  # Green
        ]
        
        self.set_font("Courier", "B", 10)
        for i, (label, count, color) in enumerate(status_config):
            x_pos = table_x + (i * col_width)
            self.set_xy(x_pos, table_y)
            # DISABLED: Background fill color (may cause layering issues)
            # self.set_fill_color(*color)
            # self.set_draw_color(200, 200, 200)
            self.set_text_color(0, 0, 0)  # Force Black
            
            # Format: "Label: Count"
            cell_text = clean_text(f"{label}: {count}")
            self.cell(col_width, table_height, cell_text, border=1, fill=False, align='C')
        
        # Move cursor below table
        self.set_y(table_y + table_height)
        self.ln(5)
    
    def add_radar_section(self, radar_chart_path):
        """Performance Radar section - Centered Radar Chart (H & V centered)"""
        if radar_chart_path and os.path.exists(radar_chart_path):
            self.add_page()
            self.set_text_color(0, 0, 0)  # Force Black
            
            try:
                from PIL import Image as PILImage
                img = PILImage.open(radar_chart_path)
                img_width, img_height = img.size
                
                # Calculate dimensions to fit page (centered)
                page_width = 210  # A4 width in mm
                page_height = 297  # A4 height in mm
                max_width = 150  # Max width in mm
                max_height = 150  # Max height in mm
                
                aspect_ratio = img_width / img_height
                
                if aspect_ratio > 1:
                    # Landscape
                    display_width = min(max_width, page_width - 40)
                    display_height = display_width / aspect_ratio
                else:
                    # Portrait
                    display_height = min(max_height, 150)
                    display_width = display_height * aspect_ratio
                
                # Center both horizontally and vertically
                x_pos = (page_width - display_width) / 2
                # Vertical center: (page_height - top_margin - bottom_margin - image_height) / 2 + top_margin
                top_margin = 30
                bottom_margin = 20
                available_height = page_height - top_margin - bottom_margin
                y_pos = (available_height - display_height) / 2 + top_margin
                
                # Title above image (centered)
                title_y = y_pos - 20
                self.set_y(title_y)
                self.set_font("Courier", "", 10)
                self.set_text_color(255, 0, 0)  # Bright Red
                self.set_fill_color(0, 0, 0)  # Black Background
                self.cell(0, 10, clean_text("Performance Radar"), ln=True, align="C")
                
                # Place image
                self.image(radar_chart_path, x=x_pos, y=y_pos, w=display_width, h=display_height)
                self.set_y(y_pos + display_height + 10)
            except Exception as e:
                safe_print(f"[PDF] Failed to add radar chart: {safe_error_message(str(e))}")
                self.set_font("Courier", "", 10)
                self.set_text_color(255, 0, 0)  # Bright Red
                self.set_fill_color(0, 0, 0)  # Black Background
                self.cell(0, 10, clean_text("[Radar Chart Not Available]"), ln=True, align="C")
        else:
            # Add page even if no chart
            self.add_page()
            self.set_font("Courier", "", 10)
            self.set_text_color(255, 0, 0)  # Bright Red
            self.set_fill_color(0, 0, 0)  # Black Background
            self.cell(0, 10, clean_text("Performance Radar (Priority Matrix)"), ln=True, align="C")
            self.set_font("Courier", "I", 12)
            self.cell(0, 10, clean_text("[Radar Chart Not Available]"), ln=True, align="C")
    
    def add_visuals_section(self, heatmap_path):
        """Visual analysis section with proper image placement - Page 3 - Centered Heatmap"""
        self.add_page()
        
        # Root Cause Analysis: Multiple path resolution strategies (cloud-compatible)
        verified_path = None
        
        if heatmap_path:
            # Strategy 1: Try absolute path as-is
            try:
                if os.path.exists(heatmap_path):
                    verified_path = heatmap_path
                    safe_print(f"[PDF] Found heatmap at: {heatmap_path}")
            except Exception as e:
                safe_print(f"[PDF] Strategy 1 failed: {safe_error_message(str(e))}")
            
            # Strategy 2: Try converting to absolute path
            if not verified_path:
                try:
                    abs_path = os.path.abspath(heatmap_path)
                    if os.path.exists(abs_path):
                        verified_path = abs_path
                        safe_print(f"[PDF] Found heatmap at: {abs_path}")
                except Exception as e:
                    safe_print(f"[PDF] Strategy 2 failed: {safe_error_message(str(e))}")
            
            # Strategy 3: Try joining with tempfile.gettempdir() (cloud-compatible)
            if not verified_path:
                try:
                    temp_dir = os.path.join(tempfile.gettempdir(), "siteroast_temp")
                    temp_path = os.path.join(temp_dir, os.path.basename(heatmap_path))
                    if os.path.exists(temp_path):
                        verified_path = temp_path
                        safe_print(f"[PDF] Found heatmap at: {temp_path}")
                except Exception as e:
                    safe_print(f"[PDF] Strategy 3 failed: {safe_error_message(str(e))}")
            
            # Strategy 4: Try joining with current working directory if relative
            if not verified_path:
                try:
                    cwd_path = os.path.join(os.getcwd(), heatmap_path)
                    if os.path.exists(cwd_path):
                        verified_path = cwd_path
                        safe_print(f"[PDF] Found heatmap at: {cwd_path}")
                except Exception as e:
                    safe_print(f"[PDF] Strategy 4 failed: {safe_error_message(str(e))}")
            
            # Strategy 5: Try normalizing path (handles forward/backward slashes)
            if not verified_path:
                try:
                    norm_path = os.path.normpath(heatmap_path)
                    if os.path.exists(norm_path):
                        verified_path = norm_path
                        safe_print(f"[PDF] Found heatmap at: {norm_path}")
                    else:
                        # Try with absolute
                        abs_norm = os.path.abspath(norm_path)
                        if os.path.exists(abs_norm):
                            verified_path = abs_norm
                            safe_print(f"[PDF] Found heatmap at: {abs_norm}")
                except Exception as e:
                    safe_print(f"[PDF] Strategy 5 failed: {safe_error_message(str(e))}")
            
            # Strategy 6: Try searching in tempfile directory by filename only
            if not verified_path:
                try:
                    temp_dir = os.path.join(tempfile.gettempdir(), "siteroast_temp")
                    if os.path.exists(temp_dir):
                        filename = os.path.basename(heatmap_path)
                        for file in os.listdir(temp_dir):
                            if file == filename or file.endswith('.png'):
                                potential_path = os.path.join(temp_dir, file)
                                if os.path.exists(potential_path):
                                    verified_path = potential_path
                                    safe_print(f"[PDF] Found heatmap by filename search: {potential_path}")
                                    break
                except Exception as e:
                    safe_print(f"[PDF] Strategy 6 failed: {safe_error_message(str(e))}")
        
        if verified_path:
            # Center Image Logic - Both H & V centered
            page_width = 210  # A4 width in mm
            page_height = 297  # A4 height in mm
            top_margin = 30
            bottom_margin = 20
            
            # Get image dimensions
            img_w = 180  # Initial width
            img_h = 180  # Default fallback height
            try:
                from PIL import Image as PILImage
                img = PILImage.open(verified_path)
                img_width, img_height = img.size
                aspect_ratio = img_height / img_width
                img_h = img_w * aspect_ratio
                
                # Ensure image doesn't exceed page height (with margins)
                available_height = page_height - top_margin - bottom_margin - 30  # 30 for title
                max_height = min(available_height, 220)
                if img_h > max_height:
                    img_h = max_height
                    img_w = img_h / aspect_ratio
            except Exception:
                # Fallback if PIL fails
                pass
            
            # Center horizontally
            x_pos = (page_width - img_w) / 2
            
            # Center vertically (accounting for title)
            title_height = 15
            available_height = page_height - top_margin - bottom_margin - title_height
            y_pos = (available_height - img_h) / 2 + top_margin + title_height
            
            # Title above image (centered)
            title_y = y_pos - 18
            self.set_y(title_y)
            self.set_font("Courier", "B", 14)
            self.set_text_color(0, 0, 0)  # Force Black
            self.cell(0, 10, clean_text("Visual Analysis (Heatmap)"), ln=True, align="C")
            
            # Place image centered
            self.image(verified_path, x=x_pos, y=y_pos, w=img_w, h=img_h)
            
            # Move cursor below image
            self.set_y(y_pos + img_h + 10)
        else:
            # Heatmap Not Available - centered message with debugging info
            self.set_y(130)
            self.set_font("Courier", "I", 12)
            self.set_text_color(0, 0, 0)  # Force Black
            self.cell(0, 10, clean_text("[Heatmap Not Available]"), ln=True, align="C")
            
            # Debug info (only in development, can be removed in production)
            if heatmap_path:
                self.set_font("Courier", "", 10)
                self.set_text_color(255, 0, 0)  # Bright Red
                self.set_fill_color(0, 0, 0)  # Black Background
                self.set_text_color(0, 0, 0)  # Force Black
                debug_text = f"Path attempted: {str(heatmap_path)[:50]}"
                self.cell(0, 6, clean_text(debug_text), ln=True, align="C")
    
    def add_quick_wins(self, quick_wins):
        """Quick wins section with card-style formatting"""
        self.add_page()
        # Force black text at start
        self.set_text_color(0, 0, 0)  # Force Black
        self.set_font("Courier", "B", 14)
        self.cell(0, 10, clean_text("Top 3 Quick Wins"), ln=True)
        self.ln(5)
        
        for idx, win in enumerate(quick_wins[:3], 1):
            # DISABLED: Background fill and draw color (may cause layering issues)
            # self.set_fill_color(245, 245, 245)
            # self.set_draw_color(200, 200, 200)
            self.set_font("Courier", "", 10)
            self.set_text_color(255, 0, 0)  # Bright Red
            self.set_fill_color(0, 0, 0)  # Black Background
            self.set_text_color(0, 0, 0)  # Force Black
            
            title = win.get('elementName', win.get('title', 'Issue'))
            cleaned_title = clean_text(str(title))
            header_text = clean_text(f" #{idx}: {cleaned_title}")
            self.cell(0, 10, header_text, ln=True, border=1, fill=False)
            
            self.set_font("Courier", "", 10)
            self.set_text_color(255, 0, 0)  # Bright Red
            self.set_fill_color(0, 0, 0)  # Black Background
            self.set_text_color(0, 0, 0)  # Force Black
            fix_text = win.get('fix', {}).get('quickFix', 'N/A') if isinstance(win.get('fix'), dict) else str(win.get('fix', 'N/A'))
            cleaned_fix = clean_text(str(fix_text))
            fix_label_text = clean_text(f"Fix: {cleaned_fix}")
            self.multi_cell(0, 8, fix_label_text, border='LRB')
            
            self.ln(5)
    
    def audit_card(self, item):
        # 1. Clean & Prepare Data
        name = clean_text(item.get('elementName', 'Observation'))
        status = clean_text(item.get('status', 'Neutral'))
        impact = clean_text(item.get('impact', 'MI'))
        rationale = clean_text(item.get('rationale', ''))
        fix_text = clean_text(item.get('fix', {}).get('quickFix', ''))
        
        # Map Impact Codes
        impact_map = {'HI': 'High Impact', 'MI': 'Med Impact', 'LI': 'Low Impact'}
        readable_impact = impact_map.get(impact, impact)
        # 2. Calculate Dynamic Height
        # Approx 85 chars per line for Helvetica size 10
        lines_rat = max(1, len(rationale) / 85)
        lines_fix = max(1, len(fix_text) / 85)
        # Base padding (30) + Rationale height + Fix height (if exists)
        fix_height = (lines_fix * 5) + 10 if fix_text else 0
        total_h = 25 + (lines_rat * 5) + fix_height
        
        # 3. Page Break Logic
        if self.get_y() + total_h > 270:
            self.add_page()
        # 4. DRAW BACKGROUND BOX (CRITICAL: MUST BE FIRST)
        # This ensures the grey box is behind the text, solving the 'Ghost' issue
        y_start = self.get_y()
        self.set_fill_color(252, 252, 252) # Very Light Grey
        self.set_draw_color(220, 220, 220) # Light Border
        self.rect(10, y_start, 190, total_h, 'DF')
        
        # 5. DRAW CONTENT
        self.set_xy(15, y_start + 5)
        
        # -- Title Row --
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(33, 33, 33)
        self.cell(0, 8, name, ln=True)
        
        # -- Badges Row --
        self.set_x(15)
        self.draw_badge(status, status)
        self.set_x(self.get_x() + 2) # Small Gap
        self.draw_badge(readable_impact, "Neutral") # Neutral color for impact
        self.ln(8)
        # -- Rationale --
        self.set_x(15)
        self.set_font('Helvetica', '', 10)
        self.set_text_color(60, 60, 60) # Dark Grey
        self.multi_cell(180, 5, rationale)
        self.ln(2)
        # -- Action Plan (Blue Box) --
        if fix_text and len(fix_text) > 3:
            curr_y = self.get_y()
            # Blue Background
            self.set_fill_color(240, 248, 255) # AliceBlue
            self.rect(15, curr_y, 180, fix_height, 'F')
            
            # Blue Header
            self.set_xy(20, curr_y + 2)
            self.set_font('Helvetica', 'B', 10)
            self.set_text_color(0, 50, 100) # Deep Blue
            self.cell(0, 5, "Action Plan:", ln=True)
            
            # Action Text
            self.set_x(20)
            self.set_font('Helvetica', '', 10)
            self.set_text_color(33, 33, 33) # Black
            self.multi_cell(170, 5, fix_text)
        
        # 6. Move Cursor for Next Item
        self.set_y(y_start + total_h + 5)

def calculate_radar_from_sections(sections):
    """
    Calculate radar scores (0-100) from sections array.
    Maps all detailed checks into 6 standardized buckets.
    """
    radar = {
        "UX": [],
        "Conversion": [],
        "Copy": [],
        "Visuals": [],
        "Trust": [],
        "Speed": []
    }
    
    # Status to score mapping
    status_scores = {
        "Excellent": 90,
        "Good": 75,
        "Satisfactory": 60,
        "Needs Improvement": 40,
        "Failed": 20
    }
    
    for section in sections:
        section_name = section.get("name", "").lower()
        section_score = section.get("score", 0)
        items = section.get("items", [])
        
        # Map sections to radar metrics
        if "ux" in section_name or "layout" in section_name:
            # UX & Layout section -> UX metric
            if items:
                for item in items:
                    status = item.get("status", "Satisfactory")
                    score = status_scores.get(status, 50)
                    radar["UX"].append(score)
            else:
                radar["UX"].append(section_score)
        
        elif "conversion" in section_name or "funnel" in section_name:
            # Conversion & Funnel section -> Conversion metric
            if items:
                for item in items:
                    status = item.get("status", "Satisfactory")
                    score = status_scores.get(status, 50)
                    radar["Conversion"].append(score)
            else:
                radar["Conversion"].append(section_score)
        
        elif "copy" in section_name or "messaging" in section_name:
            # Copy & Messaging section -> Copy metric
            if items:
                for item in items:
                    status = item.get("status", "Satisfactory")
                    score = status_scores.get(status, 50)
                    radar["Copy"].append(score)
            else:
                radar["Copy"].append(section_score)
        
        elif "visual" in section_name or "brand" in section_name:
            # Visuals & Brand section -> Visuals metric
            if items:
                for item in items:
                    status = item.get("status", "Satisfactory")
                    score = status_scores.get(status, 50)
                    radar["Visuals"].append(score)
            else:
                radar["Visuals"].append(section_score)
        
        elif "trust" in section_name or "credibility" in section_name:
            # Trust & Credibility section -> Trust metric
            if items:
                for item in items:
                    status = item.get("status", "Satisfactory")
                    score = status_scores.get(status, 50)
                    radar["Trust"].append(score)
            else:
                radar["Trust"].append(section_score)
        
        elif "speed" in section_name or "technical" in section_name or "health" in section_name:
            # Speed & Technical Health section -> Speed metric
            if items:
                for item in items:
                    status = item.get("status", "Satisfactory")
                    score = status_scores.get(status, 50)
                    radar["Speed"].append(score)
            else:
                radar["Speed"].append(section_score)
        
        elif "mobile" in section_name:
            # Mobile Experience -> split between UX and Speed
            if items:
                for item in items:
                    status = item.get("status", "Satisfactory")
                    score = status_scores.get(status, 50)
                    # Mobile UX items go to UX, mobile performance goes to Speed
                    item_name = item.get("item", "").lower()
                    if "speed" in item_name or "load" in item_name or "performance" in item_name:
                        radar["Speed"].append(score)
                    else:
                        radar["UX"].append(score)
            else:
                # Split mobile score between UX and Speed
                radar["UX"].append(section_score * 0.7)  # 70% UX
                radar["Speed"].append(section_score * 0.3)  # 30% Speed
    
    # Calculate averages for each metric
    result = {}
    for metric in ["UX", "Conversion", "Copy", "Visuals", "Trust", "Speed"]:
        scores = radar[metric]
        if scores:
            result[metric] = int(sum(scores) / len(scores))
        else:
            result[metric] = 50  # Default if no data
    
    return result

def calculate_radar_from_categories(categories):
    """
    Calculate radar scores from legacy categories structure.
    Maps category names to the 6 standardized metrics.
    """
    radar = {}
    category_map = {
        "UX": "UX",
        "Conversion": "Conversion",
        "Copy": "Copy",
        "Visuals": "Visuals",
        "Visual": "Visuals",
        "Legal": "Trust",
        "Trust": "Trust",
        "Speed": "Speed"
    }
    
    for cat in categories:
        cat_name = cat.get("name", "")
        score = cat.get("score", 50)
        
        # Map category to radar metric
        for key, metric in category_map.items():
            if key.lower() in cat_name.lower():
                radar[metric] = score
                break
    
    # Ensure all 6 metrics are present
    required_metrics = ["UX", "Conversion", "Copy", "Visuals", "Trust", "Speed"]
    for metric in required_metrics:
        if metric not in radar:
            radar[metric] = 50  # Default to 50 if missing
    
    return radar

def clean_text(text):
    """
    Brutal ASCII Text Sanitizer: Removes ALL Unicode/emojis for FPDF.
    Forces conversion to ASCII to eliminate any possibility of font rendering issues.
    This prevents Unicode errors that cause blank PDFs on Streamlit Cloud.
    """
    if text is None:
        return ""
    
    # Force string, replace common smart quotes, then strip non-ASCII
    text = str(text).replace("'", "'").replace('"', '"').replace('"', '"')
    return text.encode('ascii', 'ignore').decode('ascii')

def clean_text_for_pdf(text):
    """
    Alias for clean_text - kept for backward compatibility.
    All new code should use clean_text() directly.
    """
    return clean_text(text)

def safe_error_message(error, max_length=200):
    """
    Safely convert an error to a string that can be displayed without Unicode encoding issues.
    This function ensures error messages don't contain emojis or Unicode that Windows can't handle.
    """
    try:
        error_str = str(error)
        # Clean the error message to remove Unicode characters
        error_str = clean_text_for_pdf(error_str)
        # Truncate if too long
        if len(error_str) > max_length:
            error_str = error_str[:max_length] + "..."
        return error_str
    except Exception:
        # If even cleaning fails, return a safe fallback
        return "An error occurred during processing. Please try again."

def safe_print(*args, **kwargs):
    """
    Safe print function that handles Unicode characters on Windows.
    Replaces emojis with ASCII equivalents before printing.
    """
    try:
        # Convert all arguments to strings and clean them
        cleaned_args = []
        for arg in args:
            if isinstance(arg, (str, bytes)):
                cleaned = safe_error_message(str(arg), max_length=10000)
                cleaned_args.append(cleaned)
            else:
                cleaned_args.append(str(arg))
        
        # Use the cleaned arguments for printing
        print(*cleaned_args, **kwargs)
    except Exception:
        # If printing fails, try to print a safe fallback
        try:
            print("[Print error: Unable to display message]", **kwargs)
        except:
            pass  # If even that fails, silently continue

def generate_html_report(data, overall_score, screenshot_path=None, radar_chart_path=None, stitched_heatmap_path=None, site_url=None):
    """
    Generate a comprehensive HTML report from audit JSON data.
    Includes all details: executive summary, priority matrix, heatmap, screenshot, deep dive details, etc.
    """
    # Basic CSS for a professional look
    css = """
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .score-box {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            margin-bottom: 40px;
        }
        .score-box h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .score {
            font-size: 4em;
            font-weight: bold;
            margin: 20px 0;
        }
        h2 {
            color: #667eea;
            margin-top: 40px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .quick-win {
            background: #f8f9fa;
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
            border-radius: 4px;
        }
        .quick-win h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .category-section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .category-section h3 {
            color: #667eea;
            margin-bottom: 15px;
        }
        .audit-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #ddd;
        }
        .badge-red {
            display: inline-block;
            padding: 4px 12px;
            background: #dc3545;
            color: white;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: bold;
            margin-right: 10px;
        }
        .badge-green {
            display: inline-block;
            padding: 4px 12px;
            background: #28a745;
            color: white;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: bold;
            margin-right: 10px;
        }
        .badge-yellow {
            display: inline-block;
            padding: 4px 12px;
            background: #ffc107;
            color: #333;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: bold;
            margin-right: 10px;
        }
        .action-plan {
            background: #fff3cd;
            padding: 15px;
            margin-top: 10px;
            border-radius: 4px;
            border-left: 4px solid #ffc107;
        }
        .working-well {
            background: #d4edda;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #28a745;
        }
        .working-well h4 {
            color: #155724;
            margin-bottom: 8px;
            font-size: 0.95em;
        }
        .working-well ul {
            margin-left: 20px;
            color: #155724;
        }
        .working-well li {
            margin: 5px 0;
        }
        .not-working {
            background: #f8d7da;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #dc3545;
        }
        .not-working h4 {
            color: #721c24;
            margin-bottom: 8px;
            font-size: 0.95em;
        }
        .not-working ul {
            margin-left: 20px;
            color: #721c24;
        }
        .not-working li {
            margin: 5px 0;
        }
        .conversion-impact {
            background: #e7f3ff;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #0066cc;
        }
        .conversion-impact strong {
            color: #0066cc;
        }
        .fix-example {
            background: #f8f9fa;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #6c757d;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 0.95em;
        }
        .fix-expected-impact {
            background: #e7f5e7;
            padding: 12px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #28a745;
        }
        .fix-expected-impact strong {
            color: #155724;
        }
    </style>
    """
    
    html = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SiteRoast Audit Report</title>
        {css}
    </head>
    <body>
        <div class="container">
            <div class="score-box">
                <h1>SiteRoast Conversion Audit Report</h1>
                <div class="score">{overall_score}/100</div>
                <p style="margin-top: 20px; font-size: 1.1em;">Client: {site_url or 'N/A'}</p>
                <p style="margin-top: 10px; font-size: 1.1em;">Generated: {time.strftime('%B %d, %Y')}</p>
            </div>
            
            <h2>Executive Summary</h2>
            <div style="margin-bottom: 20px;">
                <h3 style="color: #667eea; margin-bottom: 10px;">Summary:</h3>
                <p>{data.get('roast_summary') or data.get('headline_roast') or data.get('overview', {}).get('executiveSummary', 'No summary available.')}</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h3 style="color: #667eea; margin-bottom: 10px;">Analysis:</h3>
    """
    
    # Split analysis into multiple paragraphs (2-3 sentences each)
    analysis_text = data.get('overview', {}).get('roastAnalysis', '')
    if analysis_text:
        import re
        sentences = re.split(r'(?<=[.!?])\s+', str(analysis_text))
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Group into paragraphs of 2-3 sentences
        para_sentences = []
        current_para = []
        for i, sentence in enumerate(sentences):
            current_para.append(sentence)
            if len(current_para) >= 3 or (len(current_para) >= 2 and i == len(sentences) - 1):
                para_sentences.append(' '.join(current_para))
                current_para = []
        if current_para:
            para_sentences.append(' '.join(current_para))
        
        for para in para_sentences:
            if para:
                html += f'<p style="margin-bottom: 12px;">{para}</p>'
    else:
        html += '<p>Analysis completed.</p>'
    
    html += """
            </div>
    """
    
    # Add Priority Matrix (below Executive Summary)
    detailed_audit = data.get('detailedAudit', {})
    if detailed_audit:
        # Flatten all items from detailedAudit
        all_items = []
        for category, items in detailed_audit.items():
            if isinstance(items, list):
                all_items.extend(items)
        
        if all_items:
            # Build Priority Matrix
            matrix = {}
            impact_levels = ['HI', 'MI', 'LI']
            status_levels = ['Failed', 'Needs Improvement', 'Satisfactory', 'Good', 'Excellent']
            
            # Initialize matrix
            for impact in impact_levels:
                matrix[impact] = {}
                for status in status_levels:
                    matrix[impact][status] = 0
            
            # Count items in each bucket
            for item in all_items:
                impact = item.get('impact', 'MI')
                status = item.get('status', 'Satisfactory')
                if impact in matrix and status in matrix[impact]:
                    matrix[impact][status] += 1
            
            # Generate HTML table
            html += """
            <h2>Priority Matrix: Where to Start</h2>
            <div style="margin: 20px 0; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border: 1px solid #ddd;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">Impact</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">Failed</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">Needs Improvement</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">Satisfactory</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">Good</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">Excellent</th>
                        </tr>
                    </thead>
                    <tbody>
            """
            
            impact_labels = {'HI': 'High', 'MI': 'Medium', 'LI': 'Low'}
            impact_colors = {'HI': '#ffcccc', 'MI': '#fff4cc', 'LI': '#e6f3ff'}
            
            for impact_code in impact_levels:
                impact_label = impact_labels[impact_code]
                bg_color = impact_colors[impact_code]
                html += f"""
                        <tr style="background: {bg_color};">
                            <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">{impact_label}</td>
                """
                for status in status_levels:
                    count = matrix[impact_code][status]
                    count_text = str(count) if count > 0 else '-'
                    # Highlight high-impact failures
                    cell_style = "padding: 12px; border: 1px solid #ddd; text-align: center;"
                    if impact_code == 'HI' and status == 'Failed' and count > 0:
                        cell_style += " background: #ff9999; font-weight: bold; color: #cc0000;"
                    html += f'<td style="{cell_style}">{count_text}</td>'
                html += "</tr>"
            
            html += """
                    </tbody>
                </table>
            </div>
            <p style="color: #666; font-size: 0.9em; margin-top: 10px;">Focus on High Impact + Failed items first for maximum conversion gains.</p>
            """
    
    # Add Radar Chart (Priority Matrix)
    if radar_chart_path and os.path.exists(radar_chart_path):
        try:
            with open(radar_chart_path, 'rb') as img_file:
                img_data = base64.b64encode(img_file.read()).decode('utf-8')
                html += f"""
            <h2>Performance Radar (Priority Matrix)</h2>
            <div style="text-align: center; margin: 20px 0;">
                <img src="data:image/png;base64,{img_data}" alt="Performance Radar Chart" style="max-width: 100%; height: auto; margin: 0 auto; display: block;" />
            </div>
            """
        except Exception as e:
            safe_print(f"[HTML Report] Failed to include radar chart: {safe_error_message(str(e))}")
    
    # Add Screenshot
    if screenshot_path and os.path.exists(screenshot_path):
        try:
            with open(screenshot_path, 'rb') as img_file:
                img_data = base64.b64encode(img_file.read()).decode('utf-8')
                html += f"""
            <h2>Landing Page Screenshot</h2>
            <img src="data:image/png;base64,{img_data}" alt="Landing Page Screenshot" style="max-width: 100%; height: auto; margin: 20px 0; border: 1px solid #ddd; border-radius: 8px;" />
            """
        except Exception as e:
            safe_print(f"[HTML Report] Failed to include screenshot: {safe_error_message(str(e))}")
    
    # Add Heatmap
    if stitched_heatmap_path and os.path.exists(stitched_heatmap_path):
        try:
            with open(stitched_heatmap_path, 'rb') as img_file:
                img_data = base64.b64encode(img_file.read()).decode('utf-8')
                html += f"""
            <h2>Visual Saliency Heatmap</h2>
            <p>Heatmap showing where users' eyes are drawn on your landing page.</p>
            <img src="data:image/png;base64,{img_data}" alt="Heatmap" style="max-width: 100%; height: auto; margin: 20px 0; border: 1px solid #ddd; border-radius: 8px;" />
            """
        except Exception as e:
            safe_print(f"[HTML Report] Failed to include heatmap: {safe_error_message(str(e))}")
    
    html += """
            <h2>Quick Wins</h2>
    """
    
    # Add Quick Wins
    quick_wins = data.get('quick_wins', [])
    if quick_wins:
        for win in quick_wins[:5]:
            element_name = win.get('elementName', win.get('title', 'Issue'))
            fix_obj = win.get('fix', {})
            if isinstance(fix_obj, dict):
                quick_fix = fix_obj.get('quickFix', 'N/A')
            else:
                quick_fix = str(fix_obj) if fix_obj else 'N/A'
            
            html += f"""
            <div class="quick-win">
                <h3>{element_name}</h3>
                <p><strong>Fix:</strong> {quick_fix}</p>
            </div>
            """
    else:
        html += "<p>No quick wins available.</p>"
    
    # Add Deep Dive Analysis
    html += """
            <h2>Deep Dive Analysis</h2>
    """
    
    detailed_audit = data.get('detailedAudit', {})
    if detailed_audit:
        category_names = {
            "ux": "UX & Layout",
            "conversion": "Conversion & Funnel",
            "copy": "Copy & Messaging",
            "visuals": "Visuals & Brand",
            "trust": "Trust & Credibility",
            "speed": "Speed & Technical Health"
        }
        
        for cat_key, items in detailed_audit.items():
            if items:
                cat_name = category_names.get(cat_key.lower(), cat_key.capitalize())
                html += f"""
                <div class="category-section">
                    <h3>{cat_name.upper()}</h3>
                """
                
                for item in items:
                    status = item.get('status', 'Unknown')
                    element_name = item.get('elementName', item.get('element', 'Element'))
                    rationale = item.get('rationale', 'No rationale provided.')
                    impact_raw = item.get('impact', 'MI')
                    impact_map = {'HI': 'High Impact', 'MI': 'Medium Impact', 'LI': 'Low Impact'}
                    readable_impact = impact_map.get(impact_raw, 'Medium Impact')
                    
                    working_well = item.get('workingWell', item.get('working', []))
                    not_working = item.get('notWorking', item.get('not_working', []))
                    conversion_impact = item.get('conversionImpact', '')
                    
                    fix_obj = item.get('fix', {})
                    if isinstance(fix_obj, dict):
                        quick_fix = fix_obj.get('quickFix', '')
                        fix_example = fix_obj.get('example', '')
                        fix_expected_impact = fix_obj.get('expectedImpact', '')
                    else:
                        quick_fix = str(fix_obj) if fix_obj else ''
                        fix_example = ''
                        fix_expected_impact = ''
                    
                    # Determine badge class based on status
                    if status in ['Failed', 'Needs Improvement']:
                        badge_class = "badge-red"
                    elif status in ['Excellent', 'Good']:
                        badge_class = "badge-green"
                    else:
                        badge_class = "badge-yellow"
                    
                    html += f"""
                    <div class="audit-item">
                        <div style="margin-bottom: 10px;">
                            <strong style="font-size: 1.1em; margin-right: 10px;">{element_name}</strong>
                            <span class="{badge_class}">{status}</span>
                            <span class="badge-yellow" style="background: #6c757d;">{readable_impact}</span>
                        </div>
                        <p style="font-style: italic; color: #666; margin: 10px 0;">{rationale}</p>
                    """
                    
                    # What's Working
                    if working_well and isinstance(working_well, list) and len(working_well) > 0:
                        html += """
                        <div class="working-well">
                            <h4>What's Working:</h4>
                            <ul>
                        """
                        for w in working_well:
                            html += f"<li>{w}</li>"
                        html += """
                            </ul>
                        </div>
                        """
                    
                    # What's Broken
                    if not_working and isinstance(not_working, list) and len(not_working) > 0:
                        html += """
                        <div class="not-working">
                            <h4>What's Broken:</h4>
                            <ul>
                        """
                        for nw in not_working:
                            html += f"<li>{nw}</li>"
                        html += """
                            </ul>
                        </div>
                        """
                    
                    # Conversion Impact
                    if conversion_impact:
                        html += f"""
                        <div class="conversion-impact">
                            <strong>Conversion Impact:</strong> {conversion_impact}
                        </div>
                        """
                    
                    # Action Plan
                    if quick_fix:
                        html += f"""
                        <div class="action-plan">
                            <strong>Action Plan:</strong> {quick_fix}
                        </div>
                        """
                    
                    # Fix Example
                    if fix_example:
                        html += f"""
                        <div class="fix-example">
                            <strong>Example:</strong><br>
                            {fix_example}
                        </div>
                        """
                    
                    # Expected Impact
                    if fix_expected_impact:
                        html += f"""
                        <div class="fix-expected-impact">
                            <strong>Expected Impact:</strong> {fix_expected_impact}
                        </div>
                        """
                    
                    html += "</div>"
                
                html += "</div>"
    else:
        html += "<p>No detailed audit data available.</p>"
    
    html += """
        </div>
    </body>
    </html>
    """
    
    return html

def generate_pdf_report(json_data, screenshot_path=None, site_url=None, radar_chart_path=None, stitched_heatmap_path=None):
    """
    Generate a PDF report from the audit JSON data.
    
    Args:
        json_data: Dictionary containing the audit results
        screenshot_path: Optional path to screenshot image file
        site_url: Optional URL of the audited site (will extract base URL if full URL provided)
        radar_chart_path: Optional path to radar chart image file
    
    Returns:
        PDF bytes
    """
    # Validate input data - return error PDF if empty
    if not json_data or not isinstance(json_data, dict):
        safe_print("[ERROR] PDF generation: json_data is None or empty")
        try:
            error_pdf = PDFReport()
            error_pdf.add_page()
            error_pdf.set_font("Courier", "B", 16)
            error_pdf.cell(0, 10, clean_text("SiteRoast Conversion Audit Report"), ln=True, align="C")
            error_pdf.set_font("Courier", "", 11)
            error_pdf.cell(0, 10, clean_text("Error: No audit data available to generate report."), ln=True, align="C")
            return error_pdf.output(dest='S')
        except:
            return b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 0\ntrailer\n<<\n/Size 0\n>>\nstartxref\n0\n%%EOF'
    
    try:
        pdf = PDFReport()
        
        # Extract base URL if full URL provided
        base_url = None
        if site_url:
            try:
                from urllib.parse import urlparse
                parsed = urlparse(site_url)
                base_url = f"{parsed.scheme}://{parsed.netloc}" if parsed.netloc else site_url
            except:
                base_url = site_url
        
        # Prepare metadata for cover page
        metadata = {
            'scannedUrl': base_url or site_url or 'N/A',
            'scannedAt': time.strftime('%B %d, %Y')
        }
        
        # Prepare roast data for executive summary - MUST MATCH HTML REPORT EXACTLY
        # HTML uses: data.get('roast_summary') or data.get('headline_roast') or data.get('overview', {}).get('executiveSummary', 'No summary available.')
        roast_summary = json_data.get('roast_summary') or json_data.get('headline_roast') or json_data.get('overview', {}).get('executiveSummary', 'No summary available.')
        roast_data = {
            'roast_summary': roast_summary,  # Match HTML key
            'headline_roast': json_data.get('headline_roast', ''),
            'broadRoast': roast_summary,
            'hook': json_data.get('headline_roast', ''),
            'analysis': json_data.get('overview', {}).get('roastAnalysis', ''),
            'roastAnalysis': json_data.get('overview', {}).get('roastAnalysis', ''),
            'executiveSummary': json_data.get('overview', {}).get('executiveSummary', ''),
            'overview': json_data.get('overview', {})  # Include full overview for consistency
        }
        
        # Get overall score
        overall_score = json_data.get('overall_score', json_data.get('overview', {}).get('overallScore', 50))
        
        # Get detailedAudit for status summary table
        detailed_audit = json_data.get('detailedAudit', {})
        
        # Call new methods in order - with error handling for each section
        safe_print(f"[PDF] Starting PDF generation with {len(json_data)} keys in json_data")
        safe_print(f"[PDF] Heatmap path: {stitched_heatmap_path}")
        safe_print(f"[PDF] Screenshot path: {screenshot_path}")
        
        try:
            pdf.add_cover_page(metadata, overall_score)
            safe_print(f"[PDF] Cover page added successfully. Page count: {pdf.page_no()}")
        except Exception as e:
            safe_print(f"[ERROR] Cover page failed: {safe_error_message(str(e))}")
            # Ensure at least one page exists
            if pdf.page_no() == 0:
                pdf.add_page()
                pdf.set_font("Courier", "B", 16)
                pdf.cell(0, 10, clean_text("SiteRoast Conversion Audit Report"), ln=True, align="C")
                pdf.set_font("Courier", "", 11)
                pdf.cell(0, 10, clean_text(f"Site: {base_url or site_url or 'N/A'}"), ln=True, align="C")
                pdf.cell(0, 10, clean_text(f"Score: {overall_score}/100"), ln=True, align="C")
                safe_print(f"[PDF] Fallback cover page added. Page count: {pdf.page_no()}")
        
        try:
            pdf.add_roast_section(roast_data, overall_score, detailed_audit)
            safe_print(f"[PDF] Roast section added successfully. Page count: {pdf.page_no()}")
        except Exception as e:
            safe_print(f"[ERROR] Roast section failed: {safe_error_message(str(e))}")
            # Add fallback content
            if pdf.page_no() == 0:
                pdf.add_page()
            else:
                pdf.add_page()
            pdf.set_font("Courier", "B", 16)
            pdf.cell(0, 10, clean_text("Executive Summary"), ln=True)
            pdf.set_font("Courier", "", 11)
            summary_text = clean_text(str(roast_summary))[:500] if roast_summary else "Analysis completed"
            pdf.multi_cell(0, 6, summary_text)
            pdf.ln(5)
            pdf.cell(0, 10, clean_text(f"Overall Score: {overall_score}/100"), ln=True)
            safe_print(f"[PDF] Fallback roast section added. Page count: {pdf.page_no()}")
        
        # Add Radar Chart Section (centered)
        try:
            pdf.add_radar_section(radar_chart_path)
            safe_print(f"[PDF] Radar section added successfully. Page count: {pdf.page_no()}")
        except Exception as e:
            safe_print(f"[ERROR] Radar section failed: {safe_error_message(str(e))}")
        
        try:
            pdf.add_visuals_section(stitched_heatmap_path)
            safe_print(f"[PDF] Visuals section added successfully. Page count: {pdf.page_no()}")
        except Exception as e:
            safe_print(f"[ERROR] Visuals section failed: {safe_error_message(str(e))}")
            # Add fallback page
            pdf.add_page()
            pdf.set_font("Courier", "B", 14)
            pdf.cell(0, 10, clean_text("Visual Analysis"), ln=True, align="C")
            pdf.set_font("Courier", "I", 12)
            pdf.cell(0, 10, clean_text("[Heatmap Not Available]"), ln=True, align="C")
            if stitched_heatmap_path:
                pdf.set_font("Courier", "", 8)
                debug_text = f"Path attempted: {str(stitched_heatmap_path)[:60]}"
                pdf.cell(0, 6, clean_text(debug_text), ln=True, align="C")
            safe_print(f"[PDF] Fallback visuals section added. Page count: {pdf.page_no()}")
        
        # Quick Wins section
        quick_wins = json_data.get('quick_wins', [])
        if quick_wins and len(quick_wins) > 0:
            try:
                pdf.add_quick_wins(quick_wins)
                safe_print(f"[PDF] Quick wins section added successfully. Page count: {pdf.page_no()}")
            except Exception as e:
                safe_print(f"[ERROR] Quick wins section failed: {safe_error_message(str(e))}")
                # Add fallback content
                pdf.add_page()
                pdf.set_font("Courier", "B", 14)
                pdf.cell(0, 10, clean_text("Quick Wins"), ln=True)
                pdf.set_font("Courier", "", 11)
                for i, win in enumerate(quick_wins[:3], 1):
                    title = win.get('title', win.get('elementName', 'Quick Win'))
                    pdf.cell(0, 8, clean_text(f"{i}. {str(title)}"), ln=True)
                safe_print(f"[PDF] Fallback quick wins added. Page count: {pdf.page_no()}")
    
        # --- PAGE 3: VISUAL CONTEXT (Hero Shot) ---
        if screenshot_path:
            # Try multiple path resolution strategies for cloud compatibility
            verified_screenshot_path = None
            if os.path.exists(screenshot_path):
                verified_screenshot_path = screenshot_path
            else:
                # Try tempfile directory
                try:
                    temp_dir = os.path.join(tempfile.gettempdir(), "siteroast_temp")
                    filename = os.path.basename(screenshot_path)
                    temp_path = os.path.join(temp_dir, filename)
                    if os.path.exists(temp_path):
                        verified_screenshot_path = temp_path
                except:
                    pass
            
            if verified_screenshot_path and os.path.exists(verified_screenshot_path):
                pdf.add_page()
                pdf.set_font("Courier", 'B', 16)
                pdf.set_text_color(0, 0, 0)  # Force black text
                pdf.cell(pdf.usable_width, 10, clean_text("Landing Page Screenshot"), 0, 1, 'L')
                pdf.ln(5)
                
                try:
                    # Open image to get dimensions
                    from PIL import Image as PILImage
                    img = PILImage.open(verified_screenshot_path)
                    img_width, img_height = img.size
                    
                    # Calculate dimensions: Make it double height (or as much as fits)
                    # A4 height = 297mm, margins = 40mm total, title space ≈ 30mm
                    # Usable height ≈ 227mm
                    max_height_mm = 220  # Leave some margin
                    
                    # Calculate aspect ratio
                    aspect_ratio = img_width / img_height
                    
                    # Start with full width
                    display_width = pdf.usable_width
                    display_height = display_width / aspect_ratio
                    
                    # Double the height (or use max available)
                    target_height = min(max_height_mm, display_height * 2)
                    
                    # If target is taller, adjust width to maintain aspect ratio
                    if target_height > display_height:
                        display_height = target_height
                        display_width = display_height * aspect_ratio
                        # If wider than usable width, scale down
                        if display_width > pdf.usable_width:
                            scale = pdf.usable_width / display_width
                            display_width = pdf.usable_width
                            display_height = display_height * scale
                    
                    # Center horizontally if narrower than usable width
                    x_offset = 20 + (pdf.usable_width - display_width) / 2 if display_width < pdf.usable_width else 20
                    
                    # Place image with proper spacing (y position is already set by pdf.ln(8))
                    current_y = pdf.get_y()
                    pdf.image(verified_screenshot_path, x=x_offset, y=current_y, w=display_width)
                    safe_print(f"[PDF] Screenshot added successfully. Page count: {pdf.page_no()}")
                except Exception as e:
                    pdf.set_font("Courier", '', 10)
                    pdf.set_text_color(0, 0, 0)  # Force black text
                    error_msg = str(e)[:150]
                    pdf.multi_cell(pdf.usable_width, 8, clean_text(f"Note: Could not load screenshot: {error_msg}"), 0, 'L')
                    safe_print(f"[PDF] Screenshot load failed: {safe_error_message(str(e))}")
            else:
                safe_print(f"[PDF] Screenshot path not found: {screenshot_path}")
        
        # --- PAGE 4+: ELEMENT-BY-ELEMENT AUDIT (if available) ---
        audit_items = json_data.get('audit_items', [])
        if audit_items and len(audit_items) > 0:
            safe_print(f"[PDF] Adding {len(audit_items)} audit items")
            # Split audit_items into pages (3-4 per page)
            items_per_page = 3
            for page_start in range(0, len(audit_items), items_per_page):
                pdf.add_page()
                if page_start == 0:
                    pdf.set_font("Courier", 'B', 18)
                    pdf.set_text_color(0, 0, 0)  # Force black text
                    pdf.cell(pdf.usable_width, 12, clean_text("Element-by-Element Audit"), 0, 1, 'L')
                    pdf.ln(3)
                
                page_items = audit_items[page_start:page_start + items_per_page]
                for item in page_items:
                    try:
                        # Use the new professional audit_card method
                        pdf.audit_card(item)
                        
                        # Add separator line between cards
                        pdf.line(15, pdf.get_y(), 195, pdf.get_y())
                        pdf.ln(3)
                    except Exception as e:
                        safe_print(f"[PDF] Audit card failed: {safe_error_message(str(e))}")
                        # Add fallback content for this item
                        element_name = item.get('element', item.get('elementName', 'Element'))
                        pdf.set_font("Courier", 'B', 12)
                        pdf.set_text_color(0, 0, 0)  # Force black text
                        pdf.cell(pdf.usable_width, 8, clean_text(str(element_name)), ln=True)
                        pdf.set_font("Courier", '', 10)
                        pdf.set_text_color(0, 0, 0)  # Force black text
                        pdf.cell(pdf.usable_width, 6, clean_text(f"Status: {item.get('status', 'Unknown')}"), ln=True)
                        pdf.ln(3)
            safe_print(f"[PDF] Audit items added. Page count: {pdf.page_no()}")
        
        # --- PAGE N+: DEEP DIVES (God-Tier Schema) ---
        categories = json_data.get('categories', [])
        if categories:
            safe_print(f"[PDF] Adding {len(categories)} category pages")
            for cat in categories:
                try:
                    pdf.add_page()
                    # Title
                    pdf.set_font("Courier", 'B', 16)
                    pdf.set_text_color(0, 0, 0)  # Force black text
                    cat_name = clean_text(cat.get('name', 'Unknown'))[:80]
                    cat_score = cat.get('score', 0)
                    pdf.multi_cell(pdf.usable_width, 10, clean_text(f"{cat_name} (Score: {cat_score}/100)"), 0, 'L')
                    
                    # Verdict & Impact
                    pdf.set_font("Courier", '', 11)
                    pdf.set_text_color(0, 0, 0)  # Force black text
                    verdict = clean_text(cat.get('verdict', 'Unknown'))[:40]
                    impact = clean_text(cat.get('impact', 'Unknown'))[:40]
                    pdf.multi_cell(pdf.usable_width, 8, clean_text(f"Verdict: {verdict} | Impact: {impact}"), 0, 'L')
                    pdf.ln(4)
                    
                    # What Works
                    what_works = cat.get('what_works', '')
                    if what_works:
                        pdf.set_font("Courier", 'B', 11)
                        pdf.set_text_color(0, 0, 0)  # Force black text
                        pdf.cell(pdf.usable_width, 8, clean_text("What Works:"), 0, 1, 'L')
                        pdf.set_font("Courier", '', 10)
                        pdf.set_text_color(0, 0, 0)  # Force black text
                        pdf.multi_cell(pdf.usable_width, 6, clean_text(str(what_works))[:400], 0, 'L')
                        pdf.ln(3)
                    
                    # What Failed
                    what_failed = cat.get('what_failed', '')
                    if what_failed:
                        pdf.set_font("Courier", 'B', 11)
                        pdf.set_text_color(0, 0, 0)  # Force black text
                        pdf.cell(pdf.usable_width, 8, clean_text("What Failed:"), 0, 1, 'L')
                        pdf.set_font("Courier", '', 10)
                        pdf.set_text_color(0, 0, 0)  # Force black text
                        pdf.multi_cell(pdf.usable_width, 6, clean_text(str(what_failed))[:400], 0, 'L')
                        pdf.ln(3)
                    
                    # Fix Steps
                    fix_steps = cat.get('fix_steps', [])
                    if fix_steps:
                        pdf.set_font("Courier", 'B', 11)
                        pdf.set_text_color(0, 0, 0)  # Force black text
                        pdf.cell(pdf.usable_width, 8, clean_text("Fix Steps:"), 0, 1, 'L')
                        pdf.set_font("Courier", '', 10)
                        pdf.set_text_color(0, 0, 0)  # Force black text
                        for i, step in enumerate(fix_steps[:5]):  # Max 5 steps
                            step_text = clean_text(str(step))[:300]
                            pdf.multi_cell(pdf.usable_width, 6, clean_text(f"{i+1}. {step_text}"), 0, 'L')
                            pdf.ln(2)
                except Exception as e:
                    safe_print(f"[PDF] Category page failed: {safe_error_message(str(e))}")
                    # Add minimal fallback
                    pdf.add_page()
                    pdf.set_font("Courier", 'B', 16)
                    pdf.set_text_color(0, 0, 0)  # Force black text
                    cat_name = clean_text(cat.get('name', 'Category'))[:80]
                    pdf.cell(pdf.usable_width, 10, clean_text(f"{cat_name}"), 0, 1, 'L')
            safe_print(f"[PDF] Categories added. Page count: {pdf.page_no()}")
        
        # CRITICAL: Ensure PDF has at least one page with content BEFORE output
        page_count = pdf.page_no()
        safe_print(f"[PDF] Page count before output: {page_count}")
        
        if page_count == 0:
            safe_print("[PDF] WARNING: No pages found, adding fallback page")
            pdf.add_page()
            pdf.set_font("Courier", "B", 16)
            pdf.cell(0, 10, clean_text("SiteRoast Conversion Audit Report"), ln=True, align="C")
            pdf.set_font("Courier", "", 11)
            pdf.cell(0, 10, clean_text("Report generated successfully"), ln=True, align="C")
            pdf.cell(0, 10, clean_text(f"Site: {base_url or site_url or 'N/A'}"), ln=True, align="C")
            pdf.cell(0, 10, clean_text(f"Score: {overall_score}/100"), ln=True, align="C")
        
        # Verify we have content by checking page count again
        final_page_count = pdf.page_no()
        safe_print(f"[PDF] Final page count: {final_page_count}")
        
        if final_page_count == 0:
            raise ValueError("PDF has zero pages - cannot generate empty PDF")
        
        # pdf.output(dest='S') returns bytes/bytearray directly
        # Handle encoding errors gracefully (Windows charmap issue)
        try:
            pdf_bytes = pdf.output(dest='S')
            safe_print(f"[PDF] Output size: {len(pdf_bytes) if pdf_bytes else 0} bytes")
            # Verify PDF is not empty
            if not pdf_bytes or len(pdf_bytes) < 100:
                raise ValueError(f"PDF output is too small ({len(pdf_bytes) if pdf_bytes else 0} bytes), likely empty")
        except (UnicodeEncodeError, UnicodeDecodeError, ValueError) as e:
            # If encoding fails, use BytesIO buffer which handles encoding better
            try:
                buffer = io.BytesIO()
                pdf.output(buffer)
                pdf_bytes = buffer.getvalue()
                # Verify again
                if not pdf_bytes or len(pdf_bytes) < 100:
                    raise ValueError("PDF buffer is too small")
            except Exception as e2:
                # Last resort: create a minimal valid PDF
                safe_print(f"[ERROR] PDF generation failed: {safe_error_message(str(e2))}")
                try:
                    # Create a minimal PDF with error message
                    fallback_pdf = PDFReport()
                    fallback_pdf.add_page()
                    fallback_pdf.set_font("Courier", "B", 16)
                    fallback_pdf.cell(0, 10, clean_text("SiteRoast Conversion Audit Report"), ln=True, align="C")
                    fallback_pdf.set_font("Courier", "", 11)
                    error_msg = clean_text("PDF generation encountered an error. Please try again.")
                    fallback_pdf.multi_cell(0, 6, error_msg)
                    pdf_bytes = fallback_pdf.output(dest='S')
                except:
                    # Absolute last resort - return minimal valid PDF
                    pdf_bytes = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 0\ntrailer\n<<\n/Size 0\n>>\nstartxref\n0\n%%EOF'
        
        # Convert bytearray to bytes if needed (Streamlit download_button expects bytes)
        if isinstance(pdf_bytes, bytearray):
            pdf_bytes = bytes(pdf_bytes)
        
        # Final verification
        if not pdf_bytes or len(pdf_bytes) < 100:
            safe_print("[ERROR] PDF bytes are empty or too small")
            # Return minimal valid PDF
            pdf_bytes = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 0\ntrailer\n<<\n/Size 0\n>>\nstartxref\n0\n%%EOF'
        
        return pdf_bytes
    except Exception as e:
        safe_print(f"[CRITICAL ERROR] PDF generation completely failed: {safe_error_message(str(e))}")
        # Return minimal valid PDF structure
        return b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 0\ntrailer\n<<\n/Size 0\n>>\nstartxref\n0\n%%EOF'

def validate_url(url):
    """
    Validate URL format. Accepts URLs with or without http://, https://, or www.
    Must have a valid domain name and proper extension (.com, .ai, etc.)
    """
    if not url or not url.strip():
        return False, "URL cannot be empty"
    
    url = url.strip()
    
    # Remove protocol if present
    url_clean = re.sub(r'^https?://', '', url, flags=re.IGNORECASE)
    # Remove www. if present
    url_clean = re.sub(r'^www\.', '', url_clean, flags=re.IGNORECASE)
    
    # Remove trailing slash
    url_clean = url_clean.rstrip('/')
    
    # Check if it's empty after cleaning
    if not url_clean:
        return False, "Please enter a valid website URL"
    
    # Split by / to get domain part
    domain = url_clean.split('/')[0]
    
    # Check for valid domain pattern: must have at least one dot and valid TLD
    # Pattern: alphanumeric, dots, hyphens allowed, must end with valid extension
    domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$'
    
    if not re.match(domain_pattern, domain):
        return False, "Invalid URL format. Please enter a valid website (e.g., example.com or www.example.com)"
    
    # Check for common valid TLDs (at least 2 characters)
    tld_pattern = r'\.[a-zA-Z]{2,}$'
    if not re.search(tld_pattern, domain):
        return False, "URL must include a valid domain extension (e.g., .com, .ai, .org)"
    
    return True, ""

def main():
    # Reload environment variables (safety measure for Streamlit caching)
    env_path = pathlib.Path(__file__).parent / '.env.local'
    env_path_default = pathlib.Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path, override=True)
    elif env_path_default.exists():
        load_dotenv(env_path_default, override=True)
    
    # Sidebar removed - navigation handled elsewhere
    if "page_mode" not in st.session_state:
        st.session_state.page_mode = "full_audit"
    
    # Route to appropriate page
    if st.session_state.page_mode == "roi":
        render_roi_page()
        return
    
    # Full Audit Page (existing functionality)
    # Hero Section (Centered Layout)
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown('<h1 class="main-title">SiteRoast</h1>', unsafe_allow_html=True)
        st.markdown('<p class="sub-header">The Brutal Conversion Audit</p>', unsafe_allow_html=True)
        
        # Check API key (with quote stripping)
        api_key_check = get_api_key()
        if not api_key_check:
            st.warning("[!] API Key not found - For Streamlit Cloud: add GOOGLE_GENAI_API_KEY to Secrets. For local: add it to .env.local file")
        
        # URL input field
        site_url = st.text_input("Enter the URL below", placeholder="https://example.com", key="site_url")
        
        # Validate URL
        url_error = None
        if site_url and site_url.strip():
            is_valid, error_msg = validate_url(site_url)
            if not is_valid:
                url_error = error_msg
                st.error(f"⚠️ {error_msg}")
    
    # UPLOAD BLOCK DISABLED (can be re-enabled later if needed)
    # st.markdown("### 📸 Upload Your Screenshots (Optional)")
    # st.caption("⚠️ If you provide a URL above, screenshots will be captured automatically")
    # uploaded_files = st.file_uploader(
    #     "Upload screenshots (PNG, JPG, JPEG)",
    #     type=["png", "jpg", "jpeg"],
    #     accept_multiple_files=True
    # )
    uploaded_files = None  # Disabled for now
    
    # Button in centered column - always visible and enabled
    with col2:
        # Validate URL for button enablement
        can_roast = bool(site_url and site_url.strip() and (url_error is None))
        
        # Inject JavaScript to handle Enter key and button focus
        enter_key_script = """
        <script>
        (function() {
            let buttonClicked = false;
            
            function findRoastButton() {
                // Find by key attribute (most reliable)
                let roastButton = document.querySelector('button[key="roast_button"]');
                
                // Fallback: Find by text content
                if (!roastButton) {
                    const allButtons = document.querySelectorAll('button');
                    for (let btn of allButtons) {
                        const btnText = btn.textContent || btn.innerText || '';
                        if (btnText.includes('Roast My Site') || btnText.includes('Roast')) {
                            roastButton = btn;
                            break;
                        }
                    }
                }
                
                return roastButton;
            }
            
            function triggerRoast() {
                if (buttonClicked) return false; // Prevent multiple clicks
                
                const roastButton = findRoastButton();
                if (roastButton && site_url && site_url.trim()) {
                    buttonClicked = true;
                    roastButton.focus();
                    roastButton.click();
                    setTimeout(() => { buttonClicked = false; }, 2000);
                    return true;
                }
                return false;
            }
            
            function setupEnterHandler() {
                const urlInput = document.querySelector('input[aria-label*="URL"], input[aria-label*="url"], input[placeholder*="example.com"]');
                if (!urlInput) return;
                
                urlInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.keyCode === 13) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Wait for Streamlit to process input
                        setTimeout(() => {
                            const btn = findRoastButton();
                            if (btn) {
                                btn.focus();
                                btn.click();
                            }
                        }, 200);
                    }
                }, true);
            }
            
            // Setup on load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupEnterHandler);
            } else {
                setupEnterHandler();
            }
            
            // Retry after Streamlit renders
            setTimeout(setupEnterHandler, 500);
            setTimeout(setupEnterHandler, 1500);
            
            // Watch for new inputs
            const observer = new MutationObserver(() => {
                setTimeout(setupEnterHandler, 100);
            });
            observer.observe(document.body, { childList: true, subtree: true });
        })();
        </script>
        """
        st.markdown(enter_key_script, unsafe_allow_html=True)
        
        # Show button always - ALWAYS ENABLED (no disabled state)
        button_clicked = st.button("🔥 Roast My Site", type="primary", use_container_width=True, key="roast_button", disabled=False)
        
        if button_clicked and can_roast:
            # Clear any previous results
            if "roast_data" in st.session_state:
                del st.session_state.roast_data
            
            # Initialize progress bar in a card container
            progress_bar = st.progress(0)
            status_text = st.empty()
            progress = ProgressManager(progress_bar, status_text)
            
            try:
                # PHASE 1: Screenshot Capture (Steps 0-12)
                images = None
                
                if site_url and site_url.strip():
                    # Steps 0-2: Browser initialization
                    progress.update(0)
                    time.sleep(0.2)
                    progress.update(1)
                    time.sleep(0.2)
                    progress.update(2)
                    
                    try:
                        # Fix for Windows
                        if os.name == 'nt':
                            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                        
                        # Steps 3-12: Screenshot capture (takes ~15-30 seconds)
                        progress.update(3)
                        images, html_content, page_text = asyncio.run(capture_screenshot_from_url(site_url))
                        
                        # Run quick_scan in parallel (light scan for ROI dashboard)
                        try:
                            scan_data = asyncio.run(quick_scan(site_url))
                            st.session_state.roi_dashboard_data = scan_data
                        except Exception as scan_error:
                            safe_print(f"[WARNING] Quick scan failed: {safe_error_message(str(scan_error))}")
                            st.session_state.roi_dashboard_data = {
                                'page_height': 3000,
                                'price_guess': 50.0,
                                'industry_guess': 'SaaS'
                            }
                        
                        # Advance through steps 4-12 quickly
                        for step in range(4, 13):
                            progress.update(step)
                            time.sleep(0.15)
                        
                        # Store data
                        st.session_state.html_content = html_content
                        st.session_state.page_text = page_text
                        st.session_state.captured_images = images
                        st.session_state.audit_url = site_url
                        
                    except Exception as e:
                        import traceback
                        error_msg = str(e)
                        safe_print(f"[ERROR] Screenshot failed: {safe_error_message(traceback.format_exc())}")
                        st.session_state.roast_data = {
                            "error": error_msg,
                            "overall_score": 0,
                            "roast_summary": f"Screenshot capture failed: {error_msg[:100]}",
                        "headline_roast": f"Screenshot capture failed: {error_msg[:100]}",
                            "summary_bullets": ["[X] Screenshot capture failed", "[!] Try a different URL"],
                            "categories": []
                        }
                        if 'progress' in locals():
                            progress.finalize()
                        st.error(f"[X] Screenshot capture failed: {error_msg}")
                        images = None
                
                # PHASE 2: AI Processing (Steps 13-18)
                if images:
                    html_content = st.session_state.get("html_content", "")
                    page_text = st.session_state.get("page_text", "")
                    
                    # Steps 13-14: Preparing AI request
                    progress.update(13)
                    time.sleep(0.2)
                    progress.update(14)
                    
                    # Steps 15-18: AI generation using Assembly Line (takes ~10-20 seconds)
                    roast_data = generate_roast(images, html_content=html_content, page_text=page_text, progress_manager=progress)
                    
                    st.session_state.roast_data = roast_data
                    
                    # Save scan to Firestore (optional - only if Firebase is available)
                    if FIREBASE_AVAILABLE:
                        try:
                            audit_url = st.session_state.get("audit_url", site_url)
                            overall_score = roast_data.get("overall_score", roast_data.get("overview", {}).get("overallScore", 0))
                            # Save to DB - only if scan_id not already in session state
                            if 'scan_id' not in st.session_state:
                                scan_id = save_scan(audit_url, roast_data, overall_score)
                                if scan_id:
                                    st.session_state['scan_id'] = scan_id
                                    safe_print(f"[INFO] Scan saved to Firestore with ID: {scan_id}")
                        except Exception as e:
                            safe_print(f"[WARNING] Failed to save scan to Firestore: {safe_error_message(str(e))}")
                    
                    # Store first screenshot for PDF (use tempfile for cloud compatibility)
                    temp_dir = os.path.join(tempfile.gettempdir(), "siteroast_temp")
                    os.makedirs(temp_dir, exist_ok=True)
                    screenshot_path = os.path.join(temp_dir, f"screenshot_{int(time.time())}.png")
                    images[0].save(screenshot_path)
                    st.session_state.screenshot_path = screenshot_path
                
                # PHASE 3: Finalize (Steps 19-20)
                progress.update(19)
                time.sleep(0.2)
                progress.update(20)
                time.sleep(0.2)
                
                # Finale (100%)
                progress.finalize()
                
                if images:
                    st.success("✅ Analysis complete! Scroll down to see results.")
                else:
                    st.error("No images to analyze.")
                
            except Exception as e:
                import traceback
                error_msg = str(e)
                safe_print(f"[ERROR] Button handler failed: {safe_error_message(traceback.format_exc())}")
                if 'progress' in locals():
                    progress.finalize()
                st.error(f"[X] Error: {error_msg}")
                # Store error in session state
                st.session_state.roast_data = {
                    "error": error_msg,
                    "overall_score": 0,
                    "roast_summary": f"An error occurred: {error_msg[:100]}",
                    "headline_roast": f"An error occurred: {error_msg[:100]}",
                    "summary_bullets": ["❌ Check API key", "❌ Verify internet connection", "⚠️ Try again"],
                    "categories": []
                }
    
    if "roast_data" in st.session_state:
        roast_data = st.session_state.roast_data
        
        # Check for errors
        if "error" in roast_data:
            error_display = safe_error_message(roast_data.get('error', 'Unknown error'))
            st.error(f"[X] {error_display}")
            roast_summary = roast_data.get("roast_summary") or roast_data.get("headline_roast", "")
            if roast_summary:
                st.warning(f"**[*] The Roast:**\n\n{roast_summary}")
            return
        
        # DASHBOARD GRID LAYOUT - Show audit report directly (no tabs)
        render_main_audit_dashboard(roast_data)

def render_executive_insight_layers(roast_data, traffic, price):
    """Revenue scenarios + first impression / trust / messaging layers (consultant-style)."""
    import html as html_escape
    from insight_layers import build_revenue_leak_estimate, fallback_insight_layers

    rm = dict(roast_data.get("radarMetrics") or {})
    if not rm:
        rs = roast_data.get("radar_scores") or {}
        rm = {
            "ux": rs.get("UX", 50),
            "conversion": rs.get("Conversion", 50),
            "copy": rs.get("Copy", 50),
            "visuals": rs.get("Visuals", 50),
            "trust": rs.get("Trust", 50),
            "speed": rs.get("Speed", 50),
        }
    revenue_est = roast_data.get("revenueLeakEstimate") or build_revenue_leak_estimate(1000, 50)
    fb = fallback_insight_layers(rm)
    fi = roast_data.get("firstImpressionScore") or fb["firstImpressionScore"]
    tg = roast_data.get("trustGapIndex") or fb["trustGapIndex"]
    mc = roast_data.get("messagingClarityScore") or fb["messagingClarityScore"]
    is_paid = st.session_state.get("is_paid", False)

    st.markdown("### Executive insight layers")
    st.caption(
        "Scenario-based revenue risk and structured conversion signals. "
        "Estimates are illustrative; base uses the same 2% benchmark as Cost of Inaction."
    )

    sc = revenue_est["scenarios"]

    def annual_leak(rate):
        return traffic * rate * price * 12

    r_low = annual_leak(sc["low"]["conversionUpliftRate"])
    r_base = annual_leak(sc["base"]["conversionUpliftRate"])
    r_high = annual_leak(sc["high"]["conversionUpliftRate"])

    er1, er2, er3 = st.columns(3)
    with er1:
        st.markdown(
            f'<div class="css-card" style="padding:1rem;text-align:center;">'
            f'<div style="font-size:0.75rem;color:#94a3b8;">Low scenario</div>'
            f'<div style="font-size:1.5rem;font-weight:700;color:#667eea;">${r_low:,.0f}</div>'
            f'<div style="font-size:0.7rem;color:#94a3b8;">Uplift {sc["low"]["conversionUpliftRate"]*100:.1f}%</div></div>',
            unsafe_allow_html=True,
        )
    with er2:
        st.markdown(
            f'<div class="css-card" style="padding:1rem;text-align:center;">'
            f'<div style="font-size:0.75rem;color:#94a3b8;">Base scenario</div>'
            f'<div style="font-size:1.5rem;font-weight:700;color:#667eea;">${r_base:,.0f}</div>'
            f'<div style="font-size:0.7rem;color:#94a3b8;">Uplift {sc["base"]["conversionUpliftRate"]*100:.1f}% (standard)</div></div>',
            unsafe_allow_html=True,
        )
    with er3:
        st.markdown(
            f'<div class="css-card" style="padding:1rem;text-align:center;">'
            f'<div style="font-size:0.75rem;color:#94a3b8;">High scenario</div>'
            f'<div style="font-size:1.5rem;font-weight:700;color:#667eea;">${r_high:,.0f}</div>'
            f'<div style="font-size:0.7rem;color:#94a3b8;">Uplift {sc["high"]["conversionUpliftRate"]*100:.1f}%</div></div>',
            unsafe_allow_html=True,
        )

    with st.expander("Revenue estimate — methodology & assumptions", expanded=False):
        st.markdown(revenue_est.get("methodology", ""))
        for a in revenue_est.get("assumptions", []):
            st.markdown(f"- {a}")
        st.markdown(f"*{revenue_est.get('disclaimer', '')}*")

    def layer_block(title, layer):
        pr = layer.get("priority", "medium")
        pr_color = "#ef4444" if pr == "high" else "#f59e0b" if pr == "medium" else "#64748b"
        comp = layer.get("composite") or {}
        t_esc = html_escape.escape(str(title))
        summ_esc = html_escape.escape(str(layer.get("layerSummary", "")))
        imp_esc = html_escape.escape(str(comp.get("impact", "")))
        st.markdown(
            f'<div class="css-card" style="padding:1rem;margin-bottom:0.75rem;">'
            f'<div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">'
            f'<strong style="color:white;">{t_esc}</strong>'
            f'<span style="font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:4px;background:{pr_color}22;color:{pr_color};text-transform:uppercase;">{pr} priority</span></div>'
            f'<p style="color:#cbd5e1;font-size:0.85rem;margin:0.5rem 0;">{summ_esc}</p>'
            f'<p style="color:#94a3b8;font-size:0.8rem;">Current <strong style="color:#fff;">{comp.get("current", "—")}</strong> → Proposed <strong style="color:#667eea;">{comp.get("proposed", "—")}</strong></p>'
            f'<p style="color:#cbd5e1;font-size:0.8rem;">{imp_esc}</p></div>',
            unsafe_allow_html=True,
        )
        sigs = layer.get("highPrioritySignals") or []
        if sigs:
            st.markdown("**High-priority signals**")
            for s in sigs:
                st.markdown(f"- {html_escape.escape(str(s))}")
        if is_paid:
            st.markdown("**Sub-scores (current → proposed)**")
            for k, v in (layer.get("subscores") or {}).items():
                if isinstance(v, dict):
                    st.markdown(
                        f"- **{k}**: {v.get('current')} → {v.get('proposed')} — {v.get('impact', '')}"
                    )
        else:
            st.caption("Unlock full report for sub-score breakdown.")

    lc1, lc2, lc3 = st.columns(3)
    with lc1:
        layer_block("First impression score", fi)
    with lc2:
        layer_block("Trust gap index", tg)
    with lc3:
        layer_block("Messaging clarity score", mc)


def render_main_audit_dashboard(roast_data):
    """
    Render the main audit dashboard (existing functionality).
    """
    # CRITICAL FIX: Initialize categories at the very top to prevent UnboundLocalError
    categories = []
    
    # Initialize freemium state
    if 'is_paid' not in st.session_state:
        st.session_state['is_paid'] = False
    
    # DASHBOARD GRID LAYOUT
    
    # Top Row: Full-width card with Verdict/Score
    with st.container():
        st.markdown('<div class="css-card" style="margin-bottom: 0.5rem; padding-bottom: 0.5rem;">', unsafe_allow_html=True)
        col_top1, col_top2, col_top3 = st.columns([1, 1, 1])
        with col_top1:
            score = roast_data.get("overall_score", 50)
            st.metric("Overall Site Score", f"{score}/100")
        with col_top2:
            # Visual Traffic Light based on score
            if score < 50:
                st.error("Verdict: CRITICAL CONDITION")
            elif score < 80:
                st.warning("Verdict: NEEDS OPTIMIZATION")
            else:
                st.success("Verdict: EXCELLENT")
        with col_top3:
            # Dual-button setup: PDF Download + HTML View
            try:
                overall_score = roast_data.get("overall_score", 50)
                site_url = st.session_state.get("audit_url", st.session_state.get("site_url", None))
                
                # Create two columns for buttons
                col_pdf, col_html = st.columns(2)
                
                with col_pdf:
                    # PDF Download
                    try:
                        pdf_bytes = generate_pdf_report(
                            roast_data,
                            site_url=site_url,
                            radar_chart_path=st.session_state.get("radar_chart_path"),
                            stitched_heatmap_path=st.session_state.get("stitched_heatmap_path")
                        )
                        if pdf_bytes and len(pdf_bytes) > 100:
                            st.download_button(
                                "📄 Download PDF",
                                pdf_bytes,
                                f"audit_{int(time.time())}.pdf",
                                "application/pdf",
                                use_container_width=True
                            )
                        else:
                            st.error("PDF generation failed")
                    except Exception as e:
                        st.error(f"PDF Error: {safe_error_message(str(e))}")
                
                with col_html:
                    # HTML View in Browser - Use components.html for reliable JavaScript execution
                    html_report = generate_html_report(
                        roast_data, 
                        overall_score, 
                        screenshot_path=st.session_state.get("screenshot_path"),
                        radar_chart_path=st.session_state.get("radar_chart_path"),
                        stitched_heatmap_path=st.session_state.get("stitched_heatmap_path"),
                        site_url=site_url
                    )
                    if html_report and len(html_report) > 100:
                        try:
                            import streamlit.components.v1 as components
                            
                            # Encode HTML to base64 for embedding
                            html_b64 = base64.b64encode(html_report.encode('utf-8')).decode('utf-8')
                            
                            # Create button with JavaScript that opens blob URL
                            button_html = f"""
                            <div style="width: 100%;">
                                <button id="viewReportBtn" 
                                        onclick="openReport()"
                                        style="width:100%;padding:10px;background:#ff4b4b;color:white;border:none;border-radius:5px;font-weight:bold;cursor:pointer;">
                                    📥 Download the Report
                                </button>
                                <script>
                                function openReport() {{
                                    try {{
                                        const htmlB64 = '{html_b64}';
                                        const htmlContent = atob(htmlB64);
                                        const blob = new Blob([htmlContent], {{ type: 'text/html;charset=utf-8' }});
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                    }} catch (e) {{
                                        console.error('Error opening report:', e);
                                        // Fallback to data URI
                                        window.open('data:text/html;base64,{html_b64}', '_blank');
                                    }}
                                }}
                                </script>
                            </div>
                            """
                            components.html(button_html, height=50)
                        except ImportError:
                            # Fallback: Use direct anchor tag with data URI
                            html_b64 = base64.b64encode(html_report.encode('utf-8')).decode('utf-8')
                            html_link = f"""
                            <a href="data:text/html;base64,{html_b64}" target="_blank" 
                               style="display:inline-block;width:100%;padding:10px;background:#ff4b4b;color:white;border:none;border-radius:5px;font-weight:bold;cursor:pointer;text-align:center;text-decoration:none;">
                               🌏 View in Browser
                            </a>
                            """
                            st.markdown(html_link, unsafe_allow_html=True)
                    else:
                        st.error("HTML generation failed")
            except Exception as e:
                error_msg = safe_error_message(e)
                st.error(f"Error generating report: {error_msg}")
        st.markdown('</div>', unsafe_allow_html=True)
    
    # 3x2 Grid: Shocker Metrics (above Performance Radar and Executive Summary)
    # Get scan data for calculations
    scan_data = st.session_state.get("roi_dashboard_data", {})
    page_height = scan_data.get('page_height', 3000)
    default_price = scan_data.get('price_guess', 50.0)
    default_industry = scan_data.get('industry_guess', 'SaaS')
    default_traffic = st.session_state.get("roi_traffic", 1000)
    price = st.session_state.get("roi_price", default_price)
    traffic = st.session_state.get("roi_traffic", default_traffic)
    industry = st.session_state.get("roi_industry", default_industry)
    
    lift = 0.02
    lost_revenue = (traffic * lift * price * 12)
    cost = 19
    roi_percent = (lost_revenue / cost * 100) if cost > 0 else 0

    render_executive_insight_layers(roast_data, traffic, price)
    
    # Row 1: Performance Radar, Cost of Inaction, Scroll of Death
    grid_row1_col1, grid_row1_col2, grid_row1_col3 = st.columns(3)
    
    with grid_row1_col1:
        st.markdown('<div class="css-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 240px; position: relative; padding-bottom: 2.5rem; margin-bottom: 0;">', unsafe_allow_html=True)
        st.markdown('<h3 style="text-align: center; margin-bottom: 0.5rem; font-size: 1rem;">📊 Performance Radar</h3>', unsafe_allow_html=True)
    
        # Build radar data - ALWAYS use these 6 standardized metrics
        radar_scores = roast_data.get("radar_scores", {})
        
        # If radar_scores not provided, calculate from sections or categories
        if not radar_scores:
            # Try to get from sections first (new structure)
            sections = roast_data.get("sections", [])
            if sections:
                radar_scores = calculate_radar_from_sections(sections)
            else:
                # Fallback to categories (legacy)
                categories = roast_data.get("categories", [])
                radar_scores = calculate_radar_from_categories(categories)
        
        # Ensure all 6 metrics are present (default to 50 if missing)
        required_metrics = ["UX", "Conversion", "Copy", "Visuals", "Trust", "Speed"]
        radar = {}
        for metric in required_metrics:
            radar[metric] = radar_scores.get(metric, 50)  # Default to 50 if missing
        
        if radar and len(radar) == 6:
            # Ensure correct order: UX, Conversion, Copy, Visuals, Trust, Speed
            ordered_radar = {
                "UX": radar.get("UX", 50),
                "Conversion": radar.get("Conversion", 50),
                "Copy": radar.get("Copy", 50),
                "Visuals": radar.get("Visuals", 50),
                "Trust": radar.get("Trust", 50),
                "Speed": radar.get("Speed", 50)
            }
            df = pd.DataFrame(dict(
                r=list(ordered_radar.values()),
                theta=list(ordered_radar.keys())
            ))
            fig = px.line_polar(df, r='r', theta='theta', line_close=True)
            fig.update_traces(
                fill='toself',
                line_color='#667eea',
                fillcolor='rgba(102, 126, 234, 0.3)'
            )
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, 100],
                        tickmode='linear',
                        tick0=0,
                        dtick=20,
                        tickfont=dict(size=10),
                        gridcolor='rgba(150, 150, 150, 0.5)',
                        showline=True,
                        linecolor='rgba(150, 150, 150, 0.5)',
                        gridwidth=1,
                        linewidth=1
                    ),
                    angularaxis=dict(
                        showline=True,
                        linecolor='rgba(150, 150, 150, 0.3)',
                        gridcolor='rgba(150, 150, 150, 0.3)',
                        gridwidth=1,
                        linewidth=1
                    ),
                    bgcolor='rgba(0,0,0,0)'
                ),
                showlegend=False,
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                font=dict(family="Courier", size=12),
                height=250  # Reduced to match other grid items
            )
            st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})
            
            # Save radar chart as image for PDF (with transparent background)
            try:
                temp_dir = os.path.join(tempfile.gettempdir(), "siteroast_temp")
                os.makedirs(temp_dir, exist_ok=True)
                radar_chart_path = os.path.join(temp_dir, f"radar_{int(time.time())}.png")
                # Save with transparent background
                fig.write_image(radar_chart_path, width=400, height=400, scale=2, format='png')
                st.session_state.radar_chart_path = radar_chart_path
            except Exception as e:
                st.caption(f"Note: Chart export error: {str(e)[:30]}")
        else:
            st.info("No radar data")
        st.markdown('<p style="text-align: center; margin-top: 0.5rem; color: white; font-size: 0.85rem;">Overall performance across <span style="color: #667eea; font-weight: bold;">6 key metrics</span></p>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    with grid_row1_col2:
        st.markdown('<div class="css-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 240px; position: relative; padding-bottom: 2.5rem; margin-bottom: 0;">', unsafe_allow_html=True)
        st.markdown('<h3 style="text-align: center; margin-bottom: 0.5rem; font-size: 1rem; color: white;">💸 Cost of Inaction</h3>', unsafe_allow_html=True)
        st.markdown(f'<div style="font-size: 2.4rem; font-weight: 700; color: #667eea; margin: 0.5rem 0; text-align: center;">${lost_revenue:,.0f}</div>', unsafe_allow_html=True)
        st.markdown('<p style="text-align: center; margin-top: 0.5rem; color: white; font-size: 0.85rem;">Revenue you leave on the table <span style="color: #667eea; font-weight: bold;">annually</span></p>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    with grid_row1_col3:
        st.markdown('<div class="css-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 240px; position: relative; padding-bottom: 2.5rem; margin-bottom: 0;">', unsafe_allow_html=True)
        fold_height = 800
        below_fold = max(0, page_height - fold_height)
        below_fold_percent = (below_fold / page_height * 100) if page_height > 0 else 0
        st.markdown('<h3 style="text-align: center; margin-bottom: 0.5rem; font-size: 1rem;">📉 The Scroll of Death</h3>', unsafe_allow_html=True)
        st.markdown(f'<div style="font-size: 2.4rem; font-weight: 700; color: #667eea; margin: 0.5rem 0; text-align: center;">{page_height:,}px</div>', unsafe_allow_html=True)
        
        scroll_html = f"""
        <div style="position: relative; width: 100%; height: 200px; border: 2px solid #333; border-radius: 8px; margin: 1rem 0;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: {min(100, (fold_height / page_height * 100))}%; background: linear-gradient(180deg, #00ff00 0%, #00cc00 100%); border-radius: 8px 8px 0 0;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; font-size: 0.9rem;">Above Fold ({fold_height}px)</div>
            </div>
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: {max(0, (below_fold / page_height * 100))}%; background: linear-gradient(180deg, #ff0000 0%, #cc0000 100%); border-radius: 0 0 8px 8px;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold; font-size: 0.9rem;">Below Fold ({below_fold_percent:.0f}%)</div>
            </div>
            <div style="position: absolute; top: {min(100, (fold_height / page_height * 100))}%; left: 0; width: 100%; height: 2px; background: yellow; z-index: 10;"></div>
        </div>
        """
        st.markdown(scroll_html, unsafe_allow_html=True)
        st.markdown(f'<p style="text-align: center; margin-top: 0.5rem; color: white; font-size: 0.85rem;"><span style="color: #667eea; font-weight: bold;">{below_fold_percent:.0f}%</span> of users never see your bottom CTA</p>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Row 2: Competitor Gap, Industry Insider, ROI (minimal spacing)
    st.markdown('<div style="margin-top: 0.5rem;"></div>', unsafe_allow_html=True)
    grid_row2_col1, grid_row2_col2, grid_row2_col3 = st.columns(3)
    
    with grid_row2_col1:
        st.markdown('<div class="css-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 240px; position: relative; padding-bottom: 2.5rem; margin-bottom: 0;">', unsafe_allow_html=True)
        st.markdown('<h3 style="text-align: center; margin-bottom: 0.5rem; font-size: 1rem;">🥊 Competitor Gap</h3>', unsafe_allow_html=True)
        
        # Calculate competitor traffic as a multiple of user traffic based on industry
        industry_multipliers = {
            "SaaS": 2.5,
            "Agency": 3.0,
            "E-commerce": 2.0
        }
        multiplier = industry_multipliers.get(industry, 2.5)
        competitor_traffic = int(traffic * multiplier)
        
        # Ensure minimum competitor traffic for visual clarity
        if competitor_traffic < 1000:
            competitor_traffic = 1000
        
        chart_data = pd.DataFrame({
            'Source': ['You', 'Top Competitor'],
            'Monthly Visits': [traffic, competitor_traffic]
        })
        
        max_visits = max(traffic, competitor_traffic)
        y_max = int(max_visits * 1.40)  # 40% headroom
        
        fig = px.bar(chart_data, x='Source', y='Monthly Visits',
                     color='Source',
                     color_discrete_map={'You': '#888888', 'Top Competitor': '#ff0000'},
                     text='Monthly Visits',
                     labels={'Monthly Visits': '', 'Source': ''},
                     barmode='group')
        fig.update_traces(
            texttemplate='%{text:,}', 
            textposition='outside',
            width=0.5  # Reduce bar width to 50%
        )
        fig.update_layout(
            showlegend=False,
            height=180,
            yaxis=dict(range=[0, y_max]),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            margin=dict(l=20, r=20, t=5, b=5),  # Reduced margins
            bargap=0.3  # Average gap between bars
        )
        st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})
        st.markdown(f'<p style="text-align: center; margin-top: 0.5rem; color: white; font-size: 0.85rem;">Competitors get <span style="color: #667eea; font-weight: bold;">{multiplier:.1f}x</span> your traffic</p>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    with grid_row2_col2:
        st.markdown('<div class="css-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 240px; position: relative; padding-bottom: 2.5rem; margin-bottom: 0;">', unsafe_allow_html=True)
        st.markdown('<h3 style="text-align: center; margin-bottom: 0.5rem; font-size: 1rem;">🧠 Industry Insider</h3>', unsafe_allow_html=True)
        
        industry_facts = {
            'SaaS': [
                'SaaS pages with video convert 80% higher',
                'Top SaaS sites use social proof in hero section',
                'SaaS landing pages with clear pricing convert 2.5x better'
            ],
            'Agency': [
                'Agency sites with case studies convert 3x higher',
                'Top agencies showcase client logos above fold',
                'Agency pages with testimonials convert 60% better'
            ],
            'E-commerce': [
                'E-com sites with trust badges convert 40% more',
                'Product pages with reviews convert 2.8x better',
                'E-com sites with free shipping convert 30% more'
            ]
        }
        
        facts = industry_facts.get(industry, industry_facts['SaaS'])
        random_fact = random.choice(facts)
        
        st.info(f"💡 {random_fact}")
        st.markdown('<p style="text-align: center; margin-top: 0.5rem; color: white; font-size: 0.85rem;">You are missing <span style="color: #667eea; font-weight: bold;">critical elements</span> found on top sites</p>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    with grid_row2_col3:
        st.markdown('<div class="css-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 240px; position: relative; padding-bottom: 2.5rem; margin-bottom: 0;">', unsafe_allow_html=True)
        st.markdown('<h3 style="text-align: center; margin-bottom: 0.5rem; font-size: 1rem;">🚀 ROI</h3>', unsafe_allow_html=True)
        st.markdown(f'<div style="font-size: 2.4rem; font-weight: 700; color: #667eea; margin: 0.5rem 0; text-align: center;">{roi_percent:,.0f}%</div>', unsafe_allow_html=True)
        st.markdown(f'<p style="text-align: center; margin-top: 0.5rem; color: white; font-size: 0.85rem;">Spend <span style="color: #667eea; font-weight: bold;">${cost}</span> to recover <span style="color: #667eea; font-weight: bold;">${lost_revenue:,.0f}</span></p>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Price Detector below the grid (3 columns on same line)
    st.markdown('<div class="css-card">', unsafe_allow_html=True)
    st.subheader("⚙️ Price Detector")
    price_col1, price_col2, price_col3 = st.columns(3)
    
    with price_col1:
        new_price = st.number_input("Detected Price ($)", min_value=1.0, max_value=10000.0, 
                                    value=float(price), step=1.0, key="main_dashboard_price")
    with price_col2:
        new_traffic = st.number_input("Monthly Traffic", min_value=100, max_value=1000000, 
                                      value=int(traffic), step=100, key="main_dashboard_traffic")
    with price_col3:
        new_industry = st.selectbox("Industry", ["SaaS", "Agency", "E-commerce"], 
                                   index=["SaaS", "Agency", "E-commerce"].index(industry) if industry in ["SaaS", "Agency", "E-commerce"] else 0,
                                   key="main_dashboard_industry")
    
    if new_price != price or new_traffic != traffic or new_industry != industry:
        st.session_state.roi_price = new_price
        st.session_state.roi_traffic = new_traffic
        st.session_state.roi_industry = new_industry
        st.rerun()
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Middle Row: Executive Summary (Full Width)
    st.markdown('<div class="css-card">', unsafe_allow_html=True)
    st.subheader("🔥 Executive Summary")
    
    # Show roast_summary (check multiple possible fields)
    roast_summary = (
        roast_data.get("roastSummary") or 
        roast_data.get("roast_summary") or 
        roast_data.get("overview", {}).get("executiveSummary") or 
        roast_data.get("headline_roast") or 
        "Analysis completed"
    )
    if roast_summary and roast_summary.strip():
        st.markdown(roast_summary)
    else:
        st.warning("Executive summary is being generated...")
    
    # Show roast analysis if available
    roast_analysis = roast_data.get("overview", {}).get("roastAnalysis")
    if roast_analysis and roast_analysis.strip():
        st.markdown(f'**Analysis:**\n\n{roast_analysis}')
    
    # Show summary bullets
    summary_bullets = roast_data.get("summary_bullets", [])
    if summary_bullets:
        st.markdown("**Key Findings:**")
        for bullet in summary_bullets[:5]:
            if "✅" in bullet:
                st.success(bullet)
            elif "❌" in bullet:
                st.error(bullet)
            else:
                st.info(bullet)
    
    # Show heatmap of ONLY the first screenshot (Hero section)
    st.markdown("**Visual Saliency - First Impression**")
    if "captured_images" in st.session_state and st.session_state.captured_images:
        try:
            hero_image = st.session_state.captured_images[0]
            hero_heatmap = generate_heatmap(hero_image)
            
            # Save heatmap to temp directory for PDF (use tempfile for cloud compatibility)
            temp_dir = os.path.join(tempfile.gettempdir(), "siteroast_temp")
            os.makedirs(temp_dir, exist_ok=True)
            heatmap_path = os.path.join(temp_dir, f"heatmap_{int(time.time())}.png")
            hero_heatmap.save(heatmap_path)
            st.session_state.heatmap_path = heatmap_path
            
            # Create stitched heatmap for PDF (if multiple images)
            if len(st.session_state.captured_images) > 1:
                try:
                    heatmap_images = [generate_heatmap(img) for img in st.session_state.captured_images[:3]]
                    stitched_heatmap = stitch_images(heatmap_images, max_images=3)
                    if stitched_heatmap:
                        stitched_heatmap_path = os.path.join(temp_dir, f"stitched_heatmap_{int(time.time())}.png")
                        stitched_heatmap.save(stitched_heatmap_path)
                        st.session_state.stitched_heatmap_path = stitched_heatmap_path
                except Exception as stitch_error:
                    safe_print(f"[WARNING] Stitched heatmap failed: {safe_error_message(str(stitch_error))}")
                    st.session_state.stitched_heatmap_path = heatmap_path  # Fallback to single heatmap
            else:
                st.session_state.stitched_heatmap_path = heatmap_path
            
            st.image(hero_heatmap, caption="Hero Section Heatmap", use_container_width=True)
        except Exception as e:
            safe_print(f"[ERROR] Heatmap generation failed: {safe_error_message(str(e))}")
            st.warning("Heatmap generation failed. Showing original screenshot.")
            st.image(hero_image, caption="Hero Section (Heatmap unavailable)", use_container_width=True)
    elif "uploaded_files" in st.session_state and st.session_state.uploaded_files:
        try:
            first_file = st.session_state.uploaded_files[0]
            hero_image = Image.open(first_file)
            hero_heatmap = generate_heatmap(hero_image)
            
            # Save heatmap for PDF (use tempfile for cloud compatibility)
            temp_dir = os.path.join(tempfile.gettempdir(), "siteroast_temp")
            os.makedirs(temp_dir, exist_ok=True)
            heatmap_path = os.path.join(temp_dir, f"heatmap_{int(time.time())}.png")
            hero_heatmap.save(heatmap_path)
            st.session_state.heatmap_path = heatmap_path
            st.session_state.stitched_heatmap_path = heatmap_path
            
            st.image(hero_heatmap, caption="Hero Section Heatmap", use_container_width=True)
        except Exception as e:
            safe_print(f"[ERROR] Heatmap generation failed: {safe_error_message(str(e))}")
            st.warning("Heatmap generation failed. Showing original screenshot.")
            st.image(hero_image, caption="Hero Section (Heatmap unavailable)", use_container_width=True)
    else:
        st.info("No screenshot available")
    st.markdown('</div>', unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Quick Wins Section
    quick_wins = roast_data.get("quick_wins", [])
    if quick_wins:
        st.markdown("---")
        st.subheader("🚀 Quick Wins (Ranked by Impact)")
        for i, win in enumerate(quick_wins[:3], 1):
            with st.expander(f"**{i}. {win.get('title', 'Quick Win')}** - {win.get('effort', 'N/A')} | {win.get('lift', 'N/A')}"):
                st.markdown(f"**Problem:** {win.get('problem', 'N/A')}")
                st.markdown(f"**Fix:** {win.get('fix', 'N/A')}")
                if win.get('example'):
                    st.code(win.get('example'), language='html')
    
    # Audit Items Section
    audit_items = roast_data.get("audit_items", [])
    if audit_items:
        st.markdown("---")
        st.subheader("📋 Element-by-Element Audit")
        for item in audit_items[:6]:
            status = item.get("status", "Unknown")
            status_color = {
                "Excellent": "🟢",
                "Good": "🟡",
                "Satisfactory": "🟠",
                "Needs Improvement": "🔴",
                "Failed": "❌"
            }.get(status, "⚪")
            
            with st.expander(f"{status_color} **{item.get('element', 'Element')}** - {status}"):
                st.markdown(f"**Rationale:** {item.get('rationale', 'N/A')}")
                
                col_work1, col_work2 = st.columns(2)
                with col_work1:
                    st.markdown("**✅ What's Working:**")
                    for working_item in item.get("working", []):
                        st.success(f"• {working_item}")
                
                with col_work2:
                    st.markdown("**❌ What's Not Working:**")
                    for not_working_item in item.get("not_working", []):
                        st.error(f"• {not_working_item}")
                
                if item.get("fix"):
                    st.markdown("**🔧 Fix:**")
                    st.code(item.get("fix"), language='html')
                    if item.get("expected_impact"):
                        st.info(f"**Expected Impact:** {item.get('expected_impact')}")
    
    # Bottom Row: Deep Dive Tabs (Freemium Lock)
    st.markdown("---")
    
    if st.session_state['is_paid']:
        st.subheader("🔍 Deep Dive Findings")
        
        # Use detailedAudit instead of categories (detailedAudit is the new structure)
        detailed_audit = roast_data.get("detailedAudit", {})
        
        # Convert detailedAudit to categories format for display
        # Note: categories is already initialized at function start, so we can append to it
        if detailed_audit:
            category_names = {
                "ux": "UX & Layout",
                "conversion": "Conversion & Funnel",
                "copy": "Copy & Messaging",
                "visuals": "Visuals & Brand",
                "trust": "Trust & Credibility",
                "speed": "Speed & Technical Health"
            }
            
            for cat_key, items in detailed_audit.items():
                if items:  # Only add categories that have items
                    cat_name = category_names.get(cat_key.lower(), cat_key.capitalize())
                # Calculate score for this category
                status_points = {"Excellent": 95, "Good": 80, "Satisfactory": 60, "Needs Improvement": 35, "Failed": 5}
                scores = [status_points.get(item.get("status", "Satisfactory"), 60) for item in items]
                avg_score = round(sum(scores) / len(scores)) if scores else 50
                
                # Build what_works and what_failed from items
                what_works_items = [item for item in items if item.get("status") in ["Excellent", "Good"]]
                what_failed_items = [item for item in items if item.get("status") in ["Failed", "Needs Improvement"]]
                
                what_works = "; ".join([item.get("elementName", "") for item in what_works_items[:3]]) if what_works_items else ""
                what_failed = "; ".join([item.get("elementName", "") for item in what_failed_items[:3]]) if what_failed_items else ""
                
                # Build fix_steps from items
                fix_steps = []
                for item in what_failed_items[:3]:
                    fix = item.get("fix", {})
                    if isinstance(fix, dict):
                        quick_fix = fix.get("quickFix", "")
                        if quick_fix:
                            fix_steps.append(f"{item.get('elementName', 'Item')}: {quick_fix}")
                    elif fix:
                        fix_steps.append(f"{item.get('elementName', 'Item')}: {str(fix)}")
                
                categories.append({
                    "name": cat_name,
                    "score": avg_score,
                    "verdict": "Needs Improvement" if avg_score < 60 else "Good" if avg_score < 80 else "Excellent",
                    "impact": "High" if what_failed_items else "Medium",
                    "what_works": what_works,
                    "what_failed": what_failed,
                    "fix_steps": fix_steps
                })
    
    # Fallback to legacy categories if detailedAudit is empty
    if not categories:
        categories = roast_data.get("categories", [])
    
    if categories:
        # Map category names to emoji icons
        emoji_map = {
            "UX": "🎯",
            "Conversion": "💰",
            "Copy": "✍️",
            "Visuals": "🎨",
            "Legal": "⚖️",
            "Speed": "⚡"
        }
        cat_names = []
        for cat in categories:
            cat_name = cat.get('name', '')
            # Find matching emoji
            emoji = "📋"  # Default
            for key, emoji_icon in emoji_map.items():
                if key in cat_name:
                    emoji = emoji_icon
                    break
            cat_names.append(f"{emoji} {cat_name}")
        
        tabs = st.tabs(cat_names)
        
        for i, tab in enumerate(tabs):
            cat = categories[i]
            with tab:
                # Impact Badge
                impact = cat.get("impact", "Unknown")
                if impact == "High":
                    st.error(f"Impact: {impact} - Priority Fix!")
                else:
                    st.warning(f"Impact: {impact}")
                
                score = cat.get("score", 0)
                verdict = cat.get("verdict", "Unknown")
                st.write(f"**Score:** {score}/100 | **Verdict:** {verdict}")
                
                # Display what_works, what_failed, fix_steps
                what_works = cat.get("what_works", "")
                what_failed = cat.get("what_failed", "")
                fix_steps = cat.get("fix_steps", [])
                verdict = cat.get("verdict", "Unknown")
                
                if what_works:
                    st.success(f"**✅ What Works:**\n\n{what_works}")
                
                if what_failed:
                    st.error(f"**[X] What Failed:**\n\n{what_failed}")
                
                if fix_steps:
                    st.markdown("**🔧 Fix Steps:**")
                    for step in fix_steps:
                        st.info(step)
                
                if not what_works and not what_failed and not fix_steps:
                    st.info("No specific findings for this category.")
        else:
            st.info("No category data available. The AI may not have returned structured findings.")
    else:
        st.divider()
        st.info("🔒 The detailed Deep Dive and PDF Report are locked.")
        if st.button("Unlock Full Audit (Simulate Payment)"):
            st.session_state['is_paid'] = True
            st.rerun()

if __name__ == "__main__":
    main()
