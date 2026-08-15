from pydantic import BaseModel

class topic(BaseModel):
     query:str

class response(BaseModel):
     output:dict