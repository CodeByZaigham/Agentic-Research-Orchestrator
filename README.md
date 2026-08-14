# Agentic-Research-Orchestrator
Production-grade, fully autonomous multi-agent AI system orchestrated via LangChain's LCEL pipeline atop a ReAct reasoning core. Specialized Search, Reader, Writer, and Critic agents collaborate through shared memory to research, scrape, synthesize, and self-critique reports end-to-end powered by Tavily, BeautifulSoup, FastAPI, and React.

# Under Development (Stay Tuned!)

# Development plan

                    ┌───────────────┐
                    │ Research Topic│
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ search Agent  │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ scrape Agent  │
                    └───────┬───────┘
                    ┌───────────────┐
                    │ Research Data │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Writer Agent  │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Research      │
                    │ Report        │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │ Checker/Critic│
                    └───────┬───────┘
                            ↓
                 ┌──────────┴──────────┐
                 ↓                     ↓
            Score ≥ threshold     Score < threshold
                 ↓                     ↓
          PDF Generation          Writer Agent
                                       ↓
                                  Improved Report
                                       ↓
                                    Checker