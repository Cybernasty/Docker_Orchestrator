#!/usr/bin/env python3
"""
OWASP ZAP Report Parser
Converts ZAP baseline scan output to a formatted HTML report
"""

import sys
import re
from datetime import datetime

def parse_zap_output(input_file):
    """Parse ZAP baseline scan output and extract findings"""
    
    findings = {
        'FAIL-NEW': [],
        'WARN-NEW': [],
        'PASS': [],
        'INFO': []
    }
    
    with open(input_file, 'r') as f:
        for line in f:
            line = line.strip()
            if 'FAIL-NEW' in line:
                findings['FAIL-NEW'].append(line)
            elif 'WARN-NEW' in line:
                findings['WARN-NEW'].append(line)
            elif 'PASS' in line and not line.startswith('Total'):
                findings['PASS'].append(line)
            elif 'INFO' in line:
                findings['INFO'].append(line)
    
    return findings

def severity_from_code(code):
    """Map ZAP codes to severity levels"""
    severity_map = {
        '0': 'Critical',
        '1': 'High', 
        '2': 'Medium',
        '3': 'Low'
    }
    return severity_map.get(code, 'Unknown')

def generate_html_report(findings, target_url, output_file):
    """Generate HTML report from findings"""
    
    # Count by severity
    counts = {
        'Critical': 0,
        'High': 0,
        'Medium': 0,
        'Low': 0,
        'Warnings': len(findings['WARN-NEW']),
        'Passed': len(findings['PASS'])
    }
    
    # Parse FAIL-NEW items for severity
    for item in findings['FAIL-NEW']:
        match = re.search(r'FAIL-NEW: (\d)', item)
        if match:
            severity = severity_from_code(match.group(1))
            counts[severity] = counts.get(severity, 0) + 1
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OWASP ZAP Security Report - Docker Orchestrator</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        .header p {{
            opacity: 0.9;
            font-size: 1.1em;
        }}
        .content {{
            padding: 40px;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}
        .stat-card {{
            text-align: center;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }}
        .stat-card:hover {{
            transform: translateY(-5px);
        }}
        .stat-card.critical {{ background: linear-gradient(135deg, #fc8181 0%, #f56565 100%); color: white; }}
        .stat-card.high {{ background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%); color: white; }}
        .stat-card.medium {{ background: linear-gradient(135deg, #f6e05e 0%, #ecc94b 100%); color: #744210; }}
        .stat-card.low {{ background: linear-gradient(135deg, #68d391 0%, #48bb78 100%); color: white; }}
        .stat-card.info {{ background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%); color: white; }}
        .stat-card.pass {{ background: linear-gradient(135deg, #68d391 0%, #38a169 100%); color: white; }}
        .stat-card h3 {{
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            opacity: 0.9;
        }}
        .stat-card .count {{
            font-size: 3em;
            font-weight: bold;
        }}
        .section {{
            margin: 40px 0;
        }}
        .section-title {{
            font-size: 1.8em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }}
        .finding {{
            background: #f7fafc;
            padding: 20px;
            margin: 15px 0;
            border-left: 5px solid;
            border-radius: 5px;
        }}
        .finding.critical {{ border-left-color: #f56565; }}
        .finding.high {{ border-left-color: #ed8936; }}
        .finding.medium {{ border-left-color: #ecc94b; }}
        .finding.low {{ border-left-color: #48bb78; }}
        .finding.warn {{ border-left-color: #f6ad55; }}
        .finding-title {{
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        .no-findings {{
            text-align: center;
            padding: 60px;
            background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
            border-radius: 10px;
        }}
        .no-findings h2 {{
            color: #22543d;
            font-size: 2em;
            margin-bottom: 10px;
        }}
        .no-findings p {{
            color: #276749;
            font-size: 1.2em;
        }}
        .footer-section {{
            text-align: center;
            padding: 40px;
            background: #f7fafc;
            color: #718096;
        }}
        code {{
            background: #2d3748;
            color: #68d391;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 OWASP ZAP Security Report</h1>
            <p>Docker Orchestrator Application - Security Assessment</p>
            <p><code>{target_url}</code></p>
            <p>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="stat-card critical">
                    <h3>Critical</h3>
                    <div class="count">{counts['Critical']}</div>
                </div>
                <div class="stat-card high">
                    <h3>High</h3>
                    <div class="count">{counts['High']}</div>
                </div>
                <div class="stat-card medium">
                    <h3>Medium</h3>
                    <div class="count">{counts['Medium']}</div>
                </div>
                <div class="stat-card low">
                    <h3>Low</h3>
                    <div class="count">{counts['Low']}</div>
                </div>
                <div class="stat-card info">
                    <h3>Warnings</h3>
                    <div class="count">{counts['Warnings']}</div>
                </div>
                <div class="stat-card pass">
                    <h3>Passed</h3>
                    <div class="count">{counts['Passed']}</div>
                </div>
            </div>
"""

    # Add findings sections
    if not findings['FAIL-NEW'] and not findings['WARN-NEW']:
        html += """
            <div class="no-findings">
                <h2>✅ No Security Issues Found!</h2>
                <p>All security checks passed successfully.</p>
            </div>
"""
    else:
        if findings['FAIL-NEW']:
            html += f"""
            <div class="section">
                <h2 class="section-title">🚨 Security Issues ({len(findings['FAIL-NEW'])})</h2>
"""
            for item in findings['FAIL-NEW']:
                severity_match = re.search(r'FAIL-NEW: (\d)', item)
                severity = severity_from_code(severity_match.group(1)) if severity_match else 'Unknown'
                html += f"""
                <div class="finding {severity.lower()}">
                    <div class="finding-title">{item}</div>
                </div>
"""
            html += """
            </div>
"""

        if findings['WARN-NEW']:
            html += f"""
            <div class="section">
                <h2 class="section-title">⚠️ Warnings ({len(findings['WARN-NEW'])})</h2>
"""
            for item in findings['WARN-NEW']:
                html += f"""
                <div class="finding warn">
                    <div class="finding-title">{item}</div>
                </div>
"""
            html += """
            </div>
"""

    html += f"""
        </div>
        
        <div class="footer-section">
            <p><strong>Generated by OWASP ZAP Baseline Scanner</strong></p>
            <p>Part of Docker Orchestrator DevSecOps Pipeline</p>
            <p>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>
</body>
</html>
"""

    # Write HTML report
    with open(output_file, 'w') as f:
        f.write(html)
    
    return counts

if __name__ == "__main__":
    input_file = sys.argv[1] if len(sys.argv) > 1 else "zap-scan-output.txt"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "zap-report.html"
    
    print(f"Parsing {input_file}...")
    findings = parse_zap_output(input_file)
    
    print(f"Generating {output_file}...")
    counts = generate_html_report(findings, "http://orchestrator", output_file)
    
    print(f"\n✅ Report generated: {output_file}")
    print(f"\nSummary:")
    for severity, count in counts.items():
        print(f"  {severity}: {count}")

