import base64
import cv2
import numpy as np


def img_to_data_url(img: np.ndarray):
    retval, buffer = cv2.imencode('.png', img)
    if not retval:
        raise Exception("Error encoding image")
    base64_str = base64.b64encode(buffer).decode('utf-8')