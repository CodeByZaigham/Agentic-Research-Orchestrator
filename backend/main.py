from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from schema import topic,response
from agents import search_agent,scrappe_agent
from pipelines.report_generator import writer
from pipelines.report_checker import checker

app = FastAPI(title="Agentic Research Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def testroute():
     return {"message":"test route working"}

@app.post("/ask")
def givetopic(query:topic):
     state={}
     #step 1
     search_results=search_agent().invoke({
          "messages":[{"role":"user","content":f"Research {query} and give me useful information, key points, and bullet points, while also including relevant research papers, articles, and other credible sources with their direct URLs."}]
     })
     state["search_results"]=search_results["messages"][-1].content

     #step 2
     scrape_results=scrappe_agent().invoke({
          "messages":[{"role":"user","content":f"Research topic: {query}\n\nRaw search results:\n{state["search_results"]}\n\nIdentify the most relevant URLs, scrape those pages, and extract the important facts, findings, insights, and supporting information useful for researching this topic. Also give authors, citations of content taken. Prioritize credible sources and ignore irrelevant, duplicate, or low-value content."}]         
     })
     state["scrape_results"]=scrape_results["messages"][-1].content

     #step 3
     report=writer().invoke({
          "topic":query,
          "research":(f"search results: {state["search_results"]} & scrapped web pages data: {state["scrape_results"]}")
     })
     state["final_report"]=report

     #step 4
     score=checker().invoke({
          "report":state["final_report"]
     })

     state["evaluation"]=score

     return{
          "Report: ":state["final_report"],
          "Evaluation: ":state["evaluation"]
     }

