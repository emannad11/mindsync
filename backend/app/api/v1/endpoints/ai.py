from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import types
from app.api import deps
from app.core.config import settings
from pydantic import BaseModel
from app.schemas.user import UserOut
from typing import List, Optional, Dict, Any
from app.db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()


class ChatMessage(BaseModel):
    role: str   # "user" or "model"
    text: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


def _get_system_instruction(user: UserOut) -> str:
    return f"""You are MindSync AI, an intelligent personal productivity assistant built as a Final Year Project.
Your user's name is {user.name}.

User Profile Context:
- Primary Goal: {user.primaryGoal or 'Productivity'}
- Productivity Style: {user.productivityStyle or 'Balanced'}
- Work Schedule: {user.workStart or '09:00'} to {user.workEnd or '17:00'}
- Daily Sleep Goal: {user.sleepGoal or 8} hours
- Daily Water Goal: {user.waterGoal or 2.5} Liters
- Current Stress Level (1-5): {user.stressLevel or 2}

Guidelines:
1. Be concise, warm, and actionable. Avoid long walls of text.
2. Reference the user's profile naturally when relevant.
3. Use bullet points or numbered steps for structured advice.
4. If the user seems stressed or mentions fatigue, acknowledge it empathetically first.
5. Always end with a practical next step or a question to keep the conversation going.
"""


@router.post("/chat")
async def chat_with_ai(
    request: ChatRequest,
    current_user: UserOut = Depends(deps.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        raise HTTPException(
            status_code=500,
            detail="Gemini API Key is not configured. Please add your GEMINI_API_KEY to backend/.env"
        )

    try:
        import json
        from datetime import datetime
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # 1. Analyze if the message implies a database action (Agentic Tool Use)
        action_taken = None
        action_details = ""
        keywords = ["task", "todo", "remind", "schedule", "mood", "feeling", "stressed", "tired", "happy", "log"]
        
        if any(kw in request.message.lower() for kw in keywords):
            try:
                action_prompt = f"""
                Analyze the user's message: "{request.message}"
                
                If the user is asking to:
                1. Add a task or remind them to do something, set action_type to "create_task" and fill out the task_data fields.
                2. Log a mood, report how they feel, or log stress/fatigue, set action_type to "log_mood" and fill out the mood_data fields.
                
                Return a JSON object matching this schema:
                {{
                    "action_type": "create_task" | "log_mood" | "none",
                    "task_data": {{
                        "title": "Short, clear title of the task",
                        "description": "Optional description/details of the task",
                        "priority": "low" | "medium" | "high" (default "medium"),
                        "status": "pending"
                    }},
                    "mood_data": {{
                        "mood_score": 1-5 (5 being happiest/best, default 3),
                        "stress_level": 1-5 (5 being highest, default 2),
                        "fatigue_level": 1-5 (5 being highest, default 2),
                        "notes": "Short description of how they feel"
                    }}
                }}
                Output strictly raw JSON. No markdown or wrappers.
                """
                
                action_res = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=action_prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                
                parsed_action = json.loads(action_res.text)
                action_type = parsed_action.get("action_type")
                
                if action_type == "create_task":
                    task_data = parsed_action.get("task_data", {})
                    if task_data.get("title"):
                        task_dict = {
                            "title": task_data.get("title"),
                            "description": task_data.get("description"),
                            "priority": task_data.get("priority", "medium"),
                            "status": task_data.get("status", "pending"),
                            "user_id": current_user.id,
                            "created_at": datetime.utcnow()
                        }
                        result = await db["tasks"].insert_one(task_dict)
                        action_taken = "create_task"
                        action_details = f"Successfully created task: '{task_dict['title']}' with {task_dict['priority']} priority."
                        
                elif action_type == "log_mood":
                    mood_data = parsed_action.get("mood_data", {})
                    mood_dict = {
                        "mood_score": mood_data.get("mood_score", 3),
                        "stress_level": mood_data.get("stress_level", 2),
                        "fatigue_level": mood_data.get("fatigue_level", 2),
                        "notes": mood_data.get("notes"),
                        "user_id": current_user.id,
                        "timestamp": datetime.utcnow()
                    }
                    result = await db["moods"].insert_one(mood_dict)
                    action_taken = "log_mood"
                    action_details = f"Successfully logged mood (Score: {mood_dict['mood_score']}, Stress: {mood_dict['stress_level']}, Fatigue: {mood_dict['fatigue_level']})."
                    
            except Exception as ae:
                # Silently catch and fall back to normal chat to avoid blocking the user experience
                print(f"Agentic Action Exception: {str(ae)}")

        # 2. Build multi-turn history for context-aware conversation
        history = []
        for msg in (request.history or []):
            history.append(
                types.Content(
                    role=msg.role,
                    parts=[types.Part(text=msg.text)]
                )
            )

        # Append action feedback context if an action was executed
        user_message_content = request.message
        if action_taken:
            user_message_content += f"\n\n[SYSTEM NOTIFICATION: The system automatically completed action '{action_taken}' and logged it in the database. Action details: {action_details}]"

        # Add the new user message (with background system context if actioned)
        history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=user_message_content)]
            )
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=history,
            config=types.GenerateContentConfig(
                system_instruction=_get_system_instruction(current_user),
                temperature=0.7,
                max_output_tokens=1024,
            )
        )

        return {"response": response.text}

    except Exception as e:
        error_msg = str(e)
        if "API_KEY_INVALID" in error_msg or "API key not valid" in error_msg:
            raise HTTPException(
                status_code=401,
                detail="Invalid Gemini API Key. Please check your GEMINI_API_KEY in backend/.env"
            )
        raise HTTPException(status_code=500, detail=f"AI Service Error: {error_msg}")

