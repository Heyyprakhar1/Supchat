import os
import subprocess
import openai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json

app = FastAPI(title="SupaChat DevOps Agent")

class CommandRequest(BaseModel):
    command: str
    context: str = ""

class LogAnalysisRequest(BaseModel):
    logs: str
    service: str

def run_shell_command(cmd: str):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/agent/deploy")
async def deploy_service(req: CommandRequest):
    """Trigger deployment"""
    if req.command == "restart":
        result = run_shell_command("cd /opt/supachat && docker-compose restart")
        return {"status": "restarted", "details": result}
    elif req.command == "update":
        result = run_shell_command("cd /opt/supachat && docker-compose pull && docker-compose up -d")
        return {"status": "updated", "details": result}
    return {"status": "unknown command"}

@app.post("/agent/analyze-logs")
async def analyze_logs(req: LogAnalysisRequest):
    """AI-powered log analysis"""
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    prompt = f"""
    Analyze these logs from service {req.service}:
    {req.logs}
    
    Provide:
    1. Summary of what happened
    2. Root cause if error
    3. Suggested fix
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "analysis": response.choices[0].message.content,
        "service": req.service
    }

@app.post("/agent/health-check")
async def comprehensive_health():
    """Run comprehensive health diagnostics"""
    checks = {
        "docker": run_shell_command("docker ps --format 'table {{.Names}}\\t{{.Status}}'"),
        "disk": run_shell_command("df -h"),
        "memory": run_shell_command("free -h"),
        "api": run_shell_command("curl -s http://localhost/api/health")
    }
    
    # Determine overall status
    healthy = all([
        checks["docker"]["returncode"] == 0,
        "Up" in checks["docker"]["stdout"],
        checks["api"]["returncode"] == 0
    ])
    
    return {
        "healthy": healthy,
        "checks": checks,
        "timestamp": json.dumps({})
    }

