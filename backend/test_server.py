from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a simple HTML page
@app.get("/", response_class=HTMLResponse)
async def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head><title>API Test</title></head>
    <body>
        <h1>Backend is Running!</h1>
        <button onclick="test()">Test API</button>
        <pre id="result"></pre>
        <script>
            async function test() {
                const res = await fetch('/health');
                const data = await res.json();
                document.getElementById('result').innerHTML = JSON.stringify(data, null, 2);
            }
        </script>
    </body>
    </html>
    '''

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
