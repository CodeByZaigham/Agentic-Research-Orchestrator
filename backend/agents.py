from langchain_mistralai import ChatMistralAI
from langchain.agents import create_agent
from tools.websearchtool import web_search
from tools.webscraptool import scrappe
from dotenv import load_dotenv
load_dotenv

llm=ChatMistralAI(model="mistral-medium-latest")

def search_agent():
     agent=create_agent(
          model=llm,
          tools=[web_search]
     )
     return agent

def scrappe_agent():
     agent=create_agent(
          model=llm,
          tools=[scrappe]
     )
     return agent