@router.get("/insights")
async def get_ai_insights(
    current_user: UserOut = Depends(deps.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Generate personalized productivity insights based on user profile, 
    recent tasks, and mood history. Fall back gracefully to local rule-based insights if Gemini is unavailable.
    """
    try:
        recent_tasks = await db["tasks"].find(
            {"user_id": current_user.id}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        recent_moods = await db["userdata"].find(
            {"user_id": current_user.id}
        ).sort("created_at", -1).limit(5).to_list(5)

        # 1. Check if Gemini API key exists and is set
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
            try:
                tasks_str = "\n".join([f"- {t.get('title')} ({t.get('status')})" for t in recent_tasks]) or "No recent tasks."
                moods_str = "\n".join([f"- Mood Score: {m.get('mood_score')}/5, Stress Level: {m.get('stress_level')}/5, Fatigue Level: {m.get('fatigue_level')}/5 ({m.get('notes') or ''})" for m in recent_moods]) or "No recent mood logs."

                prompt = f"""
                Analyze the following user data and provide 3 actionable, highly personalized productivity insights for today.
                User: {current_user.name}
                Goal: {current_user.primaryGoal}
                Productivity Style: {current_user.productivityStyle}
                
                Recent Tasks:
                {tasks_str}
                
                Recent Moods:
                {moods_str}
                
                Format your response as a JSON object with a 'forecast' (short string) and 'insights' (list of 3 strings).
                Keep it encouraging and data-driven.
                """

                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.7,
                    )
                )

                import json
                return json.loads(response.text)
            except Exception as e:
                print(f"[WARNING] Gemini API failed: {str(e)}. Falling back to local insights generator.")

        # 2. Local rule-based fallback insights if Gemini is not configured, offline, or rate-limited
        mood_score_avg = 3.0
        stress_level_avg = 2.0
        fatigue_level_avg = 2.0
        
        if recent_moods:
            mood_score_avg = sum([m.get("mood_score", 3) for m in recent_moods]) / len(recent_moods)
            stress_level_avg = sum([m.get("stress_level", 2) for m in recent_moods]) / len(recent_moods)
            fatigue_level_avg = sum([m.get("fatigue_level", 2) for m in recent_moods]) / len(recent_moods)
            
        pending_tasks_count = sum([1 for t in recent_tasks if t.get("status") == "pending"])
        
        insights_list = []
        if stress_level_avg >= 3.5:
            insights_list.append("High stress patterns detected. Schedule a 15-minute screen-free mindfulness break to let your nervous system recover.")
        else:
            insights_list.append(f"Your stress levels are well-managed today. Great work keeping a balanced state under your {current_user.productivityStyle or 'Balanced'} focus flow.")
            
        if fatigue_level_avg >= 3.5:
            insights_list.append("Significant fatigue indicators present. Keep light tasks for the afternoon and ensure you get offline early tonight.")
        elif mood_score_avg >= 4.0:
            insights_list.append("Your mood is excellent today! Use this positive cognitive state to tackle high-focus, creative design tasks.")
        else:
            insights_list.append(f"Aim for a daily walk or light exercise. Physical movement is shown to boost mood and focus by up to 20%.")
            
        if pending_tasks_count > 2:
            insights_list.append(f"You have {pending_tasks_count} pending tasks. Try grouping them and doing the smallest task first to build momentum.")
        else:
            insights_list.append(f"Your checklist is clear and manageable. Excellent job organizing your workload today, {current_user.name.split()[0]}!")

        return {
            "forecast": "Maintain steady pacing and take regular intervals of rest.",
            "insights": insights_list[:3]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insight Generation Error: {str(e)}")


@router.post("/decompose-task")
async def decompose_task(
    task_title: str,
    current_user: UserOut = Depends(deps.get_current_user)
):
    """
    Break down a complex task into smaller, manageable sub-tasks.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    try:
        prompt = f"""
        Break down the following task into 4-6 small, actionable sub-tasks for {current_user.name}:
        Task: "{task_title}"
        
        Format your response as a JSON object with a 'subtasks' key containing a list of strings.
        """
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.5,
            )
        )

        import json
        return json.loads(response.text)

    except Exception as e:
        import traceback
        print(f"Task Decomposition Error Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Task Decomposition Error: {str(e)}")


