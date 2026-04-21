from flask import Flask, jsonify, request
from threading import Thread
import cheat_detection  # Import the detection module

app = Flask(__name__)
detection_running = False

# === Flask Routes ===
@app.route("/")
def home():
    return "Cheating Detection API is running."

@app.route("/start-detection", methods=["GET"])
def start_detection():
    global detection_running
    if not detection_running:
        detection_running = True
        Thread(target=cheat_detection.run_detection).start()  # Start detection in a new thread
        return jsonify({"status": "Cheating detection started"}), 200
    else:
        return jsonify({"status": "Detection already running"}), 400

@app.route("/cheating-detected", methods=["POST"])
def cheating_detected():
    data = request.get_json()
    warning_count = data.get('warning_count', 0)

    if warning_count == 3:
        return jsonify({
            "status": "Cheating detected",
            "message": "Session terminated due to 3 warnings."
        }), 200
    elif warning_count < 3:
        return jsonify({
            "status": "Warning issued",
            "warning_count": warning_count,
            "message": f"Warning {warning_count}/3"
        }), 200
    else:
        return jsonify({
            "status": "Invalid warning count",
            "warning_count": warning_count,
            "message": "The warning count exceeds the limit."
        }), 400

# === App Runner ===
if __name__ == "__main__":
    app.run(debug=True, port=7000)


# http://localhost:7000/start-detection to start 

# http://localhost:7000/cheating-detected to check the cheating count make post req
