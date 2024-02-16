import base64
import cv2


def cv2_to_data_url(cv2_image):
    # Convert the cv2 image to bytes
    print(cv2_image.shape, cv2_image)
    retval, buffer = cv2.imencode('.png', cv2_image)
    if not retval:
        raise Exception("Error encoding image")

    # Convert the bytes to a base64 encoded string
    base64_str = base64.b64encode(buffer).decode('utf-8')

    # Construct the data URL
    data_url = f"data:image/png;base64,{base64_str}"

    return data_url