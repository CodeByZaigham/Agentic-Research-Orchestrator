from langchain.tools import tool
from tavily import TavilyClient
from dotenv import load_dotenv
from rich import print #just for help to visualize responses
load_dotenv()
import os

tavily_api_key=os.getenv("TAVILY_API_KEY")

@tool
def web_search(query: str)->str:
     """this tool fetches real time data from the web and provides URLs , snippits,bullets etc"""
     tavily=TavilyClient(api_key=tavily_api_key)
     result=tavily.search(query=query , max_results=2)
     output=[]
     for i in result["results"]:
          output.append(f"title: {i["title"]} \n URL: {i["url"]} \n content: {i["content"][:500]}\n")
     return f"-----\n".join(output)