# Helper to run inference with the global MTL model
_mtl_model = None
_preprocessors = None

def get_mtl_predictions(
    current_user,
    avg_stress: float,
    avg_fatigue: float,
    avg_mood: float,
    task_score: float,
    sleep_hours: Optional[float] = None,
    work_hours: Optional[float] = None,
    activity_level: Optional[str] = None,
    workload_intensity: Optional[str] = None
) -> tuple:
    global _mtl_model, _preprocessors
    import os
    import pickle
    import numpy as np
    import pandas as pd
    
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))) # backend/app
    model_path = os.path.join(base_dir, "ml", "models", "mindsync_mtl_model.keras")
    preprocessor_path = os.path.join(base_dir, "ml", "models", "mindsync_mtl_preprocessors.pkl")
    
    # Auto-train if model doesn't exist yet
    if not os.path.exists(model_path) or not os.path.exists(preprocessor_path):
        try:
            from app.ml.train_mtl import run_pipeline
            print("[INFO] MTL Keras model not found. Automatically training model...")
            run_pipeline()
        except Exception as e:
            print(f"[ERROR] Failed to auto-train model: {str(e)}")
            return None, None
            
    # Load model and preprocessors if not already cached
    if _mtl_model is None or _preprocessors is None:
        try:
            from tensorflow.keras.models import load_model
            _mtl_model = load_model(model_path)
            with open(preprocessor_path, "rb") as f:
                _preprocessors = pickle.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to load MTL model/preprocessors: {str(e)}")
            return None, None

    try:
        stress_val = float(avg_stress)
        fatigue_val = float(avg_fatigue)
        mood_val = float(avg_mood)
        pending_t = float(task_score)
        
        sleep_h = float(sleep_hours) if sleep_hours is not None else float(current_user.sleepGoal or 8.0)
        work_h = float(work_hours) if work_hours is not None else 6.0
        
        phys_act = 1.5
        if activity_level == "low":
            phys_act = 0.5
        elif activity_level == "high":
            phys_act = 2.5
            
        scr_time = 7.0
        soc_media = 2.5
        if workload_intensity == "low":
            scr_time = 4.0
            soc_media = 1.0
        elif workload_intensity == "high":
            scr_time = 10.0
            soc_media = 4.0

        sleep_qual = float(mood_val * 2.0)
        foc_habits = float(max(1.0, min(10.0, mood_val * 2.0 - (pending_t / 2.0))))

        input_data = {
            "screen_time": scr_time,
            "social_media_usage": soc_media,
            "sleep_hours": sleep_h,
            "work_hours": work_h,
            "meetings_per_day": int(min(7, max(0, int(pending_t)))),
            "stress_level": stress_val,
            "fatigue_level": fatigue_val,
            "sleep_quality": sleep_qual,
            "focus_habits": foc_habits,
            "physical_activity": phys_act,
            "work_mode": "Remote",
            "productivity_style": current_user.productivityStyle or "Balanced"
        }
        
        df_in = pd.DataFrame([input_data])
        
        for col in _preprocessors["numeric_cols"]:
            if col in df_in.columns:
                df_in[col] = df_in[col].fillna(_preprocessors["imputation_values"][col])
        for col in _preprocessors["categorical_cols"]:
            if col in df_in.columns:
                df_in[col] = df_in[col].fillna(_preprocessors["imputation_values"][col])
                
        df_encoded = pd.get_dummies(df_in, columns=_preprocessors["categorical_cols"], dtype=float)
        
        for col in _preprocessors["encoded_feature_columns"]:
            if col not in df_encoded.columns:
                df_encoded[col] = 0.0
        df_encoded = df_encoded[_preprocessors["encoded_feature_columns"]]
        
        scaled_data = _preprocessors["scaler"].transform(df_encoded)
        
        preds = _mtl_model.predict(scaled_data, verbose=0)
        pred_risk_probs = preds[0][0]
        pred_score = float(preds[1][0][0])
        
        classes = _preprocessors["label_encoder"].classes_.tolist()
        high_idx = classes.index("High") if "High" in classes else 2
        med_idx = classes.index("Medium") if "Medium" in classes else 1
        
        burnout_risk = float(pred_risk_probs[high_idx] * 100.0 + pred_risk_probs[med_idx] * 50.0)
        burnout_risk = round(min(100.0, max(0.0, burnout_risk)), 1)
        productivity_index = round(min(100.0, max(10.0, pred_score)), 1)
        
        return burnout_risk, productivity_index
    except Exception as e:
        print(f"[ERROR] Exception during MTL prediction inference: {str(e)}")
        return None, None


