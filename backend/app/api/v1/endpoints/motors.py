from fastapi import APIRouter

router = APIRouter(tags=["Motors"])

@router.get("/")
async def get_motors():
    return {"message": "Motors endpoint - coming soon"}

@router.post("/")
async def create_motor():
    return {"message": "Create motor - coming soon"}

@router.get("/{motor_id}")
async def get_motor(motor_id: int):
    return {"message": f"Get motor {motor_id} - coming soon"}
