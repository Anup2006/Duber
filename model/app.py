from fastapi import FastAPI
import joblib
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

CLIENT_URL = os.getenv("CLIENT_URL")


app = FastAPI()

# CORS (put it right after app creation)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CLIENT_URL or "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("fare_model.pkl")


@app.get("/")
def home():
    return {"message": "Fare prediction API is running"}


@app.post("/predict-fare")
def predict_fare(data: dict):

    input_data = pd.DataFrame([{
        "distanceKm": data["distanceKm"],
        "durationMin": data["durationMin"],
        "hour": data["hour"],
        "dayOfWeek": data["dayOfWeek"],
        "weatherScore": data["weatherScore"],
        "trafficScore": data["trafficScore"]
    }])

    prediction = model.predict(input_data)[0]

    return {
        "fare": round(float(prediction), 2)
    }