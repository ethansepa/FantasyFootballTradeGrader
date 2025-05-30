import google.generativeai as genai
from app.core.config import get_settings
from typing import Tuple, List

settings = get_settings()
genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel('gemini-pro')

def analyze_trade(incoming_players: List[str], outgoing_players: List[str]) -> Tuple[int, str, str]:
    """
    Analyze a fantasy football trade using Gemini AI
    Returns: (score, grade, analysis)
    """
    prompt = f"""
    You are a fantasy football expert analyzing a trade from MY team's perspective. Please provide a detailed analysis and score this trade on a scale of 0-100 based on whether this is good for MY team.

    TRADE DETAILS (From MY perspective):
    I am GETTING: {', '.join(incoming_players)}
    I am GIVING UP: {', '.join(outgoing_players)}

    Please analyze this trade considering:
    1. Am I getting good value for what I'm giving up?
    2. Player performance trends and recent form
    3. Positional needs and roster construction
    4. Injury history and risk factors
    5. Playoff schedule strength (weeks 15-17)
    6. Age, career trajectory, and long-term value
    7. Opportunity and target share in their current teams
    8. Overall trade value from MY team's perspective

    Scoring Guide:
    - 80-100: Excellent trade for me, clear win
    - 65-79: Good trade, favorable value
    - 50-64: Fair trade, roughly even value
    - 35-49: Poor trade, losing value
    - 0-34: Very poor trade, significant loss

    Provide your response in the following format:
    SCORE: [0-100 integer score]
    GRADE: [Excellent/Good/Fair/Poor/Very Poor]
    ANALYSIS: [Detailed 3-4 sentence analysis explaining why this trade is good/bad for MY team, focusing on the value I'm getting vs giving up]

    Focus entirely on whether this trade helps MY team win.
    """
    
    try:
        response = model.generate_content(prompt)
        analysis_text = response.text
        
        score = extract_score(analysis_text)
        grade = extract_grade(analysis_text)
        analysis = extract_analysis(analysis_text)
        
        return score, grade, analysis
        
    except Exception as e:
        return get_mock_analysis(incoming_players, outgoing_players)

def extract_score(text: str) -> int:
    """Extract score from Gemini response"""
    try:
        for line in text.split('\n'):
            if 'SCORE:' in line.upper():
                score_str = line.split(':')[1].strip()
                return int(''.join(filter(str.isdigit, score_str)))
        return 50  # Default if not found
    except:
        return 50

def extract_grade(text: str) -> str:
    """Extract grade from Gemini response"""
    try:
        for line in text.split('\n'):
            if 'GRADE:' in line.upper():
                grade = line.split(':')[1].strip()
                return grade
        return "Fair"  # Default if not found
    except:
        return "Fair"

def extract_analysis(text: str) -> str:
    """Extract analysis from Gemini response"""
    try:
        lines = text.split('\n')
        analysis_started = False
        analysis_lines = []
        
        for line in lines:
            if 'ANALYSIS:' in line.upper():
                analysis_started = True
                analysis_lines.append(line.split(':', 1)[1].strip())
            elif analysis_started and line.strip():
                analysis_lines.append(line.strip())
        
        return ' '.join(analysis_lines) if analysis_lines else "Trade analysis completed."
    except:
        return "Trade analysis completed."

def get_mock_analysis(incoming: List[str], outgoing: List[str]) -> Tuple[int, str, str]:
    """Fallback mock analysis if API fails"""
    import random
    
    base_score = 50
    incoming_bonus = len(incoming) * 3
    outgoing_penalty = len(outgoing) * 2
    score_modifier = random.randint(-20, 20) + incoming_bonus - outgoing_penalty
    score = max(10, min(90, base_score + score_modifier))
    
    if score >= 80:
        grade = "Excellent"
    elif score >= 65:
        grade = "Good"
    elif score >= 50:
        grade = "Fair"
    elif score >= 35:
        grade = "Poor"
    else:
        grade = "Very Poor"
    
    analysis = f"Mock analysis from your team's perspective: This trade shows {grade.lower()} value. You're getting {len(incoming)} player(s) and giving up {len(outgoing)} player(s). The value exchange appears {'favorable' if score >= 60 else 'questionable' if score >= 40 else 'poor'} for your team."
    
    return score, grade, analysis 