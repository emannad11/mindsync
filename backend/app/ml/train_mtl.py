import os
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, mean_squared_error, mean_absolute_error, r2_score

# Set directories
ML_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(ML_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# -------------------------------------------------------------
# STEP 1: DATA EXPLORATION (with automatic fallback simulation)
# -------------------------------------------------------------

def load_or_generate_dataset():
    # List possible locations
    possible_paths = [
        os.path.join(ML_DIR, "digital_burnout_productivity.csv"),
        os.path.join(os.path.dirname(ML_DIR), "digital_burnout_productivity.csv"),
        os.path.join(os.path.dirname(os.path.dirname(ML_DIR)), "digital_burnout_productivity.csv"),
    ]
    
    csv_path = None
    for path in possible_paths:
        if os.path.exists(path):
            csv_path = path
            break
            
    if csv_path:
        print(f"[INFO] Loading dataset from: {csv_path}")
        df = pd.read_csv(csv_path)
    else:
        print("[INFO] digital_burnout_productivity.csv not found. Auto-generating high-quality simulated dataset...")
        np.random.seed(42)
        n_samples = 25000
        
        # Simulating behavioral, psychological, and lifestyle features
        screen_time = np.random.uniform(2.0, 12.0, n_samples)
        social_media_usage = np.random.uniform(0.5, 6.0, n_samples)
        sleep_hours = np.random.uniform(4.0, 10.0, n_samples)
        work_hours = np.random.uniform(4.0, 12.0, n_samples)
        meetings_per_day = np.random.randint(0, 8, n_samples)
        stress_level = np.random.uniform(1.0, 5.0, n_samples)
        fatigue_level = np.random.uniform(1.0, 5.0, n_samples)
        sleep_quality = np.random.uniform(1.0, 10.0, n_samples)
        focus_habits = np.random.uniform(1.0, 10.0, n_samples)
        physical_activity = np.random.uniform(0.0, 3.0, n_samples)
        
        work_mode = np.random.choice(["Remote", "Hybrid", "On-site"], n_samples)
        productivity_style = np.random.choice(["Morning Owl", "Night Owl", "Balanced"], n_samples)
        
        # Target: productivity_score (0-100)
        prod_noise = np.random.normal(0, 3, n_samples)
        productivity_score = (
            50 
            - (stress_level * 5.5) 
            - (fatigue_level * 4.5) 
            + (sleep_hours * 2.5) 
            + (focus_habits * 2.0) 
            - (social_media_usage * 1.2) 
            + (sleep_quality * 1.5)
            + (physical_activity * 2.0)
            + prod_noise
        )
        productivity_score = np.clip(productivity_score, 10.0, 100.0)
        
        # Target: burnout_risk (Low, Medium, High)
        burnout_val = (stress_level * 0.45) + (fatigue_level * 0.35) + (screen_time * 0.1) + (work_hours * 0.1) + np.random.normal(0, 0.2, n_samples)
        burnout_risk = []
        for val in burnout_val:
            if val >= 4.0:
                burnout_risk.append("High")
            elif val >= 2.6:
                burnout_risk.append("Medium")
            else:
                burnout_risk.append("Low")
                
        # Target: productivity_category
        productivity_category = []
        for val in productivity_score:
            if val >= 75:
                productivity_category.append("High")
            elif val >= 45:
                productivity_category.append("Medium")
            else:
                productivity_category.append("Low")
                
        df = pd.DataFrame({
            "screen_time": screen_time,
            "social_media_usage": social_media_usage,
            "sleep_hours": sleep_hours,
            "work_hours": work_hours,
            "meetings_per_day": meetings_per_day,
            "stress_level": stress_level,
            "fatigue_level": fatigue_level,
            "sleep_quality": sleep_quality,
            "focus_habits": focus_habits,
            "physical_activity": physical_activity,
            "work_mode": work_mode,
            "productivity_style": productivity_style,
            "burnout_risk": burnout_risk,
            "productivity_score": productivity_score,
            "productivity_category": productivity_category
        })
        
        # Inject occasional missing values for preprocessing test
        for col in ["screen_time", "sleep_hours", "work_mode"]:
            mask = np.random.choice([True, False], size=n_samples, p=[0.02, 0.98])
            df.loc[mask, col] = np.nan
            
        # Save generated CSV
        df.to_csv(os.path.join(ML_DIR, "digital_burnout_productivity.csv"), index=False)
        print(f"[INFO] Saved generated dataset to {os.path.join(ML_DIR, 'digital_burnout_productivity.csv')}")
        
    # EXPLORATION
    print("\n" + "="*50)
    print("STEP 1: DATA EXPLORATION")
    print("="*50)
    print("\n--- df.info() ---")
    df.info()
    print("\n--- df.describe() ---")
    print(df.describe())
    print("\n--- df.head() ---")
    print(df.head())
    
    unique_burnout = df["burnout_risk"].dropna().unique().tolist()
    print(f"\n[REPORT] Exact unique values of burnout_risk: {unique_burnout}")
    
    return df.sample(n=min(len(df), 3000), random_state=42)

# -------------------------------------------------------------
# STEP 2: PREPROCESSING
# -------------------------------------------------------------

def preprocess_data(df):
    print("\n" + "="*50)
    print("STEP 2: PREPROCESSING")
    print("="*50)
    
    df_clean = df.copy()
    
    # 1. Separate targets from features
    y_risk_raw = df_clean["burnout_risk"]
    y_score = df_clean["productivity_score"]
    
    # Drop target columns from feature matrix X
    X_raw = df_clean.drop(columns=["burnout_risk", "productivity_score", "productivity_category"])
    
    # 2. Handle missing values
    numeric_cols = X_raw.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = X_raw.select_dtypes(exclude=[np.number]).columns.tolist()
    
    imputation_values = {}
    
    for col in numeric_cols:
        median_val = X_raw[col].median()
        X_raw[col] = X_raw[col].fillna(median_val)
        imputation_values[col] = median_val
        
    for col in categorical_cols:
        mode_val = X_raw[col].mode()[0]
        X_raw[col] = X_raw[col].fillna(mode_val)
        imputation_values[col] = mode_val
        
    if y_risk_raw.isnull().any():
        risk_mode = y_risk_raw.mode()[0]
        y_risk_raw = y_risk_raw.fillna(risk_mode)
        
    if y_score.isnull().any():
        score_median = y_score.median()
        y_score = y_score.fillna(score_median)
        
    # 3. Encode categorical features using One-Hot Encoding
    X_encoded = pd.get_dummies(X_raw, columns=categorical_cols, dtype=float)
    encoded_feature_columns = X_encoded.columns.tolist()
    
    # 4. Encode burnout_risk target with Label Encoding
    label_encoder = LabelEncoder()
    y_risk_encoded = label_encoder.fit_transform(y_risk_raw)
    num_risk_classes = len(label_encoder.classes_)
    
    # 5. Scale all numeric features using StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_encoded)
    
    # 6. Split data into train (80%) and test (20%)
    X_train, X_test, y_train_risk, y_test_risk, y_train_score, y_test_score = train_test_split(
        X_scaled, y_risk_encoded, y_score, test_size=0.2, random_state=42
    )
    
    print(f"Features size: {X_scaled.shape[1]} columns")
    print(f"Train samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}")
    print(f"Burnout risk target encoded mapping: {dict(zip(label_encoder.classes_, range(num_risk_classes)))}")
    
    preprocessors = {
        "imputation_values": imputation_values,
        "categorical_cols": categorical_cols,
        "encoded_feature_columns": encoded_feature_columns,
        "label_encoder": label_encoder,
        "scaler": scaler,
        "numeric_cols": numeric_cols
    }
    
    preprocessor_path = os.path.join(MODELS_DIR, "mindsync_mtl_preprocessors.pkl")
    with open(preprocessor_path, "wb") as f:
        pickle.dump(preprocessors, f)
    print(f"[INFO] Saved preprocessors to {preprocessor_path}")
    
    return X_train, X_test, y_train_risk, y_test_risk, y_train_score, y_test_score, num_risk_classes, X_scaled.shape[1]

# -------------------------------------------------------------
# STEP 3: MODEL ARCHITECTURE
# -------------------------------------------------------------

def build_model(input_dim, num_risk_classes):
    print("\n" + "="*50)
    print("STEP 3: MODEL ARCHITECTURE (Shared MLP MTL)")
    print("="*50)
    
    import tensorflow as tf
    from tensorflow.keras.layers import Input, Dense, Dropout
    from tensorflow.keras.models import Model
    
    inputs = Input(shape=(input_dim,), name="input_layer")
    
    x = Dense(128, activation='relu', name="shared_dense_1")(inputs)
    x = Dropout(0.3, name="shared_dropout_1")(x)
    x = Dense(64, activation='relu', name="shared_dense_2")(x)
    x = Dropout(0.2, name="shared_dropout_2")(x)
    
    burnout_head = Dense(num_risk_classes, activation='softmax', name="burnout_head")(x)
    productivity_head = Dense(1, activation='linear', name="productivity_head")(x)
    
    model = Model(inputs=inputs, outputs=[burnout_head, productivity_head], name="MindSync_MTL_Model")
    model.summary()
    
    return model

# -------------------------------------------------------------
# STEP 4: COMPILE & TRAIN
# -------------------------------------------------------------

def train_model(model, X_train, y_train_risk, y_train_score):
    print("\n" + "="*50)
    print("STEP 4: COMPILE & TRAIN")
    print("="*50)
    
    import tensorflow as tf
    from tensorflow.keras.optimizers import Adam
    from tensorflow.keras.callbacks import EarlyStopping
    
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss={
            "burnout_head": "sparse_categorical_crossentropy",
            "productivity_head": "mean_squared_error"
        },
        loss_weights={
            "burnout_head": 0.5,
            "productivity_head": 0.5
        },
        metrics={
            "burnout_head": "accuracy",
            "productivity_head": "mae"
        }
    )
    
    early_stopping = EarlyStopping(
        monitor="val_loss",
        patience=3,
        restore_best_weights=True
    )
    
    history = model.fit(
        X_train,
        {
            "burnout_head": y_train_risk,
            "productivity_head": y_train_score
        },
        epochs=10,
        batch_size=32,
        validation_split=0.15,
        callbacks=[early_stopping],
        verbose=1
    )
    
    model_path = os.path.join(MODELS_DIR, "mindsync_mtl_model.keras")
    model.save(model_path)
    print(f"[INFO] Saved trained model to {model_path}")
    
    return history