@router.get("/predict-burnout")
async def predict_burnout(
    current_user: UserOut = Depends(deps.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Predicts burnout risk and cognitive productivity index dynamically
    based on the user's latest daily questionnaire log (from userdata collection).
    """
    try:
        # 1. Fetch the user's latest daily activity log (our daily questionnaire)
        latest_log = await db["userdata"].find_one(
            {"user_id": current_user.id},
            sort=[("created_at", -1)]
        )

        # 2. Extract questionnaire inputs (or fall back to defaults)
        if latest_log:
            sleep_hours = float(latest_log.get("sleep_hours", 8.0))
            study_hours = float(latest_log.get("study_hours", 6.0))
            mood_score = float(latest_log.get("mood_score", 3.0))
            stress_level = float(latest_log.get("stress_level", 2.0))
            fatigue_level = float(latest_log.get("fatigue_level", 2.0))
            pending_tasks = float(latest_log.get("pending_tasks", 2.0))
            activity_level = latest_log.get("activity_level", "medium")
            workload_intensity = latest_log.get("workload_intensity", "medium")
            source_type = "Interactive Questionnaire Log"
        else:
            # Base fallbacks from profile and database
            pending_tasks = float(await db["tasks"].count_documents({"user_id": current_user.id, "status": "pending"}))
            sleep_hours = float(current_user.sleepGoal or 8.0)
            study_hours = 6.0
            mood_score = 3.0
            stress_level = float(current_user.stressLevel or 2.0)
            fatigue_level = 2.0
            activity_level = "medium"
            workload_intensity = "medium"
            source_type = "Seeded Context Baseline"

        # 3. Predict burnout risk and productivity index via the trained Neural Network
        burnout_risk, productivity_index = get_mtl_predictions(
            current_user=current_user,
            avg_stress=stress_level,
            avg_fatigue=fatigue_level,
            avg_mood=mood_score,
            task_score=pending_tasks,
            sleep_hours=sleep_hours,
            work_hours=study_hours,
            activity_level=activity_level,
            workload_intensity=workload_intensity
        )

        # Fall back to heuristic rule engine if model inference fails
        if burnout_risk is None or productivity_index is None:
            stress_pred = stress_level
            if workload_intensity == "high":
                stress_pred += 0.8
            elif workload_intensity == "low":
                stress_pred -= 0.5
            if sleep_hours < 6.0:
                stress_pred += 0.6
            if pending_tasks > 5:
                stress_pred += 0.4
            stress_pred = max(1.0, min(5.0, stress_pred))

            fatigue_pred = fatigue_level
            if workload_intensity == "high":
                fatigue_pred += 0.8
            if sleep_hours < 7.0:
                fatigue_pred += (7.0 - sleep_hours) * 0.5
            if study_hours > 8.0:
                fatigue_pred += 0.6
            if activity_level == "low":
                fatigue_pred += 0.3
            elif activity_level == "high":
                fatigue_pred -= 0.3
            fatigue_pred = max(1.0, min(5.0, fatigue_pred))

            burnout_val = (stress_pred * 0.40) + (fatigue_pred * 0.35) + (min(pending_tasks, 10.0) / 10.0 * 5.0 * 0.25)
            burnout_risk = round(min(100.0, max(0.0, (burnout_val - 1.0) / 4.0 * 100.0)), 1)

            raw_productivity = 100.0 - burnout_risk + (mood_score * 3.0)
            if sleep_hours >= 7.0 and stress_pred <= 2.5:
                raw_productivity += 5.0
            
            productivity_index = round(min(100.0, max(10.0, raw_productivity)), 1)
            source_type += " (Fallback Rule Engine)"
        else:
            source_type += " (Trained Neural Network Inference)"

        # Check fatigue values for recommendations
        stress_pred = stress_level
        fatigue_pred = fatigue_level

        # 4. Generate action-oriented, personalized recommendations
        recommendation_prefix = f"🧠 [ACTIVE NEURAL ASSESSOR - {source_type}]: "
        recommendation = ""
        
        if burnout_risk > 70.0:
            recommendation = (
                recommendation_prefix 
                + f"CRITICAL: High cognitive load detected ({burnout_risk}%). "
                + f"Your workload intensity is high, causing elevated stress ({round(stress_pred, 1)}/5) and fatigue ({round(fatigue_pred, 1)}/5). "
                + "We strongly recommend taking a 15-minute off-screen break, rescheduling low-priority tasks, and allocating time to recover."
            )
        elif burnout_risk > 40.0:
            recommendation = (
                recommendation_prefix 
                + f"WARNING: Moderate cognitive fatigue detected ({burnout_risk}%). "
                + f"Workload and sleep restriction have raised fatigue ({round(fatigue_pred, 1)}/5). "
                + "Try breaking down large tasks, prioritizing hydration, and avoiding working overtime."
            )
        else:
            recommendation = (
                recommendation_prefix 
                + f"EXCELLENT: Low stress ({round(stress_pred, 1)}/5) and fatigue ({round(fatigue_pred, 1)}/5) detected ({burnout_risk}%). "
                + "Your mental resources are optimal. This is the perfect window to tackle complex, deep-focus tasks!"
            )

        # 5. Map start/end work hours
        work_start = current_user.workStart or "09:00"
        work_end = current_user.workEnd or "17:00"
        style = current_user.productivityStyle or "Balanced"

        return {
            "burnout_risk": burnout_risk,
            "productivity_index": productivity_index,
            "metrics": {
                "avg_stress": round(stress_pred, 2),
                "avg_fatigue": round(fatigue_pred, 2),
                "avg_mood": round(mood_score, 2),
                "task_density_score": round(min(5.0, pending_tasks * 0.5), 2),
                "pending_tasks": int(pending_tasks),
                "completed_tasks": 0
            },
            "scheduling": {
                "work_hours": f"{work_start} - {work_end}",
                "style": style,
                "optimal_focus_window": "Morning (09:00 - 12:00)" if fatigue_pred < 3.0 else "Evening (17:00 - 20:00)"
            },
            "recommendation": recommendation
        }

    except Exception as e:
        import traceback
        print(f"Prediction Model Error:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Prediction Model Error: {str(e)}")


@router.post("/heal-schedule")
async def heal_schedule(
    current_user: UserOut = Depends(deps.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Autonomous schedule optimization. If high burnout risk or stress is detected,
    automatically postpones low-priority tasks and schedules wellness recharge breaks.
    """
    try:
        from datetime import datetime, timedelta
        
        # 1. Fetch recent tasks and moods to compute burnout risk
        pending_count = await db["tasks"].count_documents({"user_id": current_user.id, "status": "pending"})
        completed_count = await db["tasks"].count_documents({"user_id": current_user.id, "status": "completed"})
        
        recent_moods = await db["moods"].find(
            {"user_id": current_user.id}
        ).sort("timestamp", -1).limit(7).to_list(7)

        avg_stress = float(current_user.stressLevel or 2)
        avg_fatigue = 2.0

        if recent_moods:
            stress_scores = [m.get("stress_level", 2) for m in recent_moods if m.get("stress_level") is not None]
            fatigue_scores = [m.get("fatigue_level", 2) for m in recent_moods if m.get("fatigue_level") is not None]
            if stress_scores: avg_stress = sum(stress_scores) / len(stress_scores)
            if fatigue_scores: avg_fatigue = sum(fatigue_scores) / len(fatigue_scores)

        # Compute task density
        total_tasks = pending_count + completed_count
        if total_tasks == 0:
            task_score = 2.0
        else:
            task_score = min(5.0, (pending_count / max(1, completed_count)) * 2.5)

        # Multivariate Burnout calculation
        w_stress, w_fatigue, w_task = 0.45, 0.35, 0.20
        raw_burnout = (w_stress * avg_stress) + (w_fatigue * avg_fatigue) + (w_task * task_score)
        burnout_risk = round(min(100.0, max(0.0, (raw_burnout - 1.0) * 25.0)), 1)

        # 2. Heuristic check: Trigger healing if burnout risk > 45% OR stress > 3.0
        if burnout_risk > 45.0 or avg_stress >= 3.0:
            now = datetime.utcnow()
            postpone_date = now + timedelta(days=2)
            
            # Find low priority pending tasks
            low_priority_tasks = await db["tasks"].find({
                "user_id": current_user.id,
                "status": "pending",
                "priority": "low"
            }).to_list(100)
            
            rescheduled_count = 0
            rescheduled_titles = []
            
            for task in low_priority_tasks:
                await db["tasks"].update_one(
                    {"_id": task["_id"]},
                    {"$set": {
                        "due_date": postpone_date,
                        "description": (task.get("description") or "") + "\n\n[Optimized: Postponed by MindSync AI to lower burnout risk.]"
                    }}
                )
                rescheduled_count += 1
                rescheduled_titles.append(task.get("title"))

            # Insert a personalized wellness recharge block
            wellness_task = {
                "title": "💆 MindSync Wellness Recharge",
                "description": f"AI-prescribed recovery break based on stress level {round(avg_stress, 1)}/5 and fatigue level {round(avg_fatigue, 1)}/5. Spend 15 minutes away from screens.",
                "priority": "high",
                "status": "pending",
                "due_date": now,
                "created_at": now,
                "user_id": current_user.id
            }
            await db["tasks"].insert_one(wellness_task)

            return {
                "healed": True,
                "burnout_risk": burnout_risk,
                "rescheduled_count": rescheduled_count,
                "rescheduled_tasks": rescheduled_titles,
                "wellness_added": True,
                "message": f"MindSync AI detected high burnout indicators ({burnout_risk}%). Automatically rescheduled {rescheduled_count} low-priority tasks by 48 hours and inserted a high-priority Wellness Recharge block."
            }
        
        return {
            "healed": False,
            "burnout_risk": burnout_risk,
            "rescheduled_count": 0,
            "rescheduled_tasks": [],
            "wellness_added": False,
            "message": f"Your current burnout indicators ({burnout_risk}%) are well within optimal bounds. No calendar rescheduling or stress healing required today!"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schedule Healing Error: {str(e)}")


@router.post("/train")
async def train_model_endpoint(
    current_user: UserOut = Depends(deps.get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Triggers retraining of the global Multi-Task Learning MLP model.
    """
    try:
        from app.ml.train_mtl import run_pipeline
        metrics = run_pipeline()
        
        return {
            "status": "success",
            "message": "Global Multi-Task Learning MLP successfully retrained.",
            "metrics": {
                "burnout_accuracy": metrics["burnout_accuracy"],
                "regression_r2": metrics["productivity_r2"]
            },
            "trained_at": metrics["trained_at"]
        }
    except Exception as e:
        import traceback
        print(f"ML Model Training Exception:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"ML Model Training Failed: {str(e)}")
