#!/bin/bash
# Generate HTML report from ZAP JSON alerts

INPUT_FILE=${1:-zap-alerts.json}
OUTPUT_FILE=${2:-zap-report.html}

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: $INPUT_FILE not found"
    exit 1
fi

# Count by severity
HIGH_COUNT=$(cat $INPUT_FILE | grep -o '"risk":"High"' | wc -l)
MEDIUM_COUNT=$(cat $INPUT_FILE | grep -o '"risk":"Medium"' | wc -l)
LOW_COUNT=$(cat $INPUT_FILE | grep -o '"risk":"Low"' | wc -l)
INFO_COUNT=$(cat $INPUT_FILE | grep -o '"risk":"Informational"' | wc -l)

# Create HTML report
cat > $OUTPUT_FILE << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>OWASP ZAP Security Report - Docker Orchestrator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 5px solid; }
        .stat-card.high { border-left-color: #e53e3e; }
        .stat-card.medium { border-left-color: #ed8936; }
        .stat-card.low { border-left-color: #ecc94b; }
        .stat-card.info { border-left-color: #4299e1; }
        .stat-card h3 { color: #666; font-size: 0.9em; text-transform: uppercase; margin-bottom: 10px; }
        .count { font-size: 3em; font-weight: bold; color: #1a202c; }
        .alert { background: white; padding: 25px; margin: 20px 0; border-radius: 10px; border-left: 5px solid; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .alert.high { border-left-color: #e53e3e; }
        .alert.medium { border-left-color: #ed8936; }
        .alert.low { border-left-color: #ecc94b; }
        .alert.informational { border-left-color: #4299e1; }
        .alert-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .alert-title { font-size: 1.3em; font-weight: bold; color: #1a202c; }
        .badge { padding: 6px 12px; border-radius: 20px; font-size: 0.75em; font-weight: bold; text-transform: uppercase; }
        .badge.high { background: #fed7d7; color: #c53030; }
        .badge.medium { background: #feebc8; color: #c05621; }
        .badge.low { background: #fefcbf; color: #975a16; }
        .badge.informational { background: #bee3f8; color: #2c5282; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; color: #2d3748; margin-bottom: 5px; }
        .section-content { color: #4a5568; line-height: 1.6; }
        .url { background: #edf2f7; padding: 8px 12px; border-radius: 5px; font-family: monospace; font-size: 0.9em; word-break: break-all; }
        .no-findings { text-align: center; padding: 60px; background: white; border-radius: 10px; }
        .no-findings h2 { color: #38a169; font-size: 2em; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 OWASP ZAP Security Report</h1>
            <p style="font-size: 1.1em; opacity: 0.9;">Docker Orchestrator Application</p>
            <p style="opacity: 0.8;">REPORT_DATE</p>
        </div>
        
        <div class="summary">
            <div class="stat-card high">
                <h3>High Risk</h3>
                <div class="count">HIGH_COUNT</div>
            </div>
            <div class="stat-card medium">
                <h3>Medium Risk</h3>
                <div class="count">MEDIUM_COUNT</div>
            </div>
            <div class="stat-card low">
                <h3>Low Risk</h3>
                <div class="count">LOW_COUNT</div>
            </div>
            <div class="stat-card info">
                <h3>Informational</h3>
                <div class="count">INFO_COUNT</div>
            </div>
        </div>
        
        <div id="alerts-container"></div>
        
    </div>
    
    <script>
        const alertsData = ALERTS_DATA_PLACEHOLDER;
        const container = document.getElementById('alerts-container');
        
        if (!alertsData || alertsData.length === 0) {
            container.innerHTML = '<div class="no-findings"><h2>✅ No Security Issues Found!</h2><p>All security checks passed successfully.</p></div>';
        } else {
            alertsData.forEach(alert => {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert ' + alert.risk.toLowerCase();
                alertDiv.innerHTML = `
                    <div class="alert-header">
                        <div class="alert-title">${alert.alert}</div>
                        <span class="badge ${alert.risk.toLowerCase()}">${alert.risk}</span>
                    </div>
                    <div class="section">
                        <div class="section-title">Description:</div>
                        <div class="section-content">${alert.description}</div>
                    </div>
                    <div class="section">
                        <div class="section-title">URL:</div>
                        <div class="url">${alert.url}</div>
                    </div>
                    <div class="section">
                        <div class="section-title">Solution:</div>
                        <div class="section-content">${alert.solution}</div>
                    </div>
                `;
                container.appendChild(alertDiv);
            });
        }
    </script>
</body>
</html>
HTMLEOF

# Replace placeholders
sed -i "s/REPORT_DATE/$(date)/g" $OUTPUT_FILE
sed -i "s/HIGH_COUNT/$HIGH_COUNT/g" $OUTPUT_FILE
sed -i "s/MEDIUM_COUNT/$MEDIUM_COUNT/g" $OUTPUT_FILE
sed -i "s/LOW_COUNT/$LOW_COUNT/g" $OUTPUT_FILE
sed -i "s/INFO_COUNT/$INFO_COUNT/g" $OUTPUT_FILE

# Insert alerts JSON data
ALERTS_JSON=$(cat $INPUT_FILE | jq -c '.alerts' | sed 's/"/\\"/g')
sed -i "s|ALERTS_DATA_PLACEHOLDER|$ALERTS_JSON|g" $OUTPUT_FILE

echo "✅ HTML report generated: $OUTPUT_FILE"
echo ""
echo "Summary:"
echo "  High: $HIGH_COUNT"
echo "  Medium: $MEDIUM_COUNT"
echo "  Low: $LOW_COUNT"
echo "  Info: $INFO_COUNT"

