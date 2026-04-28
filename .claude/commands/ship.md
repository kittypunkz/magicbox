Deploy both backend and frontend to production.

```bash
echo "🚀 Deploying backend..." && (cd backend && npm run deploy) && echo "✅ Backend deployed!" && echo "" && echo "🚀 Deploying frontend..." && npm run deploy:web && echo "✅ Frontend deployed!"
```