# -------------------------------------------------------------
# STEP 5: EVALUATION
# -------------------------------------------------------------

def evaluate_and_plot(model, history, X_test, y_test_risk, y_test_score, num_risk_classes):
    print("\n" + "="*50)
    print("STEP 5: EVALUATION")
    print("="*50)
    
    preprocessor_path = os.path.join(MODELS_DIR, "mindsync_mtl_preprocessors.pkl")
    with open(preprocessor_path, "rb") as f:
        preprocessors = pickle.load(f)
    label_encoder = preprocessors["label_encoder"]
    
    preds = model.predict(X_test)
    pred_risk_probs, pred_score = preds[0], preds[1]
    
    pred_risk_classes = np.argmax(pred_risk_probs, axis=1)
    
    accuracy = accuracy_score(y_test_risk, pred_risk_classes)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test_risk, pred_risk_classes, average='weighted'
    )
    conf_matrix = confusion_matrix(y_test_risk, pred_risk_classes)
    
    pred_score = pred_score.flatten()
    rmse = np.sqrt(mean_squared_error(y_test_score, pred_score))
    mae = mean_absolute_error(y_test_score, pred_score)
    r2 = r2_score(y_test_score, pred_score)
    
    print("\n" + "="*40)
    print("MODEL METRICS SUMMARY")
    print("="*40)
    print("TASK A: BURNOUT RISK CLASSIFICATION")
    print(f"Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print("Confusion Matrix:")
    print(conf_matrix)
    print("-"*40)
    print("TASK B: PRODUCTIVITY REGRESSION")
    print(f"RMSE:      {rmse:.4f}")
    print(f"MAE:       {mae:.4f}")
    print(f"R² Score:  {r2:.4f} ({r2*100:.2f}%)")
    print("="*40)
    
    eval_metrics = {
        "burnout_accuracy": float(accuracy),
        "burnout_precision": float(precision),
        "burnout_recall": float(recall),
        "burnout_f1": float(f1),
        "burnout_confusion_matrix": conf_matrix.tolist(),
        "productivity_rmse": float(rmse),
        "productivity_mae": float(mae),
        "productivity_r2": float(r2),
        "trained_at": pd.Timestamp.now().isoformat()
    }
    
    metrics_path = os.path.join(MODELS_DIR, "mindsync_mtl_metrics.pkl")
    with open(metrics_path, "wb") as f:
        pickle.dump(eval_metrics, f)
    print(f"[INFO] Saved metrics package to {metrics_path}")
    
    plt.figure(figsize=(12, 5))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['burnout_head_loss'], label='Train Loss')
    plt.plot(history.history['val_burnout_head_loss'], label='Val Loss')
    plt.title('Burnout Head Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['productivity_head_loss'], label='Train Loss')
    plt.plot(history.history['val_productivity_head_loss'], label='Val Loss')
    plt.title('Productivity Head Loss (MSE)')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    plot_path = os.path.join(MODELS_DIR, "mindsync_mtl_loss.png")
    plt.savefig(plot_path)
    plt.close()
    print(f"[INFO] Saved loss curve plot to {plot_path}")
    
    return eval_metrics

def run_pipeline():
    df = load_or_generate_dataset()
    X_train, X_test, y_train_risk, y_test_risk, y_train_score, y_test_score, num_risk_classes, input_dim = preprocess_data(df)
    model = build_model(input_dim, num_risk_classes)
    history = train_model(model, X_train, y_train_risk, y_train_score)
    metrics = evaluate_and_plot(model, history, X_test, y_test_risk, y_test_score, num_risk_classes)
    print("\n[SUCCESS] Multi-Task Learning MLP pipeline execution finished successfully.")
    return metrics

if __name__ == "__main__":
    run_pipeline()
