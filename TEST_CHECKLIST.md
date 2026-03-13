# Automated Test Checklist

This checklist is run automatically after every feature completion.

## 🚀 How to Run Tests

```bash
# Start dev server
npm run dev

# In another terminal, run all tests
npm test

# Run with UI for debugging
npm run test:ui

# Run specific test file
npx playwright test e2e/note-editor.spec.ts
```

## ✅ Test Suite

### 1. Homepage Tests (`e2e/homepage.spec.ts`)
- [ ] Hero section displays
- [ ] Central input is visible
- [ ] Can create note from input
- [ ] Recent notes section shows
- [ ] Can click note to open
- [ ] Stats display correctly

### 2. Note Editor Tests (`e2e/note-editor.spec.ts`)
- [ ] Editor displays correctly
- [ ] Can edit title
- [ ] Can edit content
- [ ] Auto-save shows indicator
- [ ] Checkboxes work `[ ]` `[x]`
- [ ] Can change folder
- [ ] Delete modal works
- [ ] Back navigation works

### 3. Sidebar Tests (`e2e/sidebar.spec.ts`)
- [ ] Logo and version visible
- [ ] Folder list displays
- [ ] Can navigate to folder
- [ ] Active folder highlighted
- [ ] Search bar visible

### 4. Folder Page Tests (`e2e/folder-page.spec.ts`)
- [ ] Folder header displays
- [ ] Notes in folder visible
- [ ] Can open note from folder
- [ ] Empty state shows when no notes
- [ ] Can delete note from folder

## 🔧 Manual Verification (if needed)

### Visual Checks
- [ ] No console errors
- [ ] Dark theme applied correctly
- [ ] Responsive on 1920x1080
- [ ] Responsive on 375x667 (mobile)

### Performance Checks
- [ ] Page load < 3 seconds
- [ ] Auto-save < 2 seconds
- [ ] No memory leaks

### Browser Compatibility
- [ ] Chrome (tested via Playwright)
- [ ] Firefox (manual if needed)
- [ ] Safari (manual if needed)

## 📊 Test Results

After running tests, check:
```
✅ All tests passed → Ready for production
❌ Tests failed → Fix issues before deploying
```

## 📝 Adding New Tests

When adding a new feature:

1. Create test in `e2e/` folder
2. Name it `[feature].spec.ts`
3. Add to this checklist
4. Run `npm test` to verify

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase timeout in `playwright.config.ts` |
| Element not found | Check selectors, add `data-testid` |
| Flaky tests | Add `await expect().toBeVisible()` before clicks |
| Backend not available | Mock API responses or skip test |
