import urllib.request
import json

def test_student_registration():
    url = "http://127.0.0.1:8000/api/students/register/student"
    data = {
        "name": "Test Student",
        "email": "teststudent@example.com",
        "password": "testpassword123",
        "student_id": "STU123456",
        "mobile": "1234567890",
        "course": "Computer Science",
        "year": 2,
        "face_image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print("Status Code:", response.status)
            print("Response:", response.read().decode())
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        print("Details:", e.read().decode())
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_student_registration()
