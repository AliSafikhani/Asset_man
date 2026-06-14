from fastapi import APIRouter

router = APIRouter(tags=["Transformers"])

@router.get("/")
async def get_transformers():
    return {"message": "Transformers endpoint - coming soon"}

@router.post("/")
async def create_transformer():
    return {"message": "Create transformer - coming soon"}

@router.get("/{transformer_id}")
async def get_transformer(transformer_id: int):
    return {"message": f"Get transformer {transformer_id} - coming soon"}
