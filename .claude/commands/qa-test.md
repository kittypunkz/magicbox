Run backend unit tests and frontend e2e tests, then report results.

```bash
echo "🧪 Running backend tests..." && cd backend && npm test && cd .. && echo "" && echo "🎭 Running e2e tests..." && cd frontend && npx playwright test && cd ..
```
