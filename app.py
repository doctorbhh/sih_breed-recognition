import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
import torch.nn.functional as F

app = Flask(__name__)
CORS(app)

# --- All Model Loading and Setup code remains the same ---
detection_model = models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
detection_model.eval()
COCO_INSTANCE_CATEGORY_NAMES = [
    '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
    'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'N/A', 'stop sign',
    'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'N/A', 'backpack', 'umbrella', 'N/A', 'N/A',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'N/A', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
    'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
    'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'N/A', 'dining table',
    'N/A', 'N/A', 'toilet', 'N/A', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
    'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'N/A', 'book',
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

def get_breed_model(num_classes):
    model = models.resnet50(pretrained=True)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    return model

BREED_CLASSES = [
    'Alambadi','Amritmahal','Ayrshire','Banni','Bargur','Bhadawari',
    'Brown_Swiss','Dangi','Deoni','Gir','Guernsey','Hallikar','Hariana',
    'Holstein_Friesian','Jaffrabadi','Jersey','Kangayam','Kankrej','Kasargod',
    'Kenkatha','Kherigarh','Khillari','Krishna_Valley','Malnad_gidda','Mehsana',
    'Murrah','Nagori','Nagpuri','Nili_Ravi','Nimari','Ongole','Pulikulam',
    'Rathi','Red_Dane','Red_Sindhi','Sahiwal','Surti','Tharparkar','Toda',
    'Umblachery','Vechur'
]
NUM_CLASSES = len(BREED_CLASSES)
BREED_MODEL_PATH = r'd:\prj\sih\sih_web\resnet50_cattle_breed.pth'

breed_model = get_breed_model(num_classes=NUM_CLASSES)
breed_model.load_state_dict(torch.load(BREED_MODEL_PATH, map_location=torch.device('cpu')))
breed_model.eval()

breed_preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])
detection_preprocess = transforms.Compose([
    transforms.ToTensor(),
])

# --- API ENDPOINT WITH MODIFIED RESPONSES ---

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        # **CHANGE**: Return status: 'error' and 200 OK
        return jsonify({'status': 'error', 'message': 'No file part in the request'})
    
    file = request.files['file']

    if file.filename == '':
        # **CHANGE**: Return status: 'error' and 200 OK
        return jsonify({'status': 'error', 'message': 'No file selected for uploading'})

    if file:
        try:
            image = Image.open(file.stream).convert('RGB')

            detection_tensor = detection_preprocess(image).unsqueeze(0)
            with torch.no_grad():
                predictions = detection_model(detection_tensor)

            detected_objects = []
            for i, score in enumerate(predictions[0]['scores']):
                if score > 0.8:
                    label_idx = predictions[0]['labels'][i].item()
                    detected_objects.append(COCO_INSTANCE_CATEGORY_NAMES[label_idx])
            
            if 'cow' in detected_objects:
                processed_image = breed_preprocess(image)
                processed_image = processed_image.unsqueeze(0)
                
                with torch.no_grad():
                    output = breed_model(processed_image)
                
                probabilities = F.softmax(output, dim=1)
                confidence, predicted_idx = torch.max(probabilities, 1)

                predicted_breed = BREED_CLASSES[predicted_idx.item()]
                confidence_score = confidence.item()

                # **CHANGE**: Return status: 'success' with data
                return jsonify({
                    'status': 'success',
                    'breed': predicted_breed,
                    'confidence': f'{confidence_score:.2%}'
                })

            elif 'person' in detected_objects:
                # **CHANGE**: Return status: 'error' and 200 OK
                return jsonify({'status': 'error', 'message': 'A person was detected. Please upload a valid image.'})

            else:
                # **CHANGE**: Return status: 'error' and 200 OK
                return jsonify({'status': 'error', 'message': 'Could not detect a cattle or buffalo. Please upload a valid image.'})

        except Exception as e:
            # **CHANGE**: Return status: 'error' and 200 OK
            return jsonify({'status': 'error', 'message': f'An unexpected error occurred: {str(e)}'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)