import os
import base64
import urllib.request
import uuid
from deepface import DeepFace

def match_face(base64_image: str, stored_url: str) -> bool:
    """
    Match Face Implementation using DeepFace.
    Verifies that exactly one face is present and matches the stored face.
    Raises ValueError to be caught as specific HTTP Exceptions.
    """
    # 1. Clean up base64 prefix if exists
    if "," in base64_image:
        header, encoded = base64_image.split(",", 1)
    else:
        encoded = base64_image

    uid = str(uuid.uuid4())
    img1_path = f"/tmp/{uid}_webcam.jpg"
    img2_path = f"/tmp/{uid}_stored.jpg"
    
    # Write incoming base64 directly to temp file
    try:
        with open(img1_path, "wb") as f:
            f.write(base64.b64decode(encoded))
            
        # Write stored URL to temp file
        req = urllib.request.urlopen(stored_url)
        with open(img2_path, "wb") as f:
            f.write(req.read())
            
        # 2. Extract faces from camera image to count them
        try:
            faces = DeepFace.extract_faces(img_path=img1_path, enforce_detection=True)
        except Exception:
            raise ValueError("No face detected. Please align your face properly.")
            
        if len(faces) > 1:
            raise ValueError("Multiple faces detected. Only one person allowed.")

        # 3. Verify match
        result = DeepFace.verify(
            img1_path=img1_path, 
            img2_path=img2_path,
            enforce_detection=False # already enforced above
        )
        
        if not result.get("verified"):
            raise ValueError("Face not recognized. Please try again.")
            
        return True
        
    except ValueError:
        raise
    except Exception as e:
        print("Face matching generalized error: ", e)
        raise ValueError("Face not recognized. Please try again.")
    finally:
        # cleanup
        if os.path.exists(img1_path):
            os.remove(img1_path)
        if os.path.exists(img2_path):
            os.remove(img2_path)
