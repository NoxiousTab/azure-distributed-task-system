curl -X POST "http://localhost:5000/submit-task" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"summarize\",\"text\":\"This is a long piece of text that we want to summarize using the local Azure distributed task system.\"}"
