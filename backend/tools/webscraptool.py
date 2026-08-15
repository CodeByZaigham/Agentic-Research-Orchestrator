from langchain.tools import tool
from bs4 import BeautifulSoup
import requests

@tool
def scrappe(url:str)-> str:
     """this tool takes url of a website and scrappe that webpage to generate readable content from it"""
     try:
          response=requests.get(url=url,timeout=8,headers={"User-Agent":"Mozilla/5.0"})
          soup=BeautifulSoup(response.text,"html.parser")
          for i in soup(["script","nav","footer","style"]):
               i.decompose()
          return soup.get_text(separator=" ",strip=True)[:5000]
     except Exception as e:
          return f"{e} occured! Cannot scrappe this URL"

# print(scrappe.invoke("https://timesofkarachi.pk/"))