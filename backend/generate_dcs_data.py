import psycopg2
import random
import math
from datetime import datetime, timedelta

# Database connection
conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    user='postgres',
    password='sekert1!',
    database='webapp_db'
)
cur = conn.cursor()

# Get all signals
cur.execute("SELECT id, signal_name FROM dcs_signals")
signals = cur.fetchall()

# Time range: last 10 minutes
end_time = datetime.now()
start_time = end_time - timedelta(minutes=10)

print(f"Generating data from {start_time} to {end_time}")

total_points = 0

for signal_id, signal_name in signals:
    # Define base value and amplitude based on signal
    if 'Active Power' in signal_name:
        base, amp = 50, 30
    elif 'Reactive Power' in signal_name:
        base, amp = 20, 15
    elif 'Terminal Voltage' in signal_name:
        base, amp = 11, 0.5
    elif 'Stator Current' in signal_name:
        base, amp = 3000, 500
    elif 'Frequency' in signal_name:
        base, amp = 50, 0.2
    elif 'Bearing Temperature' in signal_name:
        base, amp = 65, 10
    elif 'Winding Temperature' in signal_name:
        base, amp = 85, 15
    elif 'Vibration' in signal_name:
        base, amp = 2.5, 1.5
    elif 'Transformer Load' in signal_name:
        base, amp = 40, 20
    elif 'Top Oil Temperature' in signal_name:
        base, amp = 75, 15
    else:
        base, amp = 50, 25
    
    # Generate 1 Hz data
    current_time = start_time
    points = []
    
    while current_time <= end_time:
        # Sine wave pattern
        seconds = (current_time - start_time).total_seconds()
        val = base + amp * math.sin(seconds / 600 * math.pi)
        
        # Add random noise
        val += random.uniform(-amp * 0.05, amp * 0.05)
        
        points.append((signal_id, current_time, val))
        current_time += timedelta(seconds=1)
    
    # Insert in batches
    cur.executemany(
        "INSERT INTO dcs_data (dcs_signal_id, timestamp, value) VALUES (%s, %s, %s)",
        points
    )
    total_points += len(points)
    print(f"Generated {len(points)} points for {signal_name}")

conn.commit()
print(f"\n✅ Total {total_points} data points generated!")
cur.close()
conn.close()
