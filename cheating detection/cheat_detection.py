import cv2
import mediapipe as mp
import time
import requests  # To send the API request

# === MediaPipe Initialization ===
mp_face_detection = mp.solutions.face_detection
mp_face_mesh = mp.solutions.face_mesh

# === Landmark Constants ===
LEFT_EYE = [33, 133]
RIGHT_EYE = [362, 263]
LEFT_IRIS = [474]
RIGHT_IRIS = [469]

# === Eye Position Helper Function ===
def eye_position_ratio(eye_corner1, eye_corner2, iris_center):
    eye_width = eye_corner2[0] - eye_corner1[0]
    iris_pos = iris_center[0] - eye_corner1[0]
    return iris_pos / eye_width if eye_width != 0 else 0.5

# === Send warning to Flask API ===
def send_warning_to_api(warning_count):
    url = "http://localhost:7000/cheating-detected"
    data = {"warning_count": warning_count}
    try:
        response = requests.post(url, json=data)
        print(f"Warning sent to API: {response.status_code}")
    except Exception as e:
        print(f"Error sending warning to API: {e}")

# === Detection Logic ===
def run_detection():
    cap = cv2.VideoCapture(0)
    warnings = 0
    max_warnings = 3
    last_warning_time = 0
    cooldown = 3

    with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection, \
         mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5) as face_mesh:

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            detection_result = face_detection.process(rgb_frame)
            mesh_result = face_mesh.process(rgb_frame)

            cheat_detected = False
            num_faces = len(detection_result.detections) if detection_result.detections else 0
            current_time = time.time()

            if num_faces == 0:
                cheat_detected = True
                cv2.putText(frame, "No face detected!", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            elif num_faces > 1:
                cheat_detected = True
                cv2.putText(frame, "Multiple faces detected!", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            if mesh_result.multi_face_landmarks:
                for face_landmarks in mesh_result.multi_face_landmarks:
                    h, w, _ = frame.shape
                    landmarks = face_landmarks.landmark

                    try:
                        left_corner1 = (int(landmarks[LEFT_EYE[0]].x * w), int(landmarks[LEFT_EYE[0]].y * h))
                        left_corner2 = (int(landmarks[LEFT_EYE[1]].x * w), int(landmarks[LEFT_EYE[1]].y * h))
                        right_corner1 = (int(landmarks[RIGHT_EYE[0]].x * w), int(landmarks[RIGHT_EYE[0]].y * h))
                        right_corner2 = (int(landmarks[RIGHT_EYE[1]].x * w), int(landmarks[RIGHT_EYE[1]].y * h))

                        left_iris = (int(landmarks[LEFT_IRIS[0]].x * w), int(landmarks[LEFT_IRIS[0]].y * h))
                        right_iris = (int(landmarks[RIGHT_IRIS[0]].x * w), int(landmarks[RIGHT_IRIS[0]].y * h))

                        left_ratio = eye_position_ratio(left_corner1, left_corner2, left_iris)
                        right_ratio = eye_position_ratio(right_corner1, right_corner2, right_iris)

                        if left_ratio < 0.3 or right_ratio > 0.7:
                            cheat_detected = True
                            cv2.putText(frame, "Looking Away!", (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

                    except IndexError:
                        cheat_detected = True
                        cv2.putText(frame, "Eyes not detected!", (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            else:
                cheat_detected = True
                cv2.putText(frame, "Face landmarks not visible!", (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            if cheat_detected and current_time - last_warning_time > cooldown:
                warnings += 1
                last_warning_time = current_time
                print(f"[!] Warning {warnings}/{max_warnings} issued")
                send_warning_to_api(warnings)  # Send warning to API

            cv2.putText(frame, f"Warnings: {warnings}/{max_warnings}", (10, frame.shape[0] - 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

            if warnings >= max_warnings:
                cv2.putText(frame, "Cheating Detected! Session Terminated.", (30, 150),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                cv2.imshow("Cheating Detection", frame)
                cv2.waitKey(3000)
                send_warning_to_api(warnings)  # Send final cheating detection warning
                break

            cv2.imshow("Cheating Detection", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()